// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENCE — Generative Ambient Installation
//
// Overlapping loops create continuous, evolving harmonies.
// Like Eno's Music for Airports - always something playing.
// 6-8 voices at different periods (8-24s) phase against each other.
// ═══════════════════════════════════════════════════════════════════════════════

// Musical scales - contemplative
const SCALES = {
    'Minor Pent': [0, 3, 5, 7, 10],
    'Major Pent': [0, 2, 4, 7, 9],
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10],
    'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
    'Hirajoshi': [0, 2, 3, 7, 8],
    'In Sen': [0, 1, 5, 7, 10]
};

// Continuous like Music for Airports
const DENSITY = 0.85; // High probability - always something playing

const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

let audioCtx, masterGain, compressor, reverb, delay;
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

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.75; // Higher default volume

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.3;

    // Moderate reverb - spacious but not overwhelming
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
    rootMidi = 24 + randInt(0, 7); // Lower register
    rootName = ROOT_NOTES[rootMidi % 12];
    scaleName = pick(Object.keys(SCALES));
    const intervals = SCALES[scaleName];

    scale = [];
    for (let octave = 0; octave < 4; octave++) {
        intervals.forEach(interval => {
            const midi = rootMidi + (octave * 12) + interval;
            if (midi >= 24 && midi <= 72) { // Darker register
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
    }

    update(dt) {
        if (!this.active || !audioCtx) return;

        this.age += dt;
        this.phase = (this.age % (this.period * 1000)) / (this.period * 1000);

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

        // Choose register index
        const registerIndex = {
            'low': Math.floor(scale.length * 0.15),
            'mid': Math.floor(scale.length * 0.45),
            'high': Math.floor(scale.length * 0.7)
        }[this.register];

        // Create chord (2-4 notes)
        const chordSize = randInt(2, 4);
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
        const dur = rand(12, 20); // Moderate duration for continuous sound

        notes.forEach((midi, i) => {
            const freq = midiToFreq(midi);
            const noteDelay = rand(0, 0.3); // Gentle arpeggiation

            // 3 detuned oscillators for thick, warm texture
            const detunes = [-12, 0, 12];
            detunes.forEach((detune, oscIndex) => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine'; // Pure sine waves
                osc.frequency.value = freq;
                osc.detune.value = detune + rand(-4, 4);

                const env = audioCtx.createGain();
                const gain = (0.018 / detunes.length) * (1 - i * 0.12) * (1 - oscIndex * 0.1); // Increased gain
                const attack = rand(2, 4); // Moderate attack
                const release = rand(3, 5); // Moderate release

                env.gain.setValueAtTime(0, now + noteDelay);
                env.gain.linearRampToValueAtTime(gain, now + noteDelay + attack);
                env.gain.setValueAtTime(gain, now + noteDelay + dur - release);
                env.gain.exponentialRampToValueAtTime(0.001, now + noteDelay + dur);

                const filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = freq * rand(2.5, 3.5);
                filter.Q.value = 0.4;

                const panner = audioCtx.createStereoPanner();
                panner.pan.value = rand(-0.5, 0.5);

                osc.connect(env);
                env.connect(filter);
                filter.connect(panner);
                panner.connect(masterGain);

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
// VOICE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateVoices() {
    voices = [];

    // Create 6-8 overlapping loops like Music for Airports
    const numVoices = randInt(6, 8);

    for (let i = 0; i < numVoices; i++) {
        // Different loop periods (8-24 seconds)
        // Prime numbers and offsets create interesting phase relationships
        const period = pick([8, 11, 13, 15, 17, 19, 21, 24]);

        // Distribute across registers
        const register = i < 2 ? 'low' : (i < 5 ? 'mid' : 'high');

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
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        update();
    } else {
        paused = true;
        pausedTime = Date.now();
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
        document.getElementById('pauseBtn').textContent = 'RESUME';
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    if (!running && !paused) return;
    stop();
    setTimeout(start, 300);
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
