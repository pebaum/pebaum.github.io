// ============================================================================
// ReverieProcessor — AudioWorklet (web port of Reverie / Drift v0.11.0-b)
//
// Structural port of the Reverie plugin's DSP. Parameter set, ranges, defaults,
// and signal-flow ordering mirror the C++ source at:
//   plugins/reverie/plugin/Source/dsp/DriftEngine.h
//   plugins/reverie/plugin/Source/DriftParameters.h
//
// Signal chain (per DriftEngine.h):
//   InputGain → Copy(dry,wet) → HPF → LPF → TiltEQ
//   → (if expanse > 0.01) add Shimmer feedback
//   → JPVerb (size, time, damping, diffusion, modDepth, modRate)
//   → Pitch Ascend (feeds back via shimmer) + Pitch Descend (one-shot)
//   → GlowEffect → DriftLoFi (tape+heat) → sin/cos dry/wet mix (immersion)
//   → OutputGain → Limiter
//
// Fidelity notes (departures from C++):
//   * Reverb: structural FDN (Householder + per-line allpass + Jot RT60 damping)
//             tuned to Reverie's parameter interface. Not bit-exact to JPVerb.
//   * Pitch shifter: granular (4 voices × 8 grains, Hann, Hermite). Reverie
//             uses a 4096-pt phase-vocoder. Both produce ±octave shimmer.
//   * DriftLoFi: simplified tape+heat (input drive, soft sat, slow wow,
//             tube drive+bias, LPF, RMS match). Reverie uses Revox A77
//             hysteresis modeling (~1350 lines); the character matches.
// ============================================================================

const NUM_LINES = 16;
const HOUSEHOLDER_SCALE = 2.0 / 16.0;
const PI = 3.14159265358979323846;
const TWO_PI = 2.0 * PI;
const HALF_PI = PI / 2.0;

const PRIMES = [149, 179, 223, 263, 307, 359, 419, 491, 563, 641, 727, 839, 953, 1097, 1259, 1447];
const PRIME_SUM = PRIMES.reduce((a, b) => a + b, 0);
const FRACTIONS = PRIMES.map(p => p / PRIME_SUM);

const AP_COEFF_1 = 0.35;
const AP_COEFF_2 = 0.30;
const NUM_VOICES = 4;
const NUM_GRAINS = 8;
const GRAIN_SIZE_MS_UP   = 150;
const GRAIN_SIZE_MS_DOWN = 250;
const PITCH_RATIOS = [2.0, 4.0, 0.5, 0.25];

const BLOCK_SIZE = 128;

// ── Utility: Hermite cubic interpolation ────────────────────────────────────
function hermite(buf, posD, bufSize) {
    const pos0 = Math.floor(posD);
    const frac = posD - pos0;
    let idx0 = pos0 % bufSize;
    if (idx0 < 0) idx0 += bufSize;
    const im1 = (idx0 - 1 + bufSize) % bufSize;
    const ip1 = (idx0 + 1) % bufSize;
    const ip2 = (idx0 + 2) % bufSize;
    const y0 = buf[im1], y1 = buf[idx0], y2 = buf[ip1], y3 = buf[ip2];
    const c0 = y1;
    const c1 = 0.5 * (y2 - y0);
    const c2 = y0 - 2.5 * y1 + 2.0 * y2 - 0.5 * y3;
    const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
    return ((c3 * frac + c2) * frac + c1) * frac + c0;
}

class SimpleRng {
    constructor(seed) { this.state = (seed === 0 ? 1 : seed) >>> 0; }
    next() { this.state = (this.state * 1664525 + 1013904223) >>> 0; return this.state; }
    nextDouble() { return this.next() / 4294967296.0; }
}

// ============================================================================
// Biquad — 2nd-order Butterworth (Q = 1/√2). Matches DriftEngine.h coeffs.
// ============================================================================
class Biquad {
    constructor() {
        this.b0 = 1; this.b1 = 0; this.b2 = 0;
        this.a1 = 0; this.a2 = 0;
        this.xL = [0, 0]; this.yL = [0, 0];
        this.xR = [0, 0]; this.yR = [0, 0];
    }
    setHPF(sr, freq) {
        if (freq < 21.0) { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; return; }
        const w0 = TWO_PI * freq / sr;
        const cs = Math.cos(w0), sn = Math.sin(w0);
        const alpha = sn / (2.0 * 0.7071067811865476);
        const a0 = 1.0 + alpha;
        this.b0 = ((1.0 + cs) / 2.0) / a0;
        this.b1 = (-(1.0 + cs)) / a0;
        this.b2 = this.b0;
        this.a1 = (-2.0 * cs) / a0;
        this.a2 = (1.0 - alpha) / a0;
    }
    setLPF(sr, freq) {
        if (freq > 19999.0) { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; return; }
        const w0 = TWO_PI * freq / sr;
        const cs = Math.cos(w0), sn = Math.sin(w0);
        const alpha = sn / (2.0 * 0.7071067811865476);
        const a0 = 1.0 + alpha;
        this.b0 = ((1.0 - cs) / 2.0) / a0;
        this.b1 = (1.0 - cs) / a0;
        this.b2 = this.b0;
        this.a1 = (-2.0 * cs) / a0;
        this.a2 = (1.0 - alpha) / a0;
    }
    process(left, right, n) {
        for (let i = 0; i < n; i++) {
            const xL = left[i];
            const yL = this.b0 * xL + this.b1 * this.xL[0] + this.b2 * this.xL[1]
                     - this.a1 * this.yL[0] - this.a2 * this.yL[1];
            this.xL[1] = this.xL[0]; this.xL[0] = xL;
            this.yL[1] = this.yL[0]; this.yL[0] = yL;
            left[i] = yL;

            const xR = right[i];
            const yR = this.b0 * xR + this.b1 * this.xR[0] + this.b2 * this.xR[1]
                     - this.a1 * this.yR[0] - this.a2 * this.yR[1];
            this.xR[1] = this.xR[0]; this.xR[0] = xR;
            this.yR[1] = this.yR[0]; this.yR[0] = yR;
            right[i] = yR;
        }
    }
    reset() { this.xL = [0, 0]; this.yL = [0, 0]; this.xR = [0, 0]; this.yR = [0, 0]; }
}

