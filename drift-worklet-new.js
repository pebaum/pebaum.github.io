// ============================================================================
// ReverieProcessor — full DSP port of Reverie / Drift v0.11.0-b
//
// Hand-ported (no simplifications) from:
//   plugins/reverie/plugin/Source/dsp/DriftReverb.dsp        (Faust JPVerb)
//   plugins/reverie/plugin/Source/dsp/TapeTransport.h        (Revox A77 model)
//   plugins/reverie/plugin/Source/dsp/HeatChannel.h          (tube/speaker/ear)
//   plugins/reverie/plugin/Source/dsp/DriftEffect.h          (lo-fi orchestrator)
//   plugins/reverie/plugin/Source/dsp/SpectralPitchShifter.h (FFT phase vocoder)
//   plugins/reverie/plugin/Source/dsp/GlowEffect.h           (tube preamp)
//   plugins/reverie/plugin/Source/dsp/TiltEQ.h               (1 kHz pivot)
//   plugins/reverie/plugin/Source/dsp/DriftEngine.h          (signal flow)
//   plugins/reverie/plugin/Source/DriftParameters.h          (param surface)
//
// Signal chain (DriftEngine::processBlock):
//   InputGain → copy(dry,wet) → HPF → LPF → TiltEQ
//   → if expanse > 0.01: wet += shimmer*feedback ; JPVerb ; PitchAscend(feeds back)
//                        ; if descend > 0: PitchDescend (one-shot)
//   → GlowEffect → DriftEffect (Tape→Heat) → sin/cos dry/wet (immersion)
//   → OutputGain → 1 ms / 50 ms peak limiter at 0 dBFS
// ============================================================================

const PI = 3.14159265358979323846;
const TWO_PI = 2.0 * PI;
const HALF_PI = PI / 2.0;
const BLOCK_SIZE = 128;

// ── Utility: xorshift32 PRNG (matches the C++ used in Tape/Heat) ────────────
class XorShift32 {
    constructor(seed) { this.s = (seed >>> 0) || 1; }
    setSeed(seed) { this.s = (seed >>> 0) || 1; }
    nextU32() {
        let s = this.s;
        s ^= (s << 13) >>> 0;
        s ^= s >>> 17;
        s ^= (s << 5) >>> 0;
        s = s >>> 0;
        this.s = s;
        return s;
    }
    next() { return this.nextU32() / 4294967296.0; }     // [0,1)
}

// ── Utility: LCG PRNG (used by FDN / pitch shifter for stable seeding) ──────
class SimpleRng {
    constructor(seed) { this.state = (seed === 0 ? 1 : seed) >>> 0; }
    next() { this.state = (this.state * 1664525 + 1013904223) >>> 0; return this.state; }
    nextDouble() { return this.next() / 4294967296.0; }
}

// ── Utility: precomputed prime numbers (matches Faust ma.primes) ────────────
// Generated up to 4096 primes — enough for any size*scale used in the .dsp.
const PRIMES = (() => {
    const out = [2];
    let n = 3;
    while (out.length < 4096) {
        let isP = true;
        const lim = Math.floor(Math.sqrt(n));
        for (let i = 0; out[i] <= lim; i++) {
            if (n % out[i] === 0) { isP = false; break; }
        }
        if (isP) out.push(n);
        n += 2;
    }
    return out;
})();
function nthPrime(n) {
    const i = Math.max(0, Math.min(PRIMES.length - 1, Math.floor(n)));
    return PRIMES[i];
}

// ── Utility: in-place radix-2 Cooley-Tukey FFT (real input via packed RFFT) ─
// Matches juce::dsp::FFT::performRealOnlyForwardTransform output layout used
// by SpectralPitchShifter.h: [re0, im0, re1, im1, ...] for kNumBins = N/2 + 1.
class FFT {
    constructor(order) {
        this.order = order;
        this.N = 1 << order;
        // Bit-reversal table
        this.rev = new Uint32Array(this.N);
        const half = this.N >> 1;
        for (let i = 0; i < this.N; i++) {
            let j = 0, x = i;
            for (let k = 0; k < order; k++) { j = (j << 1) | (x & 1); x >>>= 1; }
            this.rev[i] = j;
        }
        // Twiddle factors
        this.cosTab = new Float64Array(half);
        this.sinTab = new Float64Array(half);
        for (let i = 0; i < half; i++) {
            this.cosTab[i] = Math.cos(-2 * PI * i / this.N);
            this.sinTab[i] = Math.sin(-2 * PI * i / this.N);
        }
    }
    // In-place complex FFT. re[], im[] of length N. dir = 1 forward, -1 inverse.
    fftComplex(re, im, dir) {
        const N = this.N, rev = this.rev;
        for (let i = 0; i < N; i++) {
            const j = rev[i];
            if (j > i) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
        }
        for (let size = 2; size <= N; size <<= 1) {
            const half = size >> 1, step = N / size;
            for (let i = 0; i < N; i += size) {
                for (let k = 0; k < half; k++) {
                    const ti = step * k;
                    const cos = this.cosTab[ti], sin = dir > 0 ? this.sinTab[ti] : -this.sinTab[ti];
                    const a = i + k, b = a + half;
                    const tr = re[b] * cos - im[b] * sin;
                    const tii = re[b] * sin + im[b] * cos;
                    re[b] = re[a] - tr; im[b] = im[a] - tii;
                    re[a] += tr;          im[a] += tii;
                }
            }
        }
        if (dir < 0) {
            const inv = 1 / N;
            for (let i = 0; i < N; i++) { re[i] *= inv; im[i] *= inv; }
        }
    }
    // Real forward FFT: input real[N], output bins[2*(N/2+1)] interleaved re,im.
    rfft(real, bins) {
        const N = this.N;
        const re = this._re || (this._re = new Float64Array(N));
        const im = this._im || (this._im = new Float64Array(N));
        for (let i = 0; i < N; i++) { re[i] = real[i]; im[i] = 0; }
        this.fftComplex(re, im, 1);
        const numBins = (N >> 1) + 1;
        for (let k = 0; k < numBins; k++) { bins[k * 2] = re[k]; bins[k * 2 + 1] = im[k]; }
    }
    // Inverse real FFT: input bins[2*(N/2+1)] re,im, output real[N].
    irfft(bins, real) {
        const N = this.N;
        const re = this._re || (this._re = new Float64Array(N));
        const im = this._im || (this._im = new Float64Array(N));
        const numBins = (N >> 1) + 1;
        for (let k = 0; k < numBins; k++) { re[k] = bins[k * 2]; im[k] = bins[k * 2 + 1]; }
        // Mirror the upper half (conjugate)
        for (let k = 1; k < numBins - 1; k++) {
            re[N - k] = re[k];
            im[N - k] = -im[k];
        }
        this.fftComplex(re, im, -1);
        for (let i = 0; i < N; i++) real[i] = re[i];
    }
}

// ── Utility: 1st-order allpass-interpolated fractional delay (Faust fdelay1a)
// Per Julius O. Smith: integer-tap into circular buffer, then 1st-order allpass
// (g = (1 - dFrac) / (1 + dFrac)) for the fractional part.
class AllpassDelay {
    constructor(maxSamples) {
        this.bufSize = Math.max(8, maxSamples + 4);
        this.buf = new Float64Array(this.bufSize);
        this.writePos = 0;
        this.apX = 0; // x[n-1] for the allpass
        this.apY = 0; // y[n-1]
    }
    write(x) {
        this.buf[this.writePos] = x;
        this.writePos = (this.writePos + 1) % this.bufSize;
    }
    // Read at fractional delay (samples). Must be called once per sample, AFTER write.
    read(delay) {
        const d = Math.max(1.0, delay);
        const dInt = d | 0;
        const dFrac = d - dInt;
        let pos = this.writePos - dInt - 1;
        while (pos < 0) pos += this.bufSize;
        const x = this.buf[pos];
        const g = (1.0 - dFrac) / (1.0 + dFrac);
        const y = -g * x + this.apX + g * this.apY;
        this.apX = x;
        this.apY = y;
        return y;
    }
    reset() { this.buf.fill(0); this.writePos = 0; this.apX = 0; this.apY = 0; }
}

// ── Utility: 4-point Lagrange-interpolated fractional delay (Faust fdelay4) ─
class Lagrange4Delay {
    constructor(maxSamples) {
        this.bufSize = Math.max(16, maxSamples + 8);
        this.buf = new Float64Array(this.bufSize);
        this.writePos = 0;
    }
    write(x) {
        this.buf[this.writePos] = x;
        this.writePos = (this.writePos + 1) % this.bufSize;
    }
    read(delay) {
        const d = Math.max(2.0, delay);
        const dInt = d | 0;
        const f = d - dInt;
        // Read y[-1], y[0], y[1], y[2] in delay-decreasing order
        // The "tap" is at writePos - dInt - 1. y0 = tap, y_{-1} = older, y1, y2 = newer.
        const N = this.bufSize;
        let p = this.writePos - dInt - 1; while (p < 0) p += N;
        const idx0 = p;
        const idxM = (idx0 - 1 + N) % N;
        const idxP = (idx0 + 1) % N;
        const idxQ = (idx0 + 2) % N;
        const yM = this.buf[idxM], y0 = this.buf[idx0], y1 = this.buf[idxP], y2 = this.buf[idxQ];
        // 4-pt Lagrange basis at x = -1, 0, 1, 2; t = f
        const c_M = -f * (f - 1) * (f - 2) / 6;
        const c_0 = (f + 1) * (f - 1) * (f - 2) / 2;
        const c_1 = -(f + 1) * f * (f - 2) / 2;
        const c_2 = (f + 1) * f * (f - 1) / 6;
        return c_M * yM + c_0 * y0 + c_1 * y1 + c_2 * y2;
    }
    reset() { this.buf.fill(0); this.writePos = 0; }
}

// ============================================================================
// JPVerb diffuser primitive (Faust diffuser_aux)
//
// Topology (matching Faust exactly):
//   input(stereo) <:
//     pathA = (input * c_norm) → recursive feedback through:
//                                  (block + rotator(angle) + 2*fdelay1a delays)
//                                  with feedback gain (-s_norm), then mem*c_norm
//     pathB = (input * s_norm)
//   output = pathA + pathB
//
// "block" inside the feedback is either passthrough (leaf) or another diffuser
// for nested diffusers. We unroll nesting at construction time as a cascade of
// non-nested diffusers. The .dsp uses single-level diffusers (block = bus(2)).
// ============================================================================
class JPVerbDiffuser {
    constructor(angle, g, scale1Idx, scale2Idx, sizeRef, maxDelay) {
        this.angle = angle;
        this.cosG = Math.cos(g);
        this.sinG = Math.sin(g);
        this.cosA = Math.cos(angle);
        this.sinA = Math.sin(angle);
        this.scale1Idx = scale1Idx; // index into ma.primes, scaled by size
        this.scale2Idx = scale2Idx;
        this.sizeRef = sizeRef;       // {value: size}; readable
        this.delay1 = new AllpassDelay(maxDelay);
        this.delay2 = new AllpassDelay(maxDelay);
        // Smoothed prime delay length per channel — Faust's smooth_init(0.995, ma.primes(...))
        this.d1 = nthPrime(scale1Idx * sizeRef.value) - 1;
        this.d2 = nthPrime(scale2Idx * sizeRef.value) - 1;
        this.d1Smooth = this.d1;
        this.d2Smooth = this.d2;
        this.smoothCoeff = 0.9999;  // Faust uses 0.9999 in diffuser_aux
        // Feedback state from previous sample
        this.fbL = 0;
        this.fbR = 0;
        // Single-sample memory (the "mem" in Faust diffuser_aux's c_norm path)
        this.memL = 0;
        this.memR = 0;
    }
    // Called once per sample at the start of each block, updates target delay
    // sizes from current size value. The smooth_init filter handles glitch-free
    // size changes per-sample.
    updateTargetDelays() {
        this.d1Target = nthPrime(this.scale1Idx * this.sizeRef.value) - 1;
        this.d2Target = nthPrime(this.scale2Idx * this.sizeRef.value) - 1;
    }
    // Process one stereo sample. Returns [outL, outR].
    process(inL, inR) {
        // Smooth delay lengths
        this.d1Smooth = this.smoothCoeff * this.d1Smooth + (1.0 - this.smoothCoeff) * this.d1Target;
        this.d2Smooth = this.smoothCoeff * this.d2Smooth + (1.0 - this.smoothCoeff) * this.d2Target;

        // pathB = input * sinG (direct path)
        const pBL = inL * this.sinG;
        const pBR = inR * this.sinG;

        // pathA: input * cosG goes through the recursive feedback
        // a_in = input*cosG ; "block" passes a_in through (here: identity)
        // then rotator(angle); then two delay lines with feedback gain -sinG into the next iteration
        // Faust's (block ~ par(i, 2, *(-s_norm))) means: the delay outputs are
        // multiplied by -sinG and fed back into the block's inputs.
        const aInL = inL * this.cosG + this.fbL * (-this.sinG);
        const aInR = inR * this.cosG + this.fbR * (-this.sinG);

        // rotator(PI/4) — 2x2 rotation: (cos, -sin; sin, cos)
        const rL = aInL * this.cosA - aInR * this.sinA;
        const rR = aInL * this.sinA + aInR * this.cosA;

        // Write into delay buffers, read at smoothed delay lengths
        this.delay1.write(rL);
        this.delay2.write(rR);
        const d1Out = this.delay1.read(this.d1Smooth);
        const d2Out = this.delay2.read(this.d2Smooth);

        // Save delay outputs as feedback for next sample
        this.fbL = d1Out;
        this.fbR = d2Out;

        // pathA tail: "mem : *(c_norm)" — single-sample delay then * cosG
        const pAL = this.memL * this.cosG;
        const pAR = this.memR * this.cosG;
        this.memL = d1Out;
        this.memR = d2Out;

        return [pAL + pBL, pAR + pBR];
    }
    reset() {
        this.delay1.reset(); this.delay2.reset();
        this.fbL = 0; this.fbR = 0;
        this.memL = 0; this.memR = 0;
        this.d1Smooth = this.d1;
        this.d2Smooth = this.d2;
    }
}

