// ═══════════════════════════════════════════════════════════════════════════════
// DRIFT v6 — Stellar Round
// 
// A generative ambient piece structured as a building round/canon.
//
// STRUCTURE:
// - Galaxy generated in a random KEY (root + mode)
// - Stars randomly distributed, each assigned a pitch from the mode (8 octaves)
// - A CLOCK pulse drives everything
// - Each pulse: root note plays, all explorers move one step outward
// - New explorer spawns every few pulses until 5 explorers exist
// - Creates a ritualistic, Eno-esque layered round
// ═══════════════════════════════════════════════════════════════════════════════

const DURATION = 5 * 60 * 1000; // 5 minutes

// ═══════════════════════════════════════════════════════════════════════════════
// MUSICAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Modes - intervals from root
const MODES = {
    'Ionian':     [0, 2, 4, 5, 7, 9, 11],      // Major
    'Dorian':     [0, 2, 3, 5, 7, 9, 10],
    'Phrygian':   [0, 1, 3, 5, 7, 8, 10],
    'Lydian':     [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'Aeolian':    [0, 2, 3, 5, 7, 8, 10],      // Natural minor
    'Locrian':    [0, 1, 3, 5, 6, 8, 10],
};

const MODE_NAMES = Object.keys(MODES);
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Star timbres - each star will have one of these
const TIMBRES = [
    {
        name: 'Bell',
        color: [100, 180, 255],
        waveform: 'sine',
        harmonics: [1, 2.4, 4.2],      // Frequency multipliers
        harmonicGains: [1, 0.3, 0.1],  // Relative loudness
        attack: 0.01,
        decay: 0.3,
        sustain: 0.4,
        release: 4,
        filterMult: 6,
        filterQ: 1
    },
    {
        name: 'Glass',
        color: [180, 255, 200],
        waveform: 'sine',
        harmonics: [1, 3, 5],
        harmonicGains: [1, 0.25, 0.08],
        attack: 0.005,
        decay: 0.1,
        sustain: 0.2,
        release: 5,
        filterMult: 8,
        filterQ: 0.5
    },
    {
        name: 'Pad',
        color: [255, 180, 200],
        waveform: 'sawtooth',
        harmonics: [1],
        harmonicGains: [1],
        attack: 1.5,
        decay: 0.5,
        sustain: 0.6,
        release: 3,
        filterMult: 2,
        filterQ: 1
    },
    {
        name: 'Chime',
        color: [255, 220, 140],
        waveform: 'sine',
        harmonics: [1, 2.2, 3.8],
        harmonicGains: [1, 0.35, 0.12],
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 6,
        filterMult: 5,
        filterQ: 0.7
    },
    {
        name: 'Hum',
        color: [200, 160, 255],
        waveform: 'sine',
        harmonics: [1, 2],
        harmonicGains: [1, 0.15],
        attack: 2,
        decay: 1,
        sustain: 0.7,
        release: 4,
        filterMult: 1.5,
        filterQ: 2
    },
    {
        name: 'Pluck',
        color: [140, 255, 220],
        waveform: 'triangle',
        harmonics: [1, 2, 3],
        harmonicGains: [1, 0.5, 0.2],
        attack: 0.002,
        decay: 0.15,
        sustain: 0.1,
        release: 2.5,
        filterMult: 4,
        filterQ: 1.5
    },
    {
        name: 'Drone',
        color: [255, 140, 140],
        waveform: 'sine',
        harmonics: [1, 1.5, 2],
        harmonicGains: [1, 0.4, 0.3],
        attack: 3,
        decay: 1,
        sustain: 0.8,
        release: 5,
        filterMult: 1.2,
        filterQ: 3
    },
    {
        name: 'Shimmer',
        color: [220, 200, 255],
        waveform: 'sine',
        harmonics: [1, 2, 4, 6],
        harmonicGains: [1, 0.2, 0.15, 0.05],
        attack: 0.5,
        decay: 0.3,
        sustain: 0.5,
        release: 7,
        filterMult: 10,
        filterQ: 0.3
    }
];

// Explorer colors (neutral - just for visual tracking)
const EXPLORER_COLORS = [
    [255, 255, 255],  // White
    [255, 230, 200],  // Warm white
    [200, 220, 255],  // Cool white
    [255, 220, 220],  // Pink white
    [220, 255, 220],  // Green white
];

const MAX_EXPLORERS = 5;
const NUM_RINGS = 8; // 8 octaves worth of distance

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

let canvas, ctx;
let W, H, cx, cy;
let maxRadius;

let audioCtx, masterGain, reverb;

// Musical state
let rootNote = 0;      // 0-11 (C to B)
let rootMidi = 48;     // Middle octave root
let mode = [];
let modeName = '';
let scale = [];        // All pitches in the mode across 8 octaves

// Timing
let running = false;
let startTime = 0;
let lastTime = 0;
let pulseCount = 0;
let lastPulseTime = 0;
let pulseInterval = 8000; // ms between pulses - very slow, ritualistic
let currentPulseRadius = 0; // Current radius of expanding pulse wave

// Galaxy
let stars = [];
let homeStar = null;
let explorers = [];
let activeVoices = 0;

// Track which explorers have been triggered this pulse
let triggeredThisPulse = new Set();

// Mouse / hover
let mouseX = 0, mouseY = 0;
let hoveredStar = null;

// Background tab timing
let lastTickTime = 0;
let tickInterval = null;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const rand = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
const pick = arr => arr[randInt(0, arr.length - 1)];

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToName(midi) {
    return NOTE_NAMES[midi % 12] + Math.floor(midi / 12 - 1);
}

function rgb(r, g, b, a = 1) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCALE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateScale() {
    // Pick random root and mode
    rootNote = randInt(0, 11);
    modeName = pick(MODE_NAMES);
    mode = MODES[modeName];
    
    // Root MIDI - middle of our range (C3 = 48)
    rootMidi = 48 + rootNote;
    
    // Build scale across 8 octaves (4 below root, 4 above)
    scale = [];
    for (let octave = -4; octave <= 4; octave++) {
        mode.forEach(interval => {
            const midi = rootMidi + (octave * 12) + interval;
            if (midi >= 24 && midi <= 96) { // Keep in reasonable range
                scale.push(midi);
            }
        });
    }
    
    // Sort and remove duplicates
    scale = [...new Set(scale)].sort((a, b) => a - b);
    
    // Find index of root in middle octave
    const rootIndex = scale.indexOf(rootMidi);
    
    return rootIndex;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class Star {
    constructor(x, y, midi, ring) {
        this.x = x;
        this.y = y;
        this.midi = midi;
        this.ring = ring; // Distance tier from center (0 = home)
        
        // Each star has its own timbre/instrument
        this.timbre = ring === 0 ? null : pick(TIMBRES);
        
        // Visual - color based on timbre
        this.size = ring === 0 ? 12 : rand(2, 5);
        this.color = ring === 0 ? [255, 240, 200] : this.timbre.color;
        this.brightness = ring === 0 ? 1 : 0.3;
        this.pulse = 0;
        this.twinkle = rand(0, Math.PI * 2);
        
        // Connections
        this.neighbors = [];
        
        // State
        this.visited = ring === 0;
    }
    
    update(dt) {
        this.twinkle += 0.002 * dt;
        this.pulse *= 0.93;
        
        // Brightness
        const base = this.visited ? 0.8 : 0.25;
        const twinkleAmt = this.visited ? 0.1 : 0.15;
        this.brightness = lerp(this.brightness, base + Math.sin(this.twinkle) * twinkleAmt, 0.05);
    }
    
    trigger() {
        this.pulse = 1;
        this.visited = true;
    }
    
    // Play this star's sound using its own timbre
    play(pan) {
        if (!this.timbre || activeVoices >= 10) return;
        playStar(this, pan);
    }
    
    draw() {
        const size = this.size * (1 + this.pulse * 0.6);
        const bright = this.brightness + this.pulse * 0.4;
        const col = this.color;
        
        // Glow - tinted by star's color
        if (this.visited || this.pulse > 0.1) {
            const glowSize = size * (4 + this.pulse * 4);
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
            grad.addColorStop(0, rgb(col[0], col[1], col[2], bright * 0.6));
            grad.addColorStop(0.5, rgb(col[0] * 0.7, col[1] * 0.7, col[2] * 0.7, bright * 0.2));
            grad.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }
        
        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = rgb(
            lerp(255, col[0], 0.3),
            lerp(255, col[1], 0.3),
            lerp(255, col[2], 0.3),
            bright
        );
        ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GALAXY GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateGalaxy() {
    stars = [];
    
    const rootScaleIndex = generateScale();
    
    // Home star at center - the root note in middle octave
    homeStar = new Star(cx, cy, rootMidi, 0);
    stars.push(homeStar);
    
    // Generate stars in rings radiating outward
    // Each ring represents roughly one octave of distance
    for (let ring = 1; ring <= NUM_RINGS; ring++) {
        const ringRadius = (ring / NUM_RINGS) * maxRadius * 0.95;
        const starsInRing = 8 + ring * 3; // More stars
        
        for (let i = 0; i < starsInRing; i++) {
            // Random angle with some jitter
            const baseAngle = (i / starsInRing) * Math.PI * 2;
            const angle = baseAngle + rand(-0.3, 0.3);
            
            // Random radius within ring band
            const r = ringRadius + rand(-maxRadius * 0.04, maxRadius * 0.04);
            
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            // Assign pitch - further rings get pitches further from root
            // Ring 1-2: close intervals, Ring 7-8: far intervals
            const scaleRange = Math.floor(scale.length / 2);
            const minIndex = Math.max(0, rootScaleIndex - scaleRange + Math.floor((ring - 1) * scaleRange / NUM_RINGS));
            const maxIndex = Math.min(scale.length - 1, rootScaleIndex + scaleRange - Math.floor((NUM_RINGS - ring) * scaleRange / NUM_RINGS));
            
            const pitchIndex = randInt(minIndex, maxIndex);
            const midi = scale[pitchIndex] || rootMidi;
            
            const star = new Star(x, y, midi, ring);
            stars.push(star);
        }
    }
    
    // Build connections - each star connects to nearby stars in same or adjacent rings
    stars.forEach(star => {
        const candidates = stars.filter(other => {
            if (other === star) return false;
            const d = dist(star.x, star.y, other.x, other.y);
            const ringDiff = Math.abs(star.ring - other.ring);
            return ringDiff <= 1 && d < maxRadius * 0.25;
        });
        
        // Sort by distance and keep closest
        candidates.sort((a, b) => dist(star.x, star.y, a.x, a.y) - dist(star.x, star.y, b.x, b.y));
        star.neighbors = candidates.slice(0, 5);
    });
    
    // Ensure home connects to several ring 1 stars
    const ring1 = stars.filter(s => s.ring === 1);
    ring1.sort((a, b) => dist(homeStar.x, homeStar.y, a.x, a.y) - dist(homeStar.x, homeStar.y, b.x, b.y));
    homeStar.neighbors = ring1.slice(0, 6);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPLORER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class Explorer {
    constructor(id) {
        this.id = id;
        // Explorers are neutral - just have a color for visual tracking
        this.color = EXPLORER_COLORS[id % EXPLORER_COLORS.length];
        
        this.currentStar = homeStar;
        this.targetStar = null;
        this.x = homeStar.x;
        this.y = homeStar.y;
        
        // Path history
        this.path = [homeStar];
        this.maxRingReached = 0;
        
        // Animation
        this.traveling = false;
        this.travelProgress = 0;
        this.alpha = 0;
        
        // Pulse response
        this.respondedToPulse = false;
        this.pulseGlow = 0; // Visual feedback when triggered by pulse
    }
    
    // Get distance from center
    distanceFromCenter() {
        return dist(this.x, this.y, cx, cy);
    }
    
    // Called when pulse wave reaches this explorer
    respondToPulse() {
        if (this.respondedToPulse) return;
        this.respondedToPulse = true;
        this.pulseGlow = 1;
        
        // Play note at current star - the STAR determines the sound
        this.currentStar.trigger();
        const pan = (this.x - cx) / maxRadius * 0.8;
        this.currentStar.play(pan);
    }
    
    // Called at end of pulse - move to next star
    step() {
        if (this.traveling) return; // Still moving from last step
        
        // Find outward neighbors (prefer going further out)
        let candidates = this.currentStar.neighbors.filter(s => 
            s.ring >= this.currentStar.ring && !this.path.slice(-3).includes(s)
        );
        
        // If no outward options, allow lateral or slight backtrack
        if (candidates.length === 0) {
            candidates = this.currentStar.neighbors.filter(s => !this.path.slice(-2).includes(s));
        }
        
        if (candidates.length === 0) {
            candidates = this.currentStar.neighbors;
        }
        
        if (candidates.length > 0) {
            // Prefer outward
            candidates.sort((a, b) => b.ring - a.ring);
            // Pick from top candidates with some randomness
            const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
            this.targetStar = pick(topCandidates);
            this.traveling = true;
            this.travelProgress = 0;
        }
        
        // Reset for next pulse
        this.respondedToPulse = false;
    }
    
    update(dt) {
        this.alpha = lerp(this.alpha, 1, 0.03);
        this.pulseGlow *= 0.95; // Fade pulse glow
        
        if (this.traveling && this.targetStar) {
            // Smooth travel animation - slower movement
            this.travelProgress += 0.0015 * dt;
            
            if (this.travelProgress >= 1) {
                // Arrived
                this.currentStar = this.targetStar;
                this.path.push(this.currentStar);
                this.maxRingReached = Math.max(this.maxRingReached, this.currentStar.ring);
                
                this.x = this.currentStar.x;
                this.y = this.currentStar.y;
                this.traveling = false;
                this.targetStar = null;
            } else {
                // Interpolate
                const t = this.easeInOut(this.travelProgress);
                this.x = lerp(this.path[this.path.length - 1].x, this.targetStar.x, t);
                this.y = lerp(this.path[this.path.length - 1].y, this.targetStar.y, t);
            }
        }
    }
    
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    draw() {
        if (this.alpha < 0.01) return;
        
        const col = this.color;
        const glowBoost = this.pulseGlow;
        
        // Trail to recent path - tinted by current star's color
        if (this.path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.path[Math.max(0, this.path.length - 4)].x, this.path[Math.max(0, this.path.length - 4)].y);
            for (let i = Math.max(0, this.path.length - 3); i < this.path.length; i++) {
                ctx.lineTo(this.path[i].x, this.path[i].y);
            }
            if (this.traveling && this.targetStar) {
                ctx.lineTo(this.x, this.y);
            }
            ctx.strokeStyle = rgb(col[0], col[1], col[2], this.alpha * 0.4);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Explorer glow - enhanced when triggered by pulse
        const glowRadius = 20 + glowBoost * 25;
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        grad.addColorStop(0, rgb(col[0], col[1], col[2], this.alpha * (0.7 + glowBoost * 0.5)));
        grad.addColorStop(0.4, rgb(col[0], col[1], col[2], this.alpha * (0.25 + glowBoost * 0.3)));
        grad.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Core - small dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4 + glowBoost * 3, 0, Math.PI * 2);
        ctx.fillStyle = rgb(255, 255, 255, this.alpha);
        ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════════════════════════

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    
    // Long reverb for ambient sound
    reverb = createReverb(8, 3);
    const reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.5;
    
    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 0.5;
    
    masterGain.connect(dryGain);
    masterGain.connect(reverb);
    reverb.connect(reverbGain);
    dryGain.connect(audioCtx.destination);
    reverbGain.connect(audioCtx.destination);
}

function createReverb(duration, decay) {
    const len = audioCtx.sampleRate * duration;
    const impulse = audioCtx.createBuffer(2, len, audioCtx.sampleRate);
    const L = impulse.getChannelData(0);
    const R = impulse.getChannelData(1);
    
    for (let i = 0; i < len; i++) {
        const t = i / audioCtx.sampleRate;
        const env = Math.pow(1 - t / duration, decay);
        L[i] = (Math.random() * 2 - 1) * env * 0.2;
        R[i] = (Math.random() * 2 - 1) * env * 0.2;
    }
    
    const conv = audioCtx.createConvolver();
    conv.buffer = impulse;
    return conv;
}

function playSound(type, midi, vel, pan) {
    if (!audioCtx) return;
    
    activeVoices++;
    const freq = midiToFreq(midi);
    const now = audioCtx.currentTime;
    
    if (type === 'root') {
        playRoot(freq, vel, pan, now);
    }
}

// Play a star using its own timbre properties
function playStar(star, pan) {
    if (!audioCtx || !star.timbre) return;
    
    activeVoices++;
    const t = star.timbre;
    const freq = midiToFreq(star.midi);
    const now = audioCtx.currentTime;
    const vel = 0.35;
    
    // Calculate total duration from ADSR
    const totalDur = t.attack + t.decay + t.release + rand(0, 2);
    
    // Create oscillators for each harmonic
    const oscillators = [];
    const envelopes = [];
    
    t.harmonics.forEach((harmMult, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = t.waveform;
        osc.frequency.value = freq * harmMult;
        
        const env = audioCtx.createGain();
        const harmGain = t.harmonicGains[i] || 0.1;
        
        // ADSR envelope
        env.gain.setValueAtTime(0, now);
        // Attack
        env.gain.linearRampToValueAtTime(vel * harmGain * 0.4, now + t.attack);
        // Decay to sustain
        env.gain.linearRampToValueAtTime(vel * harmGain * 0.4 * t.sustain, now + t.attack + t.decay);
        // Hold sustain briefly
        env.gain.setValueAtTime(vel * harmGain * 0.4 * t.sustain, now + totalDur - t.release);
        // Release
        env.gain.exponentialRampToValueAtTime(0.001, now + totalDur);
        
        oscillators.push(osc);
        envelopes.push(env);
    });
    
    // Filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq * t.filterMult;
    filter.Q.value = t.filterQ;
    
    // Panner
    const panner = audioCtx.createStereoPanner();
    panner.pan.value = clamp(pan, -0.8, 0.8);
    
    // Connect: oscillators -> envelopes -> filter -> panner -> master
    oscillators.forEach((osc, i) => {
        osc.connect(envelopes[i]);
        envelopes[i].connect(filter);
    });
    filter.connect(panner);
    panner.connect(masterGain);
    
    // Start and stop
    oscillators.forEach(osc => {
        osc.start(now);
        osc.stop(now + totalDur);
    });
    
    oscillators[0].onended = () => activeVoices--;
}

// Root note - deeper, more resonant (home star)
function playRoot(freq, vel, pan, now) {
    const dur = rand(4, 6);
    
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    
    const env = audioCtx.createGain();
    env.gain.setValueAtTime(vel * 0.4, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + dur);
    
    const env2 = audioCtx.createGain();
    env2.gain.setValueAtTime(vel * 0.15, now);
    env2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.6);
    
    const panner = audioCtx.createStereoPanner();
    panner.pan.value = 0; // Root always center
    
    osc.connect(env); osc2.connect(env2);
    env.connect(panner); env2.connect(panner);
    panner.connect(masterGain);
    
    osc.start(now); osc2.start(now);
    osc.stop(now + dur); osc2.stop(now + dur);
    osc.onended = () => activeVoices--;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PULSE / CLOCK
// ═══════════════════════════════════════════════════════════════════════════════

function startPulse() {
    pulseCount++;
    currentPulseRadius = 0;
    triggeredThisPulse = new Set();
    
    // Play the root note at pulse start
    homeStar.trigger();
    playSound('root', rootMidi, 0.4, 0);
    
    // Spawn new explorer every 3 pulses until we have 5
    if (pulseCount % 3 === 1 && explorers.length < MAX_EXPLORERS) {
        const newExplorer = new Explorer(explorers.length);
        explorers.push(newExplorer);
    }
}

function endPulse() {
    // All explorers move to their next star after the pulse wave finishes
    explorers.forEach(exp => {
        exp.step();
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAWING
// ═══════════════════════════════════════════════════════════════════════════════

function drawBackground() {
    ctx.fillStyle = 'rgba(2, 3, 8, 0.1)';
    ctx.fillRect(0, 0, W, H);
}

function drawRingLines() {
    // Draw subtle concentric ring guides
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= NUM_RINGS; ring++) {
        const ringRadius = (ring / NUM_RINGS) * maxRadius * 0.95;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(40, 50, 80, 0.15)`;
        ctx.stroke();
    }
}

function drawConnections() {
    // Draw faint connections between stars
    ctx.strokeStyle = 'rgba(60, 80, 120, 0.08)';
    ctx.lineWidth = 1;
    
    stars.forEach(star => {
        star.neighbors.forEach(neighbor => {
            if (star.visited || neighbor.visited) {
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(neighbor.x, neighbor.y);
                ctx.strokeStyle = `rgba(80, 100, 140, ${(star.visited && neighbor.visited) ? 0.15 : 0.05})`;
                ctx.stroke();
            }
        });
    });
}

function drawHome() {
    const pulse = Math.sin(Date.now() * 0.002) * 0.1 + 0.9;
    const size = homeStar.size * pulse * (1 + homeStar.pulse * 0.5);
    
    // Large warm glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 6);
    grad.addColorStop(0, `rgba(255, 240, 200, ${0.9 + homeStar.pulse * 0.1})`);
    grad.addColorStop(0.2, `rgba(255, 200, 150, 0.5)`);
    grad.addColorStop(0.5, `rgba(255, 150, 100, 0.2)`);
    grad.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(cx, cy, size * 6, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Core
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 250, 240, 1)';
    ctx.fill();
}

function drawPulseRing() {
    // Visual pulse ring that expands on each beat
    const timeSincePulse = Date.now() - lastPulseTime;
    const expansionDuration = pulseInterval * 0.7;
    const expansionProgress = Math.min(1, timeSincePulse / expansionDuration);
    
    if (expansionProgress < 1) {
        const radius = currentPulseRadius;
        // Fade out as it expands
        const alpha = (1 - expansionProgress) * 0.4;
        
        // Main pulse ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Inner glow
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, `rgba(150, 180, 220, ${alpha * 0.3})`);
        grad.addColorStop(1, `rgba(150, 180, 220, ${alpha * 0.1})`);
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LOOP
// ═══════════════════════════════════════════════════════════════════════════════

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
    // Wider spread - use more of the screen
    maxRadius = Math.min(W, H) * 0.48;
}

function getProgress() {
    return clamp((Date.now() - startTime) / DURATION, 0, 1);
}

function checkHover() {
    hoveredStar = null;
    for (const star of stars) {
        const d = dist(mouseX, mouseY, star.x, star.y);
        if (d < 15) {
            hoveredStar = star;
            break;
        }
    }
}

function drawHoverTooltip() {
    if (!hoveredStar) return;
    
    const noteName = midiToName(hoveredStar.midi);
    const ringText = hoveredStar.ring === 0 ? 'Home' : `Ring ${hoveredStar.ring}`;
    const timbreName = hoveredStar.timbre ? hoveredStar.timbre.name : 'Root';
    const text = `${noteName} · ${timbreName}`;
    const subText = ringText;
    
    ctx.font = '12px "Courier New", monospace';
    const metrics = ctx.measureText(text);
    const subMetrics = ctx.measureText(subText);
    const padding = 10;
    const boxW = Math.max(metrics.width, subMetrics.width) + padding * 2;
    const boxH = 38;
    
    let tx = hoveredStar.x + 15;
    let ty = hoveredStar.y - 20;
    
    // Keep on screen
    if (tx + boxW > W - 10) tx = hoveredStar.x - boxW - 10;
    if (ty < 10) ty = hoveredStar.y + 25;
    
    // Background
    ctx.fillStyle = 'rgba(10, 15, 30, 0.92)';
    ctx.fillRect(tx, ty, boxW, boxH);
    
    // Colored accent bar based on star's color
    const col = hoveredStar.color;
    ctx.fillStyle = rgb(col[0], col[1], col[2], 0.8);
    ctx.fillRect(tx, ty, 3, boxH);
    
    ctx.strokeStyle = 'rgba(100, 120, 160, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, boxW, boxH);
    
    // Text
    ctx.fillStyle = 'rgba(230, 235, 245, 0.95)';
    ctx.fillText(text, tx + padding + 2, ty + 15);
    
    ctx.fillStyle = 'rgba(150, 160, 180, 0.8)';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(subText, tx + padding + 2, ty + 30);
    
    // Highlight star with its own color
    ctx.beginPath();
    ctx.arc(hoveredStar.x, hoveredStar.y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = rgb(col[0], col[1], col[2], 0.7);
    ctx.lineWidth = 2;
    ctx.stroke();
}

function tick() {
    if (!running) return;
    
    const now = Date.now();
    const progress = getProgress();
    
    // Check for new pulse cycle (works even in background)
    if (now - lastPulseTime >= pulseInterval && progress < 0.95) {
        if (pulseCount > 0) {
            endPulse();
        }
        lastPulseTime = now;
        startPulse();
    }
    
    // Update pulse wave
    const timeSincePulse = now - lastPulseTime;
    const expansionDuration = pulseInterval * 0.7;
    const expansionProgress = Math.min(1, timeSincePulse / expansionDuration);
    currentPulseRadius = expansionProgress * maxRadius * 1.2;
    
    // Trigger explorers as pulse reaches them
    explorers.forEach(exp => {
        const explorerDist = exp.distanceFromCenter();
        if (currentPulseRadius >= explorerDist && !triggeredThisPulse.has(exp.id)) {
            triggeredThisPulse.add(exp.id);
            exp.respondToPulse();
        }
    });
    
    if (progress >= 1) {
        endPiece();
    }
}

function update() {
    if (!running) return;
    
    const now = Date.now();
    const dt = Math.min(now - lastTime, 100);
    lastTime = now;
    
    const progress = getProgress();
    
    // Update visuals
    stars.forEach(s => s.update(dt));
    explorers.forEach(e => e.update(dt));
    
    // Check hover
    checkHover();
    
    // Draw
    drawBackground();
    drawRingLines();
    drawConnections();
    drawPulseRing();
    stars.filter(s => s !== homeStar).forEach(s => s.draw());
    explorers.forEach(e => e.draw());
    drawHome();
    drawHoverTooltip();
    
    // UI
    updateUI(progress);
    
    if (progress >= 1) {
        return;
    }
    
    requestAnimationFrame(update);
}

function updateUI(progress) {
    const remaining = Math.max(0, DURATION - (Date.now() - startTime));
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    
    document.getElementById('timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('phase').textContent = `Pulse ${pulseCount}`;
    document.getElementById('nodeCount').textContent = explorers.length;
    document.getElementById('currentRing').textContent = explorers.length > 0 
        ? Math.max(...explorers.map(e => e.maxRingReached))
        : 0;
    
    const circumference = 163.36;
    const offset = circumference * (1 - progress);
    document.getElementById('progressCircle').style.strokeDashoffset = offset;
}

function endPiece() {
    running = false;
    
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
    }
    
    if (masterGain) {
        masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 4);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

function start() {
    document.getElementById('overlay').classList.add('hidden');
    
    initAudio();
    
    // Generate galaxy
    generateGalaxy();
    
    // Update display
    document.getElementById('root').textContent = `${NOTE_NAMES[rootNote]} ${modeName}`;
    
    // Reset state
    explorers = [];
    pulseCount = 0;
    currentPulseRadius = 0;
    triggeredThisPulse = new Set();
    lastPulseTime = Date.now() - pulseInterval + 1000; // First pulse after 1 second
    
    running = true;
    startTime = Date.now();
    lastTime = startTime;
    
    // Start background-safe tick timer (runs even when tab is inactive)
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(tick, 100);
    
    update();
}

// Setup
canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');
resize();
window.addEventListener('resize', resize);

// Mouse tracking for hover
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener('mouseleave', () => {
    hoveredStar = null;
});

document.getElementById('overlay').addEventListener('click', start);
document.getElementById('startBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    start();
});
