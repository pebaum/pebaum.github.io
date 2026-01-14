/**
 * Scale Library - Multi-Cultural Scales and Modes
 *
 * Provides a comprehensive library of scales from various musical traditions:
 * - Western modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian)
 * - Indian-inspired ragas
 * - Middle Eastern maqamat
 * - East Asian pentatonic modes
 * - Other exotic scales
 */

const ScaleLibrary = {

    /**
     * Western Modes (from major scale)
     * Values are semitone intervals from root
     */
    western: {
        ionian: {
            name: 'Ionian (Major)',
            intervals: [0, 2, 4, 5, 7, 9, 11], // W W H W W W H
            mood: 0.7, // Bright, happy
            tension: 0.2,
            culture: 'western',
            description: 'Bright and joyful'
        },
        dorian: {
            name: 'Dorian',
            intervals: [0, 2, 3, 5, 7, 9, 10], // W H W W W H W
            mood: 0.3, // Balanced, contemplative
            tension: 0.3,
            culture: 'western',
            description: 'Balanced, contemplative, minor with a bright note'
        },
        phrygian: {
            name: 'Phrygian',
            intervals: [0, 1, 3, 5, 7, 8, 10], // H W W W H W W
            mood: -0.5, // Dark, exotic
            tension: 0.6,
            culture: 'western',
            description: 'Dark, Spanish, mysterious'
        },
        lydian: {
            name: 'Lydian',
            intervals: [0, 2, 4, 6, 7, 9, 11], // W W W H W W H
            mood: 0.9, // Very bright, dreamy
            tension: 0.4,
            culture: 'western',
            description: 'Dreamy, ethereal, wonder'
        },
        mixolydian: {
            name: 'Mixolydian',
            intervals: [0, 2, 4, 5, 7, 9, 10], // W W H W W H W
            mood: 0.6, // Bright but grounded
            tension: 0.3,
            culture: 'western',
            description: 'Folk-like, grounded brightness'
        },
        aeolian: {
            name: 'Aeolian (Natural Minor)',
            intervals: [0, 2, 3, 5, 7, 8, 10], // W H W W H W W
            mood: -0.4, // Sad, melancholic
            tension: 0.4,
            culture: 'western',
            description: 'Sad, melancholic, introspective'
        },
        locrian: {
            name: 'Locrian',
            intervals: [0, 1, 3, 5, 6, 8, 10], // H W W H W W W
            mood: -0.7, // Very dark, unstable
            tension: 0.9,
            culture: 'western',
            description: 'Unstable, dark, dissonant'
        },
        harmonicMinor: {
            name: 'Harmonic Minor',
            intervals: [0, 2, 3, 5, 7, 8, 11], // W H W W H Aug2 H
            mood: -0.3,
            tension: 0.7,
            culture: 'western',
            description: 'Dramatic, exotic minor'
        }
    },

    /**
     * Indian-Inspired Ragas
     * Simplified versions of traditional ragas
     */
    indian: {
        bhairav: {
            name: 'Bhairav',
            intervals: [0, 1, 4, 5, 7, 8, 11],
            mood: -0.2,
            tension: 0.6,
            culture: 'indian',
            timeOfDay: 'morning',
            rasa: 'bhakti', // Devotion
            description: 'Devotional morning raga, serious'
        },
        yaman: {
            name: 'Yaman (Kalyan)',
            intervals: [0, 2, 4, 6, 7, 9, 11],
            mood: 0.7,
            tension: 0.3,
            culture: 'indian',
            timeOfDay: 'evening',
            rasa: 'shringara', // Love, beauty
            description: 'Evening raga, romantic, peaceful'
        },
        bilawal: {
            name: 'Bilawal',
            intervals: [0, 2, 4, 5, 7, 9, 11],
            mood: 0.8,
            tension: 0.2,
            culture: 'indian',
            timeOfDay: 'morning',
            rasa: 'hāsya', // Joy
            description: 'Morning raga, joyful, equivalent to Ionian'
        },
        kafi: {
            name: 'Kafi',
            intervals: [0, 2, 3, 5, 7, 9, 10],
            mood: 0.2,
            tension: 0.3,
            culture: 'indian',
            timeOfDay: 'afternoon',
            rasa: 'karuna', // Compassion
            description: 'Gentle, compassionate, equivalent to Dorian'
        },
        bhairavi: {
            name: 'Bhairavi',
            intervals: [0, 1, 3, 5, 7, 8, 10],
            mood: -0.4,
            tension: 0.5,
            culture: 'indian',
            timeOfDay: 'lateNight',
            rasa: 'karuna', // Compassion, pathos
            description: 'Late night raga, longing, departure'
        }
    },

    /**
     * Middle Eastern Maqamat
     * Approximated using 12-tone equal temperament
     * (In real maqam, quarter-tones would be used)
     */
    middleEastern: {
        rast: {
            name: 'Maqam Rast',
            intervals: [0, 2, 4, 5, 7, 9, 10],
            mood: 0.5,
            tension: 0.3,
            culture: 'middleEastern',
            description: 'Joyful, celebration, bright'
        },
        bayati: {
            name: 'Maqam Bayati',
            intervals: [0, 1.5, 3, 5, 7, 8, 10], // 1.5 approximates quarter-flat
            intervals: [0, 1, 3, 5, 7, 8, 10], // Simplified for 12-TET
            mood: 0.0,
            tension: 0.4,
            culture: 'middleEastern',
            description: 'Introspective, contemplative'
        },
        hijaz: {
            name: 'Maqam Hijaz',
            intervals: [0, 1, 4, 5, 7, 8, 11], // Augmented 2nd between 1-4
            mood: -0.1,
            tension: 0.7,
            culture: 'middleEastern',
            description: 'Spiritual, dramatic, intense'
        },
        saba: {
            name: 'Maqam Saba',
            intervals: [0, 1, 3, 4, 6, 8, 10],
            mood: -0.6,
            tension: 0.7,
            culture: 'middleEastern',
            description: 'Deep sadness, longing'
        }
    },

    /**
     * East Asian Pentatonic Scales
     */
    eastAsian: {
        majorPentatonic: {
            name: 'Major Pentatonic',
            intervals: [0, 2, 4, 7, 9],
            mood: 0.7,
            tension: 0.1,
            culture: 'eastAsian',
            description: 'Simple, pure, joyful'
        },
        minorPentatonic: {
            name: 'Minor Pentatonic',
            intervals: [0, 3, 5, 7, 10],
            mood: -0.2,
            tension: 0.2,
            culture: 'eastAsian',
            description: 'Blues, folk, grounded'
        },
        inScale: {
            name: 'In Scale (Japanese)',
            intervals: [0, 1, 5, 7, 8],
            mood: -0.3,
            tension: 0.4,
            culture: 'eastAsian',
            aesthetic: 'mono no aware',
            description: 'Wistful, transient beauty'
        },
        yoScale: {
            name: 'Yo Scale (Japanese)',
            intervals: [0, 2, 5, 7, 9],
            mood: 0.5,
            tension: 0.2,
            culture: 'eastAsian',
            aesthetic: 'purity',
            description: 'Bright, pure, ceremonial'
        },
        hirajoshi: {
            name: 'Hirajoshi',
            intervals: [0, 2, 3, 7, 8],
            mood: -0.1,
            tension: 0.3,
            culture: 'eastAsian',
            description: 'Contemplative, Japanese folk'
        }
    },

    /**
     * Other Exotic Scales
     */
    exotic: {
        wholeTone: {
            name: 'Whole Tone',
            intervals: [0, 2, 4, 6, 8, 10],
            mood: 0.3,
            tension: 0.8,
            culture: 'western',
            description: 'Dreamy, ambiguous, floating'
        },
        augmented: {
            name: 'Augmented',
            intervals: [0, 3, 4, 7, 8, 11],
            mood: 0.1,
            tension: 0.7,
            culture: 'western',
            description: 'Mysterious, symmetrical'
        },
        diminished: {
            name: 'Diminished (Octatonic)',
            intervals: [0, 2, 3, 5, 6, 8, 9, 11],
            mood: -0.4,
            tension: 0.8,
            culture: 'western',
            description: 'Dark, complex, jazzy'
        },
        chromatic: {
            name: 'Chromatic',
            intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            mood: 0.0,
            tension: 1.0,
            culture: 'western',
            description: 'All notes, maximum tension'
        }
    },

    /**
     * Get a scale by name from any cultural category
     */
    getScale(scaleName, culturalContext = 'multicultural') {
        // Search in specified cultural context first
        if (culturalContext !== 'multicultural') {
            const scale = this[culturalContext]?.[scaleName];
            if (scale) return scale;
        }

        // Search all categories
        for (const category of Object.values(this)) {
            if (typeof category === 'object' && category[scaleName]) {
                return category[scaleName];
            }
        }

        // Default to Dorian if not found
        console.warn(`Scale "${scaleName}" not found, defaulting to Dorian`);
        return this.western.dorian;
    },

    /**
     * Select a scale based on mood, tension, and cultural context
     */
    selectScale(mood, tension, culturalContext = 'multicultural') {
        let scales = [];

        // Gather scales from appropriate cultural context
        if (culturalContext === 'multicultural') {
            // Mix from all cultures
            scales = [
                ...Object.values(this.western),
                ...Object.values(this.indian),
                ...Object.values(this.middleEastern),
                ...Object.values(this.eastAsian),
                ...Object.values(this.exotic).slice(0, 2) // Limit exotic scales
            ];
        } else if (this[culturalContext]) {
            scales = Object.values(this[culturalContext]);
        } else {
            scales = Object.values(this.western);
        }

        // Find best matching scale based on mood and tension
        let bestScale = scales[0];
        let bestScore = Infinity;

        for (const scale of scales) {
            const moodDiff = Math.abs(scale.mood - mood);
            const tensionDiff = Math.abs(scale.tension - tension);
            const score = moodDiff + tensionDiff;

            if (score < bestScore) {
                bestScore = score;
                bestScale = scale;
            }
        }

        return bestScale;
    },

    /**
     * Convert scale intervals to actual MIDI notes given a root note
     */
    getScaleNotes(scale, rootNote, octaveRange = [2, 6]) {
        const notes = [];

        for (let octave = octaveRange[0]; octave <= octaveRange[1]; octave++) {
            for (const interval of scale.intervals) {
                const midiNote = rootNote + (octave * 12) + interval;
                notes.push(midiNote);
            }
        }

        return notes.sort((a, b) => a - b);
    },

    /**
     * Get notes in a specific register (low, mid, high)
     */
    getNotesInRegister(scaleNotes, register) {
        const total = scaleNotes.length;

        switch(register) {
            case 'low':
                return scaleNotes.slice(0, Math.floor(total / 3));
            case 'mid':
                return scaleNotes.slice(Math.floor(total / 3), Math.floor(2 * total / 3));
            case 'high':
                return scaleNotes.slice(Math.floor(2 * total / 3));
            default:
                return scaleNotes;
        }
    },

    /**
     * Get a random note from the scale
     */
    getRandomNote(scaleNotes, previousNote = null, maxInterval = 7) {
        if (previousNote === null) {
            return scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
        }

        // Prefer stepwise motion (voice leading)
        const nearby = scaleNotes.filter(note =>
            Math.abs(note - previousNote) <= maxInterval
        );

        if (nearby.length > 0) {
            return nearby[Math.floor(Math.random() * nearby.length)];
        }

        return scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
    },

    /**
     * MIDI note to frequency conversion
     */
    midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
};
