// ═══════════════════════════════════════════════════════════════════════════════
// DRIFT v7 — Generative Ambient Installation
//
// Overlapping loops create continuous, evolving harmonies.
// Like Eno's Music for Airports - always something playing.
// 7-9 voices at different periods (8-90s) phase against each other.
//
// NEW IN v7:
// - Extended upper register (MIDI 24-96) for occasional sparkle
// - Longer loop periods (up to 90s) for rare, impactful events
// - Very subtle tape degradation (wow/flutter, HF loss, pitch sag)
// ═══════════════════════════════════════════════════════════════════════════════

// Musical scales - diverse moods
const SCALES = {
    'Minor Pent': [0, 3, 5, 7, 10],
    'Major Pent': [0, 2, 4, 7, 9],
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10],
    'Lydian': [0, 2, 4, 6, 7, 9, 11], // Dreamy, floating (Eno)
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10], // Bluesy major
    'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
    'Hirajoshi': [0, 2, 3, 7, 8],
    'In Sen': [0, 1, 5, 7, 10],
    'Ryukyu': [0, 4, 5, 7, 11] // Okinawan (Drift v5 vibes)
};

// Continuous like Music for Airports
const DENSITY = 0.85; // High probability - always something playing

const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

let audioCtx, masterGain, compressor, reverb, delay, dryMix;
let rootMidi = 36;
let rootName = 'C';
let scaleName = 'Dorian';
let scale = [];

let voices = [];
let running = false;
let paused = false;
let startTime = 0;
let pausedTime = 0;
let totalPausedDuration = 0;
let activeNotes = 0;

// Atmospheric textures (Japanese garden ambience) - weather engine
let lastWindTime = 0;
let lastLeavesTime = 0;
let lastWaterTime = 0;
let lastChimeTime = 0;

// Canvas
let canvas, ctx;
let W, H;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[randInt(0, arr.length - 1)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Dry mix bus - voices connect here when "close"
    dryMix = audioCtx.createGain();
    dryMix.gain.value = 1.0;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 4.0; // Very loud - matches streaming services

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.3;

    // High-pass filter to remove sub-bass rumble
    const hpFilter = audioCtx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 45; // Cut rumble below 45 Hz
    hpFilter.Q.value = 0.7; // Gentle slope

    // Moderate reverb - spacious but not overwhelming
    // Voices send here when "far" - creates depth perception
    reverb = createReverb(4, 2.5);
    const reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.5; // Balanced wet/dry

    // Very subtle delay
    delay = audioCtx.createDelay(2);
    delay.delayTime.value = 0.5;
    const delayFeedback = audioCtx.createGain();
    delayFeedback.gain.value = 0.2;
    const delayMix = audioCtx.createGain();
    delayMix.gain.value = 0.15; // Very subtle
    const delayFilter = audioCtx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2000;

    delay.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(delayMix);

    // Routing: dryMix and reverb both feed masterGain
    // masterGain also feeds delay for rhythmic echo
    dryMix.connect(masterGain);
    reverb.connect(reverbGain);
    reverbGain.connect(masterGain);
    masterGain.connect(delay);
    masterGain.connect(compressor);
    delayMix.connect(compressor);
    compressor.connect(hpFilter);
    hpFilter.connect(audioCtx.destination);
}

function createReverb(duration, decay) {
    const len = audioCtx.sampleRate * duration;
    const impulse = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
    const L = impulse.getChannelData(0);
    const R = impulse.getChannelData(1);

    for (let i = 0; i < len; i++) {
        const t = i / audioCtx.sampleRate;
        const env = Math.pow(1 - t / duration, decay);
        L[i] = (Math.random() * 2 - 1) * env * 0.3;
        R[i] = (Math.random() * 2 - 1) * env * 0.3;
    }

    const conv = audioCtx.createConvolver();
    conv.buffer = impulse;
    return conv;
}

