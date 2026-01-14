/**
 * Composition Engine - Generates musical structure from text parameters
 *
 * Creates:
 * - Overall musical arc (intro, development, outro)
 * - Event timeline for each voice
 * - Note selections and timings
 * - Dynamic changes over time
 */

class CompositionEngine {
    constructor() {
        this.composition = null;
    }

    /**
     * Generate complete composition from text and parameters
     */
    generate(text, musicalParams) {
        const {
            mood,
            tension,
            density,
            tempo,
            scale,
            scaleNotes,
            rootNote,
            voiceWeights,
            activeVoices,
            effects,
            structure,
            analyses
        } = musicalParams;

        // Calculate total duration based on text length and reading pace
        const wordCount = text.split(/\s+/).length;
        const baseDuration = this.calculateDuration(wordCount, tempo);

        // Create overall arc (intro, body, outro)
        const arc = this.createArc(baseDuration, structure.structure.arc);

        // Generate timeline events for each active voice
        const timeline = this.generateTimeline(
            arc,
            scaleNotes,
            rootNote,
            activeVoices,
            voiceWeights,
            mood,
            tension,
            density,
            tempo,
            structure
        );

        // Store composition
        this.composition = {
            duration: baseDuration,
            arc: arc,
            timeline: timeline,
            params: musicalParams,
            text: text
        };

        return this.composition;
    }

    /**
     * Calculate composition duration
     */
    calculateDuration(wordCount, tempo) {
        // Base: 300ms per word for reading
        const readingDuration = wordCount * 300;

        // Adjust by tempo
        const adjusted = readingDuration / tempo;

        // Add intro and outro padding
        const total = adjusted + 8000; // 4s intro + 4s outro

        // Minimum 20 seconds, maximum 5 minutes
        return Math.max(20000, Math.min(300000, total));
    }

    /**
     * Create musical arc structure
     */
    createArc(duration, arcType = 'balanced') {
        const sections = [];

        // Intro (gradual emergence)
        sections.push({
            name: 'intro',
            start: 0,
            duration: Math.min(4000, duration * 0.15),
            densityMultiplier: 0.3,
            dynamicLevel: 0.4
        });

        // Body (main content)
        const bodyStart = sections[0].duration;
        const bodyDuration = duration - bodyStart - Math.min(4000, duration * 0.15);

        // Divide body based on arc type
        if (arcType === 'rising') {
            // Gradual build
            sections.push({
                name: 'development',
                start: bodyStart,
                duration: bodyDuration,
                densityMultiplier: [0.5, 1.0], // Grows over time
                dynamicLevel: [0.6, 0.9]
            });
        } else if (arcType === 'falling') {
            // Gradual decline
            sections.push({
                name: 'development',
                start: bodyStart,
                duration: bodyDuration,
                densityMultiplier: [1.0, 0.5], // Decreases over time
                dynamicLevel: [0.9, 0.6]
            });
        } else {
            // Balanced (stable middle)
            sections.push({
                name: 'development',
                start: bodyStart,
                duration: bodyDuration,
                densityMultiplier: 0.8,
                dynamicLevel: 0.75
            });
        }

        // Outro (gradual fade)
        sections.push({
            name: 'outro',
            start: duration - Math.min(4000, duration * 0.15),
            duration: Math.min(4000, duration * 0.15),
            densityMultiplier: 0.2,
            dynamicLevel: 0.3
        });

        return {
            duration: duration,
            sections: sections,
            type: arcType
        };
    }

    /**
     * Generate timeline of events for all voices
     */
    generateTimeline(arc, scaleNotes, rootNote, activeVoices, voiceWeights, mood, tension, density, tempo, structure) {
        const timeline = {};

        for (const voiceType of activeVoices) {
            timeline[voiceType] = this.generateVoiceTimeline(
                voiceType,
                arc,
                scaleNotes,
                rootNote,
                voiceWeights[`${voiceType}Weight`] || 0.5,
                mood,
                tension,
                density,
                tempo,
                structure
            );
        }

        return timeline;
    }

    /**
     * Generate timeline for a specific voice type
     */
    generateVoiceTimeline(voiceType, arc, scaleNotes, rootNote, weight, mood, tension, density, tempo, structure) {
        const events = [];
        let currentTime = 0;

        switch (voiceType) {
            case 'drone':
                events.push(...this.generateDroneEvents(arc, scaleNotes, rootNote, weight));
                break;

            case 'pad':
                events.push(...this.generatePadEvents(arc, scaleNotes, rootNote, weight, mood, density));
                break;

            case 'melody':
                events.push(...this.generateMelodyEvents(arc, scaleNotes, weight, tempo, structure));
                break;

            case 'texture':
                events.push(...this.generateTextureEvents(arc, scaleNotes, weight, density));
                break;

            case 'pulse':
                events.push(...this.generatePulseEvents(arc, scaleNotes, weight, tempo));
                break;

            case 'atmosphere':
                events.push(...this.generateAtmosphereEvents(arc, scaleNotes, weight, mood));
                break;
        }

        return events;
    }