// ============================================================================
// TiltEQ — 1 kHz pivot, ±12 dB. Identical to Reverie's TiltEQ.h.
// ============================================================================
class TiltEQ {
    constructor(sr) {
        const wc = TWO_PI * 1000.0 / sr;
        this.lpCoeff = Math.exp(-wc);
        this.lowGain = 1.0; this.highGain = 1.0;
        this.stateL = 0.0; this.stateR = 0.0;
    }
    setTilt(tiltDb) {
        const dB = Math.max(-12.0, Math.min(12.0, tiltDb));
        const V = Math.pow(10.0, Math.abs(dB) / 40.0);
        if (dB >= 0.0) { this.highGain = V; this.lowGain = 1.0 / V; }
        else            { this.lowGain  = V; this.highGain = 1.0 / V; }
    }
    process(left, right, n) {
        for (let i = 0; i < n; i++) {
            this.stateL = (1.0 - this.lpCoeff) * left[i] + this.lpCoeff * this.stateL;
            const hpL = left[i] - this.stateL;
            left[i] = this.stateL * this.lowGain + hpL * this.highGain;

            this.stateR = (1.0 - this.lpCoeff) * right[i] + this.lpCoeff * this.stateR;
            const hpR = right[i] - this.stateR;
            right[i] = this.stateR * this.lowGain + hpR * this.highGain;
        }
    }
    reset() { this.stateL = 0; this.stateR = 0; }
}

// ============================================================================
// GlowEffect — tube comp + asymmetric tanh sat + HF rolloff + DC blocker.
// Identical to Reverie's GlowEffect.h.
// ============================================================================
class GlowEffect {
    constructor(sr) {
        this.sr = sr;
        this.envAttack  = Math.exp(-1.0 / (sr * 0.002));
        this.envRelease = Math.exp(-1.0 / (sr * 0.200));
        this.rmsCoeff   = Math.exp(-1.0 / (sr * 0.010));
        this.hpR        = Math.exp(-2.0 * PI * 30.0 / sr);
        this.reset();
    }
    setAmount(amount) {
        const a = Math.max(0.0, Math.min(1.0, amount));
        this.amount01 = a;
        this.compThreshold = 1.0 - a * 0.85;
        this.compRatio = 1.0 + a * 9.0;
        this.satDrive = 1.0 + a * 5.0;
        this.satMakeup = 1.0 / Math.max(0.3, Math.tanh(this.satDrive * 0.7));
        const cutoffHz = 20000.0 * Math.pow(0.3, a);
        this.lpCoeff = Math.exp(-TWO_PI * cutoffHz / this.sr);
    }
    saturate(x) {
        const driven = x * this.satDrive;
        let shaped = driven >= 0 ? Math.tanh(driven) : Math.tanh(driven * 1.15) / 1.15;
        const bias = 0.08 * (this.satDrive - 1.0) / 5.0 * Math.exp(-driven * driven * 0.5);
        return (shaped + bias) * this.satMakeup;
    }
    process(left, right, n) {
        for (let i = 0; i < n; i++) {
            let L = left[i], R = right[i];
            // Stage 1 — tube compression
            const mono = (L + R) * 0.5, sq = mono * mono;
            this.rmsEnvelope = this.rmsCoeff * this.rmsEnvelope + (1.0 - this.rmsCoeff) * sq;
            const rmsLevel = Math.sqrt(this.rmsEnvelope);
            let gr = 1.0;
            if (rmsLevel > this.compThreshold && this.compThreshold > 0.0) {
                const overshoot = rmsLevel / this.compThreshold;
                gr = Math.pow(overshoot, (1.0 / this.compRatio) - 1.0);
            }
            this.compGainSmoothed = (gr < this.compGainSmoothed)
                ? this.envAttack * this.compGainSmoothed + (1.0 - this.envAttack) * gr
                : this.envRelease * this.compGainSmoothed + (1.0 - this.envRelease) * gr;
            L *= this.compGainSmoothed;
            R *= this.compGainSmoothed;
            // Stage 2 — saturation
            L = this.saturate(L); R = this.saturate(R);
            // Stage 3 — HF rolloff
            this.lpStateL = (1.0 - this.lpCoeff) * L + this.lpCoeff * this.lpStateL; L = this.lpStateL;
            this.lpStateR = (1.0 - this.lpCoeff) * R + this.lpCoeff * this.lpStateR; R = this.lpStateR;
            // Stage 4 — DC blocker
            const xL = L, xR = R;
            L = xL - this.hpXL + this.hpR * this.hpYL; this.hpXL = xL; this.hpYL = L;
            R = xR - this.hpXR + this.hpR * this.hpYR; this.hpXR = xR; this.hpYR = R;
            left[i] = L; right[i] = R;
        }
    }
    reset() {
        this.rmsEnvelope = 0; this.compGainSmoothed = 1; this.lpStateL = 0; this.lpStateR = 0;
        this.hpXL = 0; this.hpYL = 0; this.hpXR = 0; this.hpYR = 0;
        this.amount01 = 0; this.compThreshold = 1; this.compRatio = 1;
        this.satDrive = 1; this.satMakeup = 1; this.lpCoeff = 0;
    }
}

