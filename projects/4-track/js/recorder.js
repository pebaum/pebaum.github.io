// Main Recorder Class
// Coordinates all tracks and manages the master bus

class Recorder {
    constructor() {
        this.ctx = null;
        this.tracks = [];
        this.microphone = null;
        this.micStream = null;

        // Audio source management
        this.audioSourceType = 'none';  // 'none', 'microphone', 'tab'
        this.activeStream = null;       // Keep reference for cleanup

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

        // Create 4 tracks (with reverb send bus)
        for (let i = 0; i < 4; i++) {
            const track = new Track(this.ctx, i, this.masterTapeAge, this.reverbSendBus);
            this.tracks.push(track);
        }

        // Initialize visualizer (only VU meters, no waveforms)
        this.visualizer.initVUMeters();

        // Audio source will be set by user selection (no automatic mic request)

        // Start VU meter animation
        this.visualizer.startVUAnimation(this.masterAnalyser);

        console.log('Recorder initialized');
    }

    createMasterBus() {
        // Create reverb send bus (all tracks send to this)
        this.reverbSendBus = this.ctx.createGain();
        this.reverbSendBus.gain.value = 1.0;

        // Master reverb - MASSIVE Deep Listening cistern-style reverb (Pauline Oliveros inspired)
        this.masterReverb = this.ctx.createConvolver();
        this.masterReverbSize = 15.0; // 15 second decay default (Deep Listening style)
        this.masterReverb.buffer = this.generateReverbImpulse(this.masterReverbSize, this.masterReverbSize);

        // Reverb wet/dry mix
        this.reverbMix = this.ctx.createGain();
        this.reverbMix.gain.value = 0.15; // Default 15% reverb mix (lower for massive space)

        // Reverb dry signal
        this.reverbDry = this.ctx.createGain();
        this.reverbDry.gain.value = 0.85; // Default 85% dry

        // Connect reverb: reverbSendBus → reverb → reverbMix
        this.reverbSendBus.connect(this.masterReverb);
        this.masterReverb.connect(this.reverbMix);
        this.reverbSendBus.connect(this.reverbDry);

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;

        // Master analyser for VU meters
        this.masterAnalyser = this.ctx.createAnalyser();
        this.masterAnalyser.fftSize = 2048;
        this.masterAnalyser.smoothingTimeConstant = 0.8;

        // Create master tape effects
        this.tapeEffects = new TapeEffects(this.ctx);
        this.masterTapeSaturation = this.tapeEffects.createSaturation(0);
        this.masterTapeCompression = this.tapeEffects.createCompression(0);
        this.masterTapeAge = this.tapeEffects.createAgeFilter(0);

        // Connect master chain: tracks → age + (reverb wet + dry) → saturation → compression → gain → analyser → output
        this.masterTapeAge.connect(this.masterTapeSaturation);
        this.reverbMix.connect(this.masterTapeSaturation);
        this.reverbDry.connect(this.masterTapeSaturation);
        this.masterTapeSaturation.connect(this.masterTapeCompression);
        this.masterTapeCompression.connect(this.masterGain);
        this.masterGain.connect(this.masterAnalyser);
        this.masterAnalyser.connect(this.ctx.destination);

        // Impulse cache for performance
        this.reverbCache = new Map();
    }

    // Generate MASSIVE reverb impulse for Deep Listening cistern effect (Pauline Oliveros)
    // Up to 45-second decay with early reflections and extreme stereo width
    generateReverbImpulse(decay, length) {
        const sampleRate = this.ctx.sampleRate;
        const lengthSamples = sampleRate * length;
        const impulse = this.ctx.createBuffer(2, lengthSamples, sampleRate);

        // Early reflections pattern (cistern geometry simulation)
        const earlyReflections = [];
        const numEarlyReflections = 12;
        for (let i = 0; i < numEarlyReflections; i++) {
            earlyReflections.push({
                time: 0.02 + (i * 0.035) + (Math.random() * 0.015), // 20-500ms
                amplitude: 0.6 * Math.exp(-i * 0.3), // Exponential decay
                pan: (Math.random() * 2 - 1) * 0.8 // Random stereo position
            });
        }

        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);

            // Extreme stereo width (Deep Listening cistern characteristic)
            const stereoShift = (channel === 0 ? 0.90 : 1.10);

