/**
 * Voice Types - Different musical voice classes for text-to-music
 *
 * Six main voice types:
 * - Drone: Sustained fundamental tones (grounding)
 * - Pad: Harmonic beds (atmosphere)
 * - Melody: Sparse melodic phrases (key concepts)
 * - Texture: Granular/atmospheric (descriptive words)
 * - Pulse: Gentle rhythmic elements (action)
 * - Atmosphere: Environmental wash (overall mood)
 */

class Voice {
    constructor(audioContext, effects, type, patch) {
        this.ctx = audioContext;
        this.effects = effects;
        this.type = type;
        this.patch = patch;

        this.oscillators = [];
        this.gainNode = this.ctx.createGain();
        this.filterNode = this.ctx.createBiquadFilter();
        this.gainNode.gain.value = 0;

        // Connect to effects
        this.filterNode.connect(this.gainNode);
        this.gainNode.connect(this.effects.input);

        this.active = false;
        this.currentNote = null;
    }

    /**
     * Play a note
     */
    play(frequency, duration = 4000, velocity = 0.7) {
        this.stop(); // Stop any previous note

        const now = this.ctx.currentTime;
        this.active = true;
        this.currentNote = frequency;

        // Create oscillators from patch
        this.oscillators = [];
        const patchOscs = this.patch.oscillators || [{ type: 'sine', detune: 0, gain: 0.5 }];

        for (const oscConfig of patchOscs) {
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();

            osc.type = oscConfig.type || 'sine';
            osc.frequency.value = frequency;
            osc.detune.value = oscConfig.detune || 0;

            oscGain.gain.value = (oscConfig.gain || 0.3) * velocity;

            osc.connect(oscGain);
            oscGain.connect(this.filterNode);

            osc.start(now);
            this.oscillators.push({ osc, gain: oscGain });
        }

        // Apply filter from patch
        if (this.patch.filter) {
            this.filterNode.type = this.patch.filter.type || 'lowpass';
            this.filterNode.frequency.value = this.patch.filter.frequency || 2000;
            this.filterNode.Q.value = this.patch.filter.Q || 0.7;
        }

        // Apply envelope
        const env = this.patch.envelope || { attack: 1.0, decay: 0.5, sustain: 0.7, release: 2.0 };

        // Attack
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(velocity, now + env.attack);

        // Decay to sustain
        this.gainNode.gain.linearRampToValueAtTime(
            velocity * env.sustain,
            now + env.attack + env.decay
        );

        // Schedule release
        if (duration > 0) {
            const releaseStart = now + duration;
            setTimeout(() => {
                if (this.active) {
                    this.release();
                }
            }, duration);
        }

        // Apply modulation if specified
        this.applyModulation();

        return this;
    }

    /**
     * Apply vibrato, tremolo, or other modulation
     */
    applyModulation() {
        const now = this.ctx.currentTime;

        // Vibrato
        if (this.patch.vibrato && this.oscillators.length > 0) {
            const vib = this.patch.vibrato;
            const vibratoOsc = this.ctx.createOscillator();
            const vibratoGain = this.ctx.createGain();

            vibratoOsc.frequency.value = vib.rate || 4.0;
            vibratoGain.gain.value = vib.depth || 5.0;

            vibratoOsc.connect(vibratoGain);
            vibratoGain.connect(this.oscillators[0].osc.detune);

            vibratoOsc.start(now);

            this.oscillators.push({ osc: vibratoOsc, gain: vibratoGain, isModulator: true });
        }

        // Tremolo
        if (this.patch.tremolo) {
            const trem = this.patch.tremolo;
            const tremoloOsc = this.ctx.createOscillator();
            const tremoloGain = this.ctx.createGain();

            tremoloOsc.frequency.value = trem.rate || 4.0;
            tremoloGain.gain.value = trem.depth || 0.2;

            tremoloOsc.connect(tremoloGain);
            tremoloGain.connect(this.gainNode.gain);

            tremoloOsc.start(now);

            this.oscillators.push({ osc: tremoloOsc, gain: tremoloGain, isModulator: true });
        }
    }

    /**
     * Release the note (envelope release phase)
     */
    release() {
        if (!this.active) return;

        const now = this.ctx.currentTime;
        const env = this.patch.envelope || { release: 2.0 };

        // Release envelope
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + env.release);

        // Stop oscillators after release
        setTimeout(() => {
            this.stop();
        }, env.release * 1000 + 100);
    }

    /**
     * Stop the note immediately
     */
    stop() {
        const now = this.ctx.currentTime;

        for (const { osc } of this.oscillators) {
            try {
                osc.stop(now + 0.01);
            } catch (e) {
                // Oscillator may already be stopped
            }
        }

        this.oscillators = [];
        this.active = false;
        this.currentNote = null;
    }

    /**
     * Check if voice is active
     */
    isActive() {
        return this.active;
    }
}

/**
 * Voice Pool - Manages multiple voices of each type
 */
class VoicePool {
    constructor(audioContext, effects, type, patch, poolSize = 4) {
        this.voices = [];

        for (let i = 0; i < poolSize; i++) {
            this.voices.push(new Voice(audioContext, effects, type, patch));
        }
    }

    /**
     * Get an available voice (not currently active)
     */
    getAvailableVoice() {
        // First try to find an inactive voice
        for (const voice of this.voices) {
            if (!voice.isActive()) {
                return voice;
            }
        }

        // If all voices are active, steal the oldest one
        return this.voices[0];
    }

    /**
     * Play a note using an available voice
     */
    play(frequency, duration, velocity) {
        const voice = this.getAvailableVoice();
        return voice.play(frequency, duration, velocity);
    }

    /**
     * Stop all voices
     */
    stopAll() {
        for (const voice of this.voices) {
            voice.stop();
        }
    }
}
