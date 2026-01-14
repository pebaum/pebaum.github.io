/**
 * Continuous Generative Engine - Never-ending ambient music
 *
 * Uses probabilistic rules and Markov chains to generate
 * continuously evolving ambient music based on text parameters
 */

class ContinuousEngine {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.isRunning = false;
        this.params = null;
        this.scaleNotes = [];
        this.rootNote = 60;

        // Markov chains for each voice
        this.markovChains = {};

        // Voice states
        this.voiceStates = {
            drone: { active: false, currentNote: null, nextTrigger: 0 },
            pad: { active: false, currentChord: [], nextTrigger: 0 },
            melody: { active: false, currentNote: null, direction: 'any', nextTrigger: 0 },
            texture: { active: false, nextTrigger: 0 },
            pulse: { active: false, nextTrigger: 0 },
            atmosphere: { active: false, currentChord: [], nextTrigger: 0 }
        };

        // Update interval
        this.updateInterval = null;
        this.updateRate = 100; // Check every 100ms

        // Time tracking
        this.startTime = 0;
        this.elapsedTime = 0;
    }

    /**
     * Start continuous generation
     */
    async start(musicalParams) {
        if (this.isRunning) return;

        this.params = musicalParams;
        this.scaleNotes = musicalParams.scaleNotes;
        this.rootNote = musicalParams.rootNote;

        // Initialize audio engine
        if (!this.audioEngine.isInitialized) {
            await this.audioEngine.initialize();
        }

        await this.audioEngine.resume();

        // Apply effects
        this.applyEffects();

        // Build Markov chains
        this.buildMarkovChains();

        // Initialize voice states
        this.initializeVoices();

        // Start the generative loop
        this.isRunning = true;
        this.startTime = Date.now();
        this.updateInterval = setInterval(() => this.update(), this.updateRate);

        console.log('Continuous engine started');
    }

    /**
     * Stop generation
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.audioEngine.stopAll();

        console.log('Continuous engine stopped');
    }

    /**
     * Apply effects settings
     */
    applyEffects() {
        const effects = this.params.effects;
        this.audioEngine.setReverbSize(effects.reverbSize);
        this.audioEngine.setReverbMix(effects.reverbMix);
        this.audioEngine.setDelayTime(effects.delayTime);
        this.audioEngine.setLowPass(effects.lowPass);
        this.audioEngine.setHighPass(effects.highPass);
    }

    /**
     * Build Markov chains for melodic movement
     */
    buildMarkovChains() {
        this.markovChains = {
            melody: this.buildMelodicMarkovChain(this.scaleNotes),
            texture: this.buildTextureMarkovChain(this.scaleNotes)
        };
    }

    /**
     * Build melodic Markov chain
     */
    buildMelodicMarkovChain(notes) {
        const chain = {};

        // For each note, define probable next notes (stepwise motion preferred)
        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            const transitions = [];

            // Stepwise motion (high probability)
            if (i > 0) transitions.push({ note: notes[i - 1], weight: 0.3 }); // Step down
            if (i < notes.length - 1) transitions.push({ note: notes[i + 1], weight: 0.3 }); // Step up

            // Skip motion (medium probability)
            if (i > 1) transitions.push({ note: notes[i - 2], weight: 0.1 });
            if (i < notes.length - 2) transitions.push({ note: notes[i + 2], weight: 0.1 });

            // Leap motion (low probability)
            if (i > 3) transitions.push({ note: notes[i - 4], weight: 0.05 });
            if (i < notes.length - 4) transitions.push({ note: notes[i + 4], weight: 0.05 });

            // Stay on same note (rest/repeat)
            transitions.push({ note: note, weight: 0.1 });

            chain[note] = transitions;
        }

        return chain;
    }

    /**
     * Build texture Markov chain (more random)
     */
    buildTextureMarkovChain(notes) {
        const chain = {};

        for (const note of notes) {
            const transitions = notes.map(n => ({
                note: n,
                weight: 1.0 / notes.length // Equal probability
            }));

            chain[note] = transitions;
        }

        return chain;
    }

    /**
     * Initialize voice states
     */
    initializeVoices() {
        const now = Date.now();

        for (const voiceType of this.params.activeVoices) {
            this.voiceStates[voiceType].active = true;

            // Stagger initial triggers
            const delay = Math.random() * 2000;
            this.voiceStates[voiceType].nextTrigger = now + delay;
        }
    }

    /**
     * Main update loop
     */
    update() {
        if (!this.isRunning) return;

        const now = Date.now();
        this.elapsedTime = now - this.startTime;

        // Update each active voice
        for (const voiceType of this.params.activeVoices) {
            const state = this.voiceStates[voiceType];

            if (state.active && now >= state.nextTrigger) {
                this.triggerVoice(voiceType, state);
            }
        }
    }

    /**
     * Trigger a voice to play
     */
    triggerVoice(voiceType, state) {
        const params = this.params;

        switch (voiceType) {
            case 'drone':
                this.triggerDrone(state, params);
                break;

            case 'pad':
                this.triggerPad(state, params);
                break;

            case 'melody':
                this.triggerMelody(state, params);
                break;

            case 'texture':
                this.triggerTexture(state, params);
                break;

            case 'pulse':
                this.triggerPulse(state, params);
                break;

            case 'atmosphere':
                this.triggerAtmosphere(state, params);
                break;
        }
    }

    /**
     * Trigger drone note
     */
    triggerDrone(state, params) {
        const lowNotes = this.scaleNotes.filter(n => n >= this.rootNote && n < this.rootNote + 12);

        if (lowNotes.length === 0) return;

        const droneNote = lowNotes[0]; // Root
        const frequency = ScaleLibrary.midiToFrequency(droneNote);
        const duration = 20000 + Math.random() * 10000; // 20-30 seconds

        this.audioEngine.playNote('drone', frequency, duration, 0.25);

        state.currentNote = droneNote;
        state.nextTrigger = Date.now() + duration * 0.9; // Overlap slightly
    }

    /**
     * Trigger pad chord
     */
    triggerPad(state, params) {
        const chordSize = 2 + Math.floor(params.density * 2); // 2-4 notes
        const chordNotes = CompositionRules.selectChordNotes(
            this.scaleNotes,
            this.rootNote,
            chordSize,
            params.tension
        );

        const duration = 6000 + Math.random() * 6000; // 6-12 seconds

        for (const note of chordNotes) {
            const frequency = ScaleLibrary.midiToFrequency(note);
            const velocity = 0.3 + Math.random() * 0.2;
            this.audioEngine.playNote('pad', frequency, duration, velocity);
        }

        state.currentChord = chordNotes;
        state.nextTrigger = Date.now() + duration * 0.8; // Overlap
    }

    /**
     * Trigger melody note using Markov chain
     */
    triggerMelody(state, params) {
        const weight = params.voiceWeights.melodyWeight || 0.5;

        // Probabilistic triggering based on weight
        if (Math.random() > weight) {
            state.nextTrigger = Date.now() + 1000;
            return;
        }

        const midNotes = this.scaleNotes.filter(n => n >= 60 && n < 84);

        if (midNotes.length === 0) return;

        // Use Markov chain for next note
        let nextNote;
        if (state.currentNote && this.markovChains.melody[state.currentNote]) {
            nextNote = this.selectFromMarkovChain(this.markovChains.melody[state.currentNote]);
        } else {
            // Start with random note
            nextNote = midNotes[Math.floor(Math.random() * midNotes.length)];
        }

        const frequency = ScaleLibrary.midiToFrequency(nextNote);
        const duration = 800 + Math.random() * 1000;
        const velocity = 0.4 + Math.random() * 0.3;

        this.audioEngine.playNote('melody', frequency, duration, velocity);

        state.currentNote = nextNote;

        // Next trigger based on tempo
        const interval = (600 + Math.random() * 800) / params.tempo;
        state.nextTrigger = Date.now() + interval;
    }

    /**
     * Trigger texture note
     */
    triggerTexture(state, params) {
        const weight = params.voiceWeights.textureWeight || 0.3;

        // Probabilistic triggering based on density and weight
        if (Math.random() > params.density * weight) {
            state.nextTrigger = Date.now() + 500;
            return;
        }

        const highNotes = this.scaleNotes.filter(n => n >= 72);

        if (highNotes.length === 0) return;

        const note = highNotes[Math.floor(Math.random() * highNotes.length)];
        const frequency = ScaleLibrary.midiToFrequency(note);
        const duration = 1000 + Math.random() * 2000;
        const velocity = 0.2 + Math.random() * 0.2;

        this.audioEngine.playNote('texture', frequency, duration, velocity);

        state.nextTrigger = Date.now() + 800 + Math.random() * 1500;
    }

    /**
     * Trigger pulse note
     */
    triggerPulse(state, params) {
        const weight = params.voiceWeights.pulseWeight || 0.3;

        if (Math.random() > weight * 0.7) {
            state.nextTrigger = Date.now() + 1000;
            return;
        }

        const midLowNotes = this.scaleNotes.filter(n => n >= 48 && n < 72);

        if (midLowNotes.length === 0) return;

        const note = midLowNotes[Math.floor(Math.random() * midLowNotes.length)];
        const frequency = ScaleLibrary.midiToFrequency(note);
        const duration = 400;
        const velocity = 0.25 + Math.random() * 0.15;

        this.audioEngine.playNote('pulse', frequency, duration, velocity);

        // Rhythmic pattern
        const interval = (2000 / params.tempo);
        state.nextTrigger = Date.now() + interval;
    }

    /**
     * Trigger atmosphere chord
     */
    triggerAtmosphere(state, params) {
        const weight = params.voiceWeights.atmosphereWeight || 0.5;

        if (Math.random() > weight * 0.6) {
            state.nextTrigger = Date.now() + 3000;
            return;
        }

        const chordSize = 3 + Math.floor(Math.random() * 2);
        const chordNotes = CompositionRules.selectChordNotes(
            this.scaleNotes,
            this.scaleNotes[Math.floor(this.scaleNotes.length / 3)],
            chordSize,
            0.2
        );

        const duration = 10000 + Math.random() * 8000;

        for (const note of chordNotes) {
            const frequency = ScaleLibrary.midiToFrequency(note);
            const velocity = 0.2 + Math.random() * 0.15;
            this.audioEngine.playNote('atmosphere', frequency, duration, velocity);
        }

        state.currentChord = chordNotes;
        state.nextTrigger = Date.now() + 8000 + Math.random() * 6000;
    }

    /**
     * Select next note from Markov chain
     */
    selectFromMarkovChain(transitions) {
        const totalWeight = transitions.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;

        for (const transition of transitions) {
            random -= transition.weight;
            if (random <= 0) {
                return transition.note;
            }
        }

        return transitions[0].note; // Fallback
    }

    /**
     * Get elapsed time
     */
    getElapsedTime() {
        return this.elapsedTime;
    }

    /**
     * Check if running
     */
    isGenerating() {
        return this.isRunning;
    }
}