// ============================================================================
// DriftLoFi — simplified tape+heat character, driven by drift_mod (0–1).
//
// Reverie's DriftEffect orchestrates a Revox A77 tape model + heat tube channel
// (≈1350 lines combined). This is a pragmatic stand-in that hits the same
// character: input drive → soft sat → slow wow modulation → tube drive+bias
// → LPF → DC block → RMS match.
//
// Macro curves derived from DriftEffect.h's "Kevin's macro" piecewise lookup
// (v0.10.9 default).
// ============================================================================
class DriftLoFi {
    constructor(sr) {
        this.sr = sr;
        // Wow delay buffer ~30ms
        this.wfBufSize = Math.ceil(0.030 * sr) + 16;
        this.wfBufL = new Float64Array(this.wfBufSize);
        this.wfBufR = new Float64Array(this.wfBufSize);
        this.wfWritePos = 0;
        // Wow LFO ~0.35 Hz (subtle), independent L/R for stereo
        this.wowPhaseL = 0.0;
        this.wowPhaseR = 0.25;
        this.wowInc = 0.35 / sr;
        // LPF state (cable LPF + tube HF)
        this.lpStateL = 0.0; this.lpStateR = 0.0;
        // Compression envelope
        this.rmsEnv = 0.0;
        this.rmsCoeff = Math.exp(-1.0 / (sr * 0.010));
        this.compGain = 1.0;
        this.compAtk = Math.exp(-1.0 / (sr * 0.005));
        this.compRel = Math.exp(-1.0 / (sr * 0.080));
        // DC blocker
        this.dcR = Math.exp(-2.0 * TWO_PI * 30.0 / sr);
        this.dcXL = 0; this.dcYL = 0; this.dcXR = 0; this.dcYR = 0;
        // RMS match
        this.rmsMatchGain = 1.0;
        this.rmsMatchCoeff = Math.exp(-1.0 / (sr * 0.050));

        this.amount = 0.0;
        this._derive();
    }
    setAmount(a) {
        this.amount = Math.max(0.0, Math.min(1.0, a));
        this._derive();
    }
    // Piecewise macro lookup mirroring DriftEffect.h's Kevin's macro
    _kv(k, v10, v35, v50, v65, v80, v100) {
        if (k <= 0) return 0;
        if (k <= 0.10) return (k / 0.10) * v10;
        if (k <= 0.35) return v10 + ((k - 0.10) / 0.25) * (v35 - v10);
        if (k <= 0.50) return v35 + ((k - 0.35) / 0.15) * (v50 - v35);
        if (k <= 0.65) return v50 + ((k - 0.50) / 0.15) * (v65 - v50);
        if (k <= 0.80) return v65 + ((k - 0.65) / 0.15) * (v80 - v65);
        return v80 + ((k - 0.80) / 0.20) * (v100 - v80);
    }
    _derive() {
        const t = this.amount;
        // Tape input drive 1×–1.45×
        this.tapeDrive = 1.0 + this._kv(t, 0.10, 0.28, 0.36, 0.40, 0.425, 0.45);
        // Compression
        this.compRatio = 1.0 + this._kv(t, 0.10, 0.20, 0.275, 0.30, 0.375, 0.375) * 4.0;
        this.compThresh = 1.0 - this._kv(t, 0.10, 0.20, 0.275, 0.30, 0.375, 0.375) * 0.6;
        // Wow depth (cubic curve in plugin: depth01³)
        const wowD = this._kv(t, 0.24, 0.40, 0.40, 0.40, 0.44, 0.44);
        this.wowSamples = wowD * wowD * wowD * 0.0008 * this.sr; // up to ~36 samples at full
        // Tube drive 1×–1.25×
        this.tubeDrive = 1.0 + this._kv(t, 0.08, 0.10, 0.16, 0.201, 0.25, 0.25);
        // Tube bias adds asymmetry (0–1)
        this.tubeBias = this._kv(t, 0.10, 0.35, 0.50, 0.65, 0.80, 1.00);
        // Cable LPF ~6kHz at 0%, ~3.5kHz at 100%
        const lpfAmt = this._kv(t, 0.10, 0.28, 0.35, 0.35, 0.45, 0.45);
        const cutoffHz = 6000.0 * Math.pow(0.55, lpfAmt);
        this.lpCoeff = Math.exp(-TWO_PI * cutoffHz / this.sr);
        // Ear compress (gentle bus comp character)
        this.earAmt = this._kv(t, 0.10, 0.20, 0.25, 0.30, 0.35, 0.35);
    }
    process(left, right, n) {
        if (this.amount < 1e-4) return; // bypass
        // Engagement fade over first 1%
        const engageFade = Math.min(1.0, this.amount / 0.01);

        // Measure input RMS for level matching
        let sumIn = 0;
        for (let i = 0; i < n; i++) sumIn += left[i] * left[i] + right[i] * right[i];
        const rmsIn = Math.sqrt(sumIn / (2 * n));

        for (let i = 0; i < n; i++) {
            let L = left[i], R = right[i];

            // Stage 1 — input drive + soft tape sat (tanh asymmetric)
            L *= this.tapeDrive; R *= this.tapeDrive;
            L = L >= 0 ? Math.tanh(L) : Math.tanh(L * 1.10) / 1.10;
            R = R >= 0 ? Math.tanh(R) : Math.tanh(R * 1.10) / 1.10;

            // Stage 2 — wow (slow modulated short delay, chorus-y)
            // Write into delay buffer
            this.wfBufL[this.wfWritePos] = L;
            this.wfBufR[this.wfWritePos] = R;
            // LFOs
            this.wowPhaseL += this.wowInc; if (this.wowPhaseL >= 1) this.wowPhaseL -= 1;
            this.wowPhaseR += this.wowInc * 1.07; if (this.wowPhaseR >= 1) this.wowPhaseR -= 1;
            const wowL = this.wowSamples * (0.5 + 0.5 * Math.sin(TWO_PI * this.wowPhaseL));
            const wowR = this.wowSamples * (0.5 + 0.5 * Math.sin(TWO_PI * this.wowPhaseR));
            // Read at modulated delay
            let posL = this.wfWritePos - 4 - wowL; while (posL < 0) posL += this.wfBufSize;
            let posR = this.wfWritePos - 4 - wowR; while (posR < 0) posR += this.wfBufSize;
            L = hermite(this.wfBufL, posL, this.wfBufSize);
            R = hermite(this.wfBufR, posR, this.wfBufSize);
            this.wfWritePos = (this.wfWritePos + 1) % this.wfBufSize;

            // Stage 3 — tube drive + asymmetric bias (heat)
            const tdL = (L + this.tubeBias * 0.1) * this.tubeDrive;
            const tdR = (R + this.tubeBias * 0.1) * this.tubeDrive;
            L = tdL >= 0 ? Math.tanh(tdL) - this.tubeBias * 0.1
                         : Math.tanh(tdL * (1.0 + this.tubeBias * 0.3)) / (1.0 + this.tubeBias * 0.3) - this.tubeBias * 0.1;
            R = tdR >= 0 ? Math.tanh(tdR) - this.tubeBias * 0.1
                         : Math.tanh(tdR * (1.0 + this.tubeBias * 0.3)) / (1.0 + this.tubeBias * 0.3) - this.tubeBias * 0.1;

            // Stage 4 — cable LPF (one-pole)
            this.lpStateL = (1.0 - this.lpCoeff) * L + this.lpCoeff * this.lpStateL; L = this.lpStateL;
            this.lpStateR = (1.0 - this.lpCoeff) * R + this.lpCoeff * this.lpStateR; R = this.lpStateR;

            // Stage 5 — gentle compression (ear comp)
            const mono = (L + R) * 0.5, sq = mono * mono;
            this.rmsEnv = this.rmsCoeff * this.rmsEnv + (1.0 - this.rmsCoeff) * sq;
            const rms = Math.sqrt(this.rmsEnv);
            let gr = 1.0;
            if (rms > this.compThresh && this.earAmt > 0) {
                gr = Math.pow(rms / this.compThresh, (1.0 / this.compRatio) - 1.0);
                gr = 1.0 + (gr - 1.0) * this.earAmt;
            }
            this.compGain = (gr < this.compGain)
                ? this.compAtk * this.compGain + (1.0 - this.compAtk) * gr
                : this.compRel * this.compGain + (1.0 - this.compRel) * gr;
            L *= this.compGain; R *= this.compGain;

            // Stage 6 — DC blocker
            const xL = L, xR = R;
            L = xL - this.dcXL + this.dcR * this.dcYL; this.dcXL = xL; this.dcYL = L;
            R = xR - this.dcXR + this.dcR * this.dcYR; this.dcXR = xR; this.dcYR = R;

            left[i] = L; right[i] = R;
        }

        // RMS match (so DRIFT changes character, not loudness)
        let sumOut = 0;
        for (let i = 0; i < n; i++) sumOut += left[i] * left[i] + right[i] * right[i];
        const rmsOut = Math.sqrt(sumOut / (2 * n));
        const nf = 0.0001;
        const tg = (rmsIn > nf && rmsOut > nf)
            ? Math.max(0.25, Math.min(2.0, rmsIn / rmsOut))
            : 1.0;
        this.rmsMatchGain = this.rmsMatchCoeff * this.rmsMatchGain + (1.0 - this.rmsMatchCoeff) * tg;
        for (let i = 0; i < n; i++) {
            left[i]  *= this.rmsMatchGain * engageFade;
            right[i] *= this.rmsMatchGain * engageFade;
        }
    }
    reset() {
        this.wfBufL.fill(0); this.wfBufR.fill(0); this.wfWritePos = 0;
        this.wowPhaseL = 0; this.wowPhaseR = 0.25;
        this.lpStateL = 0; this.lpStateR = 0;
        this.rmsEnv = 0; this.compGain = 1;
        this.dcXL = 0; this.dcYL = 0; this.dcXR = 0; this.dcYR = 0;
        this.rmsMatchGain = 1;
    }
}

