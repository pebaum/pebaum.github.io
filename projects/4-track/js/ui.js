// UI Controller
// Handles all user interactions and wires up the interface

let recorder = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupRotaryKnobs();
    setupStartButton();
});

// Setup rotary knobs with visual indicators
function setupRotaryKnobs() {
    const rangeInputs = document.querySelectorAll('input[type="range"]');

    rangeInputs.forEach(input => {
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'knob-container';

        // Create visual knob
        const visual = document.createElement('div');
        visual.className = 'knob-visual';

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'knob-indicator';

        // Insert wrapper before input
        input.parentNode.insertBefore(wrapper, input);

        // Move input into wrapper and add visual elements
        wrapper.appendChild(input);
        wrapper.appendChild(visual);
        wrapper.appendChild(indicator);

        // Function to update knob rotation
        const updateKnob = () => {
            const min = parseFloat(input.min) || 0;
            const max = parseFloat(input.max) || 100;
            const value = parseFloat(input.value);

            // Calculate percentage (0-1)
            const percent = (value - min) / (max - min);

            // Convert to rotation angle (-135deg to +135deg, 270 degree range)
            const angle = -135 + (percent * 270);

            indicator.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        };

        // Set initial rotation
        updateKnob();

        // Update on input
        input.addEventListener('input', updateKnob);
    });
}

function setupStartButton() {
    const startBtn = document.getElementById('startBtn');
    const overlay = document.getElementById('overlay');
    const mainContainer = document.getElementById('mainContainer');

    startBtn.addEventListener('click', async () => {
        // Initialize recorder
        recorder = new Recorder();
        await recorder.init();

        // Hide overlay, show main container
        overlay.style.display = 'none';
        mainContainer.style.display = 'block';

        // Setup all UI controls
        setupTransportControls();
        setupTrackControls();
        setupMasterControls();

        // Start waveform animation loop
        recorder.startWaveformAnimation();
    });
}

function setupTransportControls() {
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    playBtn.addEventListener('click', () => {
        recorder.play();
    });

    stopBtn.addEventListener('click', () => {
        recorder.stop();
    });

    clearAllBtn.addEventListener('click', () => {
        if (confirm('Clear all tracks? This cannot be undone.')) {
            recorder.clearAll();
        }
    });
}

function setupTrackControls() {
    // Setup controls for each track (0-3)
    for (let i = 0; i < 4; i++) {
        setupTrackButtons(i);
        setupTrackSliders(i);
    }
}

function setupTrackButtons(trackNumber) {
    // Mode toggle
    const modeBtn = document.querySelector(`.mode-btn[data-track="${trackNumber}"]`);
    const loopControls = document.querySelector(`.loop-controls[data-track="${trackNumber}"]`);

    modeBtn.addEventListener('click', () => {
        const track = recorder.getTrack(trackNumber);
        const newMode = track.mode === 'normal' ? 'loop' : 'normal';
        track.setMode(newMode);

        if (newMode === 'loop') {
            modeBtn.textContent = 'LOOP';
            modeBtn.classList.add('active');
            loopControls.style.display = 'flex';
        } else {
            modeBtn.textContent = 'NORMAL';
            modeBtn.classList.remove('active');
            loopControls.style.display = 'none';
        }

        // Redraw waveform
        recorder.updateWaveforms();
    });

    // Record button
    const recBtn = document.querySelector(`.rec-btn[data-track="${trackNumber}"]`);
    recBtn.addEventListener('click', async () => {
        const track = recorder.getTrack(trackNumber);

        if (track.isRecording) {
            track.stopRecording();
            recBtn.classList.remove('recording');
            recBtn.textContent = '● REC';

            // Wait a bit for the recording to process, then update waveform
            setTimeout(() => {
                recorder.visualizer.drawWaveform(trackNumber, track.getAudioBuffer());
            }, 100);
        } else {
            await recorder.recordTrack(trackNumber);
            recBtn.classList.add('recording');
            recBtn.textContent = '■ STOP';
        }
    });

    // Mute button
    const muteBtn = document.querySelector(`.mute-btn[data-track="${trackNumber}"]`);
    muteBtn.addEventListener('click', () => {
        const track = recorder.getTrack(trackNumber);
        track.isMuted = !track.isMuted;
        track.setMute(track.isMuted);
        muteBtn.classList.toggle('active', track.isMuted);
    });

    // Solo button
    const soloBtn = document.querySelector(`.solo-btn[data-track="${trackNumber}"]`);
    soloBtn.addEventListener('click', () => {
        recorder.handleSolo(trackNumber);
        soloBtn.classList.toggle('active', recorder.getTrack(trackNumber).isSolo);
    });

    // Clear button
    const clearBtn = document.querySelector(`.clear-btn[data-track="${trackNumber}"]`);
    clearBtn.addEventListener('click', () => {
        const track = recorder.getTrack(trackNumber);
        track.clear();
        recorder.visualizer.clearWaveform(trackNumber);
    });
}

