/**
 * Sentiment Analyzer - Multi-culturally aware emotion and sentiment analysis
 *
 * Analyzes emotional content using:
 * - Cached AI-generated sentiment library (if available)
 * - Keyword-based sentiment detection
 * - Multi-cultural emotion concepts
 * - Valence, arousal, and tension
 * - Contextual modifiers (negation, intensifiers)
 */

const SentimentAnalyzer = {

    // Cached sentiment library (loaded from data/sentiment-library.json if available)
    cachedLibrary: null,
    libraryLoaded: false,

    // Positive sentiment words
    positiveWords: new Set([
        'happy', 'joy', 'love', 'wonderful', 'amazing', 'beautiful', 'great', 'excellent',
        'fantastic', 'brilliant', 'delightful', 'pleasant', 'cheerful', 'bright', 'warm',
        'light', 'hope', 'peace', 'calm', 'serene', 'gentle', 'sweet', 'kind', 'good',
        'heaven', 'paradise', 'bliss', 'ecstasy', 'triumph', 'victory', 'success',
        'laugh', 'smile', 'celebrate', 'rejoice', 'thrive', 'bloom', 'flourish'
    ]),

    // Negative sentiment words
    negativeWords: new Set([
        'sad', 'unhappy', 'miserable', 'depressed', 'gloomy', 'dark', 'cold', 'bitter',
        'hate', 'fear', 'anger', 'rage', 'fury', 'terrible', 'awful', 'horrible', 'bad',
        'pain', 'hurt', 'suffer', 'agony', 'despair', 'sorrow', 'grief', 'mourning',
        'death', 'loss', 'empty', 'void', 'hollow', 'broken', 'shattered', 'destroyed',
        'cry', 'weep', 'scream', 'die', 'fade', 'wither', 'decay'
    ]),

    // Intensifiers
    intensifiers: new Set([
        'very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally',
        'utterly', 'deeply', 'profoundly', 'intensely', 'overwhelmingly'
    ]),

    // Negations
    negations: new Set([
        'not', 'no', 'never', 'neither', 'nor', 'none', 'nobody', 'nothing',
        'nowhere', 'hardly', 'scarcely', 'barely'
    ]),

    // High arousal words (energetic)
    highArousalWords: new Set([
        'exciting', 'thrilling', 'intense', 'passionate', 'fierce', 'violent', 'wild',
        'energetic', 'dynamic', 'explosive', 'powerful', 'overwhelming', 'rush', 'surge'
    ]),

    // Low arousal words (calm)
    lowArousalWords: new Set([
        'calm', 'peaceful', 'quiet', 'still', 'serene', 'tranquil', 'gentle', 'soft',
        'slow', 'steady', 'restful', 'drowsy', 'sleepy', 'mellow', 'lull'
    ]),

    /**
     * Main analysis function
     */
    analyze(text, culturalContext = 'multicultural') {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];

        const basicSentiment = this.calculateBasicSentiment(words);
        const arousal = this.calculateArousal(words);
        const emotions = this.detectEmotions(words, culturalContext);
        const culturalConcepts = this.detectCulturalConcepts(text, culturalContext);

        // Calculate mood (-1 to 1) from sentiment
        const mood = basicSentiment.score;

        // Calculate tension (0 to 1) from arousal and negative sentiment
        const tension = (arousal + Math.abs(basicSentiment.score * 0.5)) / 2;

        return {
            mood: mood, // -1 (dark) to 1 (bright)
            tension: tension, // 0 (calm) to 1 (intense)
            arousal: arousal, // 0 (low energy) to 1 (high energy)
            sentiment: basicSentiment,
            detectedEmotions: emotions,
            culturalConcepts: culturalConcepts,
            dominantEmotion: emotions.length > 0 ? emotions[0] : null
        };
    },

    /**
     * Calculate basic sentiment score
     */
    calculateBasicSentiment(words) {
        let valenceSum = 0;
        let valenceCount = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        let intensity = 1.0;
        let isNegated = false;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];

            // Check for intensifiers
            if (this.intensifiers.has(word)) {
                intensity = 1.5;
                continue;
            }

            // Check for negations
            if (this.negations.has(word)) {
                isNegated = true;
                continue;
            }

            // Try to get cached valence first
            const cached = this.lookupWord(word);
            let wordValence = 0;

            if (cached && cached.valence !== undefined) {
                // Use cached valence (-1 to 1)
                wordValence = cached.valence;
                valenceCount++;
                if (wordValence > 0) positiveCount++;
                else if (wordValence < 0) negativeCount++;
            } else if (this.positiveWords.has(word)) {
                // Fallback to rule-based
                wordValence = 0.7;
                valenceCount++;
                positiveCount++;
            } else if (this.negativeWords.has(word)) {
                wordValence = -0.7;
                valenceCount++;
                negativeCount++;
            }

            // Apply modifiers
            if (wordValence !== 0) {
                const multiplier = intensity * (isNegated ? -1 : 1);
                valenceSum += wordValence * multiplier;

                // Reset modifiers
                intensity = 1.0;
                isNegated = false;
            }
        }

        const score = valenceCount > 0 ? valenceSum / valenceCount : 0;

        return {
            score: score, // -1 to 1
            positiveCount: positiveCount,
            negativeCount: negativeCount
        };
    },

    /**
     * Calculate arousal level (energy)
     */
    calculateArousal(words) {
        let arousalSum = 0;
        let arousalCount = 0;

        for (const word of words) {
            // Try cached arousal first
            const cached = this.lookupWord(word);

            if (cached && cached.arousal !== undefined) {
                arousalSum += cached.arousal; // 0 to 1
                arousalCount++;
            } else if (this.highArousalWords.has(word)) {
                // Fallback to rule-based
                arousalSum += 0.8;
                arousalCount++;
            } else if (this.lowArousalWords.has(word)) {
                arousalSum += 0.2;
                arousalCount++;
            }
        }

        if (arousalCount === 0) return 0.5; // Neutral

        return arousalSum / arousalCount; // 0 = low arousal, 1 = high arousal
    },

    /**
     * Detect specific emotions using cultural theories
     */
    detectEmotions(words, culturalContext) {
        const detectedEmotions = [];

        // Check each emotion keyword from cultural theories
        for (const [emotion, data] of Object.entries(CulturalTheories.emotionKeywords)) {
            // Check if emotion keyword appears in text
            if (words.includes(emotion.toLowerCase())) {
                detectedEmotions.push({
                    emotion: emotion,
                    parameters: data.base,
                    culturalMapping: data[culturalContext] || data.western || {},
                    description: data.description
                });
            }
        }

        // Sort by relevance (could be improved with better ranking)
        return detectedEmotions;
    },

    /**
     * Detect cultural-specific emotion concepts
     */
    detectCulturalConcepts(text, culturalContext) {
        const lowerText = text.toLowerCase();
        const concepts = [];

        // Check for culture-specific concepts
        const culturalEmotions = [
            'saudade', 'monoNoAware', 'mono no aware', 'duende', 'hiraeth',
            'wabisabi', 'wabi-sabi', 'sisu'
        ];

        for (const concept of culturalEmotions) {
            if (lowerText.includes(concept.toLowerCase().replace(/([A-Z])/g, ' $1').trim())) {
                const emotionData = CulturalTheories.emotionKeywords[concept];
                if (emotionData) {
                    concepts.push({
                        concept: concept,
                        parameters: emotionData.base,
                        description: emotionData.description
                    });
                }
            }
        }

        return concepts;
    },

    /**
     * Detect specific word categories from cultural theories
     */
    detectWordCategories(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const categories = {
            temporal: [],
            spatial: [],
            textural: [],
            colors: [],
            nature: [],
            abstract: []
        };

        for (const word of words) {
            // Check each category in cultural theories
            if (CulturalTheories.temporalWords[word]) {
                categories.temporal.push({
                    word: word,
                    params: CulturalTheories.temporalWords[word]
                });
            }

            if (CulturalTheories.spatialWords[word]) {
                categories.spatial.push({
                    word: word,
                    params: CulturalTheories.spatialWords[word]
                });
            }

            if (CulturalTheories.texturalWords[word]) {
                categories.textural.push({
                    word: word,
                    params: CulturalTheories.texturalWords[word]
                });
            }

            if (CulturalTheories.colorWords[word]) {
                categories.colors.push({
                    word: word,
                    params: CulturalTheories.colorWords[word]
                });
            }

            if (CulturalTheories.natureWords[word]) {
                categories.nature.push({
                    word: word,
                    params: CulturalTheories.natureWords[word]
                });
            }

            if (CulturalTheories.abstractConcepts[word]) {
                categories.abstract.push({
                    word: word,
                    params: CulturalTheories.abstractConcepts[word]
                });
            }
        }

        return categories;
    },

    /**
     * Map sentiment analysis to musical parameters
     */
    toMusicalParameters(analysis, culturalContext = 'multicultural') {
        // Mood affects scale selection and brightness
        // Tension affects dissonance and dynamics
        // Arousal affects tempo and rhythm
        // Detected emotions affect specific parameters

        const params = {
            mood: analysis.mood, // -1 to 1
            tension: analysis.tension, // 0 to 1
            arousal: analysis.arousal, // 0 to 1

            // Tempo from arousal and mood
            tempoMultiplier: 0.5 + (analysis.arousal * 0.7), // 0.5 to 1.2

            // Density from tension
            density: Math.max(0.2, Math.min(0.8, 0.4 + analysis.tension * 0.4)),

            // Brightness from mood
            brightness: (analysis.mood + 1) / 2, // 0 to 1

            // Scale selection will be done by parameter mapper
            scaleHint: analysis.mood > 0.5 ? 'bright' : analysis.mood < -0.3 ? 'dark' : 'balanced'
        };

        // Add emotion-specific parameters if emotions detected
        if (analysis.dominantEmotion) {
            Object.assign(params, analysis.dominantEmotion.parameters);
        }

        return params;
    },

    /**
     * Try to load cached sentiment library
     */
    async loadCachedLibrary() {
        if (this.libraryLoaded) return;

        try {
            const response = await fetch('data/sentiment-library.json');
            if (response.ok) {
                this.cachedLibrary = await response.json();
                this.libraryLoaded = true;
                console.log(`✓ Loaded cached sentiment library with ${Object.keys(this.cachedLibrary).length} words`);
            } else {
                console.log('ℹ No cached sentiment library found, using rule-based analysis');
                this.libraryLoaded = true;
            }
        } catch (error) {
            console.log('ℹ Cached library not available, using rule-based analysis');
            this.libraryLoaded = true;
        }
    },

    /**
     * Look up word in cached library
     */
    lookupWord(word) {
        if (!this.cachedLibrary) return null;
        return this.cachedLibrary[word.toLowerCase()] || null;
    },

    /**
     * Get enhanced sentiment using cached library if available
     */
    getEnhancedSentiment(word) {
        const cached = this.lookupWord(word);
        if (!cached) return null;

        return {
            valence: cached.valence || 0,
            arousal: cached.arousal || 0.5,
            dominance: cached.dominance || 0.5,
            emotions: cached.emotions || {},
            culturalAssociations: cached.cultural_associations || []
        };
    }
};