// ============================================================================
// AllpassDiffuser — 6 cascaded allpass for pre-diffusion, scaled by Diffusion.
// ============================================================================
class AllpassDiffuser {
    constructor(sr) {
        this.NUM_STAGES = 6;
        this.MIN_COEFF = 0.05;
        this.DELAY_TIMES_MS = [2.1, 5.3, 11.7, 23.1, 37.9, 53.7];
        this.BASE_COEFFICIENTS = [0.50, 0.50, 0.45, 0.40, 0.35, 0.30];
        this.stageCoefficients = new Float64Array(6);
        this.stages = [[], []];
        for (let s = 0; s < 6; s++) {
            const delaySamples = Math.max(1, Math.ceil(this.DELAY_TIMES_MS[s] * 0.001 * sr));
            const bufferSize = delaySamples + 1;
            for (let ch = 0; ch < 2; ch++) {
                this.stages[ch].push({
                    buffer: new Float64Array(bufferSize),
                    bufferSize, delayLength: delaySamples, writePos: 0
                });
            }
        }
        this.setDiffusion(1.0);
    }
    setDiffusion(amount) {
        const t = Math.max(0.0, Math.min(1.0, amount));
        for (let s = 0; s < 6; s++) {
            this.stageCoefficients[s] = this.MIN_COEFF
                + (this.BASE_COEFFICIENTS[s] - this.MIN_COEFF) * t;
        }
    }
    process(left, right, n) {
        const channels = [left, right];
        for (let ch = 0; ch < 2; ch++) {
            const data = channels[ch];
            for (let s = 0; s < 6; s++) {
                const ap = this.stages[ch][s];
                const g = this.stageCoefficients[s];
                for (let k = 0; k < n; k++) {
                    const x = data[k];
                    let r = ap.writePos - ap.delayLength;
                    if (r < 0) r += ap.bufferSize;
                    const d = ap.buffer[r];
                    const v = x + g * d;
                    ap.buffer[ap.writePos] = v;
                    ap.writePos = (ap.writePos + 1) % ap.bufferSize;
                    data[k] = d - g * v;
                }
            }
        }
    }
    reset() {
        for (let ch = 0; ch < 2; ch++)
            for (let s = 0; s < this.stages[ch].length; s++) {
                this.stages[ch][s].buffer.fill(0);
                this.stages[ch][s].writePos = 0;
            }
    }
}

