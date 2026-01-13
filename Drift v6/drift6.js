// ═══════════════════════════════════════════════════════════════════════════════
// DRIFT v6 — STELLAR DEPARTURE
//
// Explorers leave a home star, traveling to distant points of light.
// Each star plays a note. Chords and melodies emerge organically.
//
// Inspired by: Brian Eno, Harumi Hosono, Disasterpeace (Fez, HLD), Gorogoa
// ═══════════════════════════════════════════════════════════════════════════════

const DURATION = 5 * 60 * 1000; // 5 minutes

// Pentatonic and modal scales - Eno/Hosono/Disasterpeace inspired
const SCALES = {
    'Ryukyu': [0, 4, 5, 7, 11],           // Okinawan pentatonic (Hosono)
    'Minor Pent': [0, 3, 5, 7, 10],       // Classic minor pentatonic
    'Major Pent': [0, 2, 4, 7, 9],        // Bright pentatonic
    'Hirajoshi': [0, 2, 3, 7, 8],         // Japanese scale
    'In Sen': [0, 1, 5, 7, 10],           // Japanese scale
    'Dorian': [0, 2, 3, 5, 7, 9, 10],     // Modal (Fez-like)
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10]  // Pastoral
};

const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ═══════════════════════════════════════════════════════════════════════════════
// PHASES - 5 Minute Arc
// ═══════════════════════════════════════════════════════════════════════════════

const PHASES = [
    { name: 'Awakening', start: 0, dur: 45000, explorers: 1, interval: 8000, density: 0.35 },
    { name: 'Expansion', start: 45000, dur: 60000, explorers: 3, interval: 5000, density: 0.55 },
    { name: 'Flourishing', start: 105000, dur: 90000, explorers: 5, interval: 3500, density: 0.75 },
    { name: 'Reflection', start: 195000, dur: 60000, explorers: 3, interval: 5000, density: 0.5 },
    { name: 'Return', start: 255000, dur: 45000, explorers: 1, interval: 8000, density: 0.25 }
];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

let canvas, ctx;
let W, H, cx, cy, radius;

// Audio
let audioCtx, masterGain, compressor, reverb, delay;
let rootMidi = 36;
let rootName = 'C';
let scaleName = 'Ryukyu';
let scale = [];
let activeVoices = 0;

// Explorers and Stars
let homeStar = null;
let stars = [];
let explorers = [];
let nextExplorerId = 0;

// Timing
let running = false;
let paused = false;
let startTime = 0;
let pausedTime = 0;
let totalPausedDuration = 0;
let lastSpawnTime = 0;
let currentPhaseIndex = 0;
let lastUpdateTime = 0;
let updateInterval = null;