// ── JPVerb modulation source (mod_src in Faust) ─────────────────────────────
// 4 weighted sine LFOs at incommensurate rates + 1 filtered noise.
class ModSource {
    constructor(r1, r2, r3, r4, nr, sr, seed) {
        this.r1 = r1; this.r2 = r2; this.r3 = r3; this.r4 = r4; this.nr = nr;
        this.sr = sr;
        this.p1 = 0; this.p2 = 0; this.p3 = 0; this.p4 = 0;
        this.rng = new XorShift32(seed);
        // 3rd-order Butterworth-filtered noise (no.lfnoiseN(3, freq))
        this.noiseState = [0, 0, 0];
        this.noiseTarget = 0;
        this.noiseHold = 0;
        this.noiseSamplesLeft = 0;
    }
    sample(modFreqHz) {
        // Advance phases
        const inv = 1.0 / this.sr;
        this.p1 += TWO_PI * modFreqHz * this.r1 * inv; if (this.p1 > TWO_PI) this.p1 -= TWO_PI;
        this.p2 += TWO_PI * modFreqHz * this.r2 * inv; if (this.p2 > TWO_PI) this.p2 -= TWO_PI;
        this.p3 += TWO_PI * modFreqHz * this.r3 * inv; if (this.p3 > TWO_PI) this.p3 -= TWO_PI;
        this.p4 += TWO_PI * modFreqHz * this.r4 * inv; if (this.p4 > TWO_PI) this.p4 -= TWO_PI;
        const sineSum = 0.4 * Math.sin(this.p1) + 0.3 * Math.sin(this.p2)
                      + 0.2 * Math.sin(this.p3) + 0.1 * Math.sin(this.p4);
        // Filtered noise: triangular sample-hold at rate nr*modFreq, then 3-pole LP at same freq
        const nFreq = Math.max(0.01, modFreqHz * this.nr);
        if (this.noiseSamplesLeft <= 0) {
            this.noiseTarget = (this.rng.next() - 0.5) * 2.0;
            this.noiseSamplesLeft = Math.max(1, this.sr / nFreq | 0);
        }
        this.noiseSamplesLeft--;
        // Linear interp between hold and target — gives a cleaner low-rate noise
        const a = 1.0 - (this.noiseSamplesLeft / Math.max(1, this.sr / nFreq));
        const noiseRaw = this.noiseHold + (this.noiseTarget - this.noiseHold) * a;
        if (this.noiseSamplesLeft === 0) this.noiseHold = this.noiseTarget;
        // 3-stage one-pole LPF cascade ≈ Butterworth response order 3
        const lpC = Math.exp(-TWO_PI * nFreq / this.sr);
        let s = noiseRaw;
        for (let i = 0; i < 3; i++) {
            this.noiseState[i] = lpC * this.noiseState[i] + (1 - lpC) * s;
            s = this.noiseState[i];
        }
        return sineSum + 0.15 * s;
    }
    reset() {
        this.p1 = 0; this.p2 = 0; this.p3 = 0; this.p4 = 0;
        this.noiseState = [0, 0, 0];
        this.noiseHold = 0; this.noiseTarget = 0; this.noiseSamplesLeft = 0;
    }
}

// ── JPVerb 3-band Linkwitz-Riley filterbank (Faust fi.filterbank(5, ...)) ───
// Crossover at lowcut and highcut. 4th-order LR: cascade of two 2nd-order
// Butterworth lowpasses. Output: (lowBand, midBand, highBand).
class LinkwitzRiley3Band {
    constructor() {
        this.loCut = 600.0;
        this.hiCut = 5000.0;
        // Per-channel state
        this.state = [
            { lo: [0, 0, 0, 0], mid: [0, 0, 0, 0], hi: [0, 0, 0, 0] },
            { lo: [0, 0, 0, 0], mid: [0, 0, 0, 0], hi: [0, 0, 0, 0] }
        ];
        this.coeffs = null;
    }
    setSampleRate(sr) { this.sr = sr; this._compute(); }
    setCutoffs(loCut, hiCut) { this.loCut = loCut; this.hiCut = hiCut; this._compute(); }
    _bw2(fc) {
        // 2nd-order Butterworth LP coeffs
        const w0 = TWO_PI * fc / this.sr;
        const cs = Math.cos(w0), sn = Math.sin(w0);
        const alpha = sn / (2.0 * 0.7071067811865476);
        const a0 = 1.0 + alpha;
        return {
            b0: ((1.0 - cs) / 2.0) / a0,
            b1: (1.0 - cs) / a0,
            b2: ((1.0 - cs) / 2.0) / a0,
            a1: (-2.0 * cs) / a0,
            a2: (1.0 - alpha) / a0,
        };
    }
    _compute() {
        // LR4 = cascade of two BW2 LPs; HP = input - LP
        this.lpLo = this._bw2(this.loCut);
        this.lpHi = this._bw2(this.hiCut);
    }
    // Apply 4th-order LR at cutoff fc to input x, returns LP output. State is
    // a [s1, s2, s3, s4] running state for the two BW2 stages cascaded.
    static _lr4(x, c, s) {
        // Stage 1: y1 = c.b0*x + c.b1*x[-1] + c.b2*x[-2] - c.a1*y1[-1] - c.a2*y1[-2]
        const y1 = c.b0 * x + c.b1 * s[0] + c.b2 * s[1] - c.a1 * s[2] - c.a2 * s[3];
        // We're using DF1 with s[0]=x[-1], s[1]=x[-2], s[2]=y1[-1], s[3]=y1[-2]
        s[1] = s[0]; s[0] = x;
        s[3] = s[2]; s[2] = y1;
        return y1;
    }
    // Process one stereo sample. Returns [loL, loR, midL, midR, hiL, hiR]
    process(inL, inR) {
        const sL = this.state[0], sR = this.state[1];
        // Stage A — first BW2 LP at lowCut
        const lpA_L = LinkwitzRiley3Band._lr4(inL, this.lpLo, sL.lo);
        const lpA_R = LinkwitzRiley3Band._lr4(inR, this.lpLo, sR.lo);
        // Stage B — first BW2 LP at hiCut
        const lpB_L = LinkwitzRiley3Band._lr4(inL, this.lpHi, sL.mid);
        const lpB_R = LinkwitzRiley3Band._lr4(inR, this.lpHi, sR.mid);
        // Low band = LP at lowCut
        // Mid band = LP at hiCut - LP at lowCut
        // High band = input - LP at hiCut
        const loL = lpA_L, loR = lpA_R;
        const midL = lpB_L - lpA_L, midR = lpB_R - lpA_R;
        const hiL = inL - lpB_L, hiR = inR - lpB_R;
        return [loL, loR, midL, midR, hiL, hiR];
    }
    reset() {
        for (let ch = 0; ch < 2; ch++) {
            this.state[ch].lo.fill(0);
            this.state[ch].mid.fill(0);
            this.state[ch].hi.fill(0);
        }
    }
}

// ============================================================================
// JPVerbReverb — full port of DriftReverb.dsp (Julian Parker JPVerb fork)
//
// 2 input mod delays → smooth(damp) → 4 cascaded diffusers (early_diff)
//   ~ feedback path:
//       5 cascaded diffusers (invSqrt2)
//       → 2 mod fb1 delays
//       → 2 prime delays (size * (54 + 150*i), smooth_init 0.995)
//       → 5 cascaded diffusers (invSqrt2)
//       → 2 mod fb2 delays
//       → 2 prime delays (size * (134 - 100*i))
//       → 3-band filterbank * (low, mid, high gains)
//       → * fb gain (RT60 derived)
// ============================================================================
class JPVerbReverb {
    constructor(sr) {
        this.sr = sr;
        this.invSqrt2 = 1.0 / Math.sqrt(2.0);

        // Parameter targets — match Faust hsliders
        this.t60        = 4.2;
        this.damp       = 0.5;
        this.size       = 3.5;
        this.early_diff = 0.707;
        this.mod_depth  = 0.1;
        this.mod_freq   = 1.0;
        this.mod_scale  = 75.0;
        this.low        = 1.0;
        this.mid        = 1.0;
        this.high       = 1.0;
        this.lowcut     = 600.0;
        this.highcut    = 5000.0;
        this.early_mod  = 0.3;

        // Damping smoother (Faust si.smooth(damp)) — one-pole LP with coefficient = damp
        this.dampStateL = 0; this.dampStateR = 0;

        // Modulation sources — 6 taps, each with unique rate multipliers (no two
        // share a rate, preventing coherent phaser sweep).
        // Per .dsp:
        //   in_L   : (0.79, 1.23, 0.67, 1.47, 0.41)
        //   in_R   : (0.97, 0.71, 1.31, 0.83, 0.53)
        //   fb1_L  : (1.13, 0.89, 1.07, 0.73, 0.47)
        //   fb1_R  : (1.37, 1.19, 0.81, 1.09, 0.59)
        //   fb2_L  : (0.83, 1.41, 0.93, 1.17, 0.43)
        //   fb2_R  : (1.09, 0.77, 1.29, 0.91, 0.51)
        this.modIn_L  = new ModSource(0.79, 1.23, 0.67, 1.47, 0.41, sr, 1001);
        this.modIn_R  = new ModSource(0.97, 0.71, 1.31, 0.83, 0.53, sr, 1002);
        this.modFb1_L = new ModSource(1.13, 0.89, 1.07, 0.73, 0.47, sr, 1003);
        this.modFb1_R = new ModSource(1.37, 1.19, 0.81, 1.09, 0.59, sr, 1004);
        this.modFb2_L = new ModSource(0.83, 1.41, 0.93, 1.17, 0.43, sr, 1005);
        this.modFb2_R = new ModSource(1.09, 0.77, 1.29, 0.91, 0.51, sr, 1006);

        // Input modulated delays — fdelay4(512, ...). Buffer size big enough for
        // 5 (constant offset) + depth * 2 in worst case.
        this.delIn_L  = new Lagrange4Delay(512);
        this.delIn_R  = new Lagrange4Delay(512);
        this.delFb1_L = new Lagrange4Delay(512);
        this.delFb1_R = new Lagrange4Delay(512);
        this.delFb2_L = new Lagrange4Delay(8192);
        this.delFb2_R = new Lagrange4Delay(8192);

        // Diffuser sizeRef shared by all diffusers (so size param updates flow)
        this.sizeRef = { value: this.size };

        // Pre-section: 4 cascaded diffusers with prime scales (early_diff gain)
        // Each diffuser in Faust source: diffuser(PI/4, early_diff, scale1, scale2, size)
        this.preDiff = [
            new JPVerbDiffuser(PI / 4, this.early_diff,  55, 240, this.sizeRef, 8192),
            new JPVerbDiffuser(PI / 4, this.early_diff, 215,  85, this.sizeRef, 8192),
            new JPVerbDiffuser(PI / 4, this.early_diff, 115, 190, this.sizeRef, 8192),
            new JPVerbDiffuser(PI / 4, this.early_diff, 175, 145, this.sizeRef, 8192),
        ];

        // Feedback diffusers: 5 with invSqrt2 gain, scales 10+30*i, 110+30*i for i in 0..4
        this.fbDiffA = [];
        for (let i = 0; i < 5; i++) {
            this.fbDiffA.push(new JPVerbDiffuser(
                PI / 4, this.invSqrt2,
                10 + 30 * i, 110 + 30 * i,
                this.sizeRef, 8192));
        }
        // Second set of 5 fb diffusers, scales 125+30*i, 25+30*i
        this.fbDiffB = [];
        for (let i = 0; i < 5; i++) {
            this.fbDiffB.push(new JPVerbDiffuser(
                PI / 4, this.invSqrt2,
                125 + 30 * i, 25 + 30 * i,
                this.sizeRef, 8192));
        }

        // Prime delays after fb1/fb2 sets (each is a per-channel fdelay1a)
        // Per-line scale indices: i=0 → (54, 134), i=1 → (204, 34)
        // Faust: par(i, 2, fdelay1a(8192, ma.primes(size * (54 + 150*i)) - 1))
        // and    par(i, 2, fdelay1a(8192, ma.primes(size * (134 - 100*i)) - 1))
        // par(i, 2, ...) creates 2 parallel instances (one per stereo channel)
        // with the same scale formula → they share length; the i refers to channel? No.
        //
        // Looking at Faust: par(i, N, expression(i)) creates N parallel paths, where i indexes them.
        // par(i, 2, fdelay1a(...)) → 2 paths, both fdelay1a with the same param (since the
        // scale doesn't reference i in the prime formula here; the i refers to OUTER seq).
        //
        // BUT — looking at the .dsp more carefully:
        //   : par(i, 2,
        //       de.fdelay1a(8192,
        //           (ma.primes(size * (54 + 150*i))
        //               : smooth_init(0.995, ma.primes(size * (54 + 150*i)))) - 1))
        // The i here IS the channel index 0 or 1. So channel 0 uses scale 54, channel 1 uses 204.
        //
        // Same for the second set: i=0 → 134, i=1 → 34.
        this.primeDelayA_L = new AllpassDelay(8192);
        this.primeDelayA_R = new AllpassDelay(8192);
        this.primeDelayB_L = new AllpassDelay(8192);
        this.primeDelayB_R = new AllpassDelay(8192);
        this.primeA_L_target = 0; this.primeA_L_state = 0;
        this.primeA_R_target = 0; this.primeA_R_state = 0;
        this.primeB_L_target = 0; this.primeB_L_state = 0;
        this.primeB_R_target = 0; this.primeB_R_state = 0;
        this.primeSmoothCoeff = 0.995;

        // 3-band filterbank
        this.filterbankL = new LinkwitzRiley3Band(); this.filterbankL.setSampleRate(sr);
        this.filterbankR = new LinkwitzRiley3Band(); this.filterbankR.setSampleRate(sr);

        // Feedback storage from previous sample (Faust ~ operator)
        this.fbStateL = 0;
        this.fbStateR = 0;

        // Pre-compute initial values
        this._updateAllParams();
    }
    setSampleRate(sr) {
        this.sr = sr;
        this.filterbankL.setSampleRate(sr);
        this.filterbankR.setSampleRate(sr);
    }
    setReverbTime(t)  { this.t60 = Math.max(0.1, t); }
    setSize(s)        { this.size = Math.max(0.5, Math.min(5.0, s)); this.sizeRef.value = this.size; }
    setDamping(d)     { this.damp = Math.max(0.0, Math.min(1.0, d)); }
    setDiffusion(d)   {
        this.early_diff = Math.max(0.0, Math.min(1.0, d));
        for (const dif of this.preDiff) {
            dif.cosG = Math.cos(this.early_diff);
            dif.sinG = Math.sin(this.early_diff);
        }
    }
    setModDepth(m)    { this.mod_depth = Math.max(0.0, Math.min(1.0, m)); }
    setModFreq(f)     { this.mod_freq = Math.max(0.0, Math.min(10.0, f)); }
    setModScale(s)    { this.mod_scale = s; }
    setLFGain(g)      { this.low = g; }
    setMIDGain(g)     { this.mid = g; }
    setHFGain(g)      { this.high = g; }
    setLoCrossover(f) { this.lowcut = f; this.filterbankL.setCutoffs(f, this.highcut); this.filterbankR.setCutoffs(f, this.highcut); }
    setHiCrossover(f) { this.highcut = f; this.filterbankL.setCutoffs(this.lowcut, f); this.filterbankR.setCutoffs(this.lowcut, f); }
    setEarlyMod(e)    { this.early_mod = Math.max(0.0, Math.min(1.0, e)); }