function generateScale() {
    rootMidi = 24 + randInt(0, 7); // Lower register
    rootName = ROOT_NOTES[rootMidi % 12];
    scaleName = pick(Object.keys(SCALES));
    const intervals = SCALES[scaleName];

    scale = [];
    for (let octave = 0; octave < 5; octave++) { // Extended to 5 octaves
        intervals.forEach(interval => {
            const midi = rootMidi + (octave * 12) + interval;
            if (midi >= 24 && midi <= 96) { // Extended range to include upper register
                scale.push(midi);
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE CLASS - Looping like Music for Airports
// ═══════════════════════════════════════════════════════════════════════════════

class Voice {
    constructor(type, register, period) {
        this.type = type; // 'swell' only
        this.register = register; // 'low', 'mid', 'high'
        this.period = period; // Loop period in seconds
        this.lastTrigger = 0;
        this.age = 0;
        this.phase = 0;
        this.active = true;
        this.visualBar = '';
        this.loopCount = 0; // Track how many times this loop has played
        this.tapeAge = 0; // Accumulated degradation (very subtle)

        // SPATIAL MOVEMENT - organic panning and depth
        this.panPosition = 0; // Current pan (-1 to 1)
        this.panSpeed = rand(0.15, 0.35); // Cycles per minute
        this.panPhase = rand(0, Math.PI * 2); // Starting phase
        this.depth = rand(0.3, 0.7); // 0=close/dry, 1=far/wet
        this.depthSpeed = rand(0.1, 0.25); // Cycles per minute
        this.depthPhase = rand(0, Math.PI * 2); // Starting phase
    }

    update(dt) {
        if (!this.active || !audioCtx) return;

        this.age += dt;
        this.phase = (this.age % (this.period * 1000)) / (this.period * 1000);

        // Update spatial movement - slow organic drift
        const timeInMinutes = this.age / 60000;

        // Pan oscillates left-right at panSpeed cycles/minute
        this.panPosition = Math.sin((timeInMinutes * this.panSpeed * Math.PI * 2) + this.panPhase) * 0.7;

        // Depth oscillates near-far at depthSpeed cycles/minute
        // Range 0.2 (close/dry) to 0.8 (far/wet)
        this.depth = 0.5 + Math.sin((timeInMinutes * this.depthSpeed * Math.PI * 2) + this.depthPhase) * 0.3;

        const now = Date.now();
        const elapsed = now - this.lastTrigger;

        // Trigger when loop period completes
        if (elapsed >= this.period * 1000) {
            // Probability check - mostly yes, but with some variation
            if (Math.random() < DENSITY && activeNotes < 6) {
                this.trigger();
                this.lastTrigger = now;
            } else {
                // Still advance the loop
                this.lastTrigger = now;
            }
        }

        this.updateVisual();
    }

    trigger() {
        if (!audioCtx) return;

        // Increment loop count and accumulate very subtle tape degradation
        this.loopCount++;
        // Very slow degradation: 0.001 per loop = 0.1 after 100 loops
        this.tapeAge += 0.001;

        // Choose register index
        const registerIndex = {
            'low': Math.floor(scale.length * 0.15),
            'mid': Math.floor(scale.length * 0.45),
            'high': Math.floor(scale.length * 0.75)  // Higher up for sparkle
        }[this.register];

        // Create chord - low register mostly single notes to avoid muddiness
        let chordSize;
        if (this.register === 'low') {
            chordSize = randInt(1, 2); // 1-2 notes, keeps ultra-low clean
        } else if (this.register === 'high') {
            chordSize = randInt(2, 3); // 2-3 notes for sparkle
        } else {
            chordSize = randInt(2, 4); // 2-4 notes for mid-range richness
        }
        const notes = [];
        for (let i = 0; i < chordSize; i++) {
            const index = clamp(registerIndex + randInt(-3, 3), 0, scale.length - 1);
            notes.push(scale[index]);
        }

        // Play beautiful swell
        this.playSwell(notes);
    }

    playSwell(notes) {
        activeNotes++;

        const now = audioCtx.currentTime;

        // High register voices are shorter and more delicate
        const isHighRegister = this.register === 'high';
        const dur = isHighRegister ? rand(8, 14) : rand(12, 20);

        // TAPE DEGRADATION EFFECTS (super subtle)
        // All effects scale with tapeAge (0.001 per loop = 0.1 after 100 loops)

        // 1. Wow & Flutter - very subtle pitch instability (±2 cents max at tapeAge=1.0)
        const wowFlutter = Math.sin(now * 0.5 + this.loopCount * 0.3) * this.tapeAge * 2;

        // 2. High-frequency loss - gradual filter reduction (10% max at tapeAge=1.0)
        const hfLoss = 1 - (this.tapeAge * 0.1);

        // 3. Pitch sag - cumulative negative detune (-3 cents max at tapeAge=1.0)
        const pitchSag = -this.tapeAge * 3;

        notes.forEach((midi, i) => {
            const freq = midiToFreq(midi);
            const noteDelay = rand(0, 0.3); // Gentle arpeggiation

            // High register uses less detuning for clarity
            const detunes = isHighRegister ? [-6, 0, 6] : [-12, 0, 12];
            detunes.forEach((detune, oscIndex) => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine'; // Pure sine waves
                osc.frequency.value = freq;

                // Apply tape degradation to detune (wow/flutter + pitch sag)
                osc.detune.value = detune + rand(-4, 4) + wowFlutter + pitchSag;

                const env = audioCtx.createGain();
                // High register is quieter for background working music
                const baseGain = isHighRegister ? 0.015 : 0.024;
                const gain = (baseGain / detunes.length) * (1 - i * 0.12) * (1 - oscIndex * 0.1);
                const attack = rand(2, 4); // Moderate attack
                const release = rand(3, 5); // Moderate release

                env.gain.setValueAtTime(0, now + noteDelay);
                env.gain.linearRampToValueAtTime(gain, now + noteDelay + attack);
                env.gain.setValueAtTime(gain, now + noteDelay + dur - release);
                env.gain.exponentialRampToValueAtTime(0.001, now + noteDelay + dur);

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                // Apply high-frequency loss - subtle darkening over time
                filter.frequency.value = freq * rand(2.5, 3.5) * hfLoss;
                filter.Q.value = 0.4;

                // SPATIAL POSITIONING - use voice's current pan position
                const panner = audioCtx.createStereoPanner();
                panner.pan.value = this.panPosition + rand(-0.1, 0.1); // Add slight variance

                // DEPTH CONTROL - split between dry (close) and wet (far via reverb)
                const dryGain = audioCtx.createGain();
                const wetGain = audioCtx.createGain();

                // Depth controls reverb amount: always reverb-y, super reverb-y at max
                // depth ranges 0.2-0.8: dry 0.5-0.2, wet 0.52-0.88
                dryGain.gain.value = 0.6 - (this.depth * 0.5); // Decreases with distance
                wetGain.gain.value = 0.4 + (this.depth * 0.6); // Increases with distance

                osc.connect(env);
                env.connect(filter);
                filter.connect(panner);

                // Split signal: dry path goes to dryMix, wet path goes through reverb
                panner.connect(dryGain);
                panner.connect(wetGain);
                dryGain.connect(dryMix); // Dry mix for "close" sounds
                wetGain.connect(reverb); // Reverb for "far" sounds - creates depth

                osc.start(now + noteDelay);
                osc.stop(now + noteDelay + dur);
            });
        });

        // Decrease active notes after duration
        setTimeout(() => {
            activeNotes = Math.max(0, activeNotes - 1);
        }, dur * 1000);
    }

    updateVisual() {
        // Visual updated in canvas render
    }

    getName() {
        const registerNames = {
            'low': 'LOW',
            'mid': 'MID',
            'high': 'HIGH'
        };
        return `SWELL ${registerNames[this.register]} (${this.period.toFixed(1)}s)`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATMOSPHERIC TEXTURES - Japanese Garden Ambience (Weather Engine)
// ═══════════════════════════════════════════════════════════════════════════════

// Weather engine - each texture type checks independently with probability
// Like weather systems: always checking, occasionally happening based on chance

function checkWindWeather() {
    if (!audioCtx) return;

    const now = Date.now();
    const minInterval = 15000; // Minimum 15 seconds between wind events

    if (now - lastWindTime < minInterval) return;

    // 0.5% chance per check (called every 50ms) = ~1 event per 10 seconds when allowed
    if (Math.random() < 0.005) {
        playWind();
        lastWindTime = now;
    }
}

function checkLeavesWeather() {
    if (!audioCtx) return;

    const now = Date.now();
    const minInterval = 12000; // Minimum 12 seconds between leaf rustles

    if (now - lastLeavesTime < minInterval) return;

    // 0.4% chance per check = ~1 event per 12 seconds when allowed
    if (Math.random() < 0.004) {
        playLeaves();
        lastLeavesTime = now;
    }
}

function checkWaterWeather() {
    if (!audioCtx) return;

    const now = Date.now();
    const minInterval = 18000; // Minimum 18 seconds between water sounds

    if (now - lastWaterTime < minInterval) return;

    // 0.3% chance per check = ~1 event per 16 seconds when allowed
    if (Math.random() < 0.003) {
        playWater();
        lastWaterTime = now;
    }
}

function checkChimeWeather() {
    if (!audioCtx) return;

    const now = Date.now();
    const minInterval = 25000; // Minimum 25 seconds between chimes (rarest)

    if (now - lastChimeTime < minInterval) return;

    // 0.2% chance per check = ~1 event per 25 seconds when allowed
    if (Math.random() < 0.002) {
        playBambooChime();
        lastChimeTime = now;
    }
}

// Wind - slow filtered noise sweep (subtle, natural)
function playWind() {
    const t = audioCtx.currentTime;
    const dur = rand(5, 10);

    // More complex noise - multiple layers for naturalistic texture
    const oscillators = [];
    for (let i = 0; i < 5; i++) {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = rand(40, 180); // Wider range
        oscillators.push(osc);
    }

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.006, t + dur * 0.35); // Subtle
    noiseGain.gain.linearRampToValueAtTime(0.004, t + dur * 0.65);
    noiseGain.gain.linearRampToValueAtTime(0, t + dur);

    // Two-stage filtering for more natural wind character
    const filter1 = audioCtx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(300, t);
    filter1.frequency.exponentialRampToValueAtTime(600, t + dur * 0.7); // Slower sweep
    filter1.frequency.exponentialRampToValueAtTime(400, t + dur); // Back down
    filter1.Q.value = 0.8; // Gentler resonance

    const filter2 = audioCtx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.value = 200; // Remove low rumble
    filter2.Q.value = 0.5;

    oscillators.forEach(osc => {
        osc.connect(noiseGain);
    });
    noiseGain.connect(filter2);
    filter2.connect(filter1);
    filter1.connect(reverb); // Wind is always distant

    oscillators.forEach(osc => {
        osc.start(t);
        osc.stop(t + dur);
    });
}

// Leaves - quick bursts of filtered noise (natural rustle)
function playLeaves() {
    const t = audioCtx.currentTime;
    const numBursts = randInt(2, 4); // Fewer bursts

    for (let i = 0; i < numBursts; i++) {
        const burstTime = t + rand(0, 2); // Spread over longer time
        const burstDur = rand(0.08, 0.2); // Shorter, crisper

        // Multiple oscillators for more complex rustle texture
        for (let j = 0; j < 3; j++) {
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = rand(3000, 6000); // Higher, airier

            const env = audioCtx.createGain();
            env.gain.setValueAtTime(0, burstTime);
            env.gain.linearRampToValueAtTime(0.002, burstTime + 0.01); // Much quieter
            env.gain.exponentialRampToValueAtTime(0.0001, burstTime + burstDur);

            // Bandpass for more natural leaf texture
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = rand(4000, 7000);
            filter.Q.value = rand(3, 5); // Variable resonance

            const panner = audioCtx.createStereoPanner();
            panner.pan.value = rand(-0.8, 0.8);

            osc.connect(env);
            env.connect(filter);
            filter.connect(panner);
            panner.connect(reverb);

            osc.start(burstTime + rand(-0.01, 0.01)); // Slight timing variance
            osc.stop(burstTime + burstDur);
        }
    }
}

// Water droplet - natural drip sound (more realistic)
function playWater() {
    const t = audioCtx.currentTime;
    const numDrops = randInt(1, 2); // Fewer drops

    for (let i = 0; i < numDrops; i++) {
        const dropTime = t + rand(0, 3);
        const baseFreq = rand(1800, 2800); // Lower, less synthetic

        // Multi-harmonic for more natural drip sound
        [1, 2.3, 3.8].forEach((harmonic, idx) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = baseFreq * harmonic;

            const env = audioCtx.createGain();
            // Much quieter, with upper harmonics even softer
            const gain = idx === 0 ? 0.008 : (idx === 1 ? 0.003 : 0.001);
            env.gain.setValueAtTime(gain, dropTime);
            env.gain.exponentialRampToValueAtTime(0.0001, dropTime + rand(0.3, 0.6));

            // Bandpass for more natural water resonance
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = baseFreq * harmonic;
            filter.Q.value = rand(6, 10); // Resonant like real water

            const panner = audioCtx.createStereoPanner();
            panner.pan.value = rand(-0.5, 0.5);

            osc.connect(env);
            env.connect(filter);
            filter.connect(panner);
            panner.connect(reverb);

            osc.start(dropTime);
            osc.stop(dropTime + 0.8);
        });
    }
}

// Bamboo chime - hollow resonant tones using current scale (subtle, organic)
function playBambooChime() {
    const t = audioCtx.currentTime;
    const numTones = randInt(1, 3); // Fewer tones, more sparse

    for (let i = 0; i < numTones; i++) {
        const chimeTime = t + i * rand(0.5, 1.2); // More spacing

        // Use frequencies from current scale - pick from mid-high register
        const scaleIndex = randInt(Math.floor(scale.length * 0.5), scale.length - 1);
        const midi = scale[scaleIndex];
        const freq = midiToFreq(midi);
        const dur = rand(3, 5); // Longer decay

        // Fundamental + overtones for natural bamboo hollow sound
        [1, 2.1, 3.7].forEach((harmonic, idx) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq * harmonic + rand(-2, 2); // Slight detuning for realism

            const env = audioCtx.createGain();
            // Much quieter - bamboo chimes should be distant
            const gain = idx === 0 ? 0.006 : (idx === 1 ? 0.002 : 0.0008);
            env.gain.setValueAtTime(0, chimeTime);
            env.gain.linearRampToValueAtTime(gain * rand(0.8, 1.2), chimeTime + rand(0.02, 0.04)); // Variable attack
            env.gain.exponentialRampToValueAtTime(0.0001, chimeTime + dur);

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = freq * harmonic;
            filter.Q.value = rand(8, 14); // Variable resonance

            const panner = audioCtx.createStereoPanner();
            panner.pan.value = rand(-0.4, 0.4);

            osc.connect(env);
            env.connect(filter);
            filter.connect(panner);
            panner.connect(reverb);

            osc.start(chimeTime);
            osc.stop(chimeTime + dur);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateVoices() {
    voices = [];

    // Create 7-9 overlapping loops like Music for Airports
    const numVoices = randInt(7, 9);

    for (let i = 0; i < numVoices; i++) {
        // Longer loop periods including very long loops (8-90 seconds)
        // Mix of short (foundation), medium (texture), and long (sparse events)
        let period;
        if (i < 3) {
            // Foundation voices - shorter loops (8-24s)
            period = pick([8, 11, 13, 15, 17, 19, 21, 24]);
        } else if (i < 6) {
            // Textural voices - medium loops (25-50s)
            period = pick([27, 31, 37, 41, 47]);
        } else {
            // Event voices - long loops (60-90s) - rare, impactful
            period = pick([61, 71, 79, 89]);
        }

        // More balanced register distribution with emphasis on mid/high
        let register;
        if (i < 2) {
            register = 'low';    // 2 low voices (foundation)
        } else if (i < 5) {
            register = 'mid';    // 3 mid voices (body)
        } else {
            register = 'high';   // 2-4 high voices (sparkle)
        }

        voices.push(new Voice('swell', register, period));
    }

    // Stagger initial triggers to avoid everything starting together
    voices.forEach((voice, i) => {
        voice.lastTrigger = Date.now() - rand(0, voice.period * 1000);
        voice.age = rand(0, voice.period * 1000);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS & VISUALS
// ═══════════════════════════════════════════════════════════════════════════════

function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
}

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

function render() {
    if (!running) return;

    // Fade trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, W, H);

    const centerX = W / 2;
    const centerY = H / 2;
    const time = Date.now() * 0.001;

    // Separate voices by register for Fantasia-style visualization
    const lowVoices = voices.filter(v => v.register === 'low');
    const midVoices = voices.filter(v => v.register === 'mid');
    const highVoices = voices.filter(v => v.register === 'high');

    // LOW VOICES - Thick horizontal waves (bass foundation)
    lowVoices.forEach((voice, i) => {
        const y = centerY + (i - lowVoices.length / 2 + 0.5) * 80;
        const amplitude = 30 + voice.phase * 60;
        const thickness = 8 + voice.phase * 12;
        const opacity = 0.2 + voice.phase * 0.5;

        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';

        ctx.beginPath();
        for (let x = 0; x <= W; x += 5) {
            const waveX = x;
            const waveY = y + Math.sin((x / 100) + (voice.phase * Math.PI * 2) + time * 0.5) * amplitude;
            if (x === 0) ctx.moveTo(waveX, waveY);
            else ctx.lineTo(waveX, waveY);
        }
        ctx.stroke();

        // Add nodes along the wave when active
        if (voice.phase > 0.8) {
            for (let x = 0; x <= W; x += 120) {
                const waveY = y + Math.sin((x / 100) + (voice.phase * Math.PI * 2) + time * 0.5) * amplitude;
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
                ctx.beginPath();
                ctx.arc(x, waveY, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    // MID VOICES - Circles that expand and contract (melody)
    midVoices.forEach((voice, i) => {
        const angle = (i / midVoices.length) * Math.PI * 2;
        const orbitRadius = Math.min(W, H) * 0.2;
        const x = centerX + Math.cos(angle + time * 0.3) * orbitRadius;
        const y = centerY + Math.sin(angle + time * 0.3) * orbitRadius;

        const radius = 20 + voice.phase * 80;
        const opacity = 0.15 + voice.phase * 0.5;

        // Outer circle
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner fill when active
        if (voice.phase > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center dot
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Connecting line to center (Bauhaus style)
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
    });

    // HIGH VOICES - Vertical lines and arcs (treble, like strings)
    highVoices.forEach((voice, i) => {
        const x = (W / (highVoices.length + 1)) * (i + 1);
        const maxHeight = H * 0.35;
        const height = maxHeight * voice.phase;
        const opacity = 0.2 + voice.phase * 0.6;

        // Vertical line from center
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, centerY - height);
        ctx.lineTo(x, centerY + height);
        ctx.stroke();

        // Arc at top and bottom when near completion
        if (voice.phase > 0.6) {
            const arcRadius = 30 + voice.phase * 40;

            // Top arc
            ctx.beginPath();
            ctx.arc(x, centerY - height, arcRadius, 0, Math.PI, true);
            ctx.stroke();

            // Bottom arc
            ctx.beginPath();
            ctx.arc(x, centerY + height, arcRadius, 0, Math.PI);
            ctx.stroke();
        }

        // Horizontal crossbar
        const crossbarWidth = 40 + voice.phase * 60;
        ctx.beginPath();
        ctx.moveTo(x - crossbarWidth, centerY);
        ctx.lineTo(x + crossbarWidth, centerY);
        ctx.stroke();
    });

    // ACTIVE NOTES - Particles emanating from center (Fantasia style)
    if (activeNotes > 0) {
        for (let i = 0; i < activeNotes; i++) {
            const particleAngle = (i / activeNotes) * Math.PI * 2 + time * 2;
            const particleRadius = 40 + Math.sin(time * 3 + i) * 20;
            const px = centerX + Math.cos(particleAngle) * particleRadius;
            const py = centerY + Math.sin(particleAngle) * particleRadius;

            const size = 2 + Math.sin(time * 5 + i) * 2;
            const particleOpacity = 0.4 + Math.sin(time * 4 + i) * 0.3;

            ctx.fillStyle = `rgba(255, 255, 255, ${particleOpacity})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();

            // Connect to center with thin line
            ctx.strokeStyle = `rgba(255, 255, 255, ${particleOpacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(px, py);
            ctx.stroke();
        }
    }

    // Central pulse (conductor)
    const pulseSize = 8 + Math.sin(time * 2) * 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring for central pulse
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize + 10, 0, Math.PI * 2);
    ctx.stroke();

    requestAnimationFrame(render);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════════

function update() {
    if (!running || paused) return;

    const now = Date.now();
    const dt = 50;

    voices.forEach(v => v.update(dt));

    // Weather engine - DISABLED (atmospheric sounds not working as intended)
    // checkWindWeather();
    // checkLeavesWeather();
    // checkWaterWeather();
    // checkChimeWeather();

    updateUI();

    setTimeout(update, 50);
}

function updateUI() {
    const elapsed = (Date.now() - startTime - totalPausedDuration) / 1000;
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);

    document.getElementById('elapsed').textContent =
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('key').textContent = rootName;
    document.getElementById('mode').textContent = scaleName;
    document.getElementById('active-voices').textContent = activeNotes;
    document.getElementById('voice-count').textContent = voices.length;
}

function start() {
    document.getElementById('overlay').classList.add('hidden');

    if (!canvas) initCanvas();
    initAudio();
    generateScale();
    generateVoices();

    running = true;
    paused = false;
    startTime = Date.now();
    totalPausedDuration = 0;

    // Initialize weather engine timers
    const now = Date.now();
    lastWindTime = now;
    lastLeavesTime = now;
    lastWaterTime = now;
    lastChimeTime = now;

    document.getElementById('pauseBtn').textContent = 'PAUSE';

    update();
    render();
}

function stop() {
    running = false;
    paused = false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

document.getElementById('startBtn').addEventListener('click', start);

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (!running) return;

    if (paused) {
        paused = false;
        totalPausedDuration += Date.now() - pausedTime;
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        document.getElementById('pauseBtn').textContent = 'pause';
        update();
    } else {
        paused = true;
        pausedTime = Date.now();
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
        document.getElementById('pauseBtn').textContent = 'resume';
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    if (!running && !paused) return;
    stop();
    setTimeout(start, 300);
});

// Volume slider
document.getElementById('volumeSlider').addEventListener('input', (e) => {
    if (masterGain) {
        // Map 0-100 slider to 0-4.0 gain (4.0 is our streaming-service max)
        masterGain.gain.value = (parseFloat(e.target.value) / 100) * 4.0;
    }
});

// Keyboard
document.addEventListener('keydown', (e) => {
    if (!running && !paused) return;

    switch(e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            document.getElementById('pauseBtn').click();
            break;
        case 'r':
            e.preventDefault();
            document.getElementById('restartBtn').click();
            break;
    }
});

// Keep audio running in background
document.addEventListener('visibilitychange', () => {
    if (running && audioCtx) {
        if (!document.hidden && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (document.hidden && !paused && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }
});

setInterval(() => {
    if (running && !paused && audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
}, 1000);

// Initialize canvas on page load
window.addEventListener('DOMContentLoaded', () => {
    initCanvas();
});