// Ambient pads
let padVoices = [];
let lastPadTime = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[randInt(0, arr.length - 1)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function rgb(r, g, b, a = 1) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function getCurrentPhase() {
    const elapsed = Date.now() - startTime - totalPausedDuration;
    for (let i = PHASES.length - 1; i >= 0; i--) {
        if (elapsed >= PHASES[i].start) {
            return { index: i, phase: PHASES[i], elapsed: elapsed - PHASES[i].start };
        }
    }
    return { index: 0, phase: PHASES[0], elapsed: 0 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;

    // Compressor for glue
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 30;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Shimmer reverb
    reverb = createReverb(5, 2.5);
    const reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.5;

    // Tape delay (prominent like HLD)
    delay = audioCtx.createDelay(2);
    delay.delayTime.value = 0.375; // Dotted eighth
    const delayFeedback = audioCtx.createGain();
    delayFeedback.gain.value = 0.45; // More feedback for longer tail
    const delayMix = audioCtx.createGain();
    delayMix.gain.value = 0.4; // More prominent mix
    const delayFilter = audioCtx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2400; // Slightly brighter

    // Delay routing (tape-style feedback)
    delay.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(delayMix);

    // Main routing
    masterGain.connect(reverb);
    masterGain.connect(delay);
    masterGain.connect(compressor);
    reverb.connect(reverbGain);
    reverbGain.connect(compressor);
    delayMix.connect(compressor);
    compressor.connect(audioCtx.destination);
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
    rootMidi = 24 + randInt(0, 11);
    rootName = ROOT_NOTES[rootMidi % 12];
    scaleName = pick(Object.keys(SCALES));
    const intervals = SCALES[scaleName];

    scale = [];
    for (let octave = 0; octave < 5; octave++) {
        intervals.forEach(interval => {
            const midi = rootMidi + (octave * 12) + interval;
            if (midi >= 24 && midi <= 96) {
                scale.push(midi);
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND GENERATION - Disasterpeace style variety
// ═══════════════════════════════════════════════════════════════════════════════

// Core note player - used by all types
function playNote(midi, star, age, delay = 0, gain = 0.08, dur = null) {
    if (!audioCtx || activeVoices >= 20) return;

    activeVoices++;

    const freq = midiToFreq(midi);
    const now = audioCtx.currentTime + delay;
    const noteDur = dur || rand(1.2, 2.8);

    // Age affects timbre
    const brightness = clamp(1 - age / 8, 0.4, 1);
    const attack = 0.015 + age * 0.025 + rand(-0.005, 0.005);
    const release = 0.5 + age * 0.3 + rand(-0.1, 0.1);

    // Multi-oscillator warmth
    const detunes = [-8, 0, 8];
    const oscillators = [];

    detunes.forEach((detune, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = age < 3 ? 'sine' : (age < 6 ? 'triangle' : 'square');
        osc.frequency.value = freq;
        osc.detune.value = detune + rand(-4, 4); // More pitch variance

        const env = audioCtx.createGain();
        const noteGain = (gain / detunes.length) * (1 - i * 0.2) * rand(0.9, 1.1);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(noteGain, now + attack);
        env.gain.linearRampToValueAtTime(noteGain * 0.6, now + attack + 0.1);
        env.gain.setValueAtTime(noteGain * 0.6, now + noteDur - release);
        env.gain.exponentialRampToValueAtTime(0.001, now + noteDur);

        // Warm filtering
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq * (3 + brightness * 5);
        filter.Q.value = 0.7 + brightness * 1.5;

        // Pan based on position
        const panner = audioCtx.createStereoPanner();
        const panAmount = (star.x - cx) / radius;
        panner.pan.value = clamp(panAmount * 0.7 + rand(-0.1, 0.1), -0.9, 0.9);

        osc.connect(env);
        env.connect(filter);
        filter.connect(panner);
        panner.connect(masterGain);

        osc.start(now);
        osc.stop(now + noteDur);
        oscillators.push(osc);
    });

    oscillators[0].onended = () => activeVoices--;
}

// Single note - simple and clean
function playSingleNote(star, age) {
    playNote(star.midi, star, age);
}

// Chord - 3-4 notes with slight arpeggiation (Hyper Light Drifter style)
function playChord(star, age) {
    const chordSize = randInt(3, 4);
    const baseMidi = star.midi;

    // Build chord intervals (thirds, fourths, fifths)
    const intervals = [0];
    const possibleIntervals = [3, 4, 5, 7, 9, 12];

    for (let i = 1; i < chordSize; i++) {
        intervals.push(pick(possibleIntervals));
    }

    // Play with humanized arpeggiation
    intervals.forEach((interval, i) => {
        const midi = baseMidi + interval;
        const arpDelay = i * rand(0.015, 0.045); // Loose timing
        const chordGain = 0.055;
        playNote(midi, star, age, arpDelay, chordGain, rand(2.5, 4));
    });
}

// Arpeggio - melodic sequence (4-6 notes)
function playArpeggio(star, age) {
    const noteCount = randInt(4, 6);
    const baseMidi = star.midi;
    const scaleIndex = scale.indexOf(baseMidi);

    // Build melodic pattern from scale
    const pattern = [0];
    for (let i = 1; i < noteCount; i++) {
        const step = pick([1, 2, 3, -1]); // Mostly upward
        const newIndex = clamp(scaleIndex + step * i, 0, scale.length - 1);
        pattern.push(scale[newIndex] - baseMidi);
    }

    // Play with rhythmic variation
    let totalTime = 0;
    pattern.forEach((interval, i) => {
        const midi = baseMidi + interval;
        const noteTiming = rand(0.08, 0.16); // Variable note spacing
        const noteDur = rand(0.3, 0.6);
        playNote(midi, star, age, totalTime, 0.07, noteDur);
        totalTime += noteTiming;
    });
}

// Ostinato - short repeating pattern (2-4 notes, repeats 2-3 times)
function playOstinato(star, age) {
    const patternLength = randInt(2, 4);
    const repeats = randInt(2, 3);
    const baseMidi = star.midi;
    const scaleIndex = scale.indexOf(baseMidi);

    // Create pattern
    const pattern = [0];
    for (let i = 1; i < patternLength; i++) {
        const step = pick([1, 2, -1, 0]); // Can repeat notes
        const newIndex = clamp(scaleIndex + step, 0, scale.length - 1);
        pattern.push(scale[newIndex] - baseMidi);
    }

    // Play repeating pattern with slight variation each time
    let totalTime = 0;
    const baseInterval = rand(0.12, 0.18);

    for (let rep = 0; rep < repeats; rep++) {
        pattern.forEach((interval, i) => {
            const midi = baseMidi + interval;
            const humanTiming = baseInterval + rand(-0.01, 0.01);
            const noteDur = rand(0.25, 0.4);
            const gainVar = 0.065 * rand(0.85, 1.15); // Volume variation
            playNote(midi, star, age, totalTime, gainVar, noteDur);
            totalTime += humanTiming;
        });
    }
}

// Ambient pad chords (plays underneath occasionally) - Disasterpeace style
function playPad() {
    if (!audioCtx) return;
    const now = Date.now();

    // Variable timing between pads
    const minInterval = 10000 + rand(-2000, 4000);
    if (now - lastPadTime < minInterval) return;
    lastPadTime = now;

    const { phase } = getCurrentPhase();

    // Probability based on phase - more sparse
    if (Math.random() > phase.density * 0.6) return;

    const t = audioCtx.currentTime;
    const dur = rand(12, 20); // Variable duration

    // Pick 3-4 notes from scale for a chord
    const chordSize = randInt(3, 4);
    const chordNotes = [];
    for (let i = 0; i < chordSize; i++) {
        const index = randInt(0, Math.min(scale.length - 1, 12)); // Lower register
        chordNotes.push(scale[index]);
    }

    chordNotes.forEach((midi, i) => {
        const freq = midiToFreq(midi);
        const noteDelay = rand(0, 0.15); // Slight stagger

        // Two detuned oscillators per note
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = freq;
        osc2.frequency.value = freq;
        osc1.detune.value = -12 + rand(-2, 2);
        osc2.detune.value = 12 + rand(-2, 2);

        const env = audioCtx.createGain();
        const gain = (0.016 + rand(-0.003, 0.003)) * (1 - i * 0.15);
        const attack = 2.5 + rand(-0.5, 1);
        const release = 3.5 + rand(-0.5, 1);

        env.gain.setValueAtTime(0, t + noteDelay);
        env.gain.linearRampToValueAtTime(gain, t + noteDelay + attack);
        env.gain.setValueAtTime(gain, t + noteDelay + dur - release);
        env.gain.exponentialRampToValueAtTime(0.001, t + noteDelay + dur);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = freq * 2.5;
        filter.Q.value = 0.4;

        osc1.connect(env);
        osc2.connect(env);
        env.connect(filter);
        filter.connect(masterGain);

        osc1.start(t + noteDelay);
        osc2.start(t + noteDelay);
        osc1.stop(t + noteDelay + dur);
        osc2.stop(t + noteDelay + dur);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class Star {
    constructor(x, y, midi, distance) {
        this.x = x;
        this.y = y;
        this.midi = midi;
        this.distance = distance; // 0 = home, higher = farther
        this.brightness = distance === 0 ? 1 : 0.2;
        this.size = distance === 0 ? 8 : rand(1.5, 4);
        this.pulse = 0;
        this.lastTriggered = 0;
        this.neighbors = []; // Connected stars
        this.visited = distance === 0; // Home is pre-visited

        // Musical character - Disasterpeace style variety
        this.type = this.assignType();
        this.voiceProbability = rand(0.5, 1); // Some stars are quieter/sparser
    }

    assignType() {
        const r = Math.random();
        if (this.distance === 0) return 'chord'; // Home is always a chord
        if (r < 0.4) return 'single';     // 40% single notes
        if (r < 0.65) return 'chord';     // 25% chords
        if (r < 0.85) return 'arpeggio';  // 20% arpeggios
        return 'ostinato';                // 15% ostinatos
    }

    trigger() {
        this.pulse = 1;
        this.brightness = 1;
        this.visited = true;
        this.lastTriggered = Date.now();

        // Probability-based triggering - not every hit makes sound
        const { phase } = getCurrentPhase();
        if (Math.random() > phase.density * this.voiceProbability) return;

        // Human timing - slight delay before sound
        const humanDelay = rand(5, 40);

        setTimeout(() => {
            this.playSound(Math.floor(this.distance));
        }, humanDelay);
    }

    playSound(age) {
        switch(this.type) {
            case 'single':
                playSingleNote(this, age);
                break;
            case 'chord':
                playChord(this, age);
                break;
            case 'arpeggio':
                playArpeggio(this, age);
                break;
            case 'ostinato':
                playOstinato(this, age);
                break;
        }
    }

    update(dt) {
        this.pulse *= 0.92;
        const timeSince = Date.now() - this.lastTriggered;
        const targetBright = this.distance === 0 ? 0.8 : (timeSince < 2000 ? 0.8 : 0.2);
        this.brightness = lerp(this.brightness, targetBright, 0.05);
    }

    draw() {
        const size = this.size * (1 + this.pulse * 0.5);
        const bright = this.brightness + this.pulse * 0.3;

        // Glow
        const glowSize = size * (3 + this.pulse * 2);
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        grad.addColorStop(0, rgb(255, 255, 255, bright * 0.6));
        grad.addColorStop(0.5, rgb(200, 220, 255, bright * 0.2));
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fillStyle = rgb(255, 255, 255, bright);
        ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLORER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class Explorer {
    constructor(id) {
        this.id = id;
        this.currentStar = homeStar;
        this.targetStar = null;
        this.x = homeStar.x;
        this.y = homeStar.y;

        this.traveling = false;
        this.travelProgress = 0;
        this.travelSpeed = 0.0008; // Slow, contemplative movement

        this.path = []; // Visual trail
        this.maxDepth = 0;
        this.alpha = 0;
        this.age = 0;
    }

    update(dt) {
        this.age += dt;
        this.alpha = Math.min(1, this.age / 2000);

        if (!this.traveling) {
            // Pick next star to visit
            this.pickNextStar();
        }

        if (this.traveling && this.targetStar) {
            // Move toward target star
            this.travelProgress += this.travelSpeed * dt;

            if (this.travelProgress >= 1) {
                // Arrived at target
                this.currentStar = this.targetStar;
                this.x = this.currentStar.x;
                this.y = this.currentStar.y;
                this.traveling = false;
                this.travelProgress = 0;

                // Trigger the star
                this.currentStar.trigger();
                this.maxDepth = Math.max(this.maxDepth, this.currentStar.distance);
            } else {
                // Interpolate position
                const t = this.easeInOut(this.travelProgress);
                this.x = lerp(this.currentStar.x, this.targetStar.x, t);
                this.y = lerp(this.currentStar.y, this.targetStar.y, t);
            }
        }

        // Add to trail
        if (this.alpha > 0.1) {
            this.path.push({x: this.x, y: this.y});
            if (this.path.length > 100) this.path.shift();
        }
    }

    pickNextStar() {
        // Find unvisited neighbors, prefer outward movement
        let candidates = this.currentStar.neighbors.filter(s =>
            !s.visited && s.distance >= this.currentStar.distance
        );

        // If no outward unvisited, allow any unvisited
        if (candidates.length === 0) {
            candidates = this.currentStar.neighbors.filter(s => !s.visited);
        }

        // If all visited, allow revisiting but prefer outward
        if (candidates.length === 0) {
            candidates = this.currentStar.neighbors.filter(s =>
                s.distance > this.currentStar.distance
            );
        }

        // Last resort: any neighbor
        if (candidates.length === 0) {
            candidates = this.currentStar.neighbors;
        }

        if (candidates.length > 0) {
            this.targetStar = pick(candidates);
            this.traveling = true;
            this.travelProgress = 0;
        }
    }

    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    draw() {
        if (this.alpha < 0.01) return;

        // Trail - smooth line through path
        if (this.path.length > 1) {
            ctx.strokeStyle = `rgba(180, 200, 255, ${this.alpha * 0.4})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const startIdx = Math.max(0, this.path.length - 60);
            ctx.moveTo(this.path[startIdx].x, this.path[startIdx].y);
            for (let i = startIdx + 1; i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            ctx.stroke();
        }

        // Explorer glow
        const glowSize = 8;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
        grad.addColorStop(0, `rgba(200, 220, 255, ${this.alpha * 0.8})`);
        grad.addColorStop(0.5, `rgba(180, 200, 255, ${this.alpha * 0.4})`);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Explorer dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALAXY GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateGalaxy() {
    stars = [];

    // Home star at center
    homeStar = new Star(cx, cy, rootMidi, 0);
    stars.push(homeStar);

    // Generate stars in shells radiating outward
    const numShells = 8;
    for (let shell = 1; shell <= numShells; shell++) {
        const shellRadius = (shell / numShells) * radius * 0.9;
        const starsInShell = 8 + shell * 4;

        for (let i = 0; i < starsInShell; i++) {
            const angle = (i / starsInShell) * Math.PI * 2 + rand(-0.2, 0.2);
            const r = shellRadius + rand(-radius * 0.04, radius * 0.04);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            // Pitch based on position - X determines scale degree, shell affects octave
            const xNorm = (x - (cx - radius)) / (radius * 2);
            const scaleIndex = Math.floor(xNorm * scale.length);
            const midi = scale[clamp(scaleIndex, 0, scale.length - 1)];

            const star = new Star(x, y, midi, shell);
            stars.push(star);
        }
    }

    // Build connections between stars
    stars.forEach(star => {
        // Find nearby stars in same or adjacent shells
        const candidates = stars.filter(other => {
            if (other === star) return false;
            const d = dist(star.x, star.y, other.x, other.y);
            const shellDiff = Math.abs(star.distance - other.distance);
            return shellDiff <= 1 && d < radius * 0.25;
        });

        // Sort by distance and connect to closest
        candidates.sort((a, b) =>
            dist(star.x, star.y, a.x, a.y) - dist(star.x, star.y, b.x, b.y)
        );

        star.neighbors = candidates.slice(0, 5);
    });

    // Ensure home star connects to first shell
    const shell1 = stars.filter(s => s.distance === 1);
    shell1.sort((a, b) =>
        dist(homeStar.x, homeStar.y, a.x, a.y) - dist(homeStar.x, homeStar.y, b.x, b.y)
    );
    homeStar.neighbors = shell1.slice(0, 6);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════════

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
    radius = Math.min(W, H) * 0.42;
}

function updateLogic() {
    if (!running || paused) return;

    const now = Date.now();
    const dt = now - lastUpdateTime;
    lastUpdateTime = now;

    // Update phase
    const phaseInfo = getCurrentPhase();
    if (phaseInfo.index !== currentPhaseIndex) {
        currentPhaseIndex = phaseInfo.index;
        console.log(`Phase: ${phaseInfo.phase.name}`);
    }
    const phase = phaseInfo.phase;

    // Spawn explorers
    if (now - lastSpawnTime > phase.interval) {
        if (explorers.length < phase.explorers) {
            explorers.push(new Explorer(nextExplorerId++));
            lastSpawnTime = now;
        }
    }

    // Remove excess explorers
    while (explorers.length > phase.explorers) {
        explorers.shift();
    }

    // Update
    stars.forEach(s => s.update(dt));
    explorers.forEach(e => e.update(dt));

    // Occasionally play ambient pad
    playPad();

    // Update UI
    updateUI();
}

function render() {
    if (!running) return;

    // Draw
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, W, H);

    // Draw connections between connected stars
    ctx.lineWidth = 1;
    stars.forEach(star => {
        star.neighbors.forEach(neighbor => {
            // Only draw each connection once
            if (stars.indexOf(star) < stars.indexOf(neighbor)) {
                const bothVisited = star.visited && neighbor.visited;
                const alpha = bothVisited ? 0.15 : 0.03;
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(neighbor.x, neighbor.y);
                ctx.stroke();
            }
        });
    });

    stars.forEach(s => s.draw());
    explorers.forEach(e => e.draw());

    requestAnimationFrame(render);
}

function updateUI() {
    const elapsed = Date.now() - startTime - totalPausedDuration;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);

    const maxDepth = explorers.length > 0 ? Math.max(...explorers.map(e => e.maxDepth)) : 0;

    document.getElementById('root').textContent = rootName;
    document.getElementById('time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('explorers').textContent = explorers.length;
    document.getElementById('depth').textContent = maxDepth;
    document.getElementById('phase').textContent = PHASES[currentPhaseIndex].name;
    document.getElementById('mode').textContent = scaleName;
    document.getElementById('voices').textContent = activeVoices;
}

function start() {
    document.getElementById('overlay').classList.add('hidden');

    initAudio();
    generateScale();
    generateGalaxy();

    explorers = [];
    nextExplorerId = 0;
    currentPhaseIndex = 0;
    running = true;
    paused = false;
    startTime = Date.now();
    lastSpawnTime = startTime;
    lastUpdateTime = startTime;
    totalPausedDuration = 0;

    document.getElementById('pauseBtn').textContent = 'pause';

    // Start logic updates (runs at ~60fps even in background)
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateLogic, 16);

    // Start rendering loop
    render();
}

function stop() {
    running = false;
    paused = false;
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');

window.addEventListener('resize', resize);
resize();

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

document.getElementById('startBtn').addEventListener('click', start);

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (!running) return;

    if (paused) {
        paused = false;
        totalPausedDuration += Date.now() - pausedTime;
        lastUpdateTime = Date.now(); // Reset to prevent large dt jump
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        document.getElementById('pauseBtn').textContent = 'pause';
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

document.getElementById('volumeSlider').addEventListener('input', (e) => {
    if (masterGain) {
        masterGain.gain.value = e.target.value / 100;
    }
});

// Keyboard
document.addEventListener('keydown', (e) => {
    if (!running && !paused) return;

    switch(e.key.toLowerCase()) {
        case ' ':
        case 'p':
            e.preventDefault();
            document.getElementById('pauseBtn').click();
            break;
        case 'r':
            e.preventDefault();
            document.getElementById('restartBtn').click();
            break;
        case 'arrowup':
            e.preventDefault();
            const vol1 = parseInt(document.getElementById('volumeSlider').value);
            document.getElementById('volumeSlider').value = Math.min(100, vol1 + 5);
            document.getElementById('volumeSlider').dispatchEvent(new Event('input'));
            break;
        case 'arrowdown':
            e.preventDefault();
            const vol2 = parseInt(document.getElementById('volumeSlider').value);
            document.getElementById('volumeSlider').value = Math.max(0, vol2 - 5);
            document.getElementById('volumeSlider').dispatchEvent(new Event('input'));
            break;
    }
});

document.addEventListener('visibilitychange', () => {
    if (running && audioCtx) {
        // Resume audio when returning to tab
        if (!document.hidden && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        // Keep audio running even when tab goes to background (unless paused)
        if (document.hidden && !paused && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }
});

// Additional safeguard: periodically check if audio context needs resuming
setInterval(() => {
    if (running && !paused && audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(err => {
            // Silently catch any errors (e.g., if user hasn't interacted yet)
        });
    }
}, 1000);