function setupTrackSliders(trackNumber) {
    const track = recorder.getTrack(trackNumber);

    // Volume
    const volumeSlider = document.querySelector(`.volume[data-track="${trackNumber}"]`);
    volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setVolume(value);
    });

    // Pan
    const panSlider = document.querySelector(`.pan[data-track="${trackNumber}"]`);
    panSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setPan(value);
    });

    // Speed
    const speedSlider = document.querySelector(`.speed[data-track="${trackNumber}"]`);
    const speedValue = document.querySelector(`.speed-value[data-track="${trackNumber}"]`);
    speedSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setSpeed(value);
        speedValue.textContent = `${e.target.value}%`;
    });

    // Loop length
    const loopLengthSlider = document.querySelector(`.loop-length[data-track="${trackNumber}"]`);
    const loopLengthValue = document.querySelector(`.loop-length-value[data-track="${trackNumber}"]`);
    if (loopLengthSlider) {
        loopLengthSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            track.setLoopLength(value);
            loopLengthValue.textContent = `${value.toFixed(1)}s`;
            recorder.updateWaveforms();
        });
    }

    // EQ Low
    const eqLowSlider = document.querySelector(`.eq-low[data-track="${trackNumber}"]`);
    eqLowSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        track.setEQLow(value);
    });

    // EQ Mid
    const eqMidSlider = document.querySelector(`.eq-mid[data-track="${trackNumber}"]`);
    eqMidSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        track.setEQMid(value);
    });

    // EQ High
    const eqHighSlider = document.querySelector(`.eq-high[data-track="${trackNumber}"]`);
    eqHighSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        track.setEQHigh(value);
    });

    // Tape Compression
    const tapeCompSlider = document.querySelector(`.tape-comp[data-track="${trackNumber}"]`);
    tapeCompSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setTapeCompression(value);
    });

    // Tape Saturation
    const tapeSatSlider = document.querySelector(`.tape-sat[data-track="${trackNumber}"]`);
    tapeSatSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setTapeSaturation(value);
    });

    // Tape Age
    const tapeAgeSlider = document.querySelector(`.tape-age[data-track="${trackNumber}"]`);
    tapeAgeSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setTapeAge(value);
    });

    // Reverb Send
    const reverbSendSlider = document.querySelector(`.reverb-send[data-track="${trackNumber}"]`);
    reverbSendSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setReverbSend(value);
    });
}

function setupMasterControls() {
    // Master volume
    const masterVolume = document.getElementById('masterVolume');
    masterVolume.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        recorder.setMasterVolume(value);
    });

    // Master reverb
    const masterReverb = document.getElementById('masterReverb');
    masterReverb.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        recorder.setMasterReverb(value);
    });

    // Master reverb size
    const masterReverbSize = document.getElementById('masterReverbSize');
    masterReverbSize.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        recorder.setMasterReverbSize(value);
    });

    // Master compression
    const masterComp = document.getElementById('masterComp');
    masterComp.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        recorder.setMasterCompression(value);
    });

    // Master saturation
    const masterSat = document.getElementById('masterSat');
    masterSat.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        recorder.setMasterSaturation(value);
    });

    // Master age
    const masterAge = document.getElementById('masterAge');
    masterAge.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        recorder.setMasterAge(value);
    });
}
