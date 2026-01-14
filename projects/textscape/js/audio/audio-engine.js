/**
 * Audio Engine - Main audio system coordinator
 *
 * Manages:
 * - Audio context
 * - Voice pools for each voice type
 * - Effects chain
 * - Master volume and output
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.effects = null;
        this.voicePools = {};
        this.isInitialized = false;
        this.masterGain = null;
    }

    /**
     * Initialize audio context and systems
     * Must be called after user interaction
     */
    async initialize() {
        if (this.isInitialized) return;

        // Create audio context
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Create effects chain
        this.effects = new AudioEffects(this.ctx);

        // Create master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.7;

        // Connect effects to master to destination
        this.effects.output.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        // Create voice pools for each type
        this.createVoicePools();

        this.isInitialized = true;
        console.log('Audio engine initialized');
    }

    /**
     * Create voice pools for different voice types
     */
    createVoicePools() {
        this.voicePools = {
            drone: new VoicePool(
                this.ctx,
                this.effects,
                'drone',
                SynthPatches.getPatch('drones', 'warmDrone'),
                2 // Pool size
            ),

            pad: new VoicePool(
                this.ctx,
                this.effects,
                'pad',
                SynthPatches.getPatch('pads', 'softPad'),
                3
            ),

            melody: new VoicePool(
                this.ctx,
                this.effects,
                'melody',
                SynthPatches.getPatch('melodic', 'pureTone'),
                4
            ),

            texture: new VoicePool(
                this.ctx,
                this.effects,
                'texture',
                SynthPatches.getPatch('textures', 'shimmer'),
                3
            ),

            pulse: new VoicePool(
                this.ctx,
                this.effects,
                'pulse',
                SynthPatches.getPatch('pulse', 'softPulse'),
                4
            ),

            atmosphere: new VoicePool(
                this.ctx,
                this.effects,
                'atmosphere',
                SynthPatches.getPatch('pads', 'lushPad'),
                2
            )
        };
    }

    /**
     * Play a note with a specific voice type
     */
    playNote(voiceType, frequency, duration = 4000, velocity = 0.7) {
        if (!this.isInitialized) {
            console.warn('Audio engine not initialized');
            return null;
        }

        if (!this.voicePools[voiceType]) {
            console.warn(`Voice type ${voiceType} not found`);
            return null;
        }

        return this.voicePools[voiceType].play(frequency, duration, velocity);
    }

    /**
     * Play a chord (multiple notes simultaneously)
     */
    playChord(voiceType, frequencies, duration = 4000, velocity = 0.7) {
        const voices = [];

        for (const freq of frequencies) {
            const voice = this.playNote(voiceType, freq, duration, velocity);
            if (voice) voices.push(voice);
        }

        return voices;
    }

    /**
     * Stop all voices of a specific type
     */
    stopVoiceType(voiceType) {
        if (this.voicePools[voiceType]) {
            this.voicePools[voiceType].stopAll();
        }
    }

    /**
     * Stop all voices
     */
    stopAll() {
        for (const pool of Object.values(this.voicePools)) {
            pool.stopAll();
        }
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
        }
    }

    /**
     * Set reverb size
     */
    setReverbSize(size) {
        if (this.effects) {
            this.effects.setReverbSize(size);
        }
    }

    /**
     * Set reverb mix
     */
    setReverbMix(mix) {
        if (this.effects) {
            this.effects.setReverbMix(mix);
        }
    }

    /**
     * Set delay time
     */
    setDelayTime(time) {
        if (this.effects) {
            this.effects.setDelayTime(time);
        }
    }

    /**
     * Set delay feedback
     */
    setDelayFeedback(feedback) {
        if (this.effects) {
            this.effects.setDelayFeedback(feedback);
        }
    }

    /**
     * Set low-pass filter
     */
    setLowPass(amount) {
        if (this.effects) {
            this.effects.setLowPass(amount);
        }
    }

    /**
     * Set high-pass filter
     */
    setHighPass(amount) {
        if (this.effects) {
            this.effects.setHighPass(amount);
        }
    }

    /**
     * Get current time from audio context
     */
    getCurrentTime() {
        return this.ctx ? this.ctx.currentTime : 0;
    }

    /**
     * Resume audio context (needed after page load on some browsers)
     */
    async resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }
}

// Create global audio engine instance
const audioEngine = new AudioEngine();
