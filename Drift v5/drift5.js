// ═══════════════════════════════════════════════════════════════════════════════
// DRIFT v5 — Generative Ambient System
// Tintinnabuli-inspired voice architecture with Fantasia visualization
//
// VOICE ARCHITECTURE:
// 1. M-voice (melodic, stepwise diatonic motion)
// 2. T-voice (triadic, arpeggiates tonic triad)
// 3. Drone (low pedal tone)
// 4. Bells (high register punctuation)
// ═══════════════════════════════════════════════════════════════════════════════

// ═══ CONSTANTS ═══
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Church modes - each has a distinct character
const MODES = {
    aeolian: { intervals: [0, 2, 3, 5, 7, 8, 10], name: 'Aeolian', character: 'sorrowful' },
    dorian: { intervals: [0, 2, 3, 5, 7, 9, 10], name: 'Dorian', character: 'contemplative' },
    phrygian: { intervals: [0, 1, 3, 5, 7, 8, 10], name: 'Phrygian', character: 'mournful' },
    lydian: { intervals: [0, 2, 4, 6, 7, 9, 11], name: 'Lydian', character: 'luminous' },
    mixolydian: { intervals: [0, 2, 4, 5, 7, 9, 10], name: 'Mixolydian', character: 'pastoral' },
    ionian: { intervals: [0, 2, 4, 5, 7, 9, 11], name: 'Ionian', character: 'pure' },
};

// Triads - simple harmonic foundation
const TRIADS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
};

// ═══ STATE ═══
let audioCtx = null;
let masterGain = null;
let masterReverb = null;
let reverbWet = null;
let voiceBus = null;
let isPlaying = false;
let startTime = null;
let timeInterval = null;

// Tonality - root and mode
let sacredRoot = 0;  // C
let sacredMode = 'aeolian';
let sacredTriad = 'minor';

// Voice instances
let mVoice = null;  // Melodic voice (stepwise diatonic)
let tVoice = null;  // Tintinnabuli voice (triad arpeggiation)
let droneVoice = null;  // Pedal tone - the eternal fundament
let bellVoice = null;  // Occasional bell punctuation

// M-voice state (stepwise motion)
let lastMelodyNote = 60;  // Middle C
let melodyDirection = 1;  // 1 = ascending, -1 = descending

// Atmosphere - global, drifts slowly like weather
let atmosphere = {
    presence: 1.0,      // Overall volume (fixed at max)
    space: 0.7,         // Reverb amount
    density: 0.55,      // Note density
    warmth: 0.5,        // Filter brightness
    breath: 0.35,       // Movement/timing variation
};

let atmosphereTargets = { ...atmosphere };
let atmosphereInterval = null;
let atmosphereChangeTimeout = null;
let tonalityChangeTimeout = null;

// ═══ FANTASIA VISUALIZATION STATE ═══
let notationCanvas = null;
let notationCtx = null;
let notationNotes = [];  // Active notes floating on canvas
let notationAnimFrame = null;
let staffLines = [];

// Voice colors for visualization
const VOICE_COLORS = {
    'm-voice': { r: 139, g: 157, b: 195 },   // Blue-gray
    't-voice': { r: 196, g: 168, b: 130 },   // Warm gold
    'drone': { r: 107, g: 123, b: 107 },     // Muted green
    'bells': { r: 212, g: 192, b: 144 },     // Bright gold
};

