/**
 * Structural Analyzer - Analyzes text structure and form
 *
 * Examines:
 * - Sentence and paragraph structure
 * - Punctuation patterns and their musical implications
 * - Text sections and divisions
 * - Repetition patterns
 */

const StructuralAnalyzer = {

    /**
     * Main analysis function
     */
    analyze(text) {
        const sentences = this.splitIntoSentences(text);
        const paragraphs = this.splitIntoParagraphs(text);
        const punctuationProfile = this.analyzePunctuation(text);
        const repetition = this.analyzeRepetition(text);

        return {
            sentenceCount: sentences.length,
            paragraphCount: paragraphs.length,
            averageSentenceLength: this.calculateAverageSentenceLength(sentences),
            sentenceLengthVariance: this.calculateSentenceLengthVariance(sentences),
            punctuationProfile: punctuationProfile,
            repetitionScore: repetition,
            structure: this.determineStructure(sentences, paragraphs),
            musicalPhrases: this.extractMusicalPhrases(sentences)
        };
    },

    /**
     * Split text into sentences
     */
    splitIntoSentences(text) {
        // Split on period, exclamation, question mark (followed by space or end)
        const sentences = text.split(/[.!?]+\s+|[.!?]+$/);
        return sentences.filter(s => s.trim().length > 0);
    },

    /**
     * Split text into paragraphs
     */
    splitIntoParagraphs(text) {
        const paragraphs = text.split(/\n\n+/);
        return paragraphs.filter(p => p.trim().length > 0);
    },

    /**
     * Analyze punctuation and its musical implications
     */
    analyzePunctuation(text) {
        const punctuation = {
            period: (text.match(/\./g) || []).length,
            comma: (text.match(/,/g) || []).length,
            exclamation: (text.match(/!/g) || []).length,
            question: (text.match(/\?/g) || []).length,
            semicolon: (text.match(/;/g) || []).length,
            colon: (text.match(/:/g) || []).length,
            dash: (text.match(/[-—]/g) || []).length,
            ellipsis: (text.match(/\.{3}|…/g) || []).length,
            quotes: (text.match(/["'"]/g) || []).length / 2 // Pair quotes
        };

        const total = Object.values(punctuation).reduce((sum, count) => sum + count, 0);

        // Normalize to ratios and add musical implications
        return {
            counts: punctuation,
            ratios: {
                period: punctuation.period / (total || 1),
                comma: punctuation.comma / (total || 1),
                exclamation: punctuation.exclamation / (total || 1),
                question: punctuation.question / (total || 1),
                semicolon: punctuation.semicolon / (total || 1),
                colon: punctuation.colon / (total || 1),
                dash: punctuation.dash / (total || 1),
                ellipsis: punctuation.ellipsis / (total || 1),
                quotes: punctuation.quotes / (total || 1)
            },
            // Musical implications
            musicalEffects: {
                // Periods → phrase endings, resolution
                resolutionPoints: punctuation.period,

                // Commas → breaths, pauses
                breathPoints: punctuation.comma,

                // Exclamations → dynamic accents
                accentPoints: punctuation.exclamation,
                tensionSpikes: punctuation.exclamation,

                // Questions → rising contours, unresolved
                risingContours: punctuation.question,
                unresolvedPoints: punctuation.question,

                // Semicolons → modulation hints
                modulationPoints: punctuation.semicolon,

                // Colons → anticipation, tension build
                anticipationPoints: punctuation.colon,

                // Dashes → sudden breaks
                interruptionPoints: punctuation.dash,

                // Ellipsis → fade outs, suspension
                suspensionPoints: punctuation.ellipsis,

                // Quotes → voice/timbre changes
                voiceChanges: punctuation.quotes
            }
        };
    },

    /**
     * Calculate average sentence length
     */
    calculateAverageSentenceLength(sentences) {
        if (sentences.length === 0) return 0;

        const totalWords = sentences.reduce((sum, sentence) => {
            const words = sentence.match(/\b\w+\b/g) || [];
            return sum + words.length;
        }, 0);

        return totalWords / sentences.length;
    },

    /**
     * Calculate sentence length variance
     */
    calculateSentenceLengthVariance(sentences) {
        if (sentences.length === 0) return 0;

        const lengths = sentences.map(s => (s.match(/\b\w+\b/g) || []).length);
        const avg = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;

        const variance = lengths.reduce((sum, len) =>
            sum + Math.pow(len - avg, 2), 0
        ) / lengths.length;

        return Math.sqrt(variance);
    },

    /**
     * Analyze repetition of words and phrases
     */
    analyzeRepetition(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const wordCounts = {};

        words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });

        const repeatedWords = Object.values(wordCounts).filter(count => count > 1).length;
        const totalUniqueWords = Object.keys(wordCounts).length;

        return repeatedWords / (totalUniqueWords || 1);
    },

    /**
     * Determine overall structure (narrative arc, poetry, etc.)
     */
    determineStructure(sentences, paragraphs) {
        const avgSentenceLength = this.calculateAverageSentenceLength(sentences);
        const variance = this.calculateSentenceLengthVariance(sentences);

        let structureType = 'prose';
        let arc = 'flat';

        // Short sentences with low variance might be poetry or list
        if (avgSentenceLength < 8 && variance < 3) {
            structureType = 'poetry';
        }

        // Long, complex sentences might be philosophical/academic
        if (avgSentenceLength > 20) {
            structureType = 'complex';
        }

        // Detect narrative arc by looking at sentence lengths
        if (sentences.length >= 3) {
            const firstThird = sentences.slice(0, Math.floor(sentences.length / 3));
            const lastThird = sentences.slice(-Math.floor(sentences.length / 3));

            const firstAvg = this.calculateAverageSentenceLength(firstThird);
            const lastAvg = this.calculateAverageSentenceLength(lastThird);

            if (lastAvg > firstAvg * 1.3) {
                arc = 'rising'; // Building intensity
            } else if (firstAvg > lastAvg * 1.3) {
                arc = 'falling'; // Decreasing intensity
            } else {
                arc = 'balanced';
            }
        }

        return {
            type: structureType,
            arc: arc,
            sections: paragraphs.length,
            formality: avgSentenceLength > 15 ? 'formal' : 'casual'
        };
    },

    /**
     * Extract musical phrases from sentences
     */
    extractMusicalPhrases(sentences) {
        return sentences.map((sentence, index) => {
            const words = sentence.match(/\b\w+\b/g) || [];
            const punctuation = this.getEndingPunctuation(sentence);

            return {
                index: index,
                text: sentence,
                wordCount: words.length,
                punctuation: punctuation,
                // Estimate duration (word count * avg reading time)
                estimatedDuration: words.length * 300, // ms
                musicalAction: this.getPunctuationMusicalAction(punctuation)
            };
        });
    },

    /**
     * Get ending punctuation of a sentence
     */
    getEndingPunctuation(sentence) {
        const trimmed = sentence.trim();
        const last = trimmed[trimmed.length - 1];

        if (last === '.') return 'period';
        if (last === '!') return 'exclamation';
        if (last === '?') return 'question';
        if (trimmed.endsWith('...') || trimmed.endsWith('…')) return 'ellipsis';
        if (last === ';') return 'semicolon';
        if (last === ':') return 'colon';

        return 'none';
    },

    /**
     * Get musical action for punctuation type
     */
    getPunctuationMusicalAction(punctuation) {
        const actions = {
            period: {
                phraseEnd: true,
                resolveToTonic: true,
                silenceDuration: 800
            },
            exclamation: {
                phraseEnd: true,
                dynamicAccent: 2.0,
                tensionSpike: 0.4,
                silenceDuration: 600
            },
            question: {
                phraseEnd: true,
                contour: 'rising',
                avoidTonic: true,
                silenceDuration: 700
            },
            comma: {
                breathPause: 300,
                subtleVoicingChange: true
            },
            semicolon: {
                phraseTransition: true,
                modulationHint: true,
                silenceDuration: 500
            },
            colon: {
                buildTension: 0.3,
                anticipation: true,
                silenceDuration: 400
            },
            ellipsis: {
                fadeOut: true,
                suspendHarmony: true,
                extendLastNote: 2000
            },
            none: {
                continue: true
            }
        };

        return actions[punctuation] || actions.none;
    },

    /**
     * Map structural analysis to musical parameters
     */
    toMusicalParameters(analysis) {
        // Sentence count affects number of phrases
        // Paragraph count affects number of sections
        // Average sentence length affects phrase duration
        // Punctuation profile affects articulation and dynamics
        // Repetition affects motif usage

        return {
            // Phrase structure
            phraseCount: analysis.sentenceCount,
            sectionCount: analysis.paragraphCount,
            averagePhraseDuration: analysis.averageSentenceLength * 300, // ms per word

            // Articulation from punctuation
            resolutionFrequency: analysis.punctuationProfile.ratios.period,
            breathFrequency: analysis.punctuationProfile.ratios.comma,
            accentFrequency: analysis.punctuationProfile.ratios.exclamation,
            tensionBuilds: analysis.punctuationProfile.ratios.colon,
            suspensions: analysis.punctuationProfile.ratios.ellipsis,

            // Overall dynamics
            dynamicRange: analysis.punctuationProfile.ratios.exclamation * 0.5 + 0.5,

            // Form
            hasNarrativeArc: analysis.structure.arc !== 'flat',
            arcDirection: analysis.structure.arc,
            formality: analysis.structure.formality === 'formal' ? 0.8 : 0.4,

            // Repetition creates motifs
            motifRepetitionLevel: analysis.repetitionScore,

            // Musical phrases with timing
            musicalPhrases: analysis.musicalPhrases
        };
    }
};
