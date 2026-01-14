/**
 * Composition Rules - Guidelines for beautiful ambient music
 *
 * Ensures that generated music is:
 * - Always harmonically consonant
 * - Never too dense or chaotic
 * - Properly balanced across voices
 * - Musically coherent
 */

const CompositionRules = {

    /**
     * Constraints for ambient music
     */
    constraints: {
        maxVoices: 6, // Never more than 6 simultaneous voices
        minNoteDuration: 500, // Minimum note length in ms
        maxNoteDuration: 12000, // Maximum note length in ms
        consonanceBias: 0.8, // 80% consonant intervals
        densityRange: [0.1, 0.7], // Density limits
        tempoRange: [0.3, 1.2], // Tempo multiplier limits
    },

    /**
     * Consonant intervals (in semitones)
     */
    consonantIntervals: [0, 3, 4, 5, 7, 8, 9, 12], // Unison, m3, M3, P4, P5, m6, M6, Octave

    /**
     * Dissonant intervals (use sparingly)
     */
    dissonantIntervals: [1, 2, 6, 10, 11], // m2, M2, tritone, m7, M7

    /**
     * Voice leading rules
     */
    voiceLeading: {
        maxInterval: 7, // Max semitones between consecutive notes
        preferStepwise: 0.7, // 70% of movements should be stepwise
        avoidParallelFifths: true
    },

    /**
     * Validate and constrain parameters
     */
    constrainParameters(params) {
        return {
            ...params,
            density: this.clamp(params.density, this.constraints.densityRange[0], this.constraints.densityRange[1]),
            tempo: this.clamp(params.tempo, this.constraints.tempoRange[0], this.constraints.tempoRange[1]),
            mood: this.clamp(params.mood, -1, 1),
            tension: this.clamp(params.tension, 0, 1)
        };
    },

    /**
     * Select harmonically appropriate notes for a chord
     */
    selectChordNotes(scaleNotes, rootNote, voiceCount, tension = 0.3) {
        const notes = [];

        // Always include root
        notes.push(rootNote);

        // Add consonant intervals based on tension
        const consonanceThreshold = 1 - (tension * 0.3); // Less tension = more consonance

        const availableNotes = scaleNotes.filter(note =>
            Math.abs(note - rootNote) < 24 // Within 2 octaves
        );

        while (notes.length < voiceCount && availableNotes.length > 0) {
            const candidate = availableNotes[Math.floor(Math.random() * availableNotes.length)];

            // Check if adding this note creates consonant intervals
            let isConsonant = true;

            for (const existingNote of notes) {
                const interval = Math.abs(candidate - existingNote) % 12;

                if (this.dissonantIntervals.includes(interval) && Math.random() > (1 - consonanceThreshold)) {
                    isConsonant = false;
                    break;
                }
            }

            if (isConsonant || Math.random() < 0.2) { // 20% chance to add anyway
                notes.push(candidate);
            }

            // Remove from candidates to avoid infinite loop
            const idx = availableNotes.indexOf(candidate);
            if (idx > -1) availableNotes.splice(idx, 1);
        }

        return notes.sort((a, b) => a - b);
    },

    /**
     * Get next melodic note following voice leading rules
     */
    getNextMelodicNote(scaleNotes, previousNote, direction = 'any') {
        if (previousNote === null) {
            return scaleNotes[Math.floor(scaleNotes.length / 2)]; // Start in middle
        }

        // Prefer stepwise motion
        const nearby = scaleNotes.filter(note => {
            const interval = Math.abs(note - previousNote);
            return interval > 0 && interval <= this.voiceLeading.maxInterval;
        });

        if (nearby.length === 0) {
            return scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
        }

        // Apply direction preference
        let candidates = nearby;

        if (direction === 'up') {
            candidates = nearby.filter(note => note > previousNote);
        } else if (direction === 'down') {
            candidates = nearby.filter(note => note < previousNote);
        }

        if (candidates.length === 0) {
            candidates = nearby; // Fall back if no notes in preferred direction
        }

        // Prefer smaller intervals
        if (Math.random() < this.voiceLeading.preferStepwise) {
            const stepwise = candidates.filter(note =>
                Math.abs(note - previousNote) <= 2
            );

            if (stepwise.length > 0) {
                candidates = stepwise;
            }
        }

        return candidates[Math.floor(Math.random() * candidates.length)];
    },

    /**
     * Calculate note duration based on parameters
     */
    calculateNoteDuration(wordLength, tempo, density) {
        // Base duration from word length (longer words = longer notes)
        let baseDuration = 1000 + (wordLength * 200);

        // Modify by tempo
        baseDuration = baseDuration / tempo;

        // Modify by density (higher density = shorter notes to prevent mud)
        baseDuration = baseDuration * (1.5 - density);

        // Constrain to limits
        return this.clamp(
            baseDuration,
            this.constraints.minNoteDuration,
            this.constraints.maxNoteDuration
        );
    },

    /**
     * Determine active voices based on weights
     */
    selectActiveVoices(weights) {
        const voices = [];
        const voiceTypes = ['drone', 'pad', 'melody', 'texture', 'pulse', 'atmosphere'];

        for (const type of voiceTypes) {
            const weight = weights[`${type}Weight`] || 0;

            // Voice is active if weight > threshold and random check passes
            if (weight > 0.2 && Math.random() < weight) {
                voices.push(type);
            }
        }

        // Always have at least drone for grounding
        if (!voices.includes('drone') && Math.random() < 0.7) {
            voices.push('drone');
        }

        // Limit to max voices
        if (voices.length > this.constraints.maxVoices) {
            // Keep highest weighted voices
            voices.sort((a, b) =>
                (weights[`${b}Weight`] || 0) - (weights[`${a}Weight`] || 0)
            );
            return voices.slice(0, this.constraints.maxVoices);
        }

        return voices;
    },

    /**
     * Create harmonic progression from mood and tension
     */
    createProgression(scaleNotes, rootMidi, mood, tension, length = 4) {
        const progression = [];
        const scale = scaleNotes.filter(note =>
            note >= rootMidi && note < rootMidi + 12
        );

        // Map mood and tension to scale degree preferences
        let degrees;

        if (mood > 0.5) {
            // Bright: I - IV - V - I
            degrees = [0, 3, 4, 0];
        } else if (mood > 0) {
            // Balanced: I - VI - IV - V
            degrees = [0, 5, 3, 4];
        } else if (mood > -0.5) {
            // Minor: I - VI - III - VII
            degrees = [0, 5, 2, 6];
        } else {
            // Dark: I - II - V - I
            degrees = [0, 1, 4, 0];
        }

        // Add tension with modal interchange
        if (tension > 0.6 && degrees.length > 2) {
            degrees[1] = (degrees[1] + 1) % scale.length; // Substitute chord
        }

        for (let i = 0; i < length; i++) {
            const degree = degrees[i % degrees.length];
            const root = scale[degree % scale.length];
            progression.push(root);
        }

        return progression;
    },

    /**
     * Utility: Clamp value to range
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Utility: Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Map a value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    }
};