            for (let i = 0; i < lengthSamples; i++) {
                const time = i / sampleRate;
                let sample = 0;

                // Early reflections (0-500ms)
                if (time < 0.5) {
                    earlyReflections.forEach(reflection => {
                        const timeDiff = Math.abs(time - reflection.time);
                        if (timeDiff < 0.002) { // 2ms window
                            const reflectionGain = reflection.amplitude * (1 - timeDiff / 0.002);
                            const panGain = channel === 0 ?
                                (1 - reflection.pan) / 2 :
                                (1 + reflection.pan) / 2;
                            sample += (Math.random() * 2 - 1) * reflectionGain * panGain * 0.5;
                        }
                    });
                }

                // Dense diffuse field (exponential decay tail)
                const envelope = Math.exp(-i / (sampleRate * decay));
                const diffuse = (Math.random() * 2 - 1) * envelope * stereoShift;

                // Subtle pitch modulation for natural character
                const modulation = 1 + Math.sin(i * 0.0001) * 0.001;

                sample += diffuse * modulation;

                data[i] = sample * 0.5; // Overall gain reduction for headroom
            }
        }

        return impulse;
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
            this.updateStatus('MICROPHONE CONNECTED');
            console.log('Microphone connected');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Recording will not be available.');
            this.audioSourceType = 'none';
        }
    }

    async setupSystemAudio() {
        try {
            // Request display capture with audio
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1 },
                    height: { ideal: 1 }
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // Extract audio tracks
            const audioTracks = stream.getAudioTracks();

            if (audioTracks.length === 0) {
                throw new Error('No audio track available. Make sure to share tab audio.');
            }

            // Create audio-only stream
            this.micStream = new MediaStream(audioTracks);
            this.activeStream = stream; // Keep reference to stop later

            // Create Web Audio source
            this.microphone = this.ctx.createMediaStreamSource(this.micStream);

            // Handle stream end (user stops sharing)
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                this.setAudioSource('none');
            });

            this.updateStatus('TAB AUDIO CONNECTED');
            console.log('Tab audio connected');
        } catch (error) {
            console.error('Error capturing tab audio:', error);
            alert('Could not capture tab audio. Make sure to select "Share tab audio" in the permission dialog.');
            this.audioSourceType = 'none';
        }
    }

    async setAudioSource(sourceType) {
        // Clean up existing stream
        if (this.activeStream) {
            this.activeStream.getTracks().forEach(track => track.stop());
            this.activeStream = null;
        }
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        this.microphone = null;

        this.audioSourceType = sourceType;

        switch(sourceType) {
            case 'microphone':
                await this.setupMicrophone();
                break;
            case 'tab':
                await this.setupSystemAudio();
                break;
            case 'none':
            default:
                this.updateStatus('NO INPUT SELECTED');
                break;
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
            alert('No audio input selected. Please select an input source first.');
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

    // Waveforms removed for performance and space optimization
    // updateWaveforms() - REMOVED
    // startWaveformAnimation() - REMOVED

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

    setMasterReverb(amount) {
        // amount is 0-1, controls wet/dry mix
        this.reverbMix.gain.value = amount;
        this.reverbDry.gain.value = 1 - amount;
    }

    setMasterReverbSize(amount) {
        // amount is 0-1, controls reverb decay time (1-45 seconds) - MASSIVE Deep Listening range
        const decayTime = 1 + (amount * 44); // 1s to 45s
        this.masterReverbSize = decayTime;

        // Check cache first for performance
        const cacheKey = decayTime.toFixed(1);
        if (this.reverbCache.has(cacheKey)) {
            this.masterReverb.buffer = this.reverbCache.get(cacheKey);
            return;
        }

        // Generate new impulse response asynchronously to avoid blocking
        setTimeout(() => {
            const newBuffer = this.generateReverbImpulse(decayTime, decayTime);
            this.masterReverb.buffer = newBuffer;

            // Cache the buffer (limit cache size to 5 most recent)
            this.reverbCache.set(cacheKey, newBuffer);
            if (this.reverbCache.size > 5) {
                const firstKey = this.reverbCache.keys().next().value;
                this.reverbCache.delete(firstKey);
            }
        }, 0);
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