// ============================================================================
// FDNReverb — 16-line Householder feedback delay network with per-line allpass
// and Jot RT60 damping. Exposes Reverie's parameter interface (size, time,
// damping, diffusion, modDepth, modRate, earlyMod). Structurally not JPVerb,
// but matches the parameter semantics and produces lush diffuse reverb.
// ============================================================================
class FDNReverb {
    constructor(sr) {
        this.sr = sr;
        this.lines = [];
        this.panCoeff = new Float64Array(NUM_LINES);
        this.fbScale = new Float64Array(NUM_LINES);
        this.dampLpCoeff = new Float64Array(NUM_LINES);
        this.dampGain = new Float64Array(NUM_LINES);
        this.currentDelaySamples = new Float64Array(NUM_LINES);
        this.currentFeedback = 1.0;
        this.modDepthNorm = 0.0;
        this.modRateHz = 0.1;
        this.dampingCoeff = 0.5;
        this.diffusion01 = 1.0;

        this.lfoRng = new SimpleRng(42);
        this.lfoState = new Float64Array(NUM_LINES);
        this.lfoFiltered = new Float64Array(NUM_LINES);
        this.lfoSmoothCoeff = new Float64Array(NUM_LINES);
        this.lfoStepScale = new Float64Array(NUM_LINES);

        const maxDelay = Math.ceil(1.4 * sr) + 16;
        for (let i = 0; i < NUM_LINES; i++) {
            const lineScale = 0.8 + 0.4 * i / 15.0;
            const ap1Delay = Math.max(1, Math.ceil(0.0013 * lineScale * sr));
            const ap2Delay = Math.max(1, Math.ceil(0.0029 * lineScale * sr));
            this.lines.push({
                buffer: new Float64Array(maxDelay),
                bufferSize: maxDelay, writePos: 0,
                lpState1: 0, lpState2: 0, dcState: 0, dcPrevInput: 0,
                ap: [
                    { buffer: new Float64Array(ap1Delay + 1), bufferSize: ap1Delay + 1, delayLength: ap1Delay, writePos: 0 },
                    { buffer: new Float64Array(ap2Delay + 1), bufferSize: ap2Delay + 1, delayLength: ap2Delay, writePos: 0 },
                ]
            });
            this.panCoeff[i] = i / (NUM_LINES - 1);
            this.fbScale[i] = 0.97 + 0.06 * i / 15.0;
            const rate = 0.05 + 0.15 * i / 15.0;
            this.lfoSmoothCoeff[i] = Math.exp(-TWO_PI * 2.0 / sr);
            this.lfoStepScale[i] = rate * 0.01;
        }

        this._tapOut = new Float64Array(NUM_LINES);
        this._mixed = new Float64Array(NUM_LINES);
        this._fb = new Float64Array(NUM_LINES);

        this.setSize(1.0);
        this.computeDamping(2.0, 3.0, 1.0);

        this.lastSize = -1;
        this.lastTime = -1;
        this.lastDamping = -1;
    }
    setSize(size) {
        // size 0.5–5.0 in Reverie. Map to total delay 250 ms..6 s using same curve.
        const sizeNorm = Math.max(0, Math.min(1, (size - 0.5) / 4.5));
        const totalMs = 250 * Math.pow(6000 / 250, sizeNorm);
        for (let i = 0; i < NUM_LINES; i++)
            this.currentDelaySamples[i] = Math.max(1, FRACTIONS[i] * totalMs * 0.001 * this.sr);
    }
    computeDamping(t60Low, t60Mid, t60High) {
        t60Mid = Math.max(0.05, t60Mid);
        for (let i = 0; i < NUM_LINES; i++) {
            const d = Math.max(1, this.currentDelaySamples[i]);
            let g = Math.pow(10, -3.0 * d / (t60Mid * this.sr));
            g = Math.min(0.9999, Math.max(0, g));
            this.dampGain[i] = g;
            // Damping (0–0.8) shifts the LP cutoff per line lower → more high-freq decay
            const baseFc = 3000 + 7000 * (1 - i / 15.0);
            const fc = Math.max(300, baseFc * (1.0 - this.dampingCoeff * 0.85));
            this.dampLpCoeff[i] = Math.exp(-TWO_PI * fc / this.sr);
        }
    }
    setDecayParams(decaySec, hfDecayRatio) {
        // Reverie expanse 0..40s. Use sqrt size mapping like before.
        const t = Math.max(0, Math.min(1, decaySec / 40.0));
        // Note: setSize is called separately by setDistance; here we only
        // recompute damping for the t60 change.
        this.computeDamping(decaySec * 1.05, decaySec, decaySec * hfDecayRatio);
    }
    setDistance(d)  { this.setSize(d); }       // Reverie: distance = size (0.5..5)
    setExpanse(t)   { this.setDecayParams(Math.max(0.05, t), 0.6); } // 0.6 = hfRatio
    setDamping(d)   {
        this.dampingCoeff = Math.max(0, Math.min(1, d));
        // Recompute LP cutoffs (no need to recompute t60 gain)
        for (let i = 0; i < NUM_LINES; i++) {
            const baseFc = 3000 + 7000 * (1 - i / 15.0);
            const fc = Math.max(300, baseFc * (1.0 - this.dampingCoeff * 0.85));
            this.dampLpCoeff[i] = Math.exp(-TWO_PI * fc / this.sr);
        }
    }
    setDiffusion(d) { this.diffusion01 = Math.max(0, Math.min(1, d)); }
    setModDepth(d)  { this.modDepthNorm = Math.max(0, Math.min(1, d)); }
    setModRate(rHz) {
        this.modRateHz = Math.max(0.0, Math.min(10.0, rHz));
        // Adjust LFO smooth pole so fast rate moves fast
        const fc = Math.max(0.5, this.modRateHz * 2.0);
        for (let i = 0; i < NUM_LINES; i++)
            this.lfoSmoothCoeff[i] = Math.exp(-TWO_PI * fc / this.sr);
    }
    setEarlyMod(e)  { this.earlyMod01 = Math.max(0, Math.min(1, e)); }

