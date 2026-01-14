/**
 * Audio Effects - Web Audio API effect chains
 *
 * Provides:
 * - Reverb (convolution and algorithmic)
 * - Delay
 * - Compression
 * - Filtering
 * - Spatial effects
 */

class AudioEffects {
    constructor(audioContext) {
        this.ctx = audioContext;

        // Create master effects chain
        this.input = this.ctx.createGain();
        this.output = this.ctx.createGain();

        // Individual effects
        this.reverb = this.createReverb();
        this.delay = this.createDelay();
        this.compressor = this.createCompressor();
        this.filter = this.createFilter();

        // Connect effects chain
        this.connectEffects();
    }

    /**
     * Create reverb effect (convolution-based)
     */
    createReverb() {
        const reverbGain = this.ctx.createGain();
        const convolver = this.ctx.createConvolver();
        const dry = this.ctx.createGain();
        const wet = this.ctx.createGain();

        // Generate impulse response for reverb
        convolver.buffer = this.generateReverbImpulse(4.0, 3.0); // 4s decay, 3s length

        // Default mix
        dry.gain.value = 0.6;
        wet.gain.value = 0.4;

        return {
            input: reverbGain,
            convolver: convolver,
            dry: dry,
            wet: wet,
            output: this.ctx.createGain()
        };
    }

    /**
     * Generate artificial reverb impulse response
     */
    generateReverbImpulse(decay = 2.0, length = 2.0) {
        const sampleRate = this.ctx.sampleRate;
        const lengthSamples = sampleRate * length;
        const impulse = this.ctx.createBuffer(2, lengthSamples, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);

            for (let i = 0; i < lengthSamples; i++) {
                // Exponential decay envelope
                const decayEnvelope = Math.exp(-i / (sampleRate * decay));

                // Random noise for reverb tail
                const noise = (Math.random() * 2 - 1) * decayEnvelope;

                // Add early reflections
                let earlyReflections = 0;
                if (i < sampleRate * 0.05) { // First 50ms
                    const reflection = Math.sin(i * Math.PI / (sampleRate * 0.05));
                    earlyReflections = reflection * 0.3;
                }

                channelData[i] = noise + earlyReflections;
            }
        }

        return impulse;
    }

    /**
     * Set reverb size (regenerates impulse)
     */
    setReverbSize(size = 'cathedral') {
        const sizes = {
            'small': { decay: 0.5, length: 0.5 },
            'room': { decay: 1.0, length: 1.0 },
            'hall': { decay: 2.5, length: 2.5 },
            'cathedral': { decay: 4.0, length: 3.5 },
            'infinite': { decay: 8.0, length: 5.0 }
        };

        const params = sizes[size] || sizes.cathedral;
        this.reverb.convolver.buffer = this.generateReverbImpulse(params.decay, params.length);
    }

    /**
     * Set reverb mix (0 = dry, 1 = wet)
     */
    setReverbMix(mix = 0.4) {
        this.reverb.dry.gain.value = 1 - mix;
        this.reverb.wet.gain.value = mix;
    }

    /**
     * Create delay effect
     */
    createDelay() {
        const delayNode = this.ctx.createDelay(5.0); // Max 5 seconds
        const delayGain = this.ctx.createGain();
        const feedback = this.ctx.createGain();
        const wet = this.ctx.createGain();

        delayNode.delayTime.value = 0.375; // Dotted eighth note at 120 BPM
        feedback.gain.value = 0.3;
        wet.gain.value = 0.2;

        // Connect feedback loop
        delayNode.connect(feedback);
        feedback.connect(delayNode);

        return {
            input: delayGain,
            delay: delayNode,
            feedback: feedback,
            wet: wet,
            output: this.ctx.createGain()
        };
    }

    /**
     * Set delay time (in seconds)
     */
    setDelayTime(time = 0.375) {
        this.delay.delay.delayTime.setValueAtTime(time, this.ctx.currentTime);
    }

    /**
     * Set delay feedback (0 to 1)
     */
    setDelayFeedback(feedback = 0.3) {
        this.delay.feedback.gain.setValueAtTime(feedback, this.ctx.currentTime);
    }

    /**
     * Set delay mix
     */
    setDelayMix(mix = 0.2) {
        this.delay.wet.gain.setValueAtTime(mix, this.ctx.currentTime);
    }

    /**
     * Create compressor (for gentle dynamics control)
     */
    createCompressor() {
        const compressor = this.ctx.createDynamicsCompressor();

        // Gentle settings for ambient music
        compressor.threshold.value = -24;
        compressor.knee.value = 12;
        compressor.ratio.value = 3;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        return compressor;
    }

    /**
     * Create master filter
     */
    createFilter() {
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 8000; // Wide open by default
        lowpass.Q.value = 0.7;

        const highpass = this.ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 20; // Very low by default
        highpass.Q.value = 0.7;

        return {
            lowpass: lowpass,
            highpass: highpass
        };
    }

    /**
     * Set low-pass filter cutoff (0 to 1, where 1 = wide open)
     */
    setLowPass(amount = 1.0) {
        const freq = 400 + (amount * 7600); // 400 Hz to 8 kHz
        this.filter.lowpass.frequency.setValueAtTime(freq, this.ctx.currentTime);
    }

    /**
     * Set high-pass filter cutoff (0 to 1, where 0 = wide open)
     */
    setHighPass(amount = 0.0) {
        const freq = 20 + (amount * 380); // 20 Hz to 400 Hz
        this.filter.highpass.frequency.setValueAtTime(freq, this.ctx.currentTime);
    }

    /**
     * Connect all effects in chain
     */
    connectEffects() {
        // Main input
        this.input.connect(this.filter.highpass);
        this.filter.highpass.connect(this.filter.lowpass);

        // Split for reverb (dry/wet)
        this.filter.lowpass.connect(this.reverb.dry);
        this.filter.lowpass.connect(this.reverb.convolver);
        this.reverb.convolver.connect(this.reverb.wet);

        // Merge reverb
        this.reverb.dry.connect(this.reverb.output);
        this.reverb.wet.connect(this.reverb.output);

        // Delay
        this.reverb.output.connect(this.delay.input);
        this.delay.input.connect(this.delay.output); // Dry
        this.delay.input.connect(this.delay.delay); // Wet
        this.delay.delay.connect(this.delay.wet);
        this.delay.wet.connect(this.delay.output);

        // Compression
        this.delay.output.connect(this.compressor);

        // Output
        this.compressor.connect(this.output);
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume = 0.7) {
        this.output.gain.setValueAtTime(volume, this.ctx.currentTime);
    }

    /**
     * Create a send effect (returns a gain node to connect to)
     */
    createSend(effectType = 'reverb') {
        const send = this.ctx.createGain();
        send.gain.value = 0.5;

        switch(effectType) {
            case 'reverb':
                send.connect(this.reverb.convolver);
                break;
            case 'delay':
                send.connect(this.delay.delay);
                break;
            default:
                send.connect(this.input);
        }

        return send;
    }
}
