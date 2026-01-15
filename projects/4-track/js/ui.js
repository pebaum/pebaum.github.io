// UI Controller
// Handles all user interactions and wires up the interface

let recorder = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupRotaryKnobs();
    setupStartButton();
});

// Setup rotary knobs with visual indicators and value labels
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

        // Create value display
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'knob-value';

        // Insert wrapper before input
        input.parentNode.insertBefore(wrapper, input);

        // Move input into wrapper and add visual elements
        wrapper.appendChild(input);
        wrapper.appendChild(visual);
        wrapper.appendChild(indicator);
        wrapper.appendChild(valueDisplay);

        // Function to format value for display
        const formatValue = (val) => {
            const min = parseFloat(input.min) || 0;
            const max = parseFloat(input.max) || 100;
            // Normalize to 0-100 range for display
            const normalized = Math.round(((val - min) / (max - min)) * 100);
            return normalized.toString();
        };

        // Function to update knob rotation and value display
        const updateKnob = () => {
            const min = parseFloat(input.min) || 0;
            const max = parseFloat(input.max) || 100;
            const value = parseFloat(input.value);

            // Calculate percentage (0-1)
            const percent = (value - min) / (max - min);

            // Convert to rotation angle (-135deg to +135deg, 270 degree range)
            const angle = -135 + (percent * 270);

            indicator.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            valueDisplay.textContent = formatValue(value);
        };

        // Click to edit value
        valueDisplay.addEventListener('click', () => {
            const currentValue = formatValue(parseFloat(input.value));
            const inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.className = 'knob-value-input';
            inputEl.value = currentValue;

            valueDisplay.replaceWith(inputEl);
            inputEl.select();
            inputEl.focus();

            const finishEdit = () => {
                const newValue = parseInt(inputEl.value) || 0;
                const clampedValue = Math.max(0, Math.min(100, newValue));

                // Convert back to input's range
                const min = parseFloat(input.min) || 0;
                const max = parseFloat(input.max) || 100;
                const actualValue = min + (clampedValue / 100) * (max - min);

                input.value = actualValue;
                input.dispatchEvent(new Event('input'));

                inputEl.replaceWith(valueDisplay);
                updateKnob();
            };

            inputEl.addEventListener('blur', finishEdit);
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    finishEdit();
                } else if (e.key === 'Escape') {
                    inputEl.replaceWith(valueDisplay);
                }
            });
        });

        // Set initial rotation and value
        updateKnob();

        // Update on input (throttled for performance)
        let inputTimeout;
        input.addEventListener('input', () => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(updateKnob, 10);
        });

        // Vertical drag behavior (DAW standard)
        let isDragging = false;
        let startY = 0;
        let startValue = 0;

        const onMouseDown = (e) => {
            if (e.target === input || e.target.closest('.knob-container')) {
                isDragging = true;
                startY = e.clientY;
                startValue = parseFloat(input.value);
                e.preventDefault();
                document.body.style.cursor = 'ns-resize';
            }
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;

            const deltaY = startY - e.clientY; // Inverted: up = positive
            const min = parseFloat(input.min) || 0;
            const max = parseFloat(input.max) || 100;
            const range = max - min;

            // Sensitivity: 100px of movement = full range
            // Shift key for fine control (10x slower)
            const sensitivity = e.shiftKey ? 0.1 : 1.0;
            const pixelsPerRange = 150 / sensitivity;
            const delta = (deltaY / pixelsPerRange) * range;

            let newValue = startValue + delta;
            newValue = Math.max(min, Math.min(max, newValue));

            input.value = newValue;
            input.dispatchEvent(new Event('input'));
            e.preventDefault();
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
            }
        };

        wrapper.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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

    // Audio source selector
    const audioSourceSelect = document.getElementById('audioSourceSelect');
    audioSourceSelect.addEventListener('change', async (e) => {
        await recorder.setAudioSource(e.target.value);
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

    modeBtn.addEventListener('click', () => {
        const track = recorder.getTrack(trackNumber);
        const newMode = track.mode === 'normal' ? 'loop' : 'normal';
        track.setMode(newMode);

        if (newMode === 'loop') {
            modeBtn.textContent = 'LOOP';
            modeBtn.classList.add('active');
        } else {
            modeBtn.textContent = 'NORMAL';
            modeBtn.classList.remove('active');
        }
    });

    // Record button
    const recBtn = document.querySelector(`.rec-btn[data-track="${trackNumber}"]`);
    recBtn.addEventListener('click', async () => {
        const track = recorder.getTrack(trackNumber);

        if (track.isRecording) {
            track.stopRecording();
            recBtn.classList.remove('recording');
            recBtn.textContent = '● REC';
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
    });
}

function setupTrackSliders(trackNumber) {
    const track = recorder.getTrack(trackNumber);

    // Trim gain
    const trimSlider = document.querySelector(`.trim[data-track="${trackNumber}"]`);
    trimSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setTrimGain(value);
    });

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
    speedSlider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        track.setSpeed(value);
    });

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

    // Master EQ Low
    const masterEQLow = document.getElementById('masterEQLow');
    masterEQLow.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        recorder.setMasterEQLow(value);
    });

    // Master EQ Mid
    const masterEQMid = document.getElementById('masterEQMid');
    masterEQMid.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        recorder.setMasterEQMid(value);
    });

    // Master EQ High
    const masterEQHigh = document.getElementById('masterEQHigh');
    masterEQHigh.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        recorder.setMasterEQHigh(value);
    });

    // Master compression
    const masterComp = document.getElementById('masterComp');
    masterComp.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        recorder.setMasterCompression(value);
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
}
