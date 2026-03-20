// ============================================================================
// DriftCisternProcessor — AudioWorklet
// Faithful JS port of Drift Cistern v29 shimmer reverb DSP chain.
//
// Complete signal chain (matches DriftEngine.h processBlock):
//   Input → Pre-Diffusion (6-stage allpass) → Spatial Decorrelator
//   → FDN Reverb (with shimmer injection) → Pitch Shift → Shimmer LP
//   → Energy Limiter → store shimmer → DriftEffect (warmth) → TiltEQ (tone)
//   → Stereo Width → Wet Gain (-4.5 dB) → Equal-power dry/wet mix
//   → Output HPF (20 Hz) → Output Limiter
//
// All internal processing in Float64Array (64-bit double precision).
// ============================================================================

const NUM_LINES = 16;
const NUM_ALLPASS = 2;
const HOUSEHOLDER_SCALE = 2.0 / 16.0; // 0.125
const OUTPUT_GAIN = 1.0 / Math.sqrt(8);
const PI = 3.14159265358979323846;
const TWO_PI = 2.0 * PI;
const HALF_PI = PI / 2.0;
const WET_GAIN = Math.pow(10.0, -4.5 / 20.0); // -4.5 dB ≈ 0.5957

// Prime-number fractions for FDN delay line lengths
const PRIMES = [149, 179, 223, 263, 307, 359, 419, 491, 563, 641, 727, 839, 953, 1097, 1259, 1447];
const PRIME_SUM = PRIMES.reduce((a, b) => a + b, 0);
const FRACTIONS = PRIMES.map(p => p / PRIME_SUM);

// FDN allpass coefficients
const AP_COEFF_1 = 0.35;
const AP_COEFF_2 = 0.30;

// Pitch shifter constants
const NUM_VOICES = 4;
const NUM_GRAINS = 8;
const GRAIN_SIZE_MS_UP = 150;
const GRAIN_SIZE_MS_DOWN = 250;
const PITCH_RATIOS = [2.0, 4.0, 0.5, 0.25]; // +12st, +24st, -12st, -24st

// Render quantum (always 128 in Web Audio spec)
const BLOCK_SIZE = 128;


// ── Hermite cubic interpolation ──────────────────────────────────────────────
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

// ── Simple LCG PRNG ──────────────────────────────────────────────────────────
class SimpleRng {
    constructor(seed) { this.state = (seed === 0 ? 1 : seed) >>> 0; }
    next() { this.state = (this.state * 1664525 + 1013904223) >>> 0; return this.state; }
    nextDouble() { return this.next() / 4294967296.0; }
}


