/**
 * Lexical Analyzer - Analyzes word-level characteristics
 *
 * Examines:
 * - Word length and complexity
 * - Part-of-speech patterns (simple rule-based)
 * - Word frequency and rarity
 * - Lexical density and variety
 */

const LexicalAnalyzer = {

    // Common English words (top 100 most frequent)
    commonWords: new Set([
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
        'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
        'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
        'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
        'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
        'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
        'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
    ]),

    // Simple part-of-speech patterns (rule-based heuristics)
    verbEndings: ['ed', 'ing', 'ize', 'ise', 'ate', 'ify'],
    nounEndings: ['tion', 'sion', 'ness', 'ment', 'ity', 'ism', 'ship', 'hood', 'ance', 'ence'],
    adjectiveEndings: ['ful', 'less', 'ous', 'ive', 'able', 'ible', 'al', 'ic', 'ical'],
    adverbEndings: ['ly'],

    commonVerbs: new Set(['is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
        'go', 'get', 'make', 'take', 'come', 'see', 'know', 'think', 'say', 'tell']),

    /**
     * Main analysis function
     */
    analyze(text) {
        const words = text.match(/\b\w+\b/g) || [];
        const lowerWords = words.map(w => w.toLowerCase());
        const uniqueWords = new Set(lowerWords);

        const wordLengths = words.map(w => w.length);
        const avgLength = wordLengths.reduce((sum, len) => sum + len, 0) / (words.length || 1);

        const posDistribution = this.analyzePOS(words);
        const frequencyProfile = this.analyzeFrequency(lowerWords);

        return {
            totalWords: words.length,
            uniqueWords: uniqueWords.size,
            lexicalDiversity: uniqueWords.size / (words.length || 1),
            averageWordLength: avgLength,
            wordLengthVariance: this.calculateVariance(wordLengths, avgLength),
            partOfSpeech: posDistribution,
            frequencyProfile: frequencyProfile,
            complexity: this.calculateLexicalComplexity(avgLength, uniqueWords.size / (words.length || 1))
        };
    },

    /**
     * Simple part-of-speech analysis using heuristics
     */
    analyzePOS(words) {
        const counts = {
            verbs: 0,
            nouns: 0,
            adjectives: 0,
            adverbs: 0,
            other: 0
        };

        for (const word of words) {
            const lower = word.toLowerCase();

            if (this.commonVerbs.has(lower) || this.endsWithAny(lower, this.verbEndings)) {
                counts.verbs++;
            } else if (this.endsWithAny(lower, this.adverbEndings)) {
                counts.adverbs++;
            } else if (this.endsWithAny(lower, this.adjectiveEndings)) {
                counts.adjectives++;
            } else if (this.endsWithAny(lower, this.nounEndings) || lower.length > 4) {
                counts.nouns++; // Assume longer words are nouns if not identified
            } else {
                counts.other++;
            }
        }

        const total = words.length || 1;

        return {
            verbs: counts.verbs / total,
            nouns: counts.nouns / total,
            adjectives: counts.adjectives / total,
            adverbs: counts.adverbs / total,
            other: counts.other / total
        };
    },

    /**
     * Check if word ends with any of the given suffixes
     */
    endsWithAny(word, suffixes) {
        return suffixes.some(suffix => word.endsWith(suffix));
    },

    /**
     * Analyze word frequency (common vs rare words)
     */
    analyzeFrequency(words) {
        const commonCount = words.filter(word => this.commonWords.has(word)).length;
        const rareCount = words.length - commonCount;

        return {
            commonRatio: commonCount / (words.length || 1),
            rareRatio: rareCount / (words.length || 1)
        };
    },

    /**
     * Calculate variance
     */
    calculateVariance(values, mean) {
        if (values.length === 0) return 0;

        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    },

    /**
     * Calculate overall lexical complexity
     */
    calculateLexicalComplexity(avgWordLength, lexicalDiversity) {
        // Combine factors:
        // - Longer words = more complex
        // - Higher lexical diversity = more complex
        const lengthFactor = Math.min(avgWordLength / 8, 1); // Normalize to 0-1
        const diversityFactor = lexicalDiversity;

        return (lengthFactor + diversityFactor) / 2;
    },

    /**
     * Map lexical analysis to musical parameters
     */
    toMusicalParameters(analysis) {
        // Part of speech affects voice assignment:
        // - Nouns → melody (subjects/objects)
        // - Verbs → pulse/rhythm (action)
        // - Adjectives → texture/timbre (color)
        // - Adverbs → modulation (manner)

        // Word length affects note duration:
        // - Short words → short notes
        // - Long words → sustained notes

        // Frequency affects harmony:
        // - Common words → consonant intervals
        // - Rare words → dissonant/exotic tones

        // Lexical diversity affects density:
        // - High diversity → richer, more complex
        // - Low diversity → simpler, repetitive

        return {
            // Voice weights based on POS
            melodyWeight: analysis.partOfSpeech.nouns,
            pulseWeight: analysis.partOfSpeech.verbs,
            textureWeight: analysis.partOfSpeech.adjectives,
            modulationDepth: analysis.partOfSpeech.adverbs,

            // Note duration based on word length
            averageNoteDuration: this.mapRange(analysis.averageWordLength, 3, 10, 300, 2000),
            durationVariety: analysis.wordLengthVariance / 10,

            // Harmonic complexity based on frequency
            consonanceLevel: analysis.frequencyProfile.commonRatio,
            dissonanceLevel: analysis.frequencyProfile.rareRatio,

            // Density based on lexical diversity
            density: analysis.lexicalDiversity * 0.7 + 0.2, // Scale to 0.2-0.9

            // Overall complexity
            harmonicComplexity: analysis.complexity,
            voiceCount: Math.floor(analysis.complexity * 4) + 2 // 2-6 voices
        };
    },

    /**
     * Map a value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    }
};