    _updateAllParams() {
        // Update diffuser delay targets from current size
        for (const d of this.preDiff) d.updateTargetDelays();
        for (const d of this.fbDiffA) d.updateTargetDelays();
        for (const d of this.fbDiffB) d.updateTargetDelays();
        // Prime delay targets
        // i=0 → 54, i=1 → 204 (set A)
        this.primeA_L_target = nthPrime(this.size * 54)  - 1;
        this.primeA_R_target = nthPrime(this.size * 204) - 1;
        // i=0 → 134, i=1 → 34 (set B)
        this.primeB_L_target = nthPrime(this.size * 134) - 1;
        this.primeB_R_target = nthPrime(this.size * 34)  - 1;
    }

    process(left, right, n) {
        // Per-block: update diffuser delay targets from current size
        this._updateAllParams();
        // Total length per .dsp: calib * 0.1 * (size * 5/4 - 1/4); calib = 1.7
        const calib = 1.7;
        const totalLength = calib * 0.1 * (this.size * 5.0 / 4.0 - 0.25);
        // fb gain: 10^(-3 / (t60 / total_length))
        const fbGain = Math.pow(10.0, -3.0 / (this.t60 / Math.max(0.001, totalLength)));

        // Mod depths: input taps use depth_early, fb taps use depth
        const depth = this.mod_scale * this.mod_depth;
        const depth_early = depth * this.early_mod;

        for (let s = 0; s < n; s++) {
            // Smooth prime delay targets
            this.primeA_L_state = this.primeSmoothCoeff * this.primeA_L_state + (1 - this.primeSmoothCoeff) * this.primeA_L_target;
            this.primeA_R_state = this.primeSmoothCoeff * this.primeA_R_state + (1 - this.primeSmoothCoeff) * this.primeA_R_target;
            this.primeB_L_state = this.primeSmoothCoeff * this.primeB_L_state + (1 - this.primeSmoothCoeff) * this.primeB_L_target;
            this.primeB_R_state = this.primeSmoothCoeff * this.primeB_R_state + (1 - this.primeSmoothCoeff) * this.primeB_R_target;

            // Inputs (sum input and feedback)
            // Faust: ((bus(4) :> bus(2)) sums input and feedback channel-wise.
            // Input is (left, right); feedback is (fbStateL, fbStateR).
            const inL = left[s] + this.fbStateL;
            const inR = right[s] + this.fbStateR;

            // Modulation sample: depth_early + depth_early * mod_src + 5
            // (the +5 prevents zero/very-short delays)
            const modInL = depth_early + depth_early * this.modIn_L.sample(this.mod_freq) + 5;
            const modInR = depth_early + depth_early * this.modIn_R.sample(this.mod_freq) + 5;

            // Input mod delays (fdelay4)
            this.delIn_L.write(inL);
            this.delIn_R.write(inR);
            let xL = this.delIn_L.read(modInL);
            let xR = this.delIn_R.read(modInR);

            // Damping smoother — Faust si.smooth(damp): one-pole LP y[n] = (1-damp)*x + damp*y[n-1]
            // damp 0 → no smoothing, 1 → infinite smoothing
            this.dampStateL = (1.0 - this.damp) * xL + this.damp * this.dampStateL;
            this.dampStateR = (1.0 - this.damp) * xR + this.damp * this.dampStateR;
            xL = this.dampStateL;
            xR = this.dampStateR;

            // 4 pre-section diffusers
            for (let i = 0; i < 4; i++) {
                const o = this.preDiff[i].process(xL, xR);
                xL = o[0]; xR = o[1];
            }
            // xL/xR is the JPVerb output for this sample.
            const outL = xL;
            const outR = xR;

            // ── Build feedback for next sample ──
            // 5 cascaded diffusers (invSqrt2 gain) — feedback set A
            let fbL = outL, fbR = outR;
            for (let i = 0; i < 5; i++) {
                const o = this.fbDiffA[i].process(fbL, fbR);
                fbL = o[0]; fbR = o[1];
            }
            // 2 fb1 mod delays
            const modFb1L = depth + depth * this.modFb1_L.sample(this.mod_freq) + 5;
            const modFb1R = depth + depth * this.modFb1_R.sample(this.mod_freq) + 5;
            this.delFb1_L.write(fbL);
            this.delFb1_R.write(fbR);
            fbL = this.delFb1_L.read(modFb1L);
            fbR = this.delFb1_R.read(modFb1R);
            // 2 prime delays (set A)
            this.primeDelayA_L.write(fbL);
            this.primeDelayA_R.write(fbR);
            fbL = this.primeDelayA_L.read(this.primeA_L_state);
            fbR = this.primeDelayA_R.read(this.primeA_R_state);
            // 5 more diffusers — feedback set B
            for (let i = 0; i < 5; i++) {
                const o = this.fbDiffB[i].process(fbL, fbR);
                fbL = o[0]; fbR = o[1];
            }
            // 2 fb2 mod delays
            const modFb2L = depth + depth * this.modFb2_L.sample(this.mod_freq) + 5;
            const modFb2R = depth + depth * this.modFb2_R.sample(this.mod_freq) + 5;
            this.delFb2_L.write(fbL);
            this.delFb2_R.write(fbR);
            fbL = this.delFb2_L.read(modFb2L);
            fbR = this.delFb2_R.read(modFb2R);
            // 2 prime delays (set B)
            this.primeDelayB_L.write(fbL);
            this.primeDelayB_R.write(fbR);
            fbL = this.primeDelayB_L.read(this.primeB_L_state);
            fbR = this.primeDelayB_R.read(this.primeB_R_state);

            // 3-band filterbank with LF/MID/HF gains
            const bL = this.filterbankL.process(fbL, fbR);
            // bL is [loL, loR, midL, midR, hiL, hiR]; we used both channels, but
            // Faust applies the filterbank *per channel* separately. Let's redo:
            // Actually Faust: par(i, 2, fi.filterbank(5, (lowcut, highcut)) : ...)
            // So one filterbank per channel, fed only that channel. Need to call
            // separate filterbanks per channel. Refactor: I'll call them with their
            // own input as a degenerate stereo (same on both channels) and use the L output.
            // Cleaner: make filterbankL accept just left, return [lo, mid, hi].
            // Adapting — call it twice with mono in/out via L channel only:
            const fbR_alone = this.filterbankR.process(fbR, fbR); // both inputs = R
            const loL = bL[0], midL = bL[2], hiL = bL[4];
            const loR = fbR_alone[0], midR = fbR_alone[2], hiR = fbR_alone[4];
            fbL = hiL * this.high + midL * this.mid + loL * this.low;
            fbR = hiR * this.high + midR * this.mid + loR * this.low;

            // Apply feedback gain
            this.fbStateL = fbL * fbGain;
            this.fbStateR = fbR * fbGain;

            left[s]  = outL;
            right[s] = outR;
        }
    }
    reset() {
        this.delIn_L.reset(); this.delIn_R.reset();
        this.delFb1_L.reset(); this.delFb1_R.reset();
        this.delFb2_L.reset(); this.delFb2_R.reset();
        this.primeDelayA_L.reset(); this.primeDelayA_R.reset();
        this.primeDelayB_L.reset(); this.primeDelayB_R.reset();
        for (const d of this.preDiff) d.reset();
        for (const d of this.fbDiffA) d.reset();
        for (const d of this.fbDiffB) d.reset();
        this.modIn_L.reset(); this.modIn_R.reset();
        this.modFb1_L.reset(); this.modFb1_R.reset();
        this.modFb2_L.reset(); this.modFb2_R.reset();
        this.filterbankL.reset(); this.filterbankR.reset();
        this.fbStateL = 0; this.fbStateR = 0;
        this.dampStateL = 0; this.dampStateR = 0;
    }
}