// ============================================================================
// AllpassDiffuser — 6 cascaded allpass filters for pre-diffusion
// Port of AllpassDiffuser.h
//
// Delay times chosen to smear transients without audible echo:
//   Stage 1:  2.1ms  g=0.50    Stage 4: 23.1ms  g=0.40
//   Stage 2:  5.3ms  g=0.50    Stage 5: 37.9ms  g=0.35
//   Stage 3: 11.7ms  g=0.45    Stage 6: 53.7ms  g=0.30
//
// setDiffusion(0–1) scales base coefficients; 0 → g≈0.05 (transparent).
// ============================================================================
class AllpassDiffuser {
    constructor(sr) {
        this.NUM_STAGES = 6;
        this.MIN_COEFF = 0.05;
        this.DELAY_TIMES_MS = [2.1, 5.3, 11.7, 23.1, 37.9, 53.7];
        this.BASE_COEFFICIENTS = [0.50, 0.50, 0.45, 0.40, 0.35, 0.30];
        this.stageCoefficients = new Float64Array(6);

        // Per-channel, per-stage state: stages[ch][stage]
        this.stages = [[], []];
        for (let s = 0; s < 6; s++) {
            const delaySamples = Math.max(1, Math.ceil(this.DELAY_TIMES_MS[s] * 0.001 * sr));
            const bufferSize = delaySamples + 1;
            for (let ch = 0; ch < 2; ch++) {
                this.stages[ch].push({
                    buffer: new Float64Array(bufferSize),
                    bufferSize,
                    delayLength: delaySamples,
                    writePos: 0
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

    process(left, right, numSamples) {
        const channels = [left, right];
        for (let ch = 0; ch < 2; ch++) {
            const data = channels[ch];
            for (let s = 0; s < 6; s++) {
                const ap = this.stages[ch][s];
                const g = this.stageCoefficients[s];
                for (let n = 0; n < numSamples; n++) {
                    const x = data[n];
                    let readPos = ap.writePos - ap.delayLength;
                    if (readPos < 0) readPos += ap.bufferSize;
                    const delayed = ap.buffer[readPos];
                    const v = x + g * delayed;
                    const y = delayed - g * v;
                    ap.buffer[ap.writePos] = v;
                    ap.writePos++;
                    if (ap.writePos >= ap.bufferSize) ap.writePos = 0;
                    data[n] = y;
                }
            }
        }
    }

    reset() {
        for (let ch = 0; ch < 2; ch++) {
            for (let s = 0; s < this.stages[ch].length; s++) {
                this.stages[ch][s].buffer.fill(0);
                this.stages[ch][s].writePos = 0;
            }
        }
    }
}


// ============================================================================
// SpatialDecorator — Cross-channel modulated delay with 4-stage allpass
// Port of SpatialDecorator.h
//
// Creates 3D depth via independent L/R delay modulation:
//   1. Cross-feed (L↔R blend)
//   2. Modulated stereo delay (slow LFOs at different rates per channel)
//   3. 4-stage allpass diffusion per channel (smooths discrete echoes)
//   4. Feedback (builds echo density)
//
// LFO rates: L=0.031Hz, R=0.047Hz, L2=0.073Hz, R2=0.019Hz
// Allpass delays: [3.1, 7.3, 13.7, 21.1]ms (R channel ×1.13 for decorrelation)
// ============================================================================
class SpatialDecorator {
    constructor(sr) {
        this.sr = sr;
        this.NUM_AP_STAGES = 4;
        // LFO rates — very slow, irrational ratios prevent beating
        this.LFO_RATE_L  = 0.031;
        this.LFO_RATE_R  = 0.047;
        this.LFO_RATE_L2 = 0.073;
        this.LFO_RATE_R2 = 0.019;
        const AP_DELAYS_MS = [3.1, 7.3, 13.7, 21.1];

        // Delay buffers: max 200ms + 20ms modulation headroom + padding
        this.delayBufSize = Math.ceil(0.250 * sr) + 16;
        this.delayBufL = new Float64Array(this.delayBufSize);
        this.delayBufR = new Float64Array(this.delayBufSize);

        // 4-stage allpass per channel
        this.apL = [];
        this.apR = [];
        for (let s = 0; s < 4; s++) {
            const apLen  = Math.max(1, Math.ceil(AP_DELAYS_MS[s] * 0.001 * sr));
            const apLenR = Math.max(1, Math.ceil(AP_DELAYS_MS[s] * 1.13 * 0.001 * sr));
            this.apL.push({ buffer: new Float64Array(apLen + 1),  bufferSize: apLen + 1,  delayLength: apLen,  writePos: 0 });
            this.apR.push({ buffer: new Float64Array(apLenR + 1), bufferSize: apLenR + 1, delayLength: apLenR, writePos: 0 });
        }

        // LFO phase increments
        this.lfoIncL  = this.LFO_RATE_L  / sr;
        this.lfoIncR  = this.LFO_RATE_R  / sr;
        this.lfoIncL2 = this.LFO_RATE_L2 / sr;
        this.lfoIncR2 = this.LFO_RATE_R2 / sr;

        this.reset();
    }

    setAmount(amount) {
        this.amount01 = Math.max(0.0, Math.min(1.0, amount));
        this.baseDelayMs = 30.0 + this.amount01 * 50.0;        // 30–80ms
        this.crossFeed   = this.amount01 * 0.20;                // 0–20%
        this.feedback    = this.amount01 * 0.30;                // 0–30%
        this.modDepthMs  = this.amount01 * 2.0;                 // 0–2ms
        this.apCoeff     = this.amount01 * 0.55;                // 0–0.55
    }

    _processAllpass(ap, input, g) {
        let readPos = ap.writePos - ap.delayLength;
        if (readPos < 0) readPos += ap.bufferSize;
        const delayed = ap.buffer[readPos];
        const v = input + g * delayed;
        const y = delayed - g * v;
        ap.buffer[ap.writePos] = v;
        ap.writePos++;
        if (ap.writePos >= ap.bufferSize) ap.writePos = 0;
        return y;
    }

    process(left, right, numSamples) {
        if (this.amount01 < 0.001) return; // bypass when negligible

        const baseDelaySamples = this.baseDelayMs * 0.001 * this.sr;
        const modDepthSamples  = this.modDepthMs * 0.001 * this.sr;

        for (let n = 0; n < numSamples; n++) {
            const inL = left[n];
            const inR = right[n];

            // Cross-feed + feedback
            const xfL = inL + inR * this.crossFeed + this.fbStateR * this.feedback;
            const xfR = inR + inL * this.crossFeed + this.fbStateL * this.feedback;

            // L channel modulated delay — two LFOs for complex movement
            const modL = modDepthSamples * (
                0.6 * Math.sin(TWO_PI * this.lfoPhaseL) +
                0.4 * Math.sin(TWO_PI * this.lfoPhaseL2));
            let delayL = baseDelaySamples + modL;
            if (delayL < 1.0) delayL = 1.0;

            // R channel — different LFO rates, slightly longer base delay (×1.07)
            const modR = modDepthSamples * (
                0.6 * Math.sin(TWO_PI * this.lfoPhaseR) +
                0.4 * Math.sin(TWO_PI * this.lfoPhaseR2));
            let delayR = baseDelaySamples * 1.07 + modR;
            if (delayR < 1.0) delayR = 1.0;

            // Write into delay buffers
            this.delayBufL[this.writePos] = xfL;
            this.delayBufR[this.writePos] = xfR;

            // Read with Hermite interpolation
            let posL = this.writePos - delayL;
            while (posL < 0.0) posL += this.delayBufSize;
            let tapL = hermite(this.delayBufL, posL, this.delayBufSize);

            let posR = this.writePos - delayR;
            while (posR < 0.0) posR += this.delayBufSize;
            let tapR = hermite(this.delayBufR, posR, this.delayBufSize);

            // 4-stage allpass diffusion per channel
            for (let s = 0; s < 4; s++) {
                tapL = this._processAllpass(this.apL[s], tapL, this.apCoeff);
                tapR = this._processAllpass(this.apR[s], tapR, this.apCoeff);
            }

            // Store feedback state
            this.fbStateL = tapL;
            this.fbStateR = tapR;

            // Advance LFOs
            this.lfoPhaseL  += this.lfoIncL;  if (this.lfoPhaseL  >= 1.0) this.lfoPhaseL  -= 1.0;
            this.lfoPhaseR  += this.lfoIncR;  if (this.lfoPhaseR  >= 1.0) this.lfoPhaseR  -= 1.0;
            this.lfoPhaseL2 += this.lfoIncL2; if (this.lfoPhaseL2 >= 1.0) this.lfoPhaseL2 -= 1.0;
            this.lfoPhaseR2 += this.lfoIncR2; if (this.lfoPhaseR2 >= 1.0) this.lfoPhaseR2 -= 1.0;

            // Advance write pointer
            this.writePos++;
            if (this.writePos >= this.delayBufSize) this.writePos = 0;

            // Crossfade between dry and processed
            left[n]  = inL * (1.0 - this.amount01) + tapL * this.amount01;
            right[n] = inR * (1.0 - this.amount01) + tapR * this.amount01;
        }
    }

    reset() {
        this.delayBufL.fill(0);
        this.delayBufR.fill(0);
        this.writePos = 0;
        this.fbStateL = 0.0;
        this.fbStateR = 0.0;
        this.lfoPhaseL  = 0.0;
        this.lfoPhaseR  = 0.25;  // offset for stereo decorrelation
        this.lfoPhaseL2 = 0.5;
        this.lfoPhaseR2 = 0.75;
        this.amount01    = 0.0;
        this.baseDelayMs = 20.0;
        this.crossFeed   = 0.0;
        this.feedback    = 0.0;
        this.modDepthMs  = 0.0;
        this.apCoeff     = 0.0;
        for (let s = 0; s < 4; s++) {
            this.apL[s].buffer.fill(0); this.apL[s].writePos = 0;
            this.apR[s].buffer.fill(0); this.apR[s].writePos = 0;
        }
    }
}


// ============================================================================
// FDN Reverb — 16-line Householder with nested allpass, Jot RT60 damping
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
        this.isFrozen = false;
        this.currentModDepthNorm = 0.3;

        // LFO state
        this.lfoRng = new SimpleRng(42);
        this.lfoState = new Float64Array(NUM_LINES);
        this.lfoFiltered = new Float64Array(NUM_LINES);
        this.lfoSmoothCoeff = new Float64Array(NUM_LINES);
        this.lfoStepScale = new Float64Array(NUM_LINES);

        // Shimmer injection buffers
        this.shimmerInL = new Float64Array(BLOCK_SIZE);
        this.shimmerInR = new Float64Array(BLOCK_SIZE);

        // Pre-allocate per-sample work arrays (avoids GC in process loop)
        this._tapOut  = new Float64Array(NUM_LINES);
        this._mixed   = new Float64Array(NUM_LINES);
        this._feedback = new Float64Array(NUM_LINES);

        const maxDelay = Math.ceil(1.1 * sr) + 16;

        for (let i = 0; i < NUM_LINES; i++) {
            const lineScale = 0.8 + 0.4 * i / 15.0;
            const ap1Delay = Math.max(1, Math.ceil(0.0013 * lineScale * sr));
            const ap2Delay = Math.max(1, Math.ceil(0.0029 * lineScale * sr));

            this.lines.push({
                buffer: new Float64Array(maxDelay),
                bufferSize: maxDelay,
                writePos: 0,
                lpState1: 0, lpState2: 0,
                dcState: 0, dcPrevInput: 0,
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

        this.setSize(0.65);
        this.computeDamping(2.0, 3.0, 1.0);
    }

    setSize(size) {
        const totalMs = 250 * Math.pow(6000 / 250, size);
        for (let i = 0; i < NUM_LINES; i++) {
            this.currentDelaySamples[i] = Math.max(1, FRACTIONS[i] * totalMs * 0.001 * this.sr);
        }
    }

    setModDepth(d) { this.currentModDepthNorm = d; }
    setFreeze(f) { this.isFrozen = f; }

    computeDamping(t60Low, t60Mid, t60High) {
        t60Low  = Math.max(0.05, t60Low);
        t60Mid  = Math.max(0.05, t60Mid);
        t60High = Math.max(0.05, t60High);
        for (let i = 0; i < NUM_LINES; i++) {
            const d = Math.max(1, this.currentDelaySamples[i]);
            let gMid = Math.pow(10, -3.0 * d / (t60Mid * this.sr));
            gMid = Math.min(0.9999, Math.max(0, gMid));
            this.dampGain[i] = gMid;
            const fc = 3000 + 7000 * (1 - i / 15.0);
            this.dampLpCoeff[i] = Math.exp(-TWO_PI * fc / this.sr);
        }
    }

    setDecayParams(decaySec, hfDecayRatio) {
        const tNorm = Math.max(0, Math.min(1, (decaySec - 0.1) / 59.9));
        this.setSize(Math.sqrt(tNorm));
        this.computeDamping(decaySec * 1.05, decaySec, decaySec * hfDecayRatio);
    }

    processAllpass(ap, input, g) {
        let readPos = ap.writePos - ap.delayLength;
        if (readPos < 0) readPos += ap.bufferSize;
        const delayed = ap.buffer[readPos];
        const v = input + g * delayed;
        const y = delayed - g * v;
        ap.buffer[ap.writePos] = v;
        ap.writePos = (ap.writePos + 1) % ap.bufferSize;
        return y;
    }

    process(left, right, numSamples) {
        const tapOut  = this._tapOut;
        const mixed   = this._mixed;
        const fb      = this._feedback;

        for (let n = 0; n < numSamples; n++) {
            // Read from delay lines with modulation + allpass
            for (let i = 0; i < NUM_LINES; i++) {
                const line = this.lines[i];
                // Random-walk LFO
                const rv = this.lfoRng.next();
                const rs = (rv / 4294967296.0 - 0.5) * 2.0;
                this.lfoState[i] = Math.max(-1, Math.min(1,
                    this.lfoState[i] + rs * this.lfoStepScale[i]));
                this.lfoFiltered[i] = this.lfoSmoothCoeff[i] * this.lfoFiltered[i]
                    + (1 - this.lfoSmoothCoeff[i]) * this.lfoState[i];

                const lineModDepth = this.currentDelaySamples[i] * 0.02 * this.currentModDepthNorm;
                const modSamples = this.lfoFiltered[i] * lineModDepth;
                const totalDelay = this.currentDelaySamples[i] + modSamples;

                let readPosD = line.writePos - totalDelay;
                if (readPosD < 0) readPosD += line.bufferSize;

                let tap = hermite(line.buffer, readPosD, line.bufferSize);
                tap = this.processAllpass(line.ap[0], tap, AP_COEFF_1);
                tap = this.processAllpass(line.ap[1], tap, AP_COEFF_2);
                tapOut[i] = tap;
            }

            // Householder mixing
            let sum = 0;
            for (let i = 0; i < NUM_LINES; i++) sum += tapOut[i];
            const scaledSum = sum * HOUSEHOLDER_SCALE;
            for (let i = 0; i < NUM_LINES; i++) mixed[i] = tapOut[i] - scaledSum;

            // Per-line damping + DC blocker
            for (let i = 0; i < NUM_LINES; i++) {
                const line = this.lines[i];
                line.lpState1 = (1 - this.dampLpCoeff[i]) * mixed[i]
                    + this.dampLpCoeff[i] * line.lpState1;
                line.lpState2 = (1 - this.dampLpCoeff[i]) * line.lpState1
                    + this.dampLpCoeff[i] * line.lpState2;
                let damped = line.lpState2 * this.dampGain[i];
                // DC blocker
                const dcIn = damped;
                const dcOut = dcIn - line.dcPrevInput + 0.9995 * line.dcState;
                line.dcPrevInput = dcIn;
                line.dcState = dcOut;
                fb[i] = this.isFrozen
                    ? (dcOut * this.fbScale[i])
                    : (dcOut * this.currentFeedback * this.fbScale[i]);
            }

            // Inject input + shimmer
            const inL = left[n], inR = right[n];
            const shimL = n < this.shimmerInL.length ? this.shimmerInL[n] : 0;
            const shimR = n < this.shimmerInR.length ? this.shimmerInR[n] : 0;

            for (let i = 0; i < NUM_LINES; i++) {
                const pan = this.panCoeff[i];
                const inp = inL * (1 - pan) + inR * pan;
                const shim = shimL * (1 - pan) + shimR * pan;
                this.lines[i].buffer[this.lines[i].writePos] = inp + fb[i] + shim;
                this.lines[i].writePos = (this.lines[i].writePos + 1)
                    % this.lines[i].bufferSize;
            }

            // Output: sum with stereo panning
            let outL = 0, outR = 0;
            for (let i = 0; i < NUM_LINES; i++) {
                outL += tapOut[i] * (1 - this.panCoeff[i]);
                outR += tapOut[i] * this.panCoeff[i];
            }
            left[n]  = outL * OUTPUT_GAIN;
            right[n] = outR * OUTPUT_GAIN;
        }
    }
}


// ============================================================================
// Granular Pitch Shifter — 4 voices × 8 grains, Hann window, Hermite interp
// ============================================================================
class GranularPitchShifter {
    constructor(sr, seed) {
        this.sr = sr;
        this.rng = new SimpleRng(seed);
        this.grainSizeUp = Math.ceil(GRAIN_SIZE_MS_UP * 0.001 * sr);
        this.grainSizeDown = Math.ceil(GRAIN_SIZE_MS_DOWN * 0.001 * sr);
        this.grainSpacingUp = Math.floor(this.grainSizeUp / NUM_GRAINS);
        this.grainSpacingDown = Math.floor(this.grainSizeDown / NUM_GRAINS);

        // Input circular buffer
        this.bufSize = this.grainSizeDown * 8;
        this.buffer = new Float64Array(this.bufSize);
        this.writePos = 0;

        // Hann windows
        this.hannUp = new Float32Array(this.grainSizeUp);
        for (let i = 0; i < this.grainSizeUp; i++)
            this.hannUp[i] = 0.5 * (1 - Math.cos(TWO_PI * i / this.grainSizeUp));
        this.hannDown = new Float32Array(this.grainSizeDown);
        for (let i = 0; i < this.grainSizeDown; i++)
            this.hannDown[i] = 0.5 * (1 - Math.cos(TWO_PI * i / this.grainSizeDown));

        // Grain state: [voice][grain]
        this.grains = [];
        const phaseOffset = (seed * 7) % Math.max(1, this.grainSpacingUp);
        for (let v = 0; v < NUM_VOICES; v++) {
            const isDown = v >= 2;
            const gs = isDown ? this.grainSizeDown : this.grainSizeUp;
            const sp = isDown ? this.grainSpacingDown : this.grainSpacingUp;
            this.grains.push([]);
            for (let g = 0; g < NUM_GRAINS; g++) {
                this.grains[v].push({
                    readPos: 0,
                    samplesActive: (g * sp + phaseOffset) % gs
                });
            }
        }

        this.oct1UpGain = 0;
        this.oct2UpGain = 0;
        this.oct1DownGain = 0;
        this.oct2DownGain = 0;
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

    process(input, output, numSamples) {
        for (let n = 0; n < numSamples; n++) {
            this.buffer[this.writePos] = input[n];
            let out = 0;

            for (let v = 0; v < NUM_VOICES; v++) {
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
                voiceOut *= 0.25; // normalize (1/4 for 8 Hann grains summing to ~4)

                const gains = [this.oct1UpGain, this.oct2UpGain,
                               this.oct1DownGain, this.oct2DownGain];
                out += voiceOut * gains[v];
            }

            output[n] = out;
            this.writePos = (this.writePos + 1) % this.bufSize;
        }
    }
}


// ============================================================================
// FeedbackEnergyLimiter — RMS envelope follower with gain reduction
// Port of FeedbackEnergyLimiter.h
//
// Prevents shimmer runaway at high shimmer + high decay settings.
//   - One-pole envelope follower tracks stereo RMS (~10ms window)
//   - Gain reduction when RMS > threshold
//   - Attack ~1ms (fast) / Release ~50ms (slow) for transparent limiting
// ============================================================================
class FeedbackEnergyLimiter {
    constructor(sr) {
        this.rmsAlpha    = 1.0 - Math.exp(-1.0 / (0.010 * sr)); // 10ms RMS window
        this.attackCoeff = 1.0 - Math.exp(-1.0 / (0.001 * sr)); // 1ms attack
        this.releaseCoeff = 1.0 - Math.exp(-1.0 / (0.050 * sr)); // 50ms release
        this.rmsLevel    = 0.0;
        this.currentGain = 1.0;
    }

    process(left, right, numSamples, threshold) {
        if (threshold === undefined) threshold = 0.9;
        for (let n = 0; n < numSamples; n++) {
            // Track RMS energy (stereo sum of squares)
            const energy = left[n] * left[n] + right[n] * right[n];
            this.rmsLevel += this.rmsAlpha * (energy - this.rmsLevel);
            if (this.rmsLevel < 0.0) this.rmsLevel = 0.0;

            const rms = Math.sqrt(this.rmsLevel);

            // Compute target gain: reduce if above threshold
            const targetGain = (rms > threshold) ? (threshold / rms) : 1.0;

            // Smooth gain: fast attack, slow release
            const coeff = (targetGain < this.currentGain)
                ? this.attackCoeff : this.releaseCoeff;
            this.currentGain += coeff * (targetGain - this.currentGain);

            left[n]  *= this.currentGain;
            right[n] *= this.currentGain;
        }
    }

    reset() {
        this.rmsLevel    = 0.0;
        this.currentGain = 1.0;
    }
}


// ============================================================================
// DriftEffect — 3-stage tube character (warmth/glow)
// Port of DriftEffect.h
//
// Amount 0.0 (clean) → 1.0 (full tube limiter):
//   1. Tube compression:  RMS compressor, threshold 1.0→0.15, ratio 1:1→10:1
//   2. Tube saturation:   Asymmetric tanh, drive 1×→6×, even-harmonic warmth
//   3. HF rolloff:        One-pole LP, 20kHz→6kHz (tape head character)
// ============================================================================
class DriftEffect {
    constructor(sr) {
        this.sr = sr;
        // Envelope follower coefficients
        this.envAttack  = Math.exp(-1.0 / (sr * 0.002));  // 2ms attack
        this.envRelease = Math.exp(-1.0 / (sr * 0.200));  // 200ms release
        this.rmsCoeff   = Math.exp(-1.0 / (sr * 0.010));  // 10ms RMS window
        this.reset();
    }

    setAmount(amount) {
        this.amount01 = Math.max(0.0, Math.min(1.0, amount));

        // Compressor: threshold 1.0→0.15, ratio 1:1→10:1
        this.compThreshold = 1.0 - this.amount01 * 0.85;
        this.compRatio     = 1.0 + this.amount01 * 9.0;

        // Saturation: drive 1×→6×
        this.satDrive  = 1.0 + this.amount01 * 5.0;
        this.satMakeup = 1.0 / Math.max(0.3, Math.tanh(this.satDrive * 0.7));

        // HF rolloff: 20kHz→6kHz
        const cutoffHz = 20000.0 * Math.pow(0.3, this.amount01);
        const wc = 2.0 * PI * cutoffHz / this.sr;
        this.lpCoeff = Math.exp(-wc);
    }

    _saturate(x) {
        const driven = x * this.satDrive;
        let shaped;
        if (driven >= 0.0) {
            shaped = Math.tanh(driven);
        } else {
            // Negative half driven 15% harder → asymmetry → even harmonics
            shaped = Math.tanh(driven * 1.15) / 1.15;
        }
        // Subtle Gaussian bias for extra 2nd-harmonic content
        const bias = 0.08 * (this.satDrive - 1.0) / 5.0
            * Math.exp(-driven * driven * 0.5);
        return (shaped + bias) * this.satMakeup;
    }

    process(left, right, numSamples) {
        for (let n = 0; n < numSamples; n++) {
            let L = left[n];
            let R = right[n];

            // ── Stage 1: Tube Compression / Limiting ──
            {
                const mono = (L + R) * 0.5;
                const sq = mono * mono;
                this.rmsEnvelope = this.rmsCoeff * this.rmsEnvelope
                    + (1.0 - this.rmsCoeff) * sq;
                const rmsLevel = Math.sqrt(this.rmsEnvelope);

                let gainReduction = 1.0;
                if (rmsLevel > this.compThreshold && this.compThreshold > 0.0) {
                    const overshoot = rmsLevel / this.compThreshold;
                    const exponent = (1.0 / this.compRatio) - 1.0;
                    gainReduction = Math.pow(overshoot, exponent);
                }

                if (gainReduction < this.compGainSmoothed)
                    this.compGainSmoothed = this.envAttack * this.compGainSmoothed
                        + (1.0 - this.envAttack) * gainReduction;
                else
                    this.compGainSmoothed = this.envRelease * this.compGainSmoothed
                        + (1.0 - this.envRelease) * gainReduction;

                L *= this.compGainSmoothed;
                R *= this.compGainSmoothed;
            }

            // ── Stage 2: Tube Saturation ──
            L = this._saturate(L);
            R = this._saturate(R);

            // ── Stage 3: HF Rolloff (one-pole LP) ──
            this.lpStateL = (1.0 - this.lpCoeff) * L + this.lpCoeff * this.lpStateL;
            L = this.lpStateL;
            this.lpStateR = (1.0 - this.lpCoeff) * R + this.lpCoeff * this.lpStateR;
            R = this.lpStateR;

            left[n]  = L;
            right[n] = R;
        }
    }

    reset() {
        this.amount01         = 0.0;
        this.compThreshold    = 1.0;
        this.compRatio        = 1.0;
        this.satDrive         = 1.0;
        this.satMakeup        = 1.0;
        this.lpCoeff          = 0.0;
        this.rmsEnvelope      = 0.0;
        this.compGainSmoothed = 1.0;
        this.lpStateL         = 0.0;
        this.lpStateR         = 0.0;
    }
}


// ============================================================================
// TiltEQ — First-order crossover tilt at 1 kHz pivot
// Port of TiltEQ.h
//
// Splits signal into LP + HP bands via one-pole crossover, applies
// complementary gain.  V = 10^(|dB|/40) — half the total tilt per side.
//   Negative dB → dark (lows up, highs down)
//   0 dB        → flat
//   Positive dB → bright (highs up, lows down)
// ============================================================================
class TiltEQ {
    constructor(sr) {
        // First-order LP coefficient at 1000 Hz crossover
        const wc = 2.0 * PI * 1000.0 / sr;
        this.lpCoeff  = Math.exp(-wc);
        this.lowGain  = 1.0;
        this.highGain = 1.0;
        this.stateL   = 0.0;
        this.stateR   = 0.0;
    }

    setTilt(tiltDb) {
        const dB = Math.max(-12.0, Math.min(12.0, tiltDb));
        const V = Math.pow(10.0, Math.abs(dB) / 40.0);
        if (dB >= 0.0) {
            this.highGain = V;
            this.lowGain  = 1.0 / V;
        } else {
            this.lowGain  = V;
            this.highGain = 1.0 / V;
        }
    }

    process(left, right, numSamples) {
        for (let n = 0; n < numSamples; n++) {
            // Left: split into LP + HP, apply tilt gains
            this.stateL = (1.0 - this.lpCoeff) * left[n] + this.lpCoeff * this.stateL;
            const hpL = left[n] - this.stateL;
            left[n] = this.stateL * this.lowGain + hpL * this.highGain;

            // Right
            this.stateR = (1.0 - this.lpCoeff) * right[n] + this.lpCoeff * this.stateR;
            const hpR = right[n] - this.stateR;
            right[n] = this.stateR * this.lowGain + hpR * this.highGain;
        }
    }

    reset() {
        this.stateL = 0.0;
        this.stateR = 0.0;
    }
}


// ============================================================================
// StereoWidthProcessor — Mid/side encoding with width control
// Port of StereoWidthProcessor.h
//
// Stateless. Width semantics:
//   0.0       = mono  (side zeroed)
//   1.0       = unity (no change)
//   1.0–2.0   = "clear center" (mid fades out, side boosted)
//   2.0       = pure sides (mid removed)
// ============================================================================
class StereoWidthProcessor {
    process(left, right, numSamples, width) {
        for (let n = 0; n < numSamples; n++) {
            const mid  = (left[n] + right[n]) * 0.5;
            const side = (left[n] - right[n]) * 0.5;

            const midGain  = width <= 1.0 ? 1.0 : Math.max(0.0, 2.0 - width);
            const sideGain = width;

            left[n]  = mid * midGain + side * sideGain;
            right[n] = mid * midGain - side * sideGain;
        }
    }
}


// ============================================================================
// DriftCisternProcessor — AudioWorklet main processor
// ============================================================================
class DriftCisternProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'mix',          defaultValue: 0,    minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'dimension',    defaultValue: 0.1,  minValue: 0.1,  maxValue: 60, automationRate: 'k-rate' },
            { name: 'octUp',        defaultValue: 0,    minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'octDown',      defaultValue: 0,    minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'modDepth',     defaultValue: 0,    minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'warmth',       defaultValue: 0,    minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'shimmerLevel', defaultValue: 0.25, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'tone',         defaultValue: 0,    minValue: -1,   maxValue: 1,  automationRate: 'k-rate' },
            { name: 'stereoWidth',  defaultValue: 1.0,  minValue: 0,    maxValue: 2,  automationRate: 'k-rate' },
            { name: 'spatial',      defaultValue: 0.3,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
        ];
    }

    constructor() {
        super();
        const sr = sampleRate;

        // ── DSP modules ──
        this.diffuser       = new AllpassDiffuser(sr);
        this.spatial        = new SpatialDecorator(sr);
        this.fdn            = new FDNReverb(sr);
        this.pitchL         = new GranularPitchShifter(sr, 42);
        this.pitchR         = new GranularPitchShifter(sr, 12345);
        this.energyLimiter  = new FeedbackEnergyLimiter(sr);
        this.driftEffect    = new DriftEffect(sr);
        this.tiltEQ         = new TiltEQ(sr);
        this.stereoWidth    = new StereoWidthProcessor();

        // ── Shimmer buffers ──
        this.shimmerBufL  = new Float64Array(BLOCK_SIZE);
        this.shimmerBufR  = new Float64Array(BLOCK_SIZE);
        this.prevShimmerL = new Float64Array(BLOCK_SIZE);
        this.prevShimmerR = new Float64Array(BLOCK_SIZE);

        // ── Shimmer LP filter state (one-pole lowpass, adaptive cutoff) ──
        this.shimmerLpStateL = 0.0;
        this.shimmerLpStateR = 0.0;

        // ── Output HPF state (20 Hz DC blocker, second-order) ──
        // Implemented as a first-order HP: y[n] = x[n] - x[n-1] + R * y[n-1]
        // R = 1 - (2π × 20 / sr)
        this.hpfR = 1.0 - (TWO_PI * 20.0 / sr);
        this.hpfPrevInL  = 0.0;
        this.hpfPrevInR  = 0.0;
        this.hpfPrevOutL = 0.0;
        this.hpfPrevOutR = 0.0;

        // ── Output limiter envelope ──
        this.limiterEnv = 0.0;

        // ── Cached parameter for change detection ──
        this.lastDimension = -1;

        // ── Pre-allocate work buffers (avoid GC in process) ──
        this._dryL = new Float64Array(BLOCK_SIZE);
        this._dryR = new Float64Array(BLOCK_SIZE);
        this._wetL = new Float64Array(BLOCK_SIZE);
        this._wetR = new Float64Array(BLOCK_SIZE);
        this._fdnOutL = new Float64Array(BLOCK_SIZE);
        this._fdnOutR = new Float64Array(BLOCK_SIZE);

        // ── Set diffuser to density=1.0 (full pre-diffusion) ──
        this.diffuser.setDiffusion(1.0);
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !input[0] || !output || !output[0]) return true;

        const numSamples = output[0].length;
        const inL = input[0], inR = input[1] || input[0];
        const outL = output[0], outR = output[1] || output[0];

        // ── Read parameters ──
        const mix          = parameters.mix[0];
        const dimension    = parameters.dimension[0];
        const octUp        = parameters.octUp[0];
        const octDown      = parameters.octDown[0];
        const modDepth     = parameters.modDepth[0];
        const warmth       = parameters.warmth[0];
        const shimmerLevel = parameters.shimmerLevel[0];
        const tone         = parameters.tone[0];
        const stereoWidth  = parameters.stereoWidth[0];
        const spatialAmt   = parameters.spatial[0];

        // ── Update FDN decay if dimension changed ──
        if (Math.abs(dimension - this.lastDimension) > 0.01) {
            this.lastDimension = dimension;
            this.fdn.setDecayParams(dimension, 0.3);
        }
        this.fdn.setModDepth(modDepth);

        // ── Set pitch shifter gains (75% breakpoint mapping like plugin) ──
        const oct1Up   = Math.min(octUp / 0.75, 1.0);
        const oct2Up   = Math.max((octUp - 0.75) / 0.25, 0.0);
        const oct1Down = Math.min(octDown / 0.75, 1.0);
        const oct2Down = Math.max((octDown - 0.75) / 0.25, 0.0);
        this.pitchL.oct1UpGain = oct1Up; this.pitchL.oct2UpGain = oct2Up;
        this.pitchL.oct1DownGain = oct1Down; this.pitchL.oct2DownGain = oct2Down;
        this.pitchR.oct1UpGain = oct1Up; this.pitchR.oct2UpGain = oct2Up;
        this.pitchR.oct1DownGain = oct1Down; this.pitchR.oct2DownGain = oct2Down;

        // ── Update spatial decorrelator ──
        this.spatial.setAmount(spatialAmt);

        // ── Update DriftEffect (warmth) ──
        this.driftEffect.setAmount(warmth);

        // ── Update TiltEQ: tone -1..+1 → -6..+6 dB ──
        this.tiltEQ.setTilt(tone * 6.0);

        // ── Compute adaptive shimmer LP coefficient ──
        // Cutoff sweeps from 6kHz (octUp=0) to 2.5kHz (octUp=1)
        const shimmerLpCutoff = 6000.0 - octUp * 3500.0; // 6000 → 2500 Hz
        const shimmerLpWc = TWO_PI * shimmerLpCutoff / sampleRate;
        const shimmerLpCoeff = Math.exp(-shimmerLpWc);

        // ── Copy dry signal + prepare wet ──
        const dryL = this._dryL;
        const dryR = this._dryR;
        const wetL = this._wetL;
        const wetR = this._wetR;
        for (let i = 0; i < numSamples; i++) {
            dryL[i] = inL[i]; dryR[i] = inR[i];
            wetL[i] = inL[i]; wetR[i] = inR[i];
        }

        // ════════════════════════════════════════════════════════════════
        // SIGNAL CHAIN — matches DriftEngine.h processBlock exactly
        // ════════════════════════════════════════════════════════════════

        // ── 1. Pre-Diffusion (6-stage cascaded allpass, density=1.0) ──
        this.diffuser.process(wetL, wetR, numSamples);

        // ── 2. Spatial Decorrelator ──
        this.spatial.process(wetL, wetR, numSamples);

        // ── 3. Inject previous block's shimmer into FDN ──
        const shimBufSize = Math.min(numSamples, this.fdn.shimmerInL.length);
        for (let i = 0; i < shimBufSize; i++) {
            this.fdn.shimmerInL[i] = this.prevShimmerL[i] * shimmerLevel;
            this.fdn.shimmerInR[i] = this.prevShimmerR[i] * shimmerLevel;
        }

        // ── 4. FDN Reverb (with shimmer injection) ──
        this.fdn.process(wetL, wetR, numSamples);

        // ── 5. Pitch Shift (FDN output → shimmer feedback) ──
        const fdnOutL = this._fdnOutL;
        const fdnOutR = this._fdnOutR;
        for (let i = 0; i < numSamples; i++) {
            fdnOutL[i] = wetL[i];
            fdnOutR[i] = wetR[i];
        }
        this.pitchL.process(fdnOutL, this.shimmerBufL, numSamples);
        this.pitchR.process(fdnOutR, this.shimmerBufR, numSamples);

        // ── 6. Shimmer LP (adaptive one-pole lowpass after pitch shifting) ──
        // Cutoff: 6kHz→2.5kHz as octUp increases (tames harsh shimmer harmonics)
        for (let i = 0; i < numSamples; i++) {
            this.shimmerLpStateL = (1.0 - shimmerLpCoeff) * this.shimmerBufL[i]
                + shimmerLpCoeff * this.shimmerLpStateL;
            this.shimmerBufL[i] = this.shimmerLpStateL;

            this.shimmerLpStateR = (1.0 - shimmerLpCoeff) * this.shimmerBufR[i]
                + shimmerLpCoeff * this.shimmerLpStateR;
            this.shimmerBufR[i] = this.shimmerLpStateR;
        }

        // ── 7. Energy Limiter (prevents shimmer runaway, uses shimmerLevel) ──
        // Threshold inversely related to shimmerLevel for tighter control at high levels
        const limiterThreshold = 0.9 - shimmerLevel * 0.3; // 0.9→0.6
        this.energyLimiter.process(
            this.shimmerBufL, this.shimmerBufR, numSamples,
            Math.max(0.3, limiterThreshold));

        // ── 8. Store shimmer for next block ──
        for (let i = 0; i < numSamples; i++) {
            this.prevShimmerL[i] = this.shimmerBufL[i];
            this.prevShimmerR[i] = this.shimmerBufR[i];
        }

        // ── 9. DriftEffect (warmth: tube comp → saturation → HF rolloff) ──
        this.driftEffect.process(wetL, wetR, numSamples);

        // ── 10. TiltEQ (tone: first-order crossover tilt at 1kHz) ──
        this.tiltEQ.process(wetL, wetR, numSamples);

        // ── 11. Stereo Width (mid/side encoding) ──
        this.stereoWidth.process(wetL, wetR, numSamples, stereoWidth);

        // ── 12. Wet Gain (-4.5 dB) ──
        for (let i = 0; i < numSamples; i++) {
            wetL[i] *= WET_GAIN;
            wetR[i] *= WET_GAIN;
        }

        // ── 13. Equal-power dry/wet mix (quadratic taper) ──
        const mixTapered = mix * mix;
        const dryGain = Math.cos(mixTapered * HALF_PI);
        const wetGain = Math.sin(mixTapered * HALF_PI);

        for (let i = 0; i < numSamples; i++) {
            outL[i] = dryL[i] * dryGain + wetL[i] * wetGain;
            outR[i] = dryR[i] * dryGain + wetR[i] * wetGain;
        }

        // ── 14. Output HPF (20 Hz high-pass to remove DC / sub rumble) ──
        for (let i = 0; i < numSamples; i++) {
            const inSampleL = outL[i];
            const inSampleR = outR[i];
            this.hpfPrevOutL = this.hpfR * this.hpfPrevOutL
                + inSampleL - this.hpfPrevInL;
            this.hpfPrevInL = inSampleL;
            outL[i] = this.hpfPrevOutL;

            this.hpfPrevOutR = this.hpfR * this.hpfPrevOutR
                + inSampleR - this.hpfPrevInR;
            this.hpfPrevInR = inSampleR;
            outR[i] = this.hpfPrevOutR;
        }

        // ── 15. Output Limiter (peak envelope with fast attack / slow release) ──
        for (let i = 0; i < numSamples; i++) {
            const peak = Math.max(Math.abs(outL[i]), Math.abs(outR[i]));
            if (peak > this.limiterEnv)
                this.limiterEnv = 0.999 * this.limiterEnv + 0.001 * peak; // ~1ms attack
            else
                this.limiterEnv = 0.9999 * this.limiterEnv + 0.0001 * peak; // ~10ms release

            if (this.limiterEnv > 0.92) {
                const g = 0.92 / this.limiterEnv;
                outL[i] *= g;
                outR[i] *= g;
            }
        }

        return true;
    }
}

registerProcessor('drift-cistern', DriftCisternProcessor);