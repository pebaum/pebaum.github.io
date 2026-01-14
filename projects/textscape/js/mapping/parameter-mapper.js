/**
 * Parameter Mapper - Translates text analysis to musical parameters
 *
 * Combines analysis from all analyzers and maps to:
 * - Global musical parameters (mood, density, tension, tempo)
 * - Scale and mode selection
 * - Voice activation and weights
 * - Effects parameters
 */

const ParameterMapper = {

    /**
     * Main mapping function - combines all analyses
     */
    mapTextToMusic(text, culturalContext = 'multicultural', userBias = {}) {
        // STEP 0: Calculate global tonal center FIRST to ensure musical coherence
        const tonalCenter = TonalCenterCalculator.calculateTonalCenter(text, culturalContext);

        // Run all analyzers
        const phonetic = PhoneticAnalyzer.analyze(text);
        const lexical = LexicalAnalyzer.analyze(text);
        const sentiment = SentimentAnalyzer.analyze(text, culturalContext);
        const structural = StructuralAnalyzer.analyze(text);
        const complexity = ComplexityAnalyzer.analyze(text);

        // Detect special word categories
        const wordCategories = SentimentAnalyzer.detectWordCategories(text);

        // Calculate base musical parameters
        const baseParams = this.calculateBaseParameters(
            phonetic,
            lexical,
            sentiment,
            structural,
            complexity,
            wordCategories
        );

        // Apply cultural context
        const culturalParams = this.applyCulturalContext(baseParams, sentiment, culturalContext);

        // Use GLOBAL scale and mode (already calculated from tonal center)
        const scaleSelection = {
            scale: tonalCenter.globalMode,
            rootNote: tonalCenter.globalKey
        };

        // Calculate voice weights
        const voiceWeights = this.calculateVoiceWeights(
            phonetic,
            lexical,
            sentiment,
            complexity,
            wordCategories
        );

        // Calculate effects parameters
        const effectsParams = this.calculateEffectsParameters(
            wordCategories,
            culturalParams
        );

        // Apply user bias (slider overrides)
        const finalParams = this.applyUserBias(culturalParams, userBias);

        // Constrain all parameters to safe ranges
        const constrainedParams = CompositionRules.constrainParameters(finalParams);

        return {
            // Global tonal center (LOCKED for entire piece)
            tonalCenter: tonalCenter,

            // Global parameters
            mood: constrainedParams.mood, // -1 to 1
            tension: constrainedParams.tension, // 0 to 1
            density: constrainedParams.density, // 0 to 1
            tempo: constrainedParams.tempo, // Multiplier

            // Scale information
            scale: scaleSelection.scale,
            scaleName: scaleSelection.scale.name,
            rootNote: scaleSelection.rootNote,
            scaleNotes: ScaleLibrary.getScaleNotes(scaleSelection.scale, scaleSelection.rootNote),

            // Voice weights
            voiceWeights: voiceWeights,
            activeVoices: CompositionRules.selectActiveVoices(voiceWeights),

            // Effects
            effects: effectsParams,

            // Structure
            structure: structural,

            // Raw analyses (for debugging/visualization)
            analyses: {
                phonetic,
                lexical,
                sentiment,
                structural,
                complexity,
                wordCategories
            }
        };
    },

    /**
     * Calculate base parameters from all analyses
     */
    calculateBaseParameters(phonetic, lexical, sentiment, structural, complexity, wordCategories) {
        // Mood primarily from sentiment
        let mood = sentiment.mood;

        // Adjust mood based on word categories
        if (wordCategories.colors.length > 0) {
            const avgColorMood = wordCategories.colors.reduce((sum, c) => sum + (c.params.mood || 0), 0) / wordCategories.colors.length;
            mood = (mood * 0.7) + (avgColorMood * 0.3);
        }

        // Tension from sentiment, complexity, and structural elements
        let tension = sentiment.tension * 0.4;
        tension += complexity.overallComplexity * 0.3;
        tension += structural.punctuationProfile.ratios.exclamation * 0.3;

        // Density from multiple sources
        let density = 0.4; // Base
        density += lexical.lexicalDiversity * 0.2;
        density += complexity.informationDensity * 0.2;
        density += sentiment.arousal * 0.1;

        // Tempo from arousal and temporal words
        let tempo = 0.7; // Base slow tempo for ambient
        tempo += sentiment.arousal * 0.3;

        // Adjust tempo based on temporal words
        if (wordCategories.temporal.length > 0) {
            const avgTempo = wordCategories.temporal.reduce((sum, t) => sum + (t.params.tempo || 1.0), 0) / wordCategories.temporal.length;
            tempo = (tempo * 0.6) + (avgTempo * 0.4);
        }

        return { mood, tension, density, tempo };
    },

    /**
     * Apply cultural context to parameters
     */
    applyCulturalContext(baseParams, sentiment, culturalContext) {
        const params = { ...baseParams };

        // If specific emotions detected, use their cultural mappings
        if (sentiment.detectedEmotions.length > 0) {
            const emotion = sentiment.detectedEmotions[0];

            if (emotion.parameters) {
                // Blend emotion parameters with base
                params.mood = (params.mood * 0.6) + ((emotion.parameters.mood || 0) * 0.4);
                params.tension = (params.tension * 0.6) + ((emotion.parameters.tension || 0) * 0.4);
                params.density = (params.density * 0.6) + ((emotion.parameters.density || 0.5) * 0.4);
                params.tempo = (params.tempo * 0.6) + ((emotion.parameters.tempo || 1.0) * 0.4);
            }
        }

        // Apply cultural-specific concepts
        if (sentiment.culturalConcepts.length > 0) {
            const concept = sentiment.culturalConcepts[0];

            if (concept.parameters) {
                params.mood = (params.mood * 0.7) + ((concept.parameters.mood || 0) * 0.3);
                params.tension = (params.tension * 0.7) + ((concept.parameters.tension || 0) * 0.3);
            }
        }

        return params;
    },

    /**
     * Select scale based on parameters and cultural context
     *
     * DEPRECATED: This function is kept for backward compatibility but should not be used
     * for new code as it can cause key-jumping issues. Use TonalCenterCalculator instead.
     */
    selectScale(params, culturalContext) {
        console.warn('⚠️ selectScale() is deprecated. Use TonalCenterCalculator.calculateTonalCenter() instead.');

        // Use ScaleLibrary to select appropriate scale
        const scale = ScaleLibrary.selectScale(params.mood, params.tension, culturalContext);

        // Select root note based on mood
        // Lower mood = lower root note
        const rootNotes = [36, 38, 40, 41, 43, 45]; // C2, D2, E2, F2, G2, A2
        const index = Math.floor(CompositionRules.mapRange(params.mood, -1, 1, 0, rootNotes.length - 1));
        const rootNote = rootNotes[Math.max(0, Math.min(index, rootNotes.length - 1))];

        return {
            scale: scale,
            rootNote: rootNote
        };
    },

    /**
     * Calculate voice weights from analyses
     */
    calculateVoiceWeights(phonetic, lexical, sentiment, complexity, wordCategories) {
        const weights = {};

        // Drone: Always present for grounding, stronger with low arousal
        weights.droneWeight = 0.7 + ((1 - sentiment.arousal) * 0.3);

        // Pad: From phonetic smoothness and lexical complexity
        weights.padWeight = phonetic.smoothness * 0.4 + lexical.lexicalDiversity * 0.3;
        weights.padWeight += wordCategories.spatial.length > 0 ? 0.3 : 0;

        // Melody: From nouns (lexical POS) and concrete language
        weights.melodyWeight = lexical.partOfSpeech.nouns * 0.6;
        weights.melodyWeight += (1 - complexity.abstractionLevel) * 0.4;

        // Texture: From adjectives and abstract language
        weights.textureWeight = lexical.partOfSpeech.adjectives * 0.5;
        weights.textureWeight += complexity.abstractionLevel * 0.3;
        weights.textureWeight += wordCategories.textural.length * 0.05;

        // Pulse: From verbs and rhythmic elements
        weights.pulseWeight = lexical.partOfSpeech.verbs * 0.6;
        weights.pulseWeight += phonetic.consonantProfile.plosive * 0.3;
        weights.pulseWeight += sentiment.arousal * 0.1;

        // Atmosphere: From overall mood and nature words
        weights.atmosphereWeight = 0.5;
        weights.atmosphereWeight += wordCategories.nature.length * 0.1;
        weights.atmosphereWeight += complexity.abstractionLevel * 0.2;

        // Normalize weights
        const maxWeight = Math.max(...Object.values(weights), 1.0);
        for (const key in weights) {
            weights[key] = weights[key] / maxWeight;
        }

        return weights;
    },

    /**
     * Calculate effects parameters
     */
    calculateEffectsParameters(wordCategories, params) {
        const effects = {
            reverbSize: 'cathedral', // Default to large
            reverbMix: 0.5,
            delayTime: 0.375,
            delayMix: 0.15,
            lowPass: 0.8,
            highPass: 0.1
        };

        // Adjust reverb based on spatial words
        if (wordCategories.spatial.length > 0) {
            const spatialParams = wordCategories.spatial[0].params;

            if (spatialParams.reverbSize) {
                effects.reverbSize = spatialParams.reverbSize;
            }

            if (spatialParams.density !== undefined) {
                effects.reverbMix = 0.3 + ((1 - spatialParams.density) * 0.4); // More reverb when sparse
            }
        }

        // Adjust filters based on textural words
        if (wordCategories.textural.length > 0) {
            const texturalParams = wordCategories.textural[0].params;

            if (texturalParams.filterCutoff !== undefined) {
                effects.lowPass = texturalParams.filterCutoff;
            }

            if (texturalParams.brightness !== undefined) {
                effects.lowPass = texturalParams.brightness;
            }
        }

        // Adjust delay based on tempo
        effects.delayTime = 60 / (120 * params.tempo) * 1.5; // Dotted quarter note

        return effects;
    },

    /**
     * Apply user bias from UI sliders
     */
    applyUserBias(params, userBias) {
        const result = { ...params };

        if (userBias.moodBias !== undefined && userBias.moodBias !== 0) {
            result.mood = Math.max(-1, Math.min(1, result.mood + userBias.moodBias));
        }

        if (userBias.densityBias !== undefined && userBias.densityBias !== 0) {
            result.density = Math.max(0.1, Math.min(0.9, result.density + userBias.densityBias));
        }

        return result;
    }
};