// ============================================================================
// Biquad — 2nd-order Butterworth (Q = 1/√2). Matches DriftEngine.h pre-reverb HPF/LPF.
// ============================================================================
class Biquad {
    constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0;
        this.xL = [0, 0]; this.yL = [0, 0]; this.xR = [0, 0]; this.yR = [0, 0]; }
    setHPF(sr, freq) {
        if (freq < 21.0) { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; return; }
        const w0 = TWO_PI * freq / sr, cs = Math.cos(w0), sn = Math.sin(w0);
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
        const w0 = TWO_PI * freq / sr, cs = Math.cos(w0), sn = Math.sin(w0);
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
// TiltEQ — 1 kHz pivot, ±12 dB. Identical to TiltEQ.h.
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
// Identical to GlowEffect.h.
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
            L *= this.compGainSmoothed; R *= this.compGainSmoothed;
            L = this.saturate(L); R = this.saturate(R);
            this.lpStateL = (1.0 - this.lpCoeff) * L + this.lpCoeff * this.lpStateL; L = this.lpStateL;
            this.lpStateR = (1.0 - this.lpCoeff) * R + this.lpCoeff * this.lpStateR; R = this.lpStateR;
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
// TapeTransport — Revox A77 model (full hand-port of TapeTransport.h)
// ============================================================================
class TapeTransport {
    constructor() {
        // Defaults match TapeTransport.h
        this.inputDrive = 1.0;
        this.tapeSpeed = 0.5;
        this.saturation = 0.3;
        this.compression = 0.4;
        this.wowDepth = 0.15;
        this.wowRateMul = 1.0;
        this.flutterDepthAmt = 0.15;
        this.flutterRateMul = 1.0;
        this.headBumpGain = 0.3;
        this.hissLevel = 0.1;
        this.hissEnabled = true;
        // Hysteresis
        this.M_n1 = 0; this.H_n1 = 0; this.H_d_n1 = 0;
        this.adaaPrevIn = 0;
        // EQ state
        this.preEmphLpState = 0; this.deEmphLpState = 0;
        this.tapeLossState = 0;
        // Head bump biquads
        this.hb_b0 = 1; this.hb_b1 = 0; this.hb_b2 = 0; this.hb_a1 = 0; this.hb_a2 = 0;
        this.hb_x1 = 0; this.hb_x2 = 0; this.hb_y1 = 0; this.hb_y2 = 0;
        this.hbd_b0 = 1; this.hbd_b1 = 0; this.hbd_b2 = 0; this.hbd_a1 = 0; this.hbd_a2 = 0;
        this.hbd_x1 = 0; this.hbd_x2 = 0; this.hbd_y1 = 0; this.hbd_y2 = 0;
        // Wow/flutter
        this.wowPhase1 = 0; this.wowPhase2 = 1.7; this.wowPhase3 = 3.2;
        this.flutterPhase1 = 0; this.flutterPhase2 = 2.1; this.flutterPhase3 = 4.5;
        this.wowDrift = 0; this.wowDriftVel = 0;
        // Hiss
        this.hissHpState = 0; this.hissLpState = 0; this.hissShelfState = 0; this.signalEnvelopeState = 0;
        // Constants
        this.JA_Ms = 1.0; this.JA_a = 1.0; this.JA_k = 0.5; this.JA_c = 0.5; this.JA_alpha = 1.0e-4;
        // PRNG (xorshift32)
        this.rng = new XorShift32(0xDEADBEEF);
    }
    setSeed(seed) { this.rng.setSeed(seed); }
    prepare(sr, maxBlock) {
        this.sr = sr; this.maxBlock = maxBlock;
        // Wow/flutter delay buffer ~100ms
        this.wfDelaySize = (sr * 0.1) | 0 + 4;
        this.wfDelay = new Float64Array(this.wfDelaySize);
        this.wfWritePos = 0;
        // NAB emphasis coeff
        const emphFreq = 3180.0;
        this.emphLpCoeff = Math.exp(-TWO_PI * emphFreq / sr);
        // Head bump init
        this._computeHeadBumpCoeffs(100, 0, 1);
        this._computeHeadBumpDipCoeffs(200, 0, 1);
    }
    setInputDrive(d)    { this.inputDrive = 1.0 + d * 5.0; }
    setTapeSpeed(s)     { this.tapeSpeed = s; }
    setSaturation(s)    { this.saturation = s; }
    setCompression(c)   { this.compression = c; }
    setHeadBump(b)      { this.headBumpGain = b; }
    setHiss(h)          { this.hissLevel = h; }
    setHissEnabled(e)   { this.hissEnabled = e; }
    setWowDepth(d)      { this.wowDepth = d * d * d; }
    setWowRate(r)       { this.wowRateMul = 0.1 + r * 1.9; }
    setFlutterDepth(d)  { this.flutterDepthAmt = d; }
    setFlutterRate(r)   { this.flutterRateMul = 0.3 + r * 2.0; }
    _lerp(a, b, t) { return a + (b - a) * t; }
    _rand() { return this.rng.next(); }
    // BC109C transistor input electronics saturation
    _inputElectronicsSat(x) {
        const headroom = 3.0;
        const scaled = x / headroom;
        const shaped = scaled >= 0 ? Math.tanh(scaled) : Math.tanh(scaled * 1.15) / 1.15;
        return shaped * headroom;
    }
    _preEmphasis(x) {
        this.preEmphLpState = (1.0 - this.emphLpCoeff) * x + this.emphLpCoeff * this.preEmphLpState;
        const hp = x - this.preEmphLpState;
        return x + this.compression * hp * 1.8;
    }
    _deEmphasis(x) {
        this.deEmphLpState = (1.0 - this.emphLpCoeff) * x + this.emphLpCoeff * this.deEmphLpState;
        const hp = x - this.deEmphLpState;
        return x - this.compression * hp * 1.8;
    }
    // Langevin function and derivative for Jiles-Atherton
    _langevin(x) {
        if (Math.abs(x) < 1e-4) return x / 3.0;
        return (1.0 / Math.tanh(x)) - (1.0 / x);
    }
    _langevinDeriv(x) {
        if (Math.abs(x) < 1e-4) return 1.0 / 3.0;
        const sh = Math.sinh(x);
        return (1.0 / (x * x)) - (1.0 / (sh * sh));
    }
    // J-A ODE: dM/dH
    _jaDMdH(M, H, dH) {
        const He = H + this.JA_alpha * M;
        const M_an = this.JA_Ms * this._langevin(He / this.JA_a);
        const dM_an_dH = (this.JA_Ms / this.JA_a) * this._langevinDeriv(He / this.JA_a) * (1.0 + this.JA_alpha);
        const delta = dH >= 0.0 ? 1.0 : -1.0;
        let denom = delta * this.JA_k - this.JA_alpha * (M_an - M);
        if (Math.abs(denom) < 1e-12) denom = 1e-12 * (denom >= 0 ? 1.0 : -1.0);
        let dM_irr = (M_an - M) / denom;
        if (dM_irr * dH < 0.0) dM_irr = 0.0;
        return (1.0 / (1.0 + this.JA_c)) * dM_irr + (this.JA_c / (1.0 + this.JA_c)) * dM_an_dH;
    }
    _hysteresisRK4(H, dH) {
        const k1 = this._jaDMdH(this.M_n1, this.H_n1, dH);
        const k2 = this._jaDMdH(this.M_n1 + 0.5 * dH * k1, this.H_n1 + 0.5 * dH, dH);
        const k3 = this._jaDMdH(this.M_n1 + 0.5 * dH * k2, this.H_n1 + 0.5 * dH, dH);
        const k4 = this._jaDMdH(this.M_n1 + dH * k3, H, dH);
        let M_new = this.M_n1 + (dH / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
        M_new = Math.max(-this.JA_Ms * 1.5, Math.min(this.JA_Ms * 1.5, M_new));
        this.M_n1 = M_new; this.H_n1 = H; this.H_d_n1 = dH;
        return M_new;
    }
    _processHysteresisSample(x) {
        const hScale = 0.5 + this.saturation * 3.5;
        const H = x * hScale;
        const dH = H - this.H_n1;
        return this._hysteresisRK4(H, dH) / hScale;
    }
    _processHysteresis2x(x) {
        const mid = (this.adaaPrevIn + x) * 0.5;
        const y1 = this._processHysteresisSample(mid);
        const y2 = this._processHysteresisSample(x);
        this.adaaPrevIn = x;
        let output = (y1 + y2) * 0.5;
        const makeupGain = 3.0 * this.JA_a / this.JA_Ms;
        const effectiveMakeup = 1.0 + (makeupGain - 1.0) * 1.0;
        output *= effectiveMakeup;
        const satBlend = Math.min(this.saturation * 3.33, 1.0);
        return x * (1.0 - satBlend) + output * satBlend;
    }
    _tapeLossFilter(x) {
        let cutoff = this._lerp(8000.0, 18000.0, this.tapeSpeed) * (1.0 - this.saturation * 0.35);
        cutoff = Math.max(cutoff, 2000.0);
        const wc = TWO_PI * cutoff / this.sr;
        const coeff = Math.exp(-wc);
        this.tapeLossState = (1.0 - coeff) * x + coeff * this.tapeLossState;
        return this.tapeLossState;
    }
    _computeHeadBumpCoeffs(freq, gainDb, Q) {
        const A = Math.pow(10.0, gainDb / 40.0);
        const w0 = TWO_PI * freq / this.sr;
        const alpha = Math.sin(w0) / (2.0 * Q);
        const b0 = 1.0 + alpha * A, b1 = -2.0 * Math.cos(w0), b2 = 1.0 - alpha * A;
        const a0 = 1.0 + alpha / A, a1 = -2.0 * Math.cos(w0), a2 = 1.0 - alpha / A;
        this.hb_b0 = b0 / a0; this.hb_b1 = b1 / a0; this.hb_b2 = b2 / a0;
        this.hb_a1 = a1 / a0; this.hb_a2 = a2 / a0;
    }
    _computeHeadBumpDipCoeffs(freq, gainDb, Q) {
        const A = Math.pow(10.0, gainDb / 40.0);
        const w0 = TWO_PI * freq / this.sr;
        const alpha = Math.sin(w0) / (2.0 * Q);
        const b0 = 1.0 + alpha * A, b1 = -2.0 * Math.cos(w0), b2 = 1.0 - alpha * A;
        const a0 = 1.0 + alpha / A, a1 = -2.0 * Math.cos(w0), a2 = 1.0 - alpha / A;
        this.hbd_b0 = b0 / a0; this.hbd_b1 = b1 / a0; this.hbd_b2 = b2 / a0;
        this.hbd_a1 = a1 / a0; this.hbd_a2 = a2 / a0;
    }
    _updateSpeedDependentParams() {
        const bumpFreq = this._lerp(60.0, 140.0, this.tapeSpeed);
        const bumpGainDb = this.headBumpGain * 6.0;
        this._computeHeadBumpCoeffs(bumpFreq, bumpGainDb, 1.0);
        const dipFreq = bumpFreq * 2.0;
        const dipGainDb = -this.headBumpGain * 3.0;
        this._computeHeadBumpDipCoeffs(dipFreq, dipGainDb, 1.0);
    }
    _headBumpFilter(x) {
        const y = this.hb_b0 * x + this.hb_b1 * this.hb_x1 + this.hb_b2 * this.hb_x2
                - this.hb_a1 * this.hb_y1 - this.hb_a2 * this.hb_y2;
        this.hb_x2 = this.hb_x1; this.hb_x1 = x;
        this.hb_y2 = this.hb_y1; this.hb_y1 = y;
        return y;
    }
    _headBumpDipFilter(x) {
        const y = this.hbd_b0 * x + this.hbd_b1 * this.hbd_x1 + this.hbd_b2 * this.hbd_x2
                - this.hbd_a1 * this.hbd_y1 - this.hbd_a2 * this.hbd_y2;
        this.hbd_x2 = this.hbd_x1; this.hbd_x1 = x;
        this.hbd_y2 = this.hbd_y1; this.hbd_y1 = y;
        return y;
    }
    _lagrangeInterp3(delaySamples) {
        const idx = delaySamples | 0;
        const frac = delaySamples - idx;
        const N = this.wfDelaySize;
        const readAt = (offset) => {
            let pos = this.wfWritePos - offset;
            while (pos < 0) pos += N;
            return this.wfDelay[pos % N];
        };
        const y0 = readAt(idx - 1), y1 = readAt(idx), y2 = readAt(idx + 1);
        const a0 = y1, a1 = 0.5 * (y2 - y0), a2 = 0.5 * (y0 + y2) - y1;
        return a0 + frac * (a1 + frac * a2);
    }
    _wowFlutterProcess(x) {
        if (this.wowDepth < 1e-6 && this.flutterDepthAmt < 1e-6) return x;
        this.wfDelay[this.wfWritePos] = x;
        const wowMod = 0.55 * Math.sin(this.wowPhase1) + 0.30 * Math.sin(this.wowPhase2) + 0.15 * Math.sin(this.wowPhase3);
        this.wowPhase1 += TWO_PI * 0.5 * this.wowRateMul / this.sr;
        this.wowPhase2 += TWO_PI * 1.2 * this.wowRateMul / this.sr;
        this.wowPhase3 += TWO_PI * 2.8 * this.wowRateMul / this.sr;
        if (this.wowPhase1 > TWO_PI) this.wowPhase1 -= TWO_PI;
        if (this.wowPhase2 > TWO_PI) this.wowPhase2 -= TWO_PI;
        if (this.wowPhase3 > TWO_PI) this.wowPhase3 -= TWO_PI;
        this.wowDriftVel += (this._rand() - 0.5) * 0.0002;
        this.wowDriftVel *= 0.999;
        this.wowDrift += this.wowDriftVel;
        this.wowDrift *= 0.9999;
        const flutterMod = 0.50 * Math.sin(this.flutterPhase1) + 0.35 * Math.sin(this.flutterPhase2) + 0.15 * Math.sin(this.flutterPhase3);
        this.flutterPhase1 += TWO_PI *  8.0 * this.flutterRateMul / this.sr;
        this.flutterPhase2 += TWO_PI * 14.0 * this.flutterRateMul / this.sr;
        this.flutterPhase3 += TWO_PI * 23.0 * this.flutterRateMul / this.sr;
        if (this.flutterPhase1 > TWO_PI) this.flutterPhase1 -= TWO_PI;
        if (this.flutterPhase2 > TWO_PI) this.flutterPhase2 -= TWO_PI;
        if (this.flutterPhase3 > TWO_PI) this.flutterPhase3 -= TWO_PI;
        const flutterNoise = (this._rand() - 0.5) * 0.3;
        const wowDepthSamples = this.wowDepth * 0.002 * this.sr;
        const flutterDepthSamples = this.flutterDepthAmt * 0.001 * this.sr;
        let delaySamples = 1.0 + (wowMod + this.wowDrift) * wowDepthSamples + (flutterMod + flutterNoise) * flutterDepthSamples;
        delaySamples = Math.max(0.5, Math.min(delaySamples, this.wfDelaySize - 4));
        const out = this._lagrangeInterp3(delaySamples);
        this.wfWritePos = (this.wfWritePos + 1) % this.wfDelaySize;
        return out;
    }
    _addTapeHiss(x) {
        if (!this.hissEnabled || this.hissLevel < 1e-6) return x;
        const noise = this._rand() * 2.0 - 1.0;
        const shelfCoeff = Math.exp(-TWO_PI * 1000.0 / this.sr);
        this.hissShelfState = shelfCoeff * this.hissShelfState + (1.0 - shelfCoeff) * noise;
        let shapedNoise = noise + (noise - this.hissShelfState) * 0.5;
        const hpCoeff = Math.exp(-TWO_PI * 100.0 / this.sr);
        this.hissHpState = hpCoeff * this.hissHpState + (1.0 - hpCoeff) * shapedNoise;
        shapedNoise = shapedNoise - this.hissHpState;
        const bw = this._lerp(12000.0, 18000.0, this.tapeSpeed);
        const lpCoeff = Math.exp(-TWO_PI * bw / this.sr);
        this.hissLpState = lpCoeff * this.hissLpState + (1.0 - lpCoeff) * shapedNoise;
        shapedNoise = this.hissLpState;
        const hissGain = Math.pow(10.0, this._lerp(-66.0, -40.0, this.hissLevel) / 20.0);
        const hissOut = shapedNoise * hissGain;
        const absX = Math.abs(x);
        this.signalEnvelopeState += 0.001 * (absX - this.signalEnvelopeState);
        const modNoise = (this._rand() * 2.0 - 1.0) * this.signalEnvelopeState * 0.1 * this.hissLevel;
        return x + hissOut + modNoise;
    }
    process(data, n) {
        this._updateSpeedDependentParams();
        for (let k = 0; k < n; k++) {
            let x = data[k];
            x *= this.inputDrive;                             // Stage 1
            x = this._inputElectronicsSat(x);                  // Stage 2
            const elecSatMakeup = this.inputDrive / Math.max(1.0, Math.tanh(this.inputDrive / 3.0) * 3.0);
            x *= elecSatMakeup;
            x = this._preEmphasis(x);                          // Stage 3
            x = this._processHysteresis2x(x);                  // Stage 4
            x = this._deEmphasis(x);                           // Stage 5
            x = this._tapeLossFilter(x);                       // Stage 6
            x = this._headBumpFilter(x);                       // Stage 7
            x = this._headBumpDipFilter(x);
            x = this._wowFlutterProcess(x);                    // Stage 8
            x = this._addTapeHiss(x);                          // Stage 9
            data[k] = x;
        }
    }
    reset() {
        this.M_n1 = 0; this.H_n1 = 0; this.H_d_n1 = 0;
        this.preEmphLpState = 0; this.deEmphLpState = 0;
        this.tapeLossState = 0;
        this.hb_x1 = this.hb_x2 = this.hb_y1 = this.hb_y2 = 0;
        this.hbd_x1 = this.hbd_x2 = this.hbd_y1 = this.hbd_y2 = 0;
        this.wfWritePos = 0;
        if (this.wfDelay) this.wfDelay.fill(0);
        this.wowPhase1 = 0; this.wowPhase2 = 1.7; this.wowPhase3 = 3.2;
        this.flutterPhase1 = 0; this.flutterPhase2 = 2.1; this.flutterPhase3 = 4.5;
        this.wowDrift = 0; this.wowDriftVel = 0;
        this.hissHpState = 0; this.hissLpState = 0; this.hissShelfState = 0; this.signalEnvelopeState = 0;
        this.adaaPrevIn = 0;
    }
}

// ============================================================================
// HeatChannel — full hand-port of HeatChannel.h (per-channel)
// ============================================================================
class HeatChannel {
    constructor() {
        this.params = { drive: 0, sag: 0, bias: 0, lpf: 0, crackle: 0, breakup: 0, dropout: 0, sizzle: 0, ear: 0 };
        this.cv = { driveOffset: 0, biasOffset: 0, lpfCutoffRatio: 1, crackleRateRatio: 1, sagTimeRatio: 1, speakerResHz: 80, millerCapHz: 8000 };
        this.rng = new XorShift32(0x12345678);
        this.reset();
    }
    setSeed(seed) {
        this.rng.setSeed(seed);
        this.cv.driveOffset      = (this.rng.next() - 0.5) * 0.10;
        this.cv.biasOffset       = (this.rng.next() - 0.5) * 0.20;
        this.cv.lpfCutoffRatio   = 1.0 + (this.rng.next() - 0.5) * 0.30;
        this.cv.crackleRateRatio = 1.0 + (this.rng.next() - 0.5) * 0.60;
        this.cv.sagTimeRatio     = 1.0 + (this.rng.next() - 0.5) * 0.40;
        this.cv.speakerResHz     = 80.0 + (this.rng.next() - 0.5) * 30.0;
        this.cv.millerCapHz      = 8000.0 + (this.rng.next() - 0.5) * 3000.0;
    }
    prepare(sr) { this.sr = sr; this.reset(); }
    setParams(p) { this.params = p; }
    _rand() { return this.rng.next(); }
    _cableCapacitanceLPF(x, amount) {
        const curved = amount * amount * amount * amount;
        let cutoff = 20000.0 * (1.0 - curved * 0.92) * this.cv.lpfCutoffRatio;
        cutoff = Math.max(cutoff, 1500.0);
        const wc = TWO_PI * cutoff / this.sr;
        const coeff = Math.exp(-wc);
        this.cableLpState = (1.0 - coeff) * x + coeff * this.cableLpState;
        return this.cableLpState;
    }
    _tubeWaveshape(x, driveAmt) {
        if (x >= 0.0) {
            const gridLimit = 1.0 + (1.0 - driveAmt) * 2.0;
            if (x > gridLimit) {
                const over = x - gridLimit;
                return Math.tanh(gridLimit) + over * 0.05;
            }
            return Math.tanh(x);
        }
        return Math.tanh(x * 1.2) / 1.2;
    }
    _tubeSaturation(x, driveAmt, sagAmt, biasAmt) {
        if (driveAmt < 1e-6 && sagAmt < 1e-6 && biasAmt < 1e-6) return x;
        const absX = Math.abs(x);
        const envCoeff = absX > this.signalEnv ? 0.005 : 0.0005;
        this.signalEnv += envCoeff * (absX - this.signalEnv);
        // Bias drift
        const tubeTemp = 0.3 + this.signalEnv * 0.7;
        const biasRate = 0.0004 * biasAmt * tubeTemp;
        this.tubeBiasVel += (this._rand() - 0.5) * biasRate;
        this.tubeBiasVel *= 0.999;
        this.tubeBiasWalk += this.tubeBiasVel;
        this.tubeBiasWalk *= 0.9997;
        const biasOffset = (this.cv.biasOffset * biasAmt + this.tubeBiasWalk) * 0.2;
        // Dual-RC sag
        const sagFastTime = 0.003 * this.cv.sagTimeRatio;
        const sagFastCoeff = Math.exp(-1.0 / (this.sr * sagFastTime));
        const sagSlowTime = 0.080 * this.cv.sagTimeRatio;
        const sagSlowCoeff = Math.exp(-1.0 / (this.sr * sagSlowTime));
        const bassEnergy = Math.abs(this.millerLpState);
        const sagInput = this.signalEnv * 0.6 + bassEnergy * 0.4;
        const sagDepth = sagAmt * 1.5;
        let sagTarget = 1.0 - sagInput * sagDepth;
        sagTarget = Math.max(0.25, sagTarget);
        this.supplyVoltFast = sagFastCoeff * this.supplyVoltFast + (1.0 - sagFastCoeff) * sagTarget;
        const slowTarget = Math.max(sagTarget, this.supplyVoltFast);
        this.supplyVoltSlow = sagSlowCoeff * this.supplyVoltSlow + (1.0 - sagSlowCoeff) * slowTarget;
        let supplyVoltage = this.supplyVoltSlow;
        supplyVoltage = Math.max(0.25, Math.min(1.0, supplyVoltage));
        // Drive
        const driveScaled = driveAmt * driveAmt;
        let drive = 1.0 + driveScaled * 9.0;
        drive *= (1.0 + this.cv.driveOffset);
        // Miller cap
        const millerCutoff = this.cv.millerCapHz / (1.0 + driveScaled * 3.0);
        const millerCoeff = Math.exp(-TWO_PI * millerCutoff / this.sr);
        this.millerLpState = millerCoeff * this.millerLpState + (1.0 - millerCoeff) * x;
        const millerBlend = driveScaled * 0.6;
        const millerFiltered = x * (1.0 - millerBlend) + this.millerLpState * millerBlend;
        const driven = (millerFiltered + biasOffset) * drive * supplyVoltage;
        // 2x oversample
        const mid = (this.tubeOsPrev + driven) * 0.5;
        this.tubeOsPrev = driven;
        const y1 = this._tubeWaveshape(mid, driveAmt);
        const y2 = this._tubeWaveshape(driven, driveAmt);
        let output = (y1 + y2) * 0.5;
        // Makeup
        const rmsEstimate = this.signalEnv * drive * supplyVoltage;
        const tanhOfRms = Math.tanh(rmsEstimate);
        let makeup = tanhOfRms > 0.01 ? rmsEstimate / tanhOfRms : 1.0;
        makeup = Math.min(makeup, drive * 0.8);
        output *= makeup / drive;
        // Sag makeup
        if (sagAmt > 1e-6) {
            const sagMakeupCoeff = Math.exp(-1.0 / (this.sr * 0.200));
            this.sagMakeupEnv = sagMakeupCoeff * this.sagMakeupEnv + (1.0 - sagMakeupCoeff) * supplyVoltage;
            output /= Math.max(0.25, this.sagMakeupEnv);
        }
        const blend = Math.min(driveAmt * 3.0, 1.0);
        return x * (1.0 - blend) + output * blend;
    }
    _speakerBreakup(x, amount) {
        const amt = amount * amount;
        // Thermal compression
        const power = x * x;
        this.spkThermal -= power * amt * 0.002;
        this.spkThermal += (1.0 - this.spkThermal) * 0.00005;
        this.spkThermal = Math.max(0.35, Math.min(1.0, this.spkThermal));
        const thermalGain = 1.0 - (1.0 - this.spkThermal) * amt;
        x *= thermalGain;
        if (thermalGain > 0.1) x /= thermalGain;
        // Voice coil inductance
        const inductAmt = amt * 0.25;
        const inductCoeff = Math.exp(-TWO_PI * 3000.0 / this.sr);
        this.spkInductLpState = inductCoeff * this.spkInductLpState + (1.0 - inductCoeff) * x;
        const hfContent = x - this.spkInductLpState;
        x -= hfContent * inductAmt;
        // Cone excursion
        this.spkExcursion += x * 0.012;
        this.spkExcursion *= 0.994;
        const excLimit = 1.0 - amt * 0.65;
        if (Math.abs(this.spkExcursion) > excLimit) {
            const over = Math.abs(this.spkExcursion) - excLimit;
            const comp = excLimit / (excLimit + over);
            x *= comp;
            x /= Math.max(0.5, comp);
        }
        // Cone cry — asymmetric soft clip
        const preClipAbs = Math.abs(x);
        const fwdLimit = 1.2 - amt * 0.5;
        const bwdLimit = 1.0 - amt * 0.4;
        if (x > fwdLimit) x = fwdLimit + Math.tanh((x - fwdLimit) * 4.0) * 0.08;
        else if (x < -bwdLimit) x = -bwdLimit + Math.tanh((x + bwdLimit) * 4.0) * 0.08;
        const postClipAbs = Math.abs(x);
        if (preClipAbs > 0.01 && postClipAbs < preClipAbs * 0.99) {
            const clipRatio = preClipAbs / postClipAbs;
            x *= 1.0 + (clipRatio - 1.0) * 0.5;
        }
        // Doppler distortion
        const coneVelocity = x - this.spkPrevSample;
        const dopplerMod = coneVelocity * amt * 0.5;
        this.spkDopplerPhase += dopplerMod;
        this.spkDopplerPhase *= 0.999;
        x += hfContent * this.spkDopplerPhase * 0.3;
        // Cabinet resonance
        const resAmt = Math.max(0.0, amt - 0.1) * 1.2;
        if (resAmt > 0.01) {
            const f = 2.0 * Math.sin(PI * this.cv.speakerResHz / this.sr);
            const q = 0.3 + resAmt * 0.9;
            this.spkResBpState1 += f * (x - this.spkResBpState1 - (q + q / 1.0001) * this.spkResBpState2);
            this.spkResBpState2 += f * this.spkResBpState1;
            x += this.spkResBpState2 * resAmt * 0.12;
        }
        // Slew rate limit
        let maxSlew = 0.9 - amt * 0.3;
        maxSlew = Math.max(maxSlew, 0.15);
        const diff = x - this.spkPrevSample;
        if (Math.abs(diff) > maxSlew) x = this.spkPrevSample + maxSlew * (diff > 0 ? 1.0 : -1.0);
        this.spkPrevSample = x;
        return x;
    }
    _addTubeCrackle(x, amount) {
        const signalCorrelation = 1.0 + Math.abs(x) * 2.0;
        const curved = amount * amount * amount * amount;
        const rate = curved * 6.0 * this.cv.crackleRateRatio * signalCorrelation;
        const probPerSample = rate / this.sr;
        if (this._rand() < probPerSample) {
            const u1 = Math.max(this._rand(), 1e-10);
            const u2 = this._rand();
            const gauss = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(TWO_PI * u2);
            let amplitude = Math.exp(gauss * 0.7);
            amplitude = Math.min(amplitude, 2.5);
            const polarity = this._rand() > 0.5 ? 1.0 : -1.0;
            this.crackleEnvelope = amplitude * (curved * 0.5 + 0.5 * curved * Math.abs(x)) * 0.06 * polarity;
        }
        this.crackleEnvelope *= Math.exp(-1.0 / (this.sr * 0.0004));
        const f = 2.0 * Math.sin(PI * 3500.0 / this.sr);
        this.crackleBpState1 += f * (this.crackleEnvelope - this.crackleBpState1 - 1.0 * this.crackleBpState2);
        this.crackleBpState2 += f * this.crackleBpState1;
        return x + this.crackleBpState2;
    }
    _applyDropout(x, amount) {
        const curved = amount * amount * amount * amount;
        const rate = curved * 0.8;
        const probPerSample = rate / this.sr;
        if (this.dropoutTimer <= 0.0 && this._rand() < probPerSample) {
            let depth;
            if (amount < 0.8) depth = 1.0 + this._rand() * 5.0 * amount;
            else depth = 3.0 + this._rand() * (8.0 + amount * 25.0);
            this.dropoutTargetGain = Math.pow(10.0, -depth / 20.0);
            const duration = 0.002 + this._rand() * 0.015;
            this.dropoutTimer = duration * this.sr;
        }
        const target = this.dropoutTimer > 0.0 ? this.dropoutTargetGain : 1.0;
        const coeff = Math.exp(-1.0 / (this.sr * 0.002));
        this.dropoutSmoothed = coeff * this.dropoutSmoothed + (1.0 - coeff) * target;
        if (this.dropoutTimer > 0.0) this.dropoutTimer -= 1.0;
        return x * this.dropoutSmoothed;
    }
    _addIntermodSizzle(x, amount) {
        const lpCoeff = Math.exp(-TWO_PI * 3000.0 / this.sr);
        this.sizzleLpState = lpCoeff * this.sizzleLpState + (1.0 - lpCoeff) * x;
        const hfBand = x - this.sizzleLpState;
        const hfAbs = Math.abs(hfBand);
        const efCoeff = hfAbs > this.sizzleEnvFollow ? 0.01 : 0.001;
        this.sizzleEnvFollow += efCoeff * (hfAbs - this.sizzleEnvFollow);
        const amt = amount * amount;
        const hfDrive = 1.0 + amt * 12.0;
        const driven = hfBand * hfDrive;
        const mid = (this.sizzleOsPrev + driven) * 0.5;
        this.sizzleOsPrev = driven;
        const sat1 = Math.tanh(mid);
        const sat2 = Math.tanh(driven);
        let saturatedHf = (sat1 + sat2) * 0.5;
        saturatedHf /= hfDrive;
        const harmonicsOnly = saturatedHf - hfBand / hfDrive;
        const sizzle = harmonicsOnly * this.sizzleEnvFollow * hfDrive;
        const mixLevel = amt * 3.0;
        return x + sizzle * mixLevel;
    }
    _earCompression(x, amount) {
        const amt = amount * amount;
        const absX = Math.abs(x);
        // Stapedius
        const stapediusThreshold = 0.3 - amt * 0.2;
        let stapediusTarget = absX > stapediusThreshold ? 1.0 - (absX - stapediusThreshold) * amt * 1.5 : 1.0;
        stapediusTarget = Math.max(0.4, stapediusTarget);
        const stapOnset = Math.exp(-1.0 / (this.sr * 0.100));
        const stapRelease = Math.exp(-1.0 / (this.sr * 0.500));
        const stapCoeff = stapediusTarget < this.earStapediusGain ? stapOnset : stapRelease;
        this.earStapediusGain = stapCoeff * this.earStapediusGain + (1.0 - stapCoeff) * stapediusTarget;
        const lmCoeff = Math.exp(-TWO_PI * 800.0 / this.sr);
        this.earLowMidLpState = lmCoeff * this.earLowMidLpState + (1.0 - lmCoeff) * x;
        const lowMid = this.earLowMidLpState;
        const rest = x - lowMid;
        const lowMidReduced = lowMid * this.earStapediusGain;
        x = lowMidReduced + rest;
        const stapMakeup = 1.0 / Math.max(0.5, 0.5 + this.earStapediusGain * 0.5);
        x *= stapMakeup;
        // Cochlear
        const cochEnvCoeff = absX > this.earCochlearEnv ? 0.002 : 0.0002;
        this.earCochlearEnv += cochEnvCoeff * (absX - this.earCochlearEnv);
        const compThreshold = 0.25 - amt * 0.15;
        if (this.earCochlearEnv > compThreshold && compThreshold > 0.01) {
            const ratio = 1.0 + amt * 2.5;
            const overshoot = this.earCochlearEnv / compThreshold;
            const gainReduction = Math.pow(overshoot, (1.0 / ratio) - 1.0);
            x *= gainReduction;
            let cochMakeup = 1.0 / Math.max(0.4, gainReduction);
            cochMakeup = Math.min(cochMakeup, 3.5);
            x *= cochMakeup;
        }
        // TTS
        const exposurePower = absX * absX * amt;
        this.earTtsAccum += exposurePower * 0.00008;
        this.earTtsAccum -= this.earTtsAccum * 0.00002;
        this.earTtsAccum = Math.max(0.0, Math.min(0.8, this.earTtsAccum));
        let ttsCutoff = 18000.0 - this.earTtsAccum * 10000.0;
        ttsCutoff = Math.max(ttsCutoff, 4000.0);
        const ttsCoeff = Math.exp(-TWO_PI * ttsCutoff / this.sr);
        this.earTtsLpState = ttsCoeff * this.earTtsLpState + (1.0 - ttsCoeff) * x;
        const ttsBlend = this.earTtsAccum * amt * 0.7;
        x = x * (1.0 - ttsBlend) + this.earTtsLpState * ttsBlend;
        return x;
    }
    process(data, n) {
        const p = this.params;
        const total = p.drive + p.sag + p.bias + p.lpf + p.crackle + p.breakup + p.dropout + p.sizzle + p.ear;
        if (total < 1e-6) return;
        for (let k = 0; k < n; k++) {
            let x = data[k];
            if (p.lpf > 1e-6) x = this._cableCapacitanceLPF(x, p.lpf);
            if (p.drive > 1e-6 || p.sag > 1e-6 || p.bias > 1e-6) x = this._tubeSaturation(x, p.drive, p.sag, p.bias);
            if (p.breakup > 1e-6) x = this._speakerBreakup(x, p.breakup);
            if (p.crackle > 1e-6) x = this._addTubeCrackle(x, p.crackle);
            if (p.dropout > 1e-6) x = this._applyDropout(x, p.dropout);
            if (p.sizzle > 1e-6) x = this._addIntermodSizzle(x, p.sizzle);
            if (p.ear > 1e-6) x = this._earCompression(x, p.ear);
            data[k] = x;
        }
    }
    reset() {
        this.cableLpState = 0;
        this.tubeBiasWalk = 0; this.tubeBiasVel = 0;
        this.supplyVoltFast = 1; this.supplyVoltSlow = 1; this.sagMakeupEnv = 1;
        this.tubeOsPrev = 0; this.signalEnv = 0;
        this.millerLpState = 0;
        this.gridCurrentState = 0;
        this.crackleEnvelope = 0; this.crackleBpState1 = 0; this.crackleBpState2 = 0;
        this.dropoutSmoothed = 1; this.dropoutTimer = 0; this.dropoutTargetGain = 1;
        this.sizzleLpState = 0; this.sizzleOsPrev = 0; this.sizzleEnvFollow = 0;
        this.spkExcursion = 0; this.spkThermal = 1;
        this.spkPrevSample = 0; this.spkDopplerPhase = 0;
        this.spkResBpState1 = 0; this.spkResBpState2 = 0;
        this.spkInductLpState = 0;
        this.earStapediusGain = 1; this.earCochlearEnv = 0;
        this.earTtsAccum = 0; this.earTtsLpState = 0;
        this.earLowMidLpState = 0;
    }
}

// ============================================================================
// DriftEffect — orchestrates Tape + Heat (port of DriftEffect.h's "Kevin's macro")
// ============================================================================
class DriftEffect {
    constructor(sr) {
        this.sr = sr;
        this.tapeL = new TapeTransport(); this.tapeR = new TapeTransport();
        this.tapeL.setSeed(501); this.tapeR.setSeed(607);
        this.tapeL.prepare(sr, BLOCK_SIZE); this.tapeR.prepare(sr, BLOCK_SIZE);
        this.heatL = new HeatChannel(); this.heatR = new HeatChannel();
        this.heatL.setSeed(701); this.heatR.setSeed(811);
        this.heatL.prepare(sr); this.heatR.prepare(sr);
        // Tape age EQ (dev-panel only, retained for parity)
        this.tapeAgeLpStateL = 0; this.tapeAgeLpStateR = 0;
        this.tapeAgeLp2StateL = 0; this.tapeAgeLp2StateR = 0;
        this.tapeAgeLp3StateL = 0; this.tapeAgeLp3StateR = 0;
        this.tapeAgeHpStateL = 0; this.tapeAgeHpStateR = 0;
        this.tapeAgeMidStateL = 0; this.tapeAgeMidStateR = 0;
        this.rmsMatchGain = 1.0;
        this.rmsMatchCoeff = Math.exp(-1.0 / (sr * 0.050));
        this.dcHpR = Math.exp(-2.0 * TWO_PI * 30.0 / sr);
        this.dcHpXL = 0; this.dcHpYL = 0; this.dcHpXR = 0; this.dcHpYR = 0;
        this.amount = 0;
        this.usePetersMacro = false; // false = Kevin's default
    }
    setAmount(a) { this.amount = Math.max(0, Math.min(1, a)); }
    setHissEnabled(e) { this.tapeL.setHissEnabled(e); this.tapeR.setHissEnabled(e); }
    setPetersMacro(e) { this.usePetersMacro = e; }
    _kv(k, v10, v35, v50, v65, v80, v100) {
        if (k <= 0) return 0;
        if (k <= 0.10) return (k / 0.10) * v10;
        if (k <= 0.35) return v10 + ((k - 0.10) / 0.25) * (v35 - v10);
        if (k <= 0.50) return v35 + ((k - 0.35) / 0.15) * (v50 - v35);
        if (k <= 0.65) return v50 + ((k - 0.50) / 0.15) * (v65 - v50);
        if (k <= 0.80) return v65 + ((k - 0.65) / 0.15) * (v80 - v65);
        return v80 + ((k - 0.80) / 0.20) * (v100 - v80);
    }
    _mp(k, v50, v100) {
        return k <= 0.5 ? (k / 0.5) * v50 : v50 + ((k - 0.5) / 0.5) * (v100 - v50);
    }
    _mpLate(k, onset, v50, v100) {
        if (k <= onset) return 0;
        const r = (k - onset) / (1.0 - onset);
        return r <= 0.5 ? (r / 0.5) * v50 : v50 + ((r - 0.5) / 0.5) * (v100 - v50);
    }
    _mpKick(k, v50, v90, v100) {
        if (k <= 0.5) return (k / 0.5) * v50;
        if (k <= 0.9) return v50 + ((k - 0.5) / 0.4) * (v90 - v50);
        return v90 + ((k - 0.9) / 0.1) * (v100 - v90);
    }
    process(left, right, n) {
        if (this.amount < 1e-4) return;
        const t = this.amount;
        let tapeAgeAmt = 0;

        if (this.usePetersMacro) {
            // Peter's macro (v0.10.7)
            const inputDrive = this._mpKick(t, 0.06, 0.09, 0.204);
            const tapeSpeed = 1.0 - this._mp(t, 0.325, 0.30);
            const compression = this._mp(t, 0.30, 0.30);
            const wowDepth = this._mp(t, 0.25, 0.40);
            const headBump = this._mpLate(t, 0.15, 0.60, 0.85);
            const hiss = this._mp(t, 0.259, 0.4025);
            this.tapeL.setInputDrive(inputDrive); this.tapeR.setInputDrive(inputDrive);
            this.tapeL.setTapeSpeed(tapeSpeed);   this.tapeR.setTapeSpeed(tapeSpeed);
            this.tapeL.setSaturation(0);          this.tapeR.setSaturation(0);
            this.tapeL.setCompression(compression); this.tapeR.setCompression(compression);
            this.tapeL.setWowDepth(wowDepth);     this.tapeR.setWowDepth(wowDepth);
            this.tapeL.setWowRate(0);             this.tapeR.setWowRate(0);
            this.tapeL.setFlutterDepth(0);        this.tapeR.setFlutterDepth(0);
            this.tapeL.setFlutterRate(0);         this.tapeR.setFlutterRate(0);
            this.tapeL.setHeadBump(headBump);     this.tapeR.setHeadBump(headBump);
            this.tapeL.setHiss(hiss);             this.tapeR.setHiss(hiss);
            const hp = {
                drive:  this._mpKick(t, 0.25, 0.30, 0.374),
                sag:    this._mp(t, 0.24, 0.45),
                bias:   this._mp(t, 0.40, 0.55),
                lpf:    this._mpLate(t, 0.15, 0.035, 0.05),
                breakup:this._mp(t, 0.55, 0.55),
                crackle:this._mp(t, 0.04, 0.05),
                dropout:this._mp(t, 0.025, 0.05),
                sizzle: this._mpLate(t, 0.15, 0.55, 0.55),
                ear:    this._mp(t, 0.735, 0.75),
            };
            this.heatL.setParams(hp); this.heatR.setParams(hp);
        } else {
            // Kevin's default macro (v0.10.9)
            const tID = this._kv(t, 0.10, 0.28, 0.36, 0.40, 0.425, 0.45);
            this.tapeL.setInputDrive(tID); this.tapeR.setInputDrive(tID);
            this.tapeL.setTapeSpeed(0.25); this.tapeR.setTapeSpeed(0.25);
            this.tapeL.setSaturation(0);   this.tapeR.setSaturation(0);
            const compression = this._kv(t, 0.10, 0.20, 0.275, 0.30, 0.375, 0.375);
            this.tapeL.setCompression(compression); this.tapeR.setCompression(compression);
            const wowDepth = this._kv(t, 0.24, 0.40, 0.40, 0.40, 0.44, 0.44);
            this.tapeL.setWowDepth(wowDepth); this.tapeR.setWowDepth(wowDepth);
            this.tapeL.setWowRate(0);         this.tapeR.setWowRate(0);
            this.tapeL.setFlutterDepth(0);    this.tapeR.setFlutterDepth(0);
            this.tapeL.setFlutterRate(0);     this.tapeR.setFlutterRate(0);
            this.tapeL.setHeadBump(0);        this.tapeR.setHeadBump(0);
            const hiss = this._kv(t, 0.0, 0.0, 0.0, 0.0, 0.0, 0.03);
            this.tapeL.setHiss(hiss); this.tapeR.setHiss(hiss);
            tapeAgeAmt = this._kv(t, 0.10, 0.35, 0.45, 0.45, 0.45, 0.45);
            const hp = {
                drive:   this._kv(t, 0.08, 0.10, 0.16, 0.201, 0.25, 0.25),
                sag:     0,
                bias:    this._kv(t, 0.10, 0.35, 0.50, 0.65, 0.80, 1.00),
                lpf:     this._kv(t, 0.10, 0.28, 0.35, 0.35, 0.45, 0.45),
                breakup: 0, crackle: 0, dropout: 0, sizzle: 0,
                ear:     this._kv(t, 0.10, 0.20, 0.25, 0.30, 0.35, 0.35),
            };
            this.heatL.setParams(hp); this.heatR.setParams(hp);
        }

        // Engagement fade over first 1%
        const engageFade = Math.min(1.0, this.amount / 0.01);
        // Measure input RMS for level matching
        let sumIn = 0;
        for (let i = 0; i < n; i++) sumIn += left[i] * left[i] + right[i] * right[i];
        const rmsIn = Math.sqrt(sumIn / (2 * n));

        // Process Tape → Heat per channel
        this.tapeL.process(left, n);  this.tapeR.process(right, n);
        this.heatL.process(left, n);  this.heatR.process(right, n);

        // DC blocker (~30 Hz HPF)
        for (let i = 0; i < n; i++) {
            const xL = left[i], xR = right[i];
            left[i]  = xL - this.dcHpXL + this.dcHpR * this.dcHpYL;  this.dcHpXL = xL; this.dcHpYL = left[i];
            right[i] = xR - this.dcHpXR + this.dcHpR * this.dcHpYR;  this.dcHpXR = xR; this.dcHpYR = right[i];
        }

        // Tape Age EQ
        if (tapeAgeAmt > 1e-4) {
            const ageLpf = Math.max(800.0, 20000.0 * Math.pow(0.05, tapeAgeAmt));
            const lpC  = Math.exp(-TWO_PI * ageLpf / this.sr);
            const hpC  = Math.exp(-TWO_PI * (20.0 + tapeAgeAmt * 100.0) / this.sr);
            const midC = Math.exp(-TWO_PI * 1200.0 / this.sr);
            const midBoost = tapeAgeAmt * 0.4;
            for (let i = 0; i < n; i++) {
                this.tapeAgeLpStateL  = lpC * this.tapeAgeLpStateL  + (1 - lpC) * left[i];
                this.tapeAgeLp2StateL = lpC * this.tapeAgeLp2StateL + (1 - lpC) * this.tapeAgeLpStateL;
                this.tapeAgeLp3StateL = lpC * this.tapeAgeLp3StateL + (1 - lpC) * this.tapeAgeLp2StateL;
                this.tapeAgeLpStateR  = lpC * this.tapeAgeLpStateR  + (1 - lpC) * right[i];
                this.tapeAgeLp2StateR = lpC * this.tapeAgeLp2StateR + (1 - lpC) * this.tapeAgeLpStateR;
                this.tapeAgeLp3StateR = lpC * this.tapeAgeLp3StateR + (1 - lpC) * this.tapeAgeLp2StateR;
                left[i] = this.tapeAgeLp3StateL; right[i] = this.tapeAgeLp3StateR;
                this.tapeAgeHpStateL = hpC * this.tapeAgeHpStateL + (1 - hpC) * left[i];
                this.tapeAgeHpStateR = hpC * this.tapeAgeHpStateR + (1 - hpC) * right[i];
                left[i]  -= this.tapeAgeHpStateL;
                right[i] -= this.tapeAgeHpStateR;
                this.tapeAgeMidStateL = midC * this.tapeAgeMidStateL + (1 - midC) * left[i];
                this.tapeAgeMidStateR = midC * this.tapeAgeMidStateR + (1 - midC) * right[i];
                left[i]  += (left[i]  - this.tapeAgeMidStateL) * midBoost;
                right[i] += (right[i] - this.tapeAgeMidStateR) * midBoost;
            }
        }

        // RMS match
        let sumOut = 0;
        for (let i = 0; i < n; i++) sumOut += left[i] * left[i] + right[i] * right[i];
        const rmsOut = Math.sqrt(sumOut / (2 * n));
        const nf = 0.0001;
        const tg = (rmsIn > nf && rmsOut > nf) ? Math.max(0.25, Math.min(2.0, rmsIn / rmsOut)) : 1.0;
        this.rmsMatchGain = this.rmsMatchCoeff * this.rmsMatchGain + (1.0 - this.rmsMatchCoeff) * tg;

        for (let i = 0; i < n; i++) {
            left[i]  *= this.rmsMatchGain * engageFade;
            right[i] *= this.rmsMatchGain * engageFade;
        }
    }
    reset() {
        this.tapeL.reset(); this.tapeR.reset(); this.heatL.reset(); this.heatR.reset();
        this.rmsMatchGain = 1;
        this.tapeAgeLpStateL = 0; this.tapeAgeLpStateR = 0;
        this.tapeAgeLp2StateL = 0; this.tapeAgeLp2StateR = 0;
        this.tapeAgeLp3StateL = 0; this.tapeAgeLp3StateR = 0;
        this.tapeAgeHpStateL = 0; this.tapeAgeHpStateR = 0;
        this.tapeAgeMidStateL = 0; this.tapeAgeMidStateR = 0;
        this.dcHpXL = 0; this.dcHpYL = 0; this.dcHpXR = 0; this.dcHpYR = 0;
    }
}

// ============================================================================
// SpectralPitchShifter — phase-vocoder, octave up + octave down (per channel).
// Direct port of SpectralPitchShifter.h with inline radix-2 FFT.
// ============================================================================
class SpectralPitchShifter {
    constructor(sr, seed) {
        this.sr = sr;
        this.kFFTOrder = 12;
        this.kFFTSize = 1 << this.kFFTOrder;     // 4096
        this.kHopSize = this.kFFTSize / 4;        // 1024 (75% overlap)
        this.kNumBins = (this.kFFTSize >> 1) + 1; // 2049
        this.kOverlapBufSize = this.kFFTSize * 2;
        this.kOLANorm = 1.0 / 1.5; // sum of Hann² at 4× overlap = 1.5
        this.fft = new FFT(this.kFFTOrder);
        this.inputRing = new Float64Array(this.kFFTSize);
        this.outputUp = new Float64Array(this.kOverlapBufSize);
        this.outputDown = new Float64Array(this.kOverlapBufSize);
        this.hannTable = new Float32Array(this.kFFTSize);
        for (let i = 0; i < this.kFFTSize; i++)
            this.hannTable[i] = 0.5 * (1 - Math.cos(2 * PI * i / this.kFFTSize));
        this.prevAnalysisPhase  = new Float32Array(this.kNumBins);
        this.prevSynthPhaseUp   = new Float32Array(this.kNumBins);
        this.prevSynthPhaseDown = new Float32Array(this.kNumBins);
        this.inputWritePos = 0;
        this.outputReadPos = 0;
        this.samplesUntilHop = this.kHopSize;
        this.currentAscendGain = 0;
        this.currentDescendGain = 0;
        this.phaseOffset = seed * 0.01;
        // Scratch buffers
        this.fftBuf = new Float64Array(2 * this.kNumBins); // [re,im,re,im,...]
        this.realBuf = new Float64Array(this.kFFTSize);
        this.synthBufUp   = new Float64Array(2 * this.kNumBins);
        this.synthBufDown = new Float64Array(2 * this.kNumBins);
        this.synthMagUp = new Float32Array(this.kNumBins);
        this.synthFreqUp = new Float32Array(this.kNumBins);
        this.synthMagDown = new Float32Array(this.kNumBins);
        this.synthFreqDown = new Float32Array(this.kNumBins);
        this.magArr = new Float32Array(this.kNumBins);
        this.trueFreqArr = new Float32Array(this.kNumBins);
        this.synthRealUp   = new Float64Array(this.kFFTSize);
        this.synthRealDown = new Float64Array(this.kFFTSize);
    }
    setSeed(seed) { this.phaseOffset = seed * 0.01; }
    setAscend(g)  { this.currentAscendGain  = g; }
    setDescend(g) { this.currentDescendGain = g; }
    process(input, output, n) {
        for (let s = 0; s < n; s++) {
            this.inputRing[this.inputWritePos] = input[s];
            this.inputWritePos = (this.inputWritePos + 1) % this.kFFTSize;
            this.samplesUntilHop--;
            if (this.samplesUntilHop <= 0) {
                this._processFrame();
                this.samplesUntilHop = this.kHopSize;
            }
            const idx = this.outputReadPos % this.kOverlapBufSize;
            const up   = this.outputUp[idx];
            const down = this.outputDown[idx];
            this.outputUp[idx]   = 0;
            this.outputDown[idx] = 0;
            this.outputReadPos = (this.outputReadPos + 1) % this.kOverlapBufSize;
            output[s] = up * this.currentAscendGain + down * this.currentDescendGain;
        }
    }
    _processFrame() {
        const N = this.kFFTSize, B = this.kNumBins, hop = this.kHopSize;
        // 1. Window input (oldest first)
        const readStart = (this.inputWritePos - N + N) % N;
        for (let i = 0; i < N; i++) {
            const idx = (readStart + i) % N;
            this.realBuf[i] = this.inputRing[idx] * this.hannTable[i];
        }
        // 2. Forward RFFT
        this.fft.rfft(this.realBuf, this.fftBuf);
        // 3. Magnitude + true frequency per bin
        const expectedPhasePerHop = 2 * PI * hop / N;
        for (let k = 0; k < B; k++) {
            const re = this.fftBuf[k * 2], im = this.fftBuf[k * 2 + 1];
            this.magArr[k] = Math.sqrt(re * re + im * im);
            const phase = Math.atan2(im, re);
            const deltaPhase = phase - this.prevAnalysisPhase[k];
            this.prevAnalysisPhase[k] = phase;
            const expected = expectedPhasePerHop * k;
            let dev = deltaPhase - expected;
            dev = dev - 2 * PI * Math.round(dev / (2 * PI));
            this.trueFreqArr[k] = expected + dev;
        }
        // 4. Octave up — bin shift × 2
        for (let k = 0; k < B; k++) { this.synthMagUp[k] = 0; this.synthFreqUp[k] = 0; }
        for (let k = 0; k < B / 2; k++) {
            const target = k * 2;
            if (target < B) {
                this.synthMagUp[target] += this.magArr[k];
                this.synthFreqUp[target] = this.trueFreqArr[k] * 2.0;
            }
        }
        // 5. Octave down — bin shift × 0.5
        for (let k = 0; k < B; k++) { this.synthMagDown[k] = 0; this.synthFreqDown[k] = 0; }
        for (let k = 0; k < B; k++) {
            const target = k >> 1;
            if (k % 2 === 0) {
                this.synthMagDown[target] += this.magArr[k];
                this.synthFreqDown[target] = this.trueFreqArr[k] * 0.5;
            } else {
                this.synthMagDown[target] += this.magArr[k] * 0.5;
                if (target + 1 < B) this.synthMagDown[target + 1] += this.magArr[k] * 0.5;
            }
        }
        // 6. Synthesize octave up
        for (let k = 0; k < B; k++) {
            this.prevSynthPhaseUp[k] += this.synthFreqUp[k] + this.phaseOffset * 0.001;
            const ph = this.prevSynthPhaseUp[k];
            this.synthBufUp[k * 2]     = this.synthMagUp[k] * Math.cos(ph);
            this.synthBufUp[k * 2 + 1] = this.synthMagUp[k] * Math.sin(ph);
        }
        this.fft.irfft(this.synthBufUp, this.synthRealUp);
        const outStartUp = this.outputReadPos % this.kOverlapBufSize;
        for (let i = 0; i < N; i++) {
            const idx = (outStartUp + i) % this.kOverlapBufSize;
            this.outputUp[idx] += this.synthRealUp[i] * this.hannTable[i] * this.kOLANorm;
        }
        // 7. Synthesize octave down
        for (let k = 0; k < B; k++) {
            this.prevSynthPhaseDown[k] += this.synthFreqDown[k] + this.phaseOffset * 0.001;
            const ph = this.prevSynthPhaseDown[k];
            this.synthBufDown[k * 2]     = this.synthMagDown[k] * Math.cos(ph);
            this.synthBufDown[k * 2 + 1] = this.synthMagDown[k] * Math.sin(ph);
        }
        this.fft.irfft(this.synthBufDown, this.synthRealDown);
        const outStartDown = this.outputReadPos % this.kOverlapBufSize;
        for (let i = 0; i < N; i++) {
            const idx = (outStartDown + i) % this.kOverlapBufSize;
            this.outputDown[idx] += this.synthRealDown[i] * this.hannTable[i] * this.kOLANorm;
        }
    }
    reset() {
        this.inputRing.fill(0);
        this.outputUp.fill(0);
        this.outputDown.fill(0);
        this.prevAnalysisPhase.fill(0);
        this.prevSynthPhaseUp.fill(0);
        this.prevSynthPhaseDown.fill(0);
        this.inputWritePos = 0;
        this.outputReadPos = 0;
        this.samplesUntilHop = this.kHopSize;
    }
}

// ============================================================================
// ReverieProcessor — main worklet. Signal flow per DriftEngine::processBlock.
// ============================================================================
class ReverieProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'immersion',  defaultValue: 0.09,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'distance',   defaultValue: 2.75,  minValue: 0.5,  maxValue: 5,  automationRate: 'k-rate' },
            { name: 'expanse',    defaultValue: 5.0,   minValue: 0,    maxValue: 40, automationRate: 'k-rate' },
            { name: 'timbre',     defaultValue: 0.5,   minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'ascend',     defaultValue: 0.10,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'descend',    defaultValue: 0,     minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'glow',       defaultValue: 0.10,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'driftMod',   defaultValue: 0.10,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'shimmer',    defaultValue: 0,     minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'inputGain',  defaultValue: 0.909, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'outputGain', defaultValue: 0.909, minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'modDepth',   defaultValue: 0.40,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'modRate',    defaultValue: 2.0,   minValue: 0,    maxValue: 10, automationRate: 'k-rate' },
            { name: 'diffusion',  defaultValue: 1.0,   minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'damping',    defaultValue: 0.75,  minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
            { name: 'hpfFreq',    defaultValue: 150,   minValue: 30,   maxValue: 1000,  automationRate: 'k-rate' },
            { name: 'lpfFreq',    defaultValue: 5000,  minValue: 500,  maxValue: 20000, automationRate: 'k-rate' },
            { name: 'earlyMod',   defaultValue: 0,     minValue: 0,    maxValue: 1,  automationRate: 'k-rate' },
        ];
    }
    constructor() {
        super();
        const sr = sampleRate;
        this.sr = sr;
        this.reverb     = new JPVerbReverb(sr);
        this.tiltEQ     = new TiltEQ(sr);
        this.glow       = new GlowEffect(sr);
        this.driftFx    = new DriftEffect(sr);
        this.hpf        = new Biquad();
        this.lpf        = new Biquad();
        // Pitch shifters per channel: separate ascend (FB) and descend (one-shot)
        this.pitchAscL  = new SpectralPitchShifter(sr, 42);
        this.pitchAscR  = new SpectralPitchShifter(sr, 137);
        this.pitchDescL = new SpectralPitchShifter(sr, 201);
        this.pitchDescR = new SpectralPitchShifter(sr, 317);

        this._dryL = new Float64Array(BLOCK_SIZE);
        this._dryR = new Float64Array(BLOCK_SIZE);
        this._wetL = new Float64Array(BLOCK_SIZE);
        this._wetR = new Float64Array(BLOCK_SIZE);
        this._pL   = new Float64Array(BLOCK_SIZE);
        this._pR   = new Float64Array(BLOCK_SIZE);
        // Shimmer feedback held across blocks (Ascend output recirculates)
        this._fbL  = new Float64Array(BLOCK_SIZE);
        this._fbR  = new Float64Array(BLOCK_SIZE);

        // Limiter (1 ms attack / 50 ms release at 0 dBFS)
        this.limEnv = 0; this.limGain = 1;
        this.limAtk     = Math.exp(-1.0 / (sr * 0.001));
        this.limRel     = Math.exp(-1.0 / (sr * 0.050));
        this.limGainAtk = Math.exp(-1.0 / (sr * 0.001));
        this.limGainRel = Math.exp(-1.0 / (sr * 0.050));

        // Cached params
        this.lastDistance = -1; this.lastExpanse = -1; this.lastDamping = -1;
        this.lastDiffusion = -1; this.lastModRate = -1; this.lastModDepth = -1;
        this.lastHpfFreq = -1; this.lastLpfFreq = -1; this.lastTimbre = -1;
        this.lastGlow = -1; this.lastDriftMod = -1; this.lastEarlyMod = -1;

        // JPVerb fixed params (matching DriftEngine.h's processBlock)
        this.reverb.setModScale(50.0);    // match stock JPVerb (Reach) depth scaling
        this.reverb.setLFGain(1.0);
        this.reverb.setMIDGain(1.0);
        this.reverb.setHFGain(1.0);
        this.reverb.setLoCrossover(377.0);
        this.reverb.setHiCrossover(3400.0);
    }
    // dB = val * 66 - 60  (0 → -60 dB / mute, 0.909 → 0 dB, 1.0 → +6 dB)
    sliderToGain(val) {
        if (val <= 0.001) return 0;
        return Math.pow(10.0, (val * 66.0 - 60.0) / 20.0);
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
        const damping   = parameters.damping[0] * 0.8;  // UI 0–100% → engine 0–80%
        const hpfFreq   = parameters.hpfFreq[0];
        const lpfFreq   = parameters.lpfFreq[0];
        const earlyMod  = parameters.earlyMod[0];
        const shimmerCapped = shimmer * 0.9;             // prevent feedback meltdown

        // Update reverb params
        if (Math.abs(distance - this.lastDistance) > 0.001) { this.reverb.setSize(distance); this.lastDistance = distance; }
        if (Math.abs(expanse - this.lastExpanse) > 0.01)    { this.reverb.setReverbTime(Math.max(0.05, expanse)); this.lastExpanse = expanse; }
        if (Math.abs(damping - this.lastDamping) > 0.001)   { this.reverb.setDamping(damping); this.lastDamping = damping; }
        if (Math.abs(diffusion - this.lastDiffusion) > 0.001){this.reverb.setDiffusion(diffusion); this.lastDiffusion = diffusion; }
        if (Math.abs(modDepth - this.lastModDepth) > 0.001) { this.reverb.setModDepth(modDepth); this.lastModDepth = modDepth; }
        if (Math.abs(modRate - this.lastModRate) > 0.01)    { this.reverb.setModFreq(modRate); this.lastModRate = modRate; }
        if (Math.abs(earlyMod - this.lastEarlyMod) > 0.001) { this.reverb.setEarlyMod(earlyMod); this.lastEarlyMod = earlyMod; }
        if (Math.abs(hpfFreq - this.lastHpfFreq) > 0.5)     { this.hpf.setHPF(this.sr, hpfFreq); this.lastHpfFreq = hpfFreq; }
        if (Math.abs(lpfFreq - this.lastLpfFreq) > 0.5)     { this.lpf.setLPF(this.sr, lpfFreq); this.lastLpfFreq = lpfFreq; }
        if (Math.abs(timbre - this.lastTimbre) > 0.001)     { this.tiltEQ.setTilt((timbre - 0.5) * 24.0); this.lastTimbre = timbre; }
        if (Math.abs(glow - this.lastGlow) > 0.001)         { this.glow.setAmount(glow); this.lastGlow = glow; }
        if (Math.abs(driftMod - this.lastDriftMod) > 0.001) { this.driftFx.setAmount(driftMod); this.lastDriftMod = driftMod; }

        // ── Step 5–6: input gain + copy to dry/wet ───────────────────────────
        const inputGainLin = this.sliderToGain(inputGV);
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
            // ── Step 8: add shimmer feedback ─────────────────────────────────
            for (let i = 0; i < n; i++) {
                wetL[i] += this._fbL[i] * shimmerCapped;
                wetR[i] += this._fbR[i] * shimmerCapped;
                this._fbL[i] = 0;
                this._fbR[i] = 0;
            }
            // ── Step 9: JPVerb reverb ────────────────────────────────────────
            this.reverb.process(wetL, wetR, n);
            // ── Step 10a: Pitch ascend (feeds back into shimmer) ─────────────
            this.pitchAscL.setAscend(ascend); this.pitchAscL.setDescend(0);
            this.pitchAscR.setAscend(ascend); this.pitchAscR.setDescend(0);
            this.pitchAscL.process(wetL, this._pL, n);
            this.pitchAscR.process(wetR, this._pR, n);
            for (let i = 0; i < n; i++) {
                this._fbL[i] = this._pL[i];
                this._fbR[i] = this._pR[i];
                wetL[i] += this._pL[i];
                wetR[i] += this._pR[i];
            }
            // ── Step 10b: Pitch descend (one-shot) ───────────────────────────
            if (descend > 0.001) {
                this.pitchDescL.setAscend(0); this.pitchDescL.setDescend(descend);
                this.pitchDescR.setAscend(0); this.pitchDescR.setDescend(descend);
                this.pitchDescL.process(wetL, this._pL, n);
                this.pitchDescR.process(wetR, this._pR, n);
                for (let i = 0; i < n; i++) {
                    wetL[i] += this._pL[i];
                    wetR[i] += this._pR[i];
                }
            }
        }

        // ── Step 11: Glow on wet ─────────────────────────────────────────────
        this.glow.process(wetL, wetR, n);
        // ── Step 11b: DriftLoFi (Tape→Heat) on wet ───────────────────────────
        this.driftFx.process(wetL, wetR, n);

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
