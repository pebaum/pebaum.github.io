// Main Recorder Class
// Coordinates all tracks and manages the master bus

class Recorder {
    constructor() {
        this.ctx = null;
        this.tracks = [];
        this.microphone = null;
        this.micStream = null;

        // Master bus
        this.masterGain = null;
        this.masterAnalyser = null;

        // Master tape effects
        this.tapeEffects = null;
        this.masterTapeSaturation = null;
        this.masterTapeCompression = null;
        this.masterTapeAge = null;

        // Playback state
        this.isPlaying = false;
        this.playStartTime = 0;

        // Visualizer
        this.visualizer = new Visualizer();
    }

    async init() {
        // Create audio context
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Resume if suspended
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        // Create master bus
        this.createMasterBus();

        // Create 4 tracks
        for (let i = 0; i < 4; i++) {
            const track = new Track(this.ctx, i, this.masterTapeAge);
            this.tracks.push(track);
        }

        // Initialize visualizer
        this.visualizer.initWaveforms();
        this.visualizer.initVUMeters();

        // Request microphone access
        await this.setupMicrophone();

        // Start VU meter animation
        this.visualizer.startVUAnimation(this.masterAnalyser);

        console.log('Recorder initialized');
    }

    createMasterBus() {
        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;

        // Master analyser for VU meters
        this.masterAnalyser = this.ctx.createAnalyser();
        this.masterAnalyser.fftSize = 2048;
        this.masterAnalyser.smoothingTimeConstant = 0.8;

        // Create master tape effects
        this.tapeEffects = new TapeEffects(this.ctx);
        this.masterTapeSaturation = this.tapeEffects.createSaturation(0.3);
        this.masterTapeCompression = this.tapeEffects.createCompression(0.4);
        this.masterTapeAge = this.tapeEffects.createAgeFilter(0.5);

        // Connect master chain: tracks → age → saturation → compression → gain → analyser → output
        this.masterTapeAge.connect(this.masterTapeSaturation);
        this.masterTapeSaturation.connect(this.masterTapeCompression);
        this.masterTapeCompression.connect(this.masterGain);
        this.masterGain.connect(this.masterAnalyser);
        this.masterAnalyser.connect(this.ctx.destination);
    }

    async setupMicrophone() {
        try {
            this.micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            this.microphone = this.ctx.createMediaStreamSource(this.micStream);
            console.log('Microphone connected');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Recording will not be available.');
        }
    }

    // Transport controls
    play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.playStartTime = this.ctx.currentTime;

        // Play all tracks that have audio
        this.tracks.forEach(track => {
            if (track.audioBuffer && !track.isMuted) {
                track.play();
            }
        });

        // Start tape reel animation
        this.startTapeAnimation();

        this.updateStatus('PLAYING');
    }

    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;

        // Stop all tracks
        this.tracks.forEach(track => {
            track.stop();
        });

        // Stop tape reel animation
        this.stopTapeAnimation();

        this.updateStatus('STOPPED');
    }

    // Record on a specific track
    async recordTrack(trackNumber) {
        if (!this.micStream) {
            alert('Microphone not available');
            return;
        }

        const track = this.tracks[trackNumber];

        if (track.isRecording) {
            track.stopRecording();
            this.updateStatus(`TRACK ${trackNumber + 1} RECORDED`);
        } else {
            await track.startRecording(this.micStream);
            this.updateStatus(`RECORDING TRACK ${trackNumber + 1}`);
        }
    }

    // Solo/mute handling
    handleSolo(trackNumber) {
        const track = this.tracks[trackNumber];
        track.setSolo(!track.isSolo);

        // Check if any track is solo
        const anySolo = this.tracks.some(t => t.isSolo);

        if (anySolo) {
            // Mute all non-solo tracks
            this.tracks.forEach((t, i) => {
                if (!t.isSolo) {
                    t.setMute(true);
                }
            });
        } else {
            // Restore all mutes to their original state
            this.tracks.forEach((t, i) => {
                // This would need to track original mute state
                t.setMute(t.isMuted);
            });
        }
    }

    // Clear all tracks
    clearAll() {
        this.stop();
        this.tracks.forEach(track => {
            track.clear();
        });
        // Clear all waveforms
        for (let i = 0; i < 4; i++) {
            this.visualizer.clearWaveform(i);
        }
        this.updateStatus('ALL TRACKS CLEARED');
    }

    // Update waveforms
    updateWaveforms() {
        this.tracks.forEach((track, i) => {
            if (track.audioBuffer) {
                const currentTime = track.getCurrentTime();
                this.visualizer.drawWaveform(i, track.audioBuffer, currentTime, track.isPlaying);

                // Draw loop region if in loop mode
                if (track.mode === 'loop') {
                    this.visualizer.drawLoopRegion(i, track.audioBuffer, track.loopLength);
                }
            }
        });
    }

    // Start animation loop for waveforms
    startWaveformAnimation() {
        const animate = () => {
            if (this.isPlaying) {
                this.updateWaveforms();
            }
            this.waveformAnimationId = requestAnimationFrame(animate);
        };
        animate();
    }

    // Master controls
    setMasterVolume(value) {
        this.masterGain.gain.value = value;
    }

    setMasterCompression(amount) {
        this.tapeEffects.updateCompression(this.masterTapeCompression, amount);
    }

    setMasterSaturation(amount) {
        this.tapeEffects.updateSaturation(this.masterTapeSaturation, amount);
    }

    setMasterAge(amount) {
        this.tapeEffects.updateAgeFilter(this.masterTapeAge, amount);
    }

    // Tape reel animation
    startTapeAnimation() {
        const reels = document.querySelectorAll('.reel');
        reels.forEach(reel => reel.classList.add('spinning'));
    }

    stopTapeAnimation() {
        const reels = document.querySelectorAll('.reel');
        reels.forEach(reel => reel.classList.remove('spinning'));
    }

    // Update status display
    updateStatus(text) {
        const status = document.getElementById('status');
        if (status) {
            status.textContent = text;
        }
    }

    // Get track
    getTrack(trackNumber) {
        return this.tracks[trackNumber];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Recorder;
}