// ═══ UTILITY FUNCTIONS ═══
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToNoteName(midi) {
    return NOTE_NAMES[midi % 12] + Math.floor(midi / 12 - 1);
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// ═══ SCALE FUNCTIONS ═══

// Get all notes in the current mode across all octaves
function getSacredScale() {
    const mode = MODES[sacredMode];
    const notes = [];
    for (let octave = 2; octave <= 7; octave++) {
        for (const interval of mode.intervals) {
            const midi = sacredRoot + interval + (octave * 12);
            if (midi >= 36 && midi <= 96) {
                notes.push(midi);
            }
        }
    }
    return notes;
}

// Get the tonic triad notes across all octaves
function getSacredTriad() {
    const triad = TRIADS[sacredTriad];
    const notes = [];
    for (let octave = 2; octave <= 7; octave++) {
        for (const interval of triad) {
            const midi = sacredRoot + interval + (octave * 12);
            if (midi >= 36 && midi <= 96) {
                notes.push(midi);
            }
        }
    }
    return notes;
}

// Get scale notes in a specific range
function getScaleInRange(min, max) {
    return getSacredScale().filter(n => n >= min && n <= max);
}

// Get triad notes in a specific range
function getTriadInRange(min, max) {
    return getSacredTriad().filter(n => n >= min && n <= max);
}

// Get the next stepwise note (M-voice behavior - true to Pärt's technique)
function getNextStepwiseNote(currentNote, range) {
    const scale = getScaleInRange(range[0], range[1]);
    if (scale.length === 0) return null;
    
    // Find current position in scale
    const currentIdx = scale.indexOf(currentNote);
    
    // If not in scale, find nearest
    if (currentIdx === -1) {
        const distances = scale.map(n => Math.abs(n - currentNote));
        const nearestIdx = distances.indexOf(Math.min(...distances));
        return scale[nearestIdx];
    }
    
    // Step up or down in the scale
    let nextIdx = currentIdx + melodyDirection;
    
    // Handle bounds - reverse direction at edges
    if (nextIdx >= scale.length || nextIdx < 0) {
        melodyDirection *= -1;
        nextIdx = currentIdx + melodyDirection;
    }
    
    // Small chance to change direction (creates gentle contour)
    if (Math.random() < 0.12) {
        melodyDirection *= -1;
    }
    
    // Very small chance to skip a note (Pärt occasionally allows this)
    if (Math.random() < 0.08) {
        nextIdx = currentIdx + melodyDirection * 2;
        nextIdx = clamp(nextIdx, 0, scale.length - 1);
    }
    
    return scale[nextIdx];
}

// Get the corresponding T-voice note for an M-voice note
// True tintinnabuli: T-voice finds nearest triad tone above or below
function getTintinnabuliNote(mNote, position = 'superior') {
    const triadNotes = getSacredTriad();
    
    if (position === 'superior') {
        // Find nearest triad note at or above the M-voice note
        const above = triadNotes.filter(n => n >= mNote);
        return above.length > 0 ? above[0] : triadNotes[triadNotes.length - 1];
    } else {
        // Find nearest triad note at or below
        const below = triadNotes.filter(n => n <= mNote);
        return below.length > 0 ? below[below.length - 1] : triadNotes[0];
    }
}

// ═══ 4-COLUMN LOGGING ═══
const voiceCounts = {
    'mvoice': 0,
    'tvoice': 0,
    'drone': 0,
    'bells': 0
};

function log(type, msg) {
    // Map voice types to column IDs
    const typeMap = {
        'm-voice': 'mvoice',
        't-voice': 'tvoice',
        'drone': 'drone',
        'bells': 'bells',
        'system': null
    };
    
    const columnType = typeMap[type];
    if (!columnType) return; // Skip system logs
    
    const container = document.getElementById(`log-${columnType}`);
    if (!container) return;
    
    // Increment count
    voiceCounts[columnType]++;
    const countEl = document.getElementById(`${columnType}-count`);
    if (countEl) countEl.textContent = voiceCounts[columnType];
    
    // Time stamp (seconds since start)
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    const time = `${mins}:${secs}`;
    
    // Extract note name from message
    const noteMatch = msg.match(/([A-G][#b]?\d)/);
    const noteName = noteMatch ? noteMatch[1] : msg;
    
    const entry = document.createElement('div');
    entry.className = `note-entry ${columnType} new`;
    entry.innerHTML = `<span class="time">${time}</span><span class="note">${noteName}</span>`;
    
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
    
    // Remove "new" class after animation
    setTimeout(() => entry.classList.remove('new'), 300);
    
    // Limit entries (keep scrolling log manageable)
    while (container.children.length > 200) {
        container.removeChild(container.firstChild);
    }
}

// startTime declared at top, reset in startEngine()

// ═══ VISUALIZATION (simplified - no canvas) ═══
function initNotation() {
    // No canvas needed for brutal ASCII design
}

function addVisualizationNote(voice, midi, velocity) {
    // No canvas visualization - handled by log() now
}

function stopNotation() {
    // No animation to stop
}

// ═══ UI UPDATES ═══
function updateDisplay() {
    // Update root dropdown
    const rootSelect = document.getElementById('rootSelect');
    if (rootSelect) {
        rootSelect.value = sacredRoot;
    }
    
    // Update mode dropdown
    const modeSelect = document.getElementById('modeSelect');
    if (modeSelect) {
        modeSelect.value = sacredMode;
    }
    
    // Update mood
    const moodEl = document.getElementById('moodDisplay');
    if (moodEl) {
        const mode = MODES[sacredMode];
        moodEl.textContent = mode.character;
    }
    
    // Update global atmosphere bars
    Object.keys(atmosphere).forEach(param => {
        const barEl = document.getElementById(`bar-${param}`);
        const valEl = document.getElementById(`val-${param}`);
        const percent = Math.round(atmosphere[param] * 100);
        
        if (barEl) {
            barEl.style.width = `${percent}%`;
        }
        if (valEl) {
            valEl.textContent = percent;
        }
    });
}

function updateTimeDisplay() {
    if (!startTime) return;
    
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timeEl = document.getElementById('timeDisplay');
    if (timeEl) {
        timeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// ═══ CATHEDRAL REVERB ═══
// Large, dark, sacred space - like a stone cathedral
function createCathedralReverb(duration = 8, decay = 3) {
    const length = audioCtx.sampleRate * duration;
    const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
    
    const leftData = impulse.getChannelData(0);
    const rightData = impulse.getChannelData(1);
    
    // Early reflections - stone walls
    const earlyReflections = 8;
    for (let i = 0; i < earlyReflections; i++) {
        const time = Math.floor(random(0.015, 0.1) * audioCtx.sampleRate);
        const amp = random(0.2, 0.5) * Math.pow(0.8, i);
        // Decorrelated stereo for width
        if (time < length) {
            leftData[time] += amp * random(0.7, 1);
            rightData[time] += amp * random(0.7, 1);
        }
    }
    
    // Long diffuse tail - cathedral acoustics
    for (let i = 0; i < length; i++) {
        const t = i / audioCtx.sampleRate;
        // Slow decay envelope
        const envelope = Math.pow(1 - t / duration, decay);
        
        // Decorrelated noise for stereo width
        const noiseL = (Math.random() * 2 - 1) * envelope * 0.25;
        const noiseR = (Math.random() * 2 - 1) * envelope * 0.25;
        
        leftData[i] += noiseL;
        rightData[i] += noiseR;
    }
    
    return impulse;
}

// ═══ SACRED VOICE CLASS - Pure Bell-like Tones ═══
class SacredVoice {
    constructor(ctx, output, config) {
        this.ctx = ctx;
        this.config = config;
        this.isPlaying = false;
        this.timeout = null;
        this.activeNotes = [];
        
        // Voice chain: filter -> panner -> gain -> output
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = config.brightness || 2000;
        this.filter.Q.value = 0.5;
        
        this.panner = ctx.createStereoPanner();
        this.panner.pan.value = config.pan || 0;
        
        this.gain = ctx.createGain();
        this.gain.gain.value = config.volume || 0.2;
        
        this.filter.connect(this.panner);
        this.panner.connect(this.gain);
        this.gain.connect(output);
        
        this.panDriftTimeout = null;
    }
    
    start() {
        this.isPlaying = true;
        this.scheduleNext(true);  // Play first note immediately
        this.startPanDrift();
        log('voice', `${this.config.name} awakens`);
    }
    
    stop() {
        this.isPlaying = false;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (this.panDriftTimeout) {
            clearTimeout(this.panDriftTimeout);
            this.panDriftTimeout = null;
        }
        // Fade out active notes
        this.activeNotes.forEach(note => {
            try {
                note.env.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
                setTimeout(() => {
                    try { note.osc.stop(); } catch(e) {}
                    try { note.osc2?.stop(); } catch(e) {}
                }, 1000);
            } catch(e) {}
        });
        this.activeNotes = [];
    }
    
    scheduleNext(immediate = false) {
        if (!this.isPlaying) return;
        
        // Play immediately on first call
        if (immediate) {
            this.playNote();
        }
        
        // Time expands, silence is sacred
        const baseInterval = this.config.interval || 5000;
        const densityMult = 1.8 - atmosphere.density * 0.8;
        const interval = baseInterval * densityMult * random(0.7, 1.3);
        
        this.timeout = setTimeout(() => {
            if (!this.isPlaying) return;
            
            // Sacred silence - but ensure notes do play
            const silenceChance = Math.max(0, 0.6 - atmosphere.density * 0.8);
            if (Math.random() < silenceChance) {
                this.scheduleNext();
                return;
            }
            
            this.playNote();
            this.scheduleNext();
        }, interval);
    }
    
    playNote() {
        // Override in subclasses
    }
    
    // Create a pure, bell-like tone - the soul of tintinnabuli
    createBellTone(freq, velocity = 0.5) {
        const now = this.ctx.currentTime;
        
        // Pure sine tone - like bells in a cathedral
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Very subtle detuning for organic warmth
        osc.detune.value = random(-4, 4);
        
        // Add subtle second partial (octave above, quiet) for richness
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;
        osc2.detune.value = random(-6, 6);
        
        // Envelope - bells have sharp attack, long natural decay
        const env = this.ctx.createGain();
        env.gain.value = 0;
        
        // Attack time - instant for bells, slow for other voices
        const attack = this.config.bellLike ? 0.008 : (this.config.attack || 0.6);
        const decay = (this.config.decay || 5) * (0.6 + atmosphere.warmth * 0.6);
        
        const presenceVol = velocity * atmosphere.presence * 0.8;
        
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(presenceVol, now + attack);
        env.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);
        
        // Second partial - quieter, shorter decay
        const env2 = this.ctx.createGain();
        env2.gain.value = 0;
        env2.gain.setValueAtTime(0, now);
        env2.gain.linearRampToValueAtTime(presenceVol * 0.12, now + attack);
        env2.gain.exponentialRampToValueAtTime(0.001, now + attack + decay * 0.6);
        
        // Connect
        osc.connect(env);
        osc2.connect(env2);
        env.connect(this.filter);
        env2.connect(this.filter);
        
        // Start
        osc.start(now);
        osc2.start(now);
        
        // Track for cleanup
        const noteObj = { osc, osc2, env, env2 };
        this.activeNotes.push(noteObj);
        
        // Stop after decay
        const stopTime = (attack + decay + 1) * 1000;
        setTimeout(() => {
            try { osc.stop(); osc2.stop(); } catch(e) {}
            this.activeNotes = this.activeNotes.filter(n => n !== noteObj);
        }, stopTime);
        
        return noteObj;
    }
    
    // Slow pan drift - voices swim through the stereo field like spirits
    startPanDrift() {
        const drift = () => {
            if (!this.isPlaying) return;
            
            // Gentle drift across stereo field
            const currentPan = this.panner.pan.value;
            const newPan = clamp(currentPan + random(-0.4, 0.4), -0.85, 0.85);
            const driftTime = random(12, 30);
            
            this.panner.pan.linearRampToValueAtTime(newPan, this.ctx.currentTime + driftTime);
            
            this.panDriftTimeout = setTimeout(drift, driftTime * 1000 + random(5000, 15000));
        };
        
        drift();
    }
}

// ═══ M-VOICE: Melodic Voice (Stepwise Diatonic Motion) ═══
// The M-voice in tintinnabuli moves diatonically in stepwise motion
class MelodicVoice extends SacredVoice {
    constructor(ctx, output) {
        super(ctx, output, {
            name: 'M-voice',
            volume: 0.32,
            brightness: 2800,
            pan: -0.25,
            interval: 4000,
            attack: 0.5,
            decay: 6,
            range: [48, 72],
        });
    }
    
    playNote() {
        const range = this.config.range;
        
        // Get next stepwise note - true to Pärt's M-voice technique
        const note = getNextStepwiseNote(lastMelodyNote, range);
        if (!note) return;
        
        lastMelodyNote = note;
        
        // Subtle velocity variation
        const velocity = random(0.45, 0.7);
        
        this.createBellTone(midiToFreq(note), velocity);
        addVisualizationNote('m-voice', note, velocity);
        log('m-voice', `♪ ${midiToNoteName(note)}`);
    }
}

// ═══ T-VOICE: Tintinnabuli Voice (Triad Arpeggiation) ═══
// The T-voice arpeggiates the tonic triad, finding notes nearest to the M-voice
class TintinnabuliVoice extends SacredVoice {
    constructor(ctx, output) {
        super(ctx, output, {
            name: 'T-voice',
            volume: 0.26,
            brightness: 3200,
            pan: 0.25,
            interval: 5000,
            attack: 0.3,
            decay: 8,
            bellLike: true,
            range: [52, 84],
        });
        
        this.position = 'superior'; // Alternates between above/below M-voice
    }
    
    playNote() {
        // T-voice responds to M-voice position
        // Finds the nearest triad note above or below current melody note
        const mNote = lastMelodyNote || 60;
        
        // Occasionally alternate position (creates variety)
        if (Math.random() < 0.25) {
            this.position = this.position === 'superior' ? 'inferior' : 'superior';
        }
        
        let note = getTintinnabuliNote(mNote, this.position);
        
        // Keep in range
        const range = this.config.range;
        while (note < range[0]) note += 12;
        while (note > range[1]) note -= 12;
        
        const velocity = random(0.35, 0.55);
        
        this.createBellTone(midiToFreq(note), velocity);
        addVisualizationNote('t-voice', note, velocity);
        log('t-voice', `◊ ${midiToNoteName(note)} [${this.position.charAt(0)}]`);
    }
}

// ═══ DRONE VOICE: The Eternal Fundament ═══
// A sustained low pedal tone - the foundation of sacred music
class DroneVoice extends SacredVoice {
    constructor(ctx, output) {
        super(ctx, output, {
            name: 'Drone',
            volume: 0.22,
            brightness: 600,
            pan: 0,
            interval: 15000,
            attack: 3,
            decay: 18,
            range: [36, 48],
        });
    }
    
    playNote() {
        // Drone plays only the root or fifth - the fundament
        const root = sacredRoot + 36; // Low octave
        const fifth = root + 7;
        
        // Usually root, sometimes fifth for variety
        const note = Math.random() < 0.75 ? root : fifth;
        
        const velocity = random(0.35, 0.55);
        
        this.createBellTone(midiToFreq(note), velocity);
        addVisualizationNote('drone', note, velocity);
        log('drone', `◯ ${midiToNoteName(note)}`);
    }
}

// ═══ BELL VOICE: Sacred Punctuation ═══
// Occasional high bell tones - "the three notes of a triad are like bells"
class BellVoice extends SacredVoice {
    constructor(ctx, output) {
        super(ctx, output, {
            name: 'Bells',
            volume: 0.18,
            brightness: 4500,
            pan: 0,
            interval: 18000,
            attack: 0.008,
            decay: 10,
            bellLike: true,
            range: [72, 88],
        });
    }
    
    playNote() {
        // Bells play triad notes - true to "three notes like bells"
        const triad = getTriadInRange(this.config.range[0], this.config.range[1]);
        if (triad.length === 0) return;
        
        const note = randomChoice(triad);
        const velocity = random(0.25, 0.45);
        
        this.createBellTone(midiToFreq(note), velocity);
        addVisualizationNote('bells', note, velocity);
        log('bells', `✧ ${midiToNoteName(note)}`);
    }
}

// ═══ ATMOSPHERE SYSTEM ═══
// Global weather - drifts slowly like changing seasons
function startAtmosphere() {
    // Set initial targets
    Object.keys(atmosphere).forEach(param => {
        atmosphereTargets[param] = atmosphere[param];
    });
    
    // Drift toward targets continuously
    atmosphereInterval = setInterval(() => {
        Object.keys(atmosphere).forEach(param => {
            const diff = atmosphereTargets[param] - atmosphere[param];
            atmosphere[param] += diff * 0.012;
        });
        
        // Apply atmosphere to audio
        applyAtmosphere();
        
        // Update display
        updateDisplay();
    }, 50);
    
    // Schedule target changes
    scheduleAtmosphereChange();
}

function stopAtmosphere() {
    if (atmosphereInterval) {
        clearInterval(atmosphereInterval);
        atmosphereInterval = null;
    }
    if (atmosphereChangeTimeout) {
        clearTimeout(atmosphereChangeTimeout);
        atmosphereChangeTimeout = null;
    }
}

function scheduleAtmosphereChange() {
    if (!isPlaying) return;
    
    // Change every 15-40 seconds
    atmosphereChangeTimeout = setTimeout(() => {
        if (!isPlaying) return;
        
        // Exclude presence (volume) from drifting parameters
        const params = Object.keys(atmosphere).filter(p => p !== 'presence');
        
        // Change 1-2 parameters
        const numChanges = Math.random() < 0.4 ? 2 : 1;
        
        for (let i = 0; i < numChanges; i++) {
            const param = randomChoice(params);
            
            let newTarget;
            if (Math.random() < 0.35) {
                // Dramatic shift
                newTarget = Math.random() < 0.5 ? random(0.12, 0.3) : random(0.7, 0.9);
            } else {
                // Medium drift
                newTarget = clamp(atmosphereTargets[param] + random(-0.35, 0.35), 0.1, 0.9);
            }
            
            atmosphereTargets[param] = newTarget;
        }
        
        scheduleAtmosphereChange();
    }, random(15000, 40000));
}

function applyAtmosphere() {
    if (!masterGain || !audioCtx) return;
    
    const now = audioCtx.currentTime;
    
    // Fixed maximum volume
    const vol = 0.6;
    masterGain.gain.setTargetAtTime(vol, now, 2);
    
    // Space -> reverb wetness
    if (reverbWet) {
        reverbWet.gain.setTargetAtTime(0.5 + atmosphere.space * 0.45, now, 3);
    }
    
    // Apply warmth (filter brightness) to all voices
    const warmthMult = 0.6 + atmosphere.warmth * 0.8;
    
    if (mVoice) {
        mVoice.filter.frequency.setTargetAtTime(1800 * warmthMult, now, 3);
    }
    if (tVoice) {
        tVoice.filter.frequency.setTargetAtTime(2200 * warmthMult, now, 3);
    }
    if (droneVoice) {
        droneVoice.filter.frequency.setTargetAtTime(400 * warmthMult, now, 3);
    }
    if (bellVoice) {
        bellVoice.filter.frequency.setTargetAtTime(3500 * warmthMult, now, 3);
    }
}

// ═══ SACRED TONALITY CHANGES ═══
// Occasional, meditative changes - like seasons changing
function scheduleTonalityChange() {
    if (!isPlaying) return;
    
    // Change every 2-6 minutes (sacred time moves slowly)
    tonalityChangeTimeout = setTimeout(() => {
        if (!isPlaying) return;
        
        // 70% chance to change mode, 30% to change root
        if (Math.random() < 0.7) {
            // Change mode - explore different sacred colors
            const modes = Object.keys(MODES);
            const newMode = randomChoice(modes);
            if (newMode !== sacredMode) {
                sacredMode = newMode;
                
                // Match triad quality to mode
                if (['aeolian', 'dorian', 'phrygian'].includes(sacredMode)) {
                    sacredTriad = 'minor';
                } else {
                    sacredTriad = 'major';
                }
                
                log('tonality', `mode → ${MODES[sacredMode].name} (${MODES[sacredMode].character})`);
                updateDisplay();
            }
        } else {
            // Change root - move by perfect fifth or fourth (sacred intervals)
            const movement = Math.random() < 0.5 ? 7 : 5;
            const direction = Math.random() < 0.5 ? 1 : -1;
            sacredRoot = (sacredRoot + movement * direction + 12) % 12;
            
            // Reset melody note to stay in new key
            lastMelodyNote = sacredRoot + 60;
            
            log('tonality', `root → ${NOTE_NAMES[sacredRoot]}`);
            updateDisplay();
        }
        
        scheduleTonalityChange();
    }, random(120000, 360000));  // 2-6 minutes
}

// ═══ AUDIO INITIALIZATION ═══
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Master gain
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.45;
    masterGain.connect(audioCtx.destination);
    
    // Cathedral reverb
    masterReverb = audioCtx.createConvolver();
    masterReverb.buffer = createCathedralReverb(10, 2.5);
    
    // Reverb wet/dry
    reverbWet = audioCtx.createGain();
    reverbWet.gain.value = 0.7;  // Heavy reverb for cathedral sound
    
    const reverbDry = audioCtx.createGain();
    reverbDry.gain.value = 0.45;
    
    // Pre-reverb bus (voices connect here)
    voiceBus = audioCtx.createGain();
    voiceBus.gain.value = 1;
    
    voiceBus.connect(reverbDry);
    voiceBus.connect(masterReverb);
    masterReverb.connect(reverbWet);
    reverbDry.connect(masterGain);
    reverbWet.connect(masterGain);
    
    // Create voices
    mVoice = new MelodicVoice(audioCtx, voiceBus);
    tVoice = new TintinnabuliVoice(audioCtx, voiceBus);
    droneVoice = new DroneVoice(audioCtx, voiceBus);
    bellVoice = new BellVoice(audioCtx, voiceBus);
    
    log('system', 'audio initialized');
}

// ═══ TRANSPORT CONTROLS ═══
function startPlayback() {
    if (isPlaying) return;
    
    if (!audioCtx) {
        initAudio();
    }
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    isPlaying = true;
    startTime = Date.now();
    
    // Start time display
    timeInterval = setInterval(updateTimeDisplay, 1000);
    
    // Start atmosphere
    startAtmosphere();
    
    // Start voices with staggered timing (gradual sacred emergence)
    log('system', '▶ contemplation begins');
    
    droneVoice.start();  // Drone first - the eternal fundament
    
    setTimeout(() => {
        if (isPlaying) {
            mVoice.start();  // M-voice emerges from silence
        }
    }, 1500);
    
    setTimeout(() => {
        if (isPlaying) {
            tVoice.start();  // T-voice responds to M-voice
        }
    }, 3500);
    
    setTimeout(() => {
        if (isPlaying) {
            bellVoice.start();  // Bells punctuate the sacred space
        }
    }, 8000);
    
    // Schedule tonality changes
    scheduleTonalityChange();
    
    updateDisplay();
    
    // Update UI
    const btn = document.getElementById('playBtn');
    if (btn) {
        btn.textContent = 'STOP';
        btn.classList.add('active');
    }
}

function stopPlayback() {
    if (!isPlaying) return;
    
    isPlaying = false;
    
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
    
    if (tonalityChangeTimeout) {
        clearTimeout(tonalityChangeTimeout);
        tonalityChangeTimeout = null;
    }
    
    stopAtmosphere();
    
    // Stop voices
    mVoice?.stop();
    tVoice?.stop();
    droneVoice?.stop();
    bellVoice?.stop();
    
    // Update UI
    const btn = document.getElementById('playBtn');
    if (btn) {
        btn.textContent = 'PLAY';
        btn.classList.remove('active');
    }
}

function togglePlayback() {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
}

// ═══ USER CONTROLS ═══
function setRoot(note) {
    sacredRoot = parseInt(note);
    // Match triad to mode
    if (['aeolian', 'dorian', 'phrygian'].includes(sacredMode)) {
        sacredTriad = 'minor';
    } else {
        sacredTriad = 'major';
    }
    // Reset melody to stay in key
    lastMelodyNote = sacredRoot + 60;
    log('tonality', `root → ${NOTE_NAMES[sacredRoot]}`);
    updateDisplay();
}

function setMode(mode) {
    if (MODES[mode]) {
        sacredMode = mode;
        // Match triad to mode
        if (['aeolian', 'dorian', 'phrygian'].includes(sacredMode)) {
            sacredTriad = 'minor';
        } else {
            sacredTriad = 'major';
        }
        log('tonality', `mode → ${MODES[sacredMode].name}`);
        updateDisplay();
    }
}

function randomize() {
    // Random root
    sacredRoot = randomInt(0, 11);
    
    // Random mode
    const modes = Object.keys(MODES);
    sacredMode = randomChoice(modes);
    
    // Match triad
    if (['aeolian', 'dorian', 'phrygian'].includes(sacredMode)) {
        sacredTriad = 'minor';
    } else {
        sacredTriad = 'major';
    }
    
    // Reset melody
    lastMelodyNote = sacredRoot + 60;
    
    // Randomize atmosphere targets (except presence/volume)
    Object.keys(atmosphere).filter(p => p !== 'presence').forEach(param => {
        atmosphereTargets[param] = random(0.25, 0.75);
    });
    
    updateDisplay();
}

// Randomize everything on page load
function randomizeOnLoad() {
    // Random root
    sacredRoot = randomInt(0, 11);
    
    // Random mode
    const modes = Object.keys(MODES);
    sacredMode = randomChoice(modes);
    
    // Match triad
    if (['aeolian', 'dorian', 'phrygian'].includes(sacredMode)) {
        sacredTriad = 'minor';
    } else {
        sacredTriad = 'major';
    }
    
    // Reset melody
    lastMelodyNote = sacredRoot + 60;
    
    // Randomize atmosphere (except presence/volume which stays at max)
    Object.keys(atmosphere).filter(p => p !== 'presence').forEach(param => {
        const val = random(0.25, 0.75);
        atmosphere[param] = val;
        atmosphereTargets[param] = val;
    });
}

// ═══ INITIALIZATION ═══
function init() {
    // Randomize on load
    randomizeOnLoad();
    
    // Initial display update
    updateDisplay();
    
    // Initialize notation (no-op in brutal version)
    initNotation();
    
    // Play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', togglePlayback);
    }
    
    // Random button
    const randBtn = document.getElementById('randBtn');
    if (randBtn) {
        randBtn.addEventListener('click', randomize);
    }
    
    // Root selector
    const rootSelect = document.getElementById('rootSelect');
    if (rootSelect) {
        rootSelect.addEventListener('change', (e) => {
            setRoot(e.target.value);
        });
    }
    
    // Mode selector
    const modeSelect = document.getElementById('modeSelect');
    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            setMode(e.target.value);
        });
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
        
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlayback();
        } else if (e.code === 'KeyR') {
            randomize();
        }
    });
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