    processAllpass(ap, x, g) {
        let r = ap.writePos - ap.delayLength;
        if (r < 0) r += ap.bufferSize;
        const d = ap.buffer[r];
        const v = x + g * d;
        ap.buffer[ap.writePos] = v;
        ap.writePos = (ap.writePos + 1) % ap.bufferSize;
        return d - g * v;
    }
    process(left, right, n) {
        const tap = this._tapOut, mixed = this._mixed, fb = this._fb;
        // Modulation amount in samples, per line, scaled by Reverie's mod_scale=50
        const modScale = 50.0;
        const modSamplesScale = modScale * this.modDepthNorm;
        const ap1 = AP_COEFF_1 * this.diffusion01;
        const ap2 = AP_COEFF_2 * this.diffusion01;

        for (let s = 0; s < n; s++) {
            for (let i = 0; i < NUM_LINES; i++) {
                const line = this.lines[i];
                // Random-walk LFO at modRate
                const rv = this.lfoRng.next();
                const rs = (rv / 4294967296.0 - 0.5) * 2.0;
                this.lfoState[i] = Math.max(-1, Math.min(1,
                    this.lfoState[i] + rs * this.lfoStepScale[i] * (0.5 + this.modRateHz * 0.3)));
                this.lfoFiltered[i] = this.lfoSmoothCoeff[i] * this.lfoFiltered[i]
                    + (1.0 - this.lfoSmoothCoeff[i]) * this.lfoState[i];
                const modSamples = this.lfoFiltered[i] * modSamplesScale;
                const totalDelay = this.currentDelaySamples[i] + modSamples;
                let r = line.writePos - totalDelay;
                if (r < 0) r += line.bufferSize;
                let t = hermite(line.buffer, r, line.bufferSize);
                t = this.processAllpass(line.ap[0], t, ap1);
                t = this.processAllpass(line.ap[1], t, ap2);
                tap[i] = t;
            }

            let sum = 0;
            for (let i = 0; i < NUM_LINES; i++) sum += tap[i];
            const scaledSum = sum * HOUSEHOLDER_SCALE;
            for (let i = 0; i < NUM_LINES; i++) mixed[i] = tap[i] - scaledSum;

            for (let i = 0; i < NUM_LINES; i++) {
                const line = this.lines[i];
                line.lpState1 = (1 - this.dampLpCoeff[i]) * mixed[i] + this.dampLpCoeff[i] * line.lpState1;
                line.lpState2 = (1 - this.dampLpCoeff[i]) * line.lpState1 + this.dampLpCoeff[i] * line.lpState2;
                let damped = line.lpState2 * this.dampGain[i];
                const dcIn = damped;
                const dcOut = dcIn - line.dcPrevInput + 0.9995 * line.dcState;
                line.dcPrevInput = dcIn; line.dcState = dcOut;
                fb[i] = dcOut * this.currentFeedback * this.fbScale[i];
            }

            const inL = left[s], inR = right[s];
            for (let i = 0; i < NUM_LINES; i++) {
                const pan = this.panCoeff[i];
                const inp = inL * (1 - pan) + inR * pan;
                this.lines[i].buffer[this.lines[i].writePos] = inp + fb[i];
                this.lines[i].writePos = (this.lines[i].writePos + 1) % this.lines[i].bufferSize;
            }

            let outL = 0, outR = 0;
            for (let i = 0; i < NUM_LINES; i++) {
                outL += tap[i] * (1 - this.panCoeff[i]);
                outR += tap[i] * this.panCoeff[i];
            }
            const og = 1.0 / Math.sqrt(8);
            left[s] = outL * og;
            right[s] = outR * og;
        }
    }
    reset() {
        for (const line of this.lines) {
            line.buffer.fill(0); line.writePos = 0;
            line.lpState1 = 0; line.lpState2 = 0; line.dcState = 0; line.dcPrevInput = 0;
            for (const ap of line.ap) { ap.buffer.fill(0); ap.writePos = 0; }
        }
        this.lfoState.fill(0); this.lfoFiltered.fill(0);
    }
}

// ============================================================================
// GranularPitchShifter — 4 voices × 8 grains, Hann window, Hermite interp.
// Used for both Ascend (feeds back via shimmer) and Descend (one-shot).
// Parameterized: setAscend(0–1) and setDescend(0–1) gates voices on/off.
// ============================================================================
class GranularPitchShifter {
    constructor(sr, seed) {
        this.sr = sr;
        this.rng = new SimpleRng(seed);
        this.grainSizeUp = Math.ceil(GRAIN_SIZE_MS_UP * 0.001 * sr);
        this.grainSizeDown = Math.ceil(GRAIN_SIZE_MS_DOWN * 0.001 * sr);
        this.grainSpacingUp = Math.floor(this.grainSizeUp / NUM_GRAINS);
        this.grainSpacingDown = Math.floor(this.grainSizeDown / NUM_GRAINS);

        this.bufSize = this.grainSizeDown * 8;
        this.buffer = new Float64Array(this.bufSize);
        this.writePos = 0;

        this.hannUp = new Float32Array(this.grainSizeUp);
        for (let i = 0; i < this.grainSizeUp; i++)
            this.hannUp[i] = 0.5 * (1 - Math.cos(TWO_PI * i / this.grainSizeUp));
        this.hannDown = new Float32Array(this.grainSizeDown);
        for (let i = 0; i < this.grainSizeDown; i++)
            this.hannDown[i] = 0.5 * (1 - Math.cos(TWO_PI * i / this.grainSizeDown));

        this.grains = [];
        const phaseOffset = (seed * 7) % Math.max(1, this.grainSpacingUp);
        for (let v = 0; v < NUM_VOICES; v++) {
            const isDown = v >= 2;
            const gs = isDown ? this.grainSizeDown : this.grainSizeUp;
            const sp = isDown ? this.grainSpacingDown : this.grainSpacingUp;
            this.grains.push([]);
            for (let g = 0; g < NUM_GRAINS; g++)
                this.grains[v].push({ readPos: 0, samplesActive: (g * sp + phaseOffset) % gs });
        }
        this.oct1UpGain = 0; this.oct2UpGain = 0;
        this.oct1DownGain = 0; this.oct2DownGain = 0;
    }
    setAscend(a) {
        const x = Math.max(0, Math.min(1, a));
        this.oct1UpGain = Math.min(x / 0.75, 1.0);
        this.oct2UpGain = Math.max((x - 0.75) / 0.25, 0.0);
    }
    setDescend(d) {
        const x = Math.max(0, Math.min(1, d));
        this.oct1DownGain = Math.min(x / 0.75, 1.0);
        this.oct2DownGain = Math.max((x - 0.75) / 0.25, 0.0);
    }
    resetGrain(g, v) {
        const isDown = v >= 2;
        const gs = isDown ? this.grainSizeDown : this.grainSizeUp;
        const sp = isDown ? this.grainSpacingDown : this.grainSpacingUp;
        let startPos = this.writePos - gs
            + (this.rng.nextDouble() - 0.5) * 0.5 * sp
            + this.rng.nextDouble() * 0.3 * sp;
        while (startPos < 0) startPos += this.bufSize;
        while (startPos >= this.bufSize) startPos -= this.bufSize;
        g.readPos = startPos;
        g.samplesActive = 0;
    }
    process(input, output, n) {
        const gains = [this.oct1UpGain, this.oct2UpGain, this.oct1DownGain, this.oct2DownGain];
        const anyActive = gains.some(g => g > 0.0001);
        if (!anyActive) {
            for (let i = 0; i < n; i++) {
                this.buffer[this.writePos] = input[i];
                this.writePos = (this.writePos + 1) % this.bufSize;
                output[i] = 0;
            }
            return;
        }
        for (let i = 0; i < n; i++) {
            this.buffer[this.writePos] = input[i];
            let out = 0;
            for (let v = 0; v < NUM_VOICES; v++) {
                if (gains[v] < 0.0001) continue;
                const isDown = v >= 2;
                const gs = isDown ? this.grainSizeDown : this.grainSizeUp;
                const hann = isDown ? this.hannDown : this.hannUp;
                let voiceOut = 0;
                for (let g = 0; g < NUM_GRAINS; g++) {
                    const gr = this.grains[v][g];
                    if (gr.samplesActive >= gs) this.resetGrain(gr, v);
                    const w = hann[gr.samplesActive];
                    let rp = gr.readPos;
                    while (rp < 0) rp += this.bufSize;
                    while (rp >= this.bufSize) rp -= this.bufSize;
                    voiceOut += hermite(this.buffer, rp, this.bufSize) * w;
                    gr.readPos += PITCH_RATIOS[v];
                    if (gr.readPos >= this.bufSize) gr.readPos -= this.bufSize;
                    gr.samplesActive++;
                }
                voiceOut *= 0.25;
                out += voiceOut * gains[v];
            }
            output[i] = out;
            this.writePos = (this.writePos + 1) % this.bufSize;
        }
    }
}

