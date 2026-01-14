/**
 * Tonal Center Calculator - Determines overall key and mode for entire piece
 *
 * CRITICAL COMPONENT: Ensures musical coherence by calculating a compound metric
 * from ALL words in the text to determine ONE stable tonal center.
 *
 * This prevents unlistenable key-jumping and creates musically coherent pieces.
 */

const TonalCenterCalculator = {

    /**
     * Calculate the global tonal center for an entire text
     *
     * Returns an object with:
     * - globalKey: MIDI root note (e.g., 48 for C3)
     * - globalMode: Scale object from ScaleLibrary
     * - globalScale: Array of MIDI notes in the key
     * - tonalProfile: Statistics about the calculation
     * - allowedModulations: Temporary modulation rules
     */
    calculateTonalCenter(text, culturalContext = 'multicultural') {
        console.log('🎵 Calculating global tonal center...');

        // Step 1: Parse and analyze all words
        const wordAnalysis = this.analyzeAllWords(text);

        // Step 2: Calculate compound metrics (weighted averages)
        const compoundMetrics = this.calculateCompoundMetrics(wordAnalysis);

        // Step 3: Determine global key (root note)
        const globalKey = this.determineGlobalKey(compoundMetrics);

        // Step 4: Determine global mode (scale)
        const globalMode = this.determineGlobalMode(compoundMetrics, culturalContext);

        // Step 5: Get scale notes in the determined key
        const globalScale = ScaleLibrary.getScaleNotes(globalMode, globalKey);

        // Step 6: Define allowed modulations
        const allowedModulations = this.defineModulationRules(globalKey, globalMode);

        const result = {
            globalKey: globalKey,
            globalKeyName: this.midiToNoteName(globalKey),
            globalMode: globalMode,
            globalModeName: globalMode.name,
            globalScale: globalScale,
            compoundMetrics: compoundMetrics,
            tonalProfile: wordAnalysis.profile,
            allowedModulations: allowedModulations
        };

        console.log(`✓ Tonal Center: ${result.globalKeyName} ${result.globalModeName}`);
        console.log(`  Compound Valence: ${compoundMetrics.valence.toFixed(3)}`);
        console.log(`  Compound Arousal: ${compoundMetrics.arousal.toFixed(3)}`);
        console.log(`  Compound Dominance: ${compoundMetrics.dominance.toFixed(3)}`);

        return result;
    },

    /**
     * Analyze all words in the text and assign VAD values and weights
     */
    analyzeAllWords(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const wordData = [];
        const profile = {
            totalWords: words.length,
            wordsWithVAD: 0,
            wordsWithoutVAD: 0,
            contentWords: 0,
            functionWords: 0
        };

        // Common function words (lower weight)
        const functionWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        ]);

        // Count word frequencies
        const wordFrequency = {};
        words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });

        // Analyze each unique word
        const uniqueWords = [...new Set(words)];

        for (const word of uniqueWords) {
            const vad = this.getWordVAD(word);
            const isFunction = functionWords.has(word);
            const frequency = wordFrequency[word];

            // Calculate weight
            let weight = 1.0;

            // Function words get lower weight
            if (isFunction) {
                weight = 0.1;
                profile.functionWords += frequency;
            } else {
                profile.contentWords += frequency;
            }

            // Repeated words get boosted by frequency
            weight *= Math.sqrt(frequency); // Square root to avoid over-weighting

            // Capitalized in original text? (Need to check original)
            // For now, we'll use frequency as proxy for importance

            if (vad) {
                wordData.push({
                    word: word,
                    valence: vad.valence,
                    arousal: vad.arousal,
                    dominance: vad.dominance,
                    weight: weight,
                    frequency: frequency,
                    isFunction: isFunction
                });
                profile.wordsWithVAD += frequency;
            } else {
                // No VAD data - use neutral values with low weight
                wordData.push({
                    word: word,
                    valence: 0.0,
                    arousal: 0.5,
                    dominance: 0.5,
                    weight: weight * 0.2, // Lower weight for unknown words
                    frequency: frequency,
                    isFunction: isFunction,
                    missing: true
                });
                profile.wordsWithoutVAD += frequency;
            }
        }

        return {
            wordData: wordData,
            profile: profile
        };
    },

    /**
     * Get VAD values for a word (from database or fallback)
     */
    getWordVAD(word) {
        // Try to get from word-emotion-database if loaded
        if (window.wordEmotionDatabase && window.wordEmotionDatabase[word]) {
            const data = window.wordEmotionDatabase[word];
            return {
                valence: data.valence || 0.0,
                arousal: data.arousal || 0.5,
                dominance: data.dominance || 0.5
            };
        }

        // Try SentimentAnalyzer's enhanced lookup
        if (SentimentAnalyzer && typeof SentimentAnalyzer.getEnhancedSentiment === 'function') {
            const enhanced = SentimentAnalyzer.getEnhancedSentiment(word);
            if (enhanced) {
                return {
                    valence: enhanced.valence,
                    arousal: enhanced.arousal,
                    dominance: enhanced.dominance
                };
            }
        }

        // No VAD data available
        return null;
    },

    /**
     * Calculate compound metrics (weighted averages)
     */
    calculateCompoundMetrics(wordAnalysis) {
        const { wordData } = wordAnalysis;

        let totalValence = 0;
        let totalArousal = 0;
        let totalDominance = 0;
        let totalWeight = 0;

        for (const data of wordData) {
            totalValence += data.valence * data.weight;
            totalArousal += data.arousal * data.weight;
            totalDominance += data.dominance * data.weight;
            totalWeight += data.weight;
        }

        // Calculate weighted averages
        const compoundValence = totalWeight > 0 ? totalValence / totalWeight : 0.0;
        const compoundArousal = totalWeight > 0 ? totalArousal / totalWeight : 0.5;
        const compoundDominance = totalWeight > 0 ? totalDominance / totalWeight : 0.5;

        // Normalize valence to -1 to 1 range (assuming input is 0 to 1)
        // If your database uses -1 to 1 already, skip this
        const normalizedValence = (compoundValence * 2) - 1; // Convert 0-1 to -1 to 1

        return {
            valence: compoundValence, // Keep original for compatibility
            arousal: compoundArousal,
            dominance: compoundDominance,
            normalizedValence: normalizedValence,
            mood: normalizedValence, // Alias for mood
            tension: (compoundArousal + Math.abs(normalizedValence * 0.5)) / 2,
            totalWeight: totalWeight
        };
    },

    /**
     * Determine global key (root note) from compound metrics
     */
    determineGlobalKey(compoundMetrics) {
        const valence = compoundMetrics.normalizedValence; // -1 to 1

        // Map valence to root notes
        // Darker (negative) emotions → lower notes
        // Brighter (positive) emotions → higher notes

        // Use C3 (48) to C4 (60) range
        const minMidi = 48; // C3
        const maxMidi = 60; // C4

        // Map valence (-1 to 1) to MIDI range
        const rawMidi = minMidi + ((valence + 1) / 2) * (maxMidi - minMidi);

        // Snap to chromatic scale
        const midiNote = Math.round(rawMidi);

        // Constrain to range
        return Math.max(minMidi, Math.min(maxMidi, midiNote));
    },

    /**
     * Determine global mode (scale) from compound metrics
     */
    determineGlobalMode(compoundMetrics, culturalContext) {
        const valence = compoundMetrics.normalizedValence; // -1 to 1
        const arousal = compoundMetrics.arousal; // 0 to 1
        const tension = compoundMetrics.tension; // 0 to 1

        // Use ScaleLibrary's selection with our compound metrics
        const selectedScale = ScaleLibrary.selectScale(
            valence, // mood
            tension,
            culturalContext
        );

        return selectedScale;
    },

    /**
     * Define allowed temporary modulations
     */
    defineModulationRules(globalKey, globalMode) {
        return {
            // Default: stay in key
            default: {
                rootNote: globalKey,
                scale: globalMode
            },

            // Exclamation mark: modulate to dominant (up 7 semitones)
            exclamation: {
                rootNote: globalKey + 7,
                scale: globalMode,
                duration: 2000, // 2 seconds
                resolveTo: globalKey
            },

            // Question mark: modulate to subdominant (up 5 semitones)
            question: {
                rootNote: globalKey + 5,
                scale: globalMode,
                duration: 1500,
                resolveTo: globalKey,
                avoidTonic: true
            },

            // Ellipsis: stay in key but suspend resolution
            ellipsis: {
                rootNote: globalKey,
                scale: globalMode,
                suspendTonic: true,
                fadeOut: true
            },

            // Semicolon: parallel key modulation (major↔minor)
            semicolon: {
                rootNote: globalKey,
                scale: this.getParallelMode(globalMode),
                duration: 3000,
                resolveTo: globalKey
            },

            // Maximum allowed deviation
            maxDeviation: 7 // semitones
        };
    },

    /**
     * Get parallel mode (major↔minor equivalent)
     */
    getParallelMode(mode) {
        const parallels = {
            'Ionian': ScaleLibrary.western.aeolian,
            'Aeolian': ScaleLibrary.western.ionian,
            'Dorian': ScaleLibrary.western.dorian, // Already balanced
            'Phrygian': ScaleLibrary.western.lydian,
            'Lydian': ScaleLibrary.western.phrygian,
            'Mixolydian': ScaleLibrary.western.dorian,
            'Locrian': ScaleLibrary.western.ionian
        };

        return parallels[mode.name] || mode;
    },

    /**
     * Convert MIDI note to note name
     */
    midiToNoteName(midi) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const noteName = noteNames[midi % 12];
        return `${noteName}${octave}`;
    },

    /**
     * Utility: Check if a note is in the global scale
     */
    isInGlobalScale(midiNote, globalScale) {
        return globalScale.includes(midiNote);
    },

    /**
     * Utility: Get nearest note in global scale
     */
    getNearestScaleNote(midiNote, globalScale) {
        let nearest = globalScale[0];
        let minDistance = Math.abs(midiNote - nearest);

        for (const scaleNote of globalScale) {
            const distance = Math.abs(midiNote - scaleNote);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = scaleNote;
            }
        }

        return nearest;
    },

    /**
     * Utility: Enforce key lock (force note into global scale)
     */
    enforceKeyLock(midiNote, globalScale) {
        // If note is already in scale, return it
        if (this.isInGlobalScale(midiNote, globalScale)) {
            return midiNote;
        }

        // Otherwise, snap to nearest scale note
        return this.getNearestScaleNote(midiNote, globalScale);
    }
};
