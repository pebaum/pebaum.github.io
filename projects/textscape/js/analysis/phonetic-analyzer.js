/**
 * Phonetic Analyzer - Analyzes the sound qualities of text
 *
 * Examines:
 * - Vowel/consonant ratios
 * - Syllable patterns and rhythm
 * - Alliteration and assonance
 * - Phonetic harshness vs smoothness
 */

const PhoneticAnalyzer = {

    vowels: ['a', 'e', 'i', 'o', 'u', 'y'],

    // Consonant classifications
    plosives: ['p', 'b', 't', 'd', 'k', 'g'], // Percussive, sudden
    fricatives: ['f', 'v', 's', 'z', 'sh', 'th', 'h'], // Breathy, sustained
    nasals: ['m', 'n', 'ng'], // Resonant, warm
    liquids: ['l', 'r'], // Flowing, smooth
    glides: ['w', 'y'], // Smooth transitions

    /**
     * Main analysis function
     */
    analyze(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const letters = text.toLowerCase().replace(/[^a-z]/g, '').split('');

        return {
            vowelRatio: this.calculateVowelRatio(letters),
            consonantProfile: this.analyzeConsonants(letters),
            syllableRhythm: this.analyzeSyllableRhythm(words),
            alliteration: this.detectAlliteration(words),
            assonance: this.detectAssonance(words),
            phoneticHarshness: this.calculateHarshness(letters),
            smoothness: this.calculateSmoothness(letters),
            overallSonicQuality: null // Will be calculated
        };
    },

    /**
     * Calculate ratio of vowels to total letters
     */
    calculateVowelRatio(letters) {
        if (letters.length === 0) return 0.4; // Default

        const vowelCount = letters.filter(letter =>
            this.vowels.includes(letter)
        ).length;

        return vowelCount / letters.length;
    },

    /**
     * Analyze the types of consonants used
     */
    analyzeConsonants(letters) {
        const consonants = letters.filter(letter =>
            !this.vowels.includes(letter)
        );

        if (consonants.length === 0) {
            return {
                plosive: 0,
                fricative: 0,
                nasal: 0,
                liquid: 0,
                glide: 0
            };
        }

        const counts = {
            plosive: consonants.filter(c => this.plosives.includes(c)).length,
            fricative: consonants.filter(c => this.fricatives.includes(c)).length,
            nasal: consonants.filter(c => this.nasals.includes(c)).length,
            liquid: consonants.filter(c => this.liquids.includes(c)).length,
            glide: consonants.filter(c => this.glides.includes(c)).length
        };

        // Normalize to ratios
        return {
            plosive: counts.plosive / consonants.length,
            fricative: counts.fricative / consonants.length,
            nasal: counts.nasal / consonants.length,
            liquid: counts.liquid / consonants.length,
            glide: counts.glide / consonants.length
        };
    },

    /**
     * Analyze syllable rhythm and patterns
     */
    analyzeSyllableRhythm(words) {
        const syllableCounts = words.map(word => this.countSyllables(word));

        if (syllableCounts.length === 0) {
            return {
                averageSyllablesPerWord: 2,
                rhythmVariance: 0.5,
                monosyllabicRatio: 0.3
            };
        }

        const total = syllableCounts.reduce((sum, count) => sum + count, 0);
        const average = total / syllableCounts.length;

        // Calculate variance
        const variance = syllableCounts.reduce((sum, count) => {
            return sum + Math.pow(count - average, 2);
        }, 0) / syllableCounts.length;

        const monosyllabic = syllableCounts.filter(c => c === 1).length;

        return {
            averageSyllablesPerWord: average,
            rhythmVariance: Math.sqrt(variance),
            monosyllabicRatio: monosyllabic / syllableCounts.length
        };
    },

    /**
     * Simple syllable counter (rule-based approximation)
     */
    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;

        // Count vowel groups
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);

        return matches ? matches.length : 1;
    },

    /**
     * Detect alliteration (repeated initial consonants)
     */
    detectAlliteration(words) {
        if (words.length < 2) return 0;

        let alliterationCount = 0;
        const firstLetters = words.map(w => w[0]);

        for (let i = 0; i < firstLetters.length - 1; i++) {
            if (firstLetters[i] === firstLetters[i + 1] &&
                !this.vowels.includes(firstLetters[i])) {
                alliterationCount++;
            }
        }

        return alliterationCount / (words.length - 1);
    },

    /**
     * Detect assonance (repeated vowel sounds)
     */
    detectAssonance(words) {
        if (words.length < 2) return 0;

        const vowelPatterns = words.map(word => {
            return word.split('').filter(c => this.vowels.includes(c)).join('');
        });

        let matchCount = 0;

        for (let i = 0; i < vowelPatterns.length - 1; i++) {
            for (let j = i + 1; j < vowelPatterns.length; j++) {
                if (this.hasCommonVowelPattern(vowelPatterns[i], vowelPatterns[j])) {
                    matchCount++;
                }
            }
        }

        const maxPossibleMatches = (words.length * (words.length - 1)) / 2;
        return maxPossibleMatches > 0 ? matchCount / maxPossibleMatches : 0;
    },

    /**
     * Check if two words share a common vowel pattern
     */
    hasCommonVowelPattern(pattern1, pattern2) {
        if (!pattern1 || !pattern2) return false;

        // Simple check: do they share at least one vowel in similar position?
        const minLength = Math.min(pattern1.length, pattern2.length);
        for (let i = 0; i < minLength; i++) {
            if (pattern1[i] === pattern2[i]) {
                return true;
            }
        }
        return false;
    },

    /**
     * Calculate phonetic harshness (plosives, sharp sounds)
     */
    calculateHarshness(letters) {
        if (letters.length === 0) return 0;

        const harshLetters = ['k', 't', 'p', 'x', 'q'];
        const harshCount = letters.filter(letter =>
            harshLetters.includes(letter)
        ).length;

        return harshCount / letters.length;
    },

    /**
     * Calculate smoothness (liquids, nasals, soft sounds)
     */
    calculateSmoothness(letters) {
        if (letters.length === 0) return 0.5;

        const smoothLetters = [...this.liquids, ...this.nasals, 'w'];
        const smoothCount = letters.filter(letter =>
            smoothLetters.includes(letter)
        ).length;

        return smoothCount / letters.length;
    },

    /**
     * Map phonetic analysis to musical parameters
     */
    toMusicalParameters(analysis) {
        // High vowel ratio → more sustained, pad-like sounds
        // High consonant variation → more rhythmic, textural
        // High alliteration → repeated motifs
        // Harshness → percussive elements, staccato
        // Smoothness → legato, sustained notes

        return {
            // Vowel ratio affects sustain and pad weight
            sustainLevel: analysis.vowelRatio * 0.8 + 0.2,
            padWeight: analysis.vowelRatio,

            // Consonant profile affects articulation and rhythm
            pulsiveWeight: analysis.consonantProfile.plosive,
            textureWeight: analysis.consonantProfile.fricative,
            resonanceWeight: analysis.consonantProfile.nasal,
            flowWeight: analysis.consonantProfile.liquid,

            // Syllable rhythm affects musical rhythm
            rhythmicComplexity: analysis.syllableRhythm.rhythmVariance,
            phraseLengthVariation: analysis.syllableRhythm.averageSyllablesPerWord / 4,
            staccatoTendency: analysis.syllableRhythm.monosyllabicRatio,

            // Alliteration and assonance create musical repetition
            motifRepetition: Math.max(analysis.alliteration, analysis.assonance),

            // Harshness/smoothness affect attack and timbre
            attackTime: analysis.phoneticHarshness > 0.3 ? 10 : 500,
            filterBrightness: analysis.phoneticHarshness * 0.5 + 0.3,
            legato: analysis.smoothness > 0.3
        };
    }
};