    /**
     * Generate drone events (sustained foundation)
     */
    generateDroneEvents(arc, scaleNotes, rootNote, weight) {
        const events = [];

        // Drone plays throughout entire piece
        const lowNotes = scaleNotes.filter(n => n >= rootNote && n < rootNote + 12);
        const droneNote = lowNotes[0]; // Root

        events.push({
            time: arc.sections[0].start,
            type: 'note',
            frequency: ScaleLibrary.midiToFrequency(droneNote),
            duration: arc.duration,
            velocity: 0.3 * weight
        });

        // Add fifth for richness
        if (lowNotes.length >= 5) {
            events.push({
                time: arc.sections[0].start + 2000,
                type: 'note',
                frequency: ScaleLibrary.midiToFrequency(lowNotes[4]), // Fifth
                duration: arc.duration - 2000,
                velocity: 0.2 * weight
            });
        }

        return events;
    }

    /**
     * Generate pad events (harmonic bed)
     */
    generatePadEvents(arc, scaleNotes, rootNote, weight, mood, density) {
        const events = [];
        let currentTime = arc.sections[0].start + 3000; // Start after intro

        while (currentTime < arc.duration - 4000) {
            // Select chord notes
            const chordSize = Math.floor(2 + density * 2); // 2-4 notes
            const chordNotes = CompositionRules.selectChordNotes(scaleNotes, rootNote, chordSize, tension);

            // Play chord
            for (const note of chordNotes) {
                events.push({
                    time: currentTime,
                    type: 'note',
                    frequency: ScaleLibrary.midiToFrequency(note),
                    duration: 6000 + Math.random() * 4000,
                    velocity: (0.4 + Math.random() * 0.2) * weight
                });
            }

            // Next chord
            currentTime += 4000 + Math.random() * 4000;
        }

        return events;
    }

    /**
     * Generate melody events (sparse phrases)
     */
    generateMelodyEvents(arc, scaleNotes, weight, tempo, structure) {
        const events = [];
        const midNotes = scaleNotes.filter(n => n >= 60 && n < 84); // C4-C6

        if (midNotes.length === 0) return events;

        let currentTime = arc.sections[0].start + 5000;
        let previousNote = null;

        // Create melodic phrases based on sentence boundaries
        const phrases = structure.musicalPhrases || [];

        for (const phrase of phrases) {
            if (Math.random() > weight) continue; // Skip some phrases based on weight

            const phraseNotes = 3 + Math.floor(Math.random() * 4); // 3-6 notes

            for (let i = 0; i < phraseNotes; i++) {
                const note = CompositionRules.getNextMelodicNote(midNotes, previousNote);
                previousNote = note;

                events.push({
                    time: currentTime,
                    type: 'note',
                    frequency: ScaleLibrary.midiToFrequency(note),
                    duration: 800 + Math.random() * 1200,
                    velocity: 0.5 + Math.random() * 0.2
                });

                currentTime += (400 + Math.random() * 600) / tempo;
            }

            // Pause between phrases
            currentTime += (1000 + Math.random() * 2000) / tempo;
        }

        return events;
    }

    /**
     * Generate texture events (atmospheric)
     */
    generateTextureEvents(arc, scaleNotes, weight, density) {
        const events = [];
        const highNotes = scaleNotes.filter(n => n >= 72); // C5 and above

        if (highNotes.length === 0) return events;

        let currentTime = arc.sections[0].start + 6000;

        while (currentTime < arc.duration - 4000) {
            if (Math.random() < density * weight) {
                const note = highNotes[Math.floor(Math.random() * highNotes.length)];

                events.push({
                    time: currentTime,
                    type: 'note',
                    frequency: ScaleLibrary.midiToFrequency(note),
                    duration: 1000 + Math.random() * 2000,
                    velocity: 0.2 + Math.random() * 0.3
                });
            }

            currentTime += 500 + Math.random() * 1500;
        }

        return events;
    }

    /**
     * Generate pulse events (gentle rhythm)
     */
    generatePulseEvents(arc, scaleNotes, weight, tempo) {
        const events = [];
        const midLowNotes = scaleNotes.filter(n => n >= 48 && n < 72); // C3-C5

        if (midLowNotes.length === 0 || weight < 0.3) return events;

        let currentTime = arc.sections[0].start + 8000;
        const interval = (2000 / tempo); // Slower pulse for ambient

        while (currentTime < arc.duration - 4000) {
            if (Math.random() < weight * 0.7) {
                const note = midLowNotes[Math.floor(Math.random() * midLowNotes.length)];

                events.push({
                    time: currentTime,
                    type: 'note',
                    frequency: ScaleLibrary.midiToFrequency(note),
                    duration: 400,
                    velocity: 0.3 + Math.random() * 0.2
                });
            }

            currentTime += interval;
        }

        return events;
    }

    /**
     * Generate atmosphere events (environmental wash)
     */
    generateAtmosphereEvents(arc, scaleNotes, weight, mood) {
        const events = [];

        // Long, evolving pad sounds throughout
        let currentTime = arc.sections[0].start + 4000;

        while (currentTime < arc.duration - 8000) {
            const chordSize = 3 + Math.floor(Math.random() * 2);
            const chordNotes = CompositionRules.selectChordNotes(scaleNotes, scaleNotes[Math.floor(scaleNotes.length / 3)], chordSize, 0.2);

            for (const note of chordNotes) {
                events.push({
                    time: currentTime,
                    type: 'note',
                    frequency: ScaleLibrary.midiToFrequency(note),
                    duration: 10000 + Math.random() * 8000,
                    velocity: (0.25 + Math.random() * 0.15) * weight
                });
            }

            currentTime += 8000 + Math.random() * 6000;
        }

        return events;
    }

    /**
     * Get composition
     */
    getComposition() {
        return this.composition;
    }
}