// ============================================================================
// ReverieProcessor — main worklet (matches Reverie's signal chain)
// ============================================================================
class ReverieProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            // Main UI knobs (mirror DriftParameters.h)
            { name: 'immersion', defaultValue: 0.09, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'distance',  defaultValue: 2.75, minValue: 0.5,  maxValue: 5,  automationRate: 'k-rate' },
            { name: 'expanse',   defaultValue: 5.0,  minValue: 0,    maxValue: 40, automationRate: 'k-rate' },
            { name: 'timbre',    defaultValue: 0.5,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'ascend',    defaultValue: 0.10, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'descend',   defaultValue: 0,    minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'glow',      defaultValue: 0.10, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'driftMod',  defaultValue: 0.10, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'shimmer',   defaultValue: 0,    minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            // Vertical sliders (0-1 normalized → dB via sliderToGain)
            { name: 'inputGain',  defaultValue: 0.909, minValue: 0,  maxValue: 1,  automationRate: 'k-rate' },
            { name: 'outputGain', defaultValue: 0.909, minValue: 0,  maxValue: 1,  automationRate: 'k-rate' },
            // Bottom row
            { name: 'modDepth',  defaultValue: 0.40, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'modRate',   defaultValue: 2.0,  minValue: 0,    maxValue: 10, automationRate: 'k-rate' },
            { name: 'diffusion', defaultValue: 1.0,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'damping',   defaultValue: 0.75, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'hpfFreq',   defaultValue: 150,  minValue: 30,   maxValue: 1000,  automationRate: 'k-rate' },
            { name: 'lpfFreq',   defaultValue: 5000, minValue: 500,  maxValue: 20000, automationRate: 'k-rate' },
            { name: 'earlyMod',  defaultValue: 0,    minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
        ];
    }

    constructor() {
        super();
        const sr = sampleRate;
        this.sr = sr;

        this.diffuser  = new AllpassDiffuser(sr);
        this.fdn       = new FDNReverb(sr);
        this.tiltEQ    = new TiltEQ(sr);
        this.glow      = new GlowEffect(sr);
        this.driftLoFi = new DriftLoFi(sr);
        this.hpf       = new Biquad();
        this.lpf       = new Biquad();
        // Two stereo pairs for pitch — ascend (feeds back) vs descend (one-shot)
        this.pitchAscL = new GranularPitchShifter(sr, 42);
        this.pitchAscR = new GranularPitchShifter(sr, 137);
        this.pitchDescL = new GranularPitchShifter(sr, 201);
        this.pitchDescR = new GranularPitchShifter(sr, 317);

        this._dryL = new Float64Array(BLOCK_SIZE);
        this._dryR = new Float64Array(BLOCK_SIZE);
        this._wetL = new Float64Array(BLOCK_SIZE);
        this._wetR = new Float64Array(BLOCK_SIZE);
        this._pitchL = new Float64Array(BLOCK_SIZE);
        this._pitchR = new Float64Array(BLOCK_SIZE);
        // Shimmer feedback held across blocks (ascend output recirculates)
        this._fbL = new Float64Array(BLOCK_SIZE);
        this._fbR = new Float64Array(BLOCK_SIZE);

        // Limiter (1 ms attack / 50 ms release, threshold 1.0 = 0 dBFS)
        this.limEnv = 0; this.limGain = 1;
        this.limAtk     = Math.exp(-1.0 / (sr * 0.001));
        this.limRel     = Math.exp(-1.0 / (sr * 0.050));
        this.limGainAtk = Math.exp(-1.0 / (sr * 0.001));
        this.limGainRel = Math.exp(-1.0 / (sr * 0.050));

        this.lastExpanse = -1;
        this.lastDistance = -1;
        this.lastDamping = -1;
        this.lastHpfFreq = -1;
        this.lastLpfFreq = -1;
        this.lastModRate = -1;

        this.diffuser.setDiffusion(1.0);
    }

    // dB = val * 66 - 60  (0 → -60 dB / mute, 0.909 → 0 dB, 1.0 → +6 dB)
    sliderToGain(val) {
        if (val <= 0.001) return 0;
        const dB = val * 66.0 - 60.0;
        return Math.pow(10.0, dB / 20.0);
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !input[0] || !output || !output[0]) return true;
        const n = output[0].length;
        const inL = input[0], inR = input[1] || input[0];
        const outL = output[0], outR = output[1] || output[0];

        const immersion = parameters.immersion[0];
        const distance  = parameters.distance[0];
        const expanse   = parameters.expanse[0];
        const timbre    = parameters.timbre[0];
        const ascend    = parameters.ascend[0];
        const descend   = parameters.descend[0];
        const glow      = parameters.glow[0];
        const driftMod  = parameters.driftMod[0];
        const shimmer   = parameters.shimmer[0];
        const inputGV   = parameters.inputGain[0];
        const outputGV  = parameters.outputGain[0];
        const modDepth  = parameters.modDepth[0];
        const modRate   = parameters.modRate[0];
        const diffusion = parameters.diffusion[0];
        // Damping × 0.8 cap (per processBlock comment: UI 0–100% maps to 0–80%)
        const damping   = parameters.damping[0] * 0.8;
        const hpfFreq   = parameters.hpfFreq[0];
        const lpfFreq   = parameters.lpfFreq[0];
        // Shimmer × 0.9 cap (per processBlock comment: prevents feedback meltdown)
        const shimmerCapped = shimmer * 0.9;

        // Update DSP modules when parameters change
        if (Math.abs(distance - this.lastDistance) > 0.001) { this.fdn.setDistance(distance); this.lastDistance = distance; }
        if (Math.abs(expanse - this.lastExpanse)   > 0.01)  { this.fdn.setExpanse(Math.max(0.01, expanse)); this.lastExpanse = expanse; }
        if (Math.abs(damping - this.lastDamping)   > 0.001) { this.fdn.setDamping(damping); this.lastDamping = damping; }
        this.fdn.setDiffusion(diffusion);
        this.fdn.setModDepth(modDepth);
        if (Math.abs(modRate - this.lastModRate)   > 0.01)  { this.fdn.setModRate(modRate); this.lastModRate = modRate; }
        if (Math.abs(hpfFreq - this.lastHpfFreq)   > 0.5)   { this.hpf.setHPF(this.sr, hpfFreq); this.lastHpfFreq = hpfFreq; }
        if (Math.abs(lpfFreq - this.lastLpfFreq)   > 0.5)   { this.lpf.setLPF(this.sr, lpfFreq); this.lastLpfFreq = lpfFreq; }

        // Pre-diffusion / spatial bypass: Reverie doesn't have a separate
        // pre-diffusion stage; the diffusers live inside JPVerb. Skip.

        // TiltEQ (timbre 0..1 → ±12 dB)
        this.tiltEQ.setTilt((timbre - 0.5) * 24.0);

        // Glow + DriftLoFi
        this.glow.setAmount(glow);
        this.driftLoFi.setAmount(driftMod);

        // ── Step 5: input gain ───────────────────────────────────────────────
        const inputGainLin = this.sliderToGain(inputGV);

        // ── Step 6: copy input to dry/wet, apply input gain ──────────────────
        const dryL = this._dryL, dryR = this._dryR, wetL = this._wetL, wetR = this._wetR;
        for (let i = 0; i < n; i++) {
            dryL[i] = inL[i] * inputGainLin;
            dryR[i] = inR[i] * inputGainLin;
            wetL[i] = dryL[i];
            wetR[i] = dryR[i];
        }

        // ── Step 6b: HPF + LPF on wet (pre-reverb tone shaping) ──────────────
        this.hpf.process(wetL, wetR, n);
        this.lpf.process(wetL, wetR, n);

        // ── Step 7: TiltEQ on wet ────────────────────────────────────────────
        this.tiltEQ.process(wetL, wetR, n);

        const reverbBypassed = (expanse < 0.01);
        if (!reverbBypassed) {
            // ── Step 8: add shimmer feedback (ascend recirculation) ──────────
            for (let i = 0; i < n; i++) {
                wetL[i] += this._fbL[i] * shimmerCapped;
                wetR[i] += this._fbR[i] * shimmerCapped;
                this._fbL[i] = 0;
                this._fbR[i] = 0;
            }

            // ── Step 9: reverb (FDN, Reverie's JPVerb stand-in) ──────────────
            this.fdn.process(wetL, wetR, n);

            // ── Step 10a: Ascend pitch (feeds back into shimmer) ─────────────
            this.pitchAscL.setAscend(ascend);
            this.pitchAscL.setDescend(0);
            this.pitchAscR.setAscend(ascend);
            this.pitchAscR.setDescend(0);
            this.pitchAscL.process(wetL, this._pitchL, n);
            this.pitchAscR.process(wetR, this._pitchR, n);
            for (let i = 0; i < n; i++) {
                this._fbL[i] = this._pitchL[i];
                this._fbR[i] = this._pitchR[i];
                wetL[i] += this._pitchL[i];
                wetR[i] += this._pitchR[i];
            }

            // ── Step 10b: Descend pitch (one-shot, no feedback) ──────────────
            if (descend > 0.001) {
                this.pitchDescL.setAscend(0);
                this.pitchDescL.setDescend(descend);
                this.pitchDescR.setAscend(0);
                this.pitchDescR.setDescend(descend);
                this.pitchDescL.process(wetL, this._pitchL, n);
                this.pitchDescR.process(wetR, this._pitchR, n);
                for (let i = 0; i < n; i++) {
                    wetL[i] += this._pitchL[i];
                    wetR[i] += this._pitchR[i];
                }
            }
        }

        // ── Step 11: GlowEffect on wet ───────────────────────────────────────
        this.glow.process(wetL, wetR, n);

        // ── Step 11b: DriftLoFi on wet (tape+heat) ───────────────────────────
        this.driftLoFi.process(wetL, wetR, n);

        // ── Step 12-13: sin/cos dry/wet mix + output gain + limiter ──────────
        const outputGainLin = this.sliderToGain(outputGV);
        const m = immersion;
        const dryGain = Math.cos(m * HALF_PI);
        const wetGain = Math.sin(m * HALF_PI);

        for (let i = 0; i < n; i++) {
            let mixL = dryL[i] * dryGain + wetL[i] * wetGain;
            let mixR = dryR[i] * dryGain + wetR[i] * wetGain;
            mixL *= outputGainLin;
            mixR *= outputGainLin;
            // Limiter (threshold 1.0 / 0 dBFS, 1 ms attack / 50 ms release)
            const pk = Math.max(Math.abs(mixL), Math.abs(mixR));
            this.limEnv = pk > this.limEnv
                ? this.limAtk * this.limEnv + (1.0 - this.limAtk) * pk
                : this.limRel * this.limEnv + (1.0 - this.limRel) * pk;
            const targetGain = this.limEnv > 1.0 ? 1.0 / this.limEnv : 1.0;
            const gc = targetGain < this.limGain ? this.limGainAtk : this.limGainRel;
            this.limGain = gc * this.limGain + (1.0 - gc) * targetGain;
            outL[i] = mixL * this.limGain;
            outR[i] = mixR * this.limGain;
        }

        return true;
    }
}

registerProcessor('drift-reverb', ReverieProcessor);
