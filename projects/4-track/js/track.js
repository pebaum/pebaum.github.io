// Track Class
// Handles individual track recording, playback, and loop modes

class Track {
    constructor(audioContext, trackNumber, masterDestination) {
        this.ctx = audioContext;
        this.trackNumber = trackNumber;
        this.masterDestination = masterDestination;

        // Recording state
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.audioBuffer = null;
        this.source = null;

        // Playback state
        this.isPlaying = false;
        this.isMuted = false;
        this.isSolo = false;
        this.mode = 'normal'; // 'normal' or 'loop'
        this.loopLength = 4.0; // seconds
        this.playbackRate = 1.0;
        this.startTime = 0;

        // Audio nodes
        this.createAudioNodes();

        // Tape effects
        this.tapeEffects = new TapeEffects(this.ctx);
        this.setupTapeEffects();
    }

    createAudioNodes() {
        // Main gain
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 0.8;

        // Pan
        this.panNode = this.ctx.createStereoPanner();
        this.panNode.pan.value = 0;

        // 3-band EQ
        this.eqLow = this.ctx.createBiquadFilter();
        this.eqLow.type = 'lowshelf';
        this.eqLow.frequency.value = 200;
        this.eqLow.gain.value = 0;

        this.eqMid = this.ctx.createBiquadFilter();
        this.eqMid.type = 'peaking';
        this.eqMid.frequency.value = 1000;
        this.eqMid.Q.value = 0.7;
        this.eqMid.gain.value = 0;

        this.eqHigh = this.ctx.createBiquadFilter();
        this.eqHigh.type = 'highshelf';
        this.eqHigh.frequency.value = 3000;
        this.eqHigh.gain.value = 0;

        // Connect EQ chain
        this.eqLow.connect(this.eqMid);
        this.eqMid.connect(this.eqHigh);
    }

    setupTapeEffects() {
        // Create tape effect chain
        this.tapeSaturation = this.tapeEffects.createSaturation(0);
        this.tapeCompression = this.tapeEffects.createCompression(0);
        this.tapeAgeFilter = this.tapeEffects.createAgeFilter(0);

        // Wow/flutter (detune oscillator)
        this.wowFlutterLFO = this.ctx.createOscillator();
        this.wowFlutterGain = this.ctx.createGain();
        this.wowFlutterLFO.frequency.value = 0.3 + (Math.random() * 0.2);
        this.wowFlutterLFO.type = 'sine';
        this.wowFlutterGain.gain.value = 0; // Start with no wow/flutter
        this.wowFlutterLFO.connect(this.wowFlutterGain);
        this.wowFlutterLFO.start();

        // Connect effects chain: EQ → saturation → compression → age filter → pan → gain → master
        this.eqHigh.connect(this.tapeSaturation);
        this.tapeSaturation.connect(this.tapeCompression);
        this.tapeCompression.connect(this.tapeAgeFilter);
        this.tapeAgeFilter.connect(this.panNode);
        this.panNode.connect(this.gainNode);
        this.gainNode.connect(this.masterDestination);
    }

    async startRecording(stream) {
        if (this.isRecording) return;

        this.isRecording = true;
        this.recordedChunks = [];

        // Create MediaRecorder
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = async () => {
            const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            await this.loadAudioFromBlob(blob);
            this.isRecording = false;
        };

        this.mediaRecorder.start();
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
        }
    }

    async loadAudioFromBlob(blob) {
        const arrayBuffer = await blob.arrayBuffer();

        try {
            this.audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Error decoding audio:', error);
        }
    }

    play(when = 0) {
        if (!this.audioBuffer || this.isPlaying) return;

        this.stop(); // Stop any existing playback

        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.playbackRate.value = this.playbackRate;

        // Connect wow/flutter to detune if enabled
        if (this.wowFlutterGain.gain.value > 0) {
            this.wowFlutterGain.connect(this.source.detune);
        }

        // Connect to effects chain
        this.source.connect(this.eqLow);

        if (this.mode === 'loop') {
            // Loop mode: set loop points based on loopLength
            this.source.loop = true;
            this.source.loopStart = 0;
            this.source.loopEnd = Math.min(this.loopLength, this.audioBuffer.duration);
        } else {
            // Normal mode: play once
            this.source.loop = false;
        }

        const startTime = when || this.ctx.currentTime;
        this.source.start(startTime);
        this.startTime = startTime;
        this.isPlaying = true;

        this.source.onended = () => {
            if (!this.source.loop) {
                this.isPlaying = false;
            }
        };
    }

    stop() {
        if (this.source) {
            try {
                this.source.stop();
                this.source.disconnect();
            } catch (e) {
                // Already stopped
            }
            this.source = null;
        }
        this.isPlaying = false;
    }

    clear() {
        this.stop();
        this.audioBuffer = null;
        this.recordedChunks = [];
    }

    // Control methods
    setVolume(value) {
        this.gainNode.gain.value = value;
    }

    setPan(value) {
        this.panNode.pan.value = value;
    }

    setSpeed(value) {
        this.playbackRate = value;
        if (this.source) {
            this.source.playbackRate.value = value;
        }
    }

    setEQLow(value) {
        this.eqLow.gain.value = value;
    }

    setEQMid(value) {
        this.eqMid.gain.value = value;
    }

    setEQHigh(value) {
        this.eqHigh.gain.value = value;
    }

    setTapeCompression(amount) {
        this.tapeEffects.updateCompression(this.tapeCompression, amount);
    }

    setTapeSaturation(amount) {
        this.tapeEffects.updateSaturation(this.tapeSaturation, amount);
    }

    setTapeAge(amount) {
        this.tapeEffects.updateAgeFilter(this.tapeAgeFilter, amount);
    }

    setWowFlutter(amount) {
        // Amount in cents (0-15)
        this.wowFlutterGain.gain.value = amount * 15;
    }

    setMute(muted) {
        this.isMuted = muted;
        this.gainNode.gain.value = muted ? 0 : 0.8;
    }

    setSolo(solo) {
        this.isSolo = solo;
    }

    setMode(mode) {
        this.mode = mode;
        if (this.isPlaying) {
            // Restart playback in new mode
            this.stop();
            this.play();
        }
    }

    setLoopLength(length) {
        this.loopLength = length;
        if (this.mode === 'loop' && this.source) {
            this.source.loopEnd = Math.min(length, this.audioBuffer.duration);
        }
    }

    // Get current playback position
    getCurrentTime() {
        if (!this.isPlaying || !this.source) return 0;

        const elapsed = this.ctx.currentTime - this.startTime;
        const adjustedTime = elapsed * this.playbackRate;

        if (this.mode === 'loop' && this.audioBuffer) {
            return adjustedTime % Math.min(this.loopLength, this.audioBuffer.duration);
        }

        return adjustedTime;
    }

    // Get audio buffer for visualization
    getAudioBuffer() {
        return this.audioBuffer;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Track;
}
