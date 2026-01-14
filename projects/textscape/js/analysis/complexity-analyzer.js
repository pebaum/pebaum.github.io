/**
 * Complexity Analyzer - Analyzes cognitive and linguistic complexity
 *
 * Examines:
 * - Reading level
 * - Information density
 * - Abstract vs concrete language
 * - Syntactic complexity
 */

const ComplexityAnalyzer = {

    // Abstract concept indicators
    abstractWords: new Set([
        'concept', 'idea', 'theory', 'philosophy', 'thought', 'belief', 'notion',
        'principle', 'essence', 'nature', 'meaning', 'purpose', 'truth', 'reality',
        'existence', 'being', 'consciousness', 'mind', 'soul', 'spirit', 'time',
        'space', 'infinity', 'eternity', 'void', 'chaos', 'order', 'freedom',
        'justice', 'beauty', 'knowledge', 'wisdom', 'understanding', 'awareness'
    ]),

    // Concrete/sensory words
    concreteIndicators: new Set([
        'see', 'hear', 'touch', 'taste', 'smell', 'feel', 'look', 'sound',
        'hand', 'eye', 'ear', 'mouth', 'nose', 'body', 'face', 'voice'
    ]),

    /**
     * Main analysis function
     */
    analyze(text) {
        const words = text.match(/\b\w+\b/g) || [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

        const readingLevel = this.calculateReadingLevel(text, sentences, words);
        const informationDensity = this.calculateInformationDensity(text, words);
        const abstractionLevel = this.calculateAbstractionLevel(words);
        const syntacticComplexity = this.calculateSyntacticComplexity(sentences);

        return {
            readingLevel: readingLevel,
            informationDensity: informationDensity,
            abstractionLevel: abstractionLevel,
            syntacticComplexity: syntacticComplexity,
            overallComplexity: (readingLevel + informationDensity + abstractionLevel + syntacticComplexity) / 4
        };
    },

    /**
     * Calculate reading level (simplified Flesch-Kincaid)
     */
    calculateReadingLevel(text, sentences, words) {
        if (words.length === 0 || sentences.length === 0) return 0.5;

        const syllableCount = words.reduce((sum, word) =>
            sum + this.countSyllables(word), 0
        );

        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = syllableCount / words.length;

        // Simplified Flesch Reading Ease (0-100, higher = easier)
        const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

        // Convert to 0-1 scale (inverted so higher = more complex)
        const normalized = Math.max(0, Math.min(100, fleschScore)) / 100;

        return 1 - normalized; // Invert so high = complex
    },

    /**
     * Simple syllable counter
     */
    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;

        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);

        return matches ? matches.length : 1;
    },

    /**
     * Calculate information density
     */
    calculateInformationDensity(text, words) {
        if (words.length === 0) return 0.5;

        // Unique words / total words = lexical diversity
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const lexicalDiversity = uniqueWords.size / words.length;

        // Long words indicate more information
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        const lengthFactor = Math.min(avgWordLength / 8, 1);

        // Combine factors
        return (lexicalDiversity + lengthFactor) / 2;
    },

    /**
     * Calculate abstraction level (abstract vs concrete)
     */
    calculateAbstractionLevel(words) {
        if (words.length === 0) return 0.5;

        let abstractCount = 0;
        let concreteCount = 0;

        for (const word of words) {
            const lower = word.toLowerCase();

            if (this.abstractWords.has(lower)) {
                abstractCount++;
            }

            if (this.concreteIndicators.has(lower)) {
                concreteCount++;
            }
        }

        // If both are zero, return middle value
        if (abstractCount === 0 && concreteCount === 0) {
            return 0.5;
        }

        // Return ratio of abstract to total indicators
        return abstractCount / (abstractCount + concreteCount);
    },

    /**
     * Calculate syntactic complexity
     */
    calculateSyntacticComplexity(sentences) {
        if (sentences.length === 0) return 0.5;

        // Count complex sentence indicators
        let complexityScore = 0;

        for (const sentence of sentences) {
            const words = sentence.match(/\b\w+\b/g) || [];

            // Long sentences are more complex
            if (words.length > 20) complexityScore += 0.3;
            else if (words.length > 15) complexityScore += 0.2;

            // Multiple clauses (commas, semicolons)
            const clauses = (sentence.match(/[,;]/g) || []).length;
            complexityScore += clauses * 0.1;

            // Subordinating conjunctions
            const subordinators = ['because', 'although', 'while', 'since', 'unless', 'whereas'];
            for (const sub of subordinators) {
                if (sentence.toLowerCase().includes(sub)) {
                    complexityScore += 0.1;
                }
            }
        }

        // Normalize by sentence count
        return Math.min(complexityScore / sentences.length, 1);
    },

    /**
     * Map complexity analysis to musical parameters
     */
    toMusicalParameters(analysis) {
        // Reading level affects overall density
        // Information density affects harmonic richness
        // Abstraction level affects timbre (abstract = ambient, concrete = clear)
        // Syntactic complexity affects voice count and layering

        return {
            // Overall density from reading level
            densityFromComplexity: analysis.readingLevel * 0.6 + 0.2,

            // Harmonic richness from information density
            harmonicRichness: analysis.informationDensity,
            voiceLayering: Math.floor(analysis.informationDensity * 4) + 2,

            // Timbre from abstraction
            ambientLevel: analysis.abstractionLevel, // High = more ambient/washy
            clarityLevel: 1 - analysis.abstractionLevel, // Low abstraction = clear tones
            textureWeight: analysis.abstractionLevel * 0.8,
            melodyWeight: (1 - analysis.abstractionLevel) * 0.8,

            // Polyphony from syntactic complexity
            polyphonyLevel: analysis.syntacticComplexity,
            voiceIndependence: analysis.syntacticComplexity * 0.7,

            // Overall complexity affects everything
            overallComplexity: analysis.overallComplexity
        };
    }
};
