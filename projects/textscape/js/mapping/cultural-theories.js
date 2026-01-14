/**
 * Cultural Theories - Multi-Cultural Music-Emotion Mappings
 *
 * Contains the theoretical frameworks for how different cultures
 * associate emotions, concepts, and experiences with musical elements
 */

const CulturalTheories = {

    /**
     * Emotion keywords mapped to musical parameters across cultures
     * Each emotion has a base mapping that can be modified by cultural context
     */
    emotionKeywords: {
        // Universal emotions
        joy: {
            base: { mood: 0.8, tension: 0.2, tempo: 1.2, density: 0.6 },
            western: { scale: 'lydian', register: 'mid-high' },
            indian: { scale: 'bilawal', rasa: 'hāsya' },
            eastAsian: { scale: 'yoScale', aesthetic: 'purity' },
            middleEastern: { scale: 'rast' }
        },

        sadness: {
            base: { mood: -0.6, tension: 0.4, tempo: 0.6, density: 0.3 },
            western: { scale: 'aeolian', register: 'low-mid' },
            indian: { scale: 'bhairavi', rasa: 'karuna' },
            eastAsian: { scale: 'inScale', aesthetic: 'mono no aware' },
            middleEastern: { scale: 'saba' }
        },

        anger: {
            base: { mood: -0.4, tension: 0.9, tempo: 1.4, density: 0.8 },
            western: { scale: 'phrygian', register: 'low' },
            indian: { scale: 'bhairav', rasa: 'raudra' },
            eastAsian: { scale: 'inScale' },
            middleEastern: { scale: 'hijaz' }
        },

        peace: {
            base: { mood: 0.4, tension: 0.1, tempo: 0.5, density: 0.3 },
            western: { scale: 'dorian', register: 'mid' },
            indian: { scale: 'yaman', rasa: 'shānta' },
            eastAsian: { scale: 'yoScale', aesthetic: 'simplicity' },
            middleEastern: { scale: 'rast' }
        },

        fear: {
            base: { mood: -0.7, tension: 0.9, tempo: 0.4, density: 0.2 },
            western: { scale: 'locrian', register: 'low' },
            indian: { scale: 'bhairavi', rasa: 'bhayānaka' },
            eastAsian: { scale: 'inScale' },
            middleEastern: { scale: 'saba' }
        },

        love: {
            base: { mood: 0.7, tension: 0.3, tempo: 0.8, density: 0.5 },
            western: { scale: 'lydian', register: 'mid' },
            indian: { scale: 'yaman', rasa: 'shringara' },
            eastAsian: { scale: 'majorPentatonic' },
            middleEastern: { scale: 'rast' }
        },

        wonder: {
            base: { mood: 0.6, tension: 0.5, tempo: 0.7, density: 0.4 },
            western: { scale: 'lydian', register: 'high' },
            indian: { scale: 'yaman', rasa: 'adbhuta' },
            eastAsian: { scale: 'yoScale' },
            middleEastern: { scale: 'rast' }
        },

        contemplation: {
            base: { mood: 0.1, tension: 0.3, tempo: 0.5, density: 0.4 },
            western: { scale: 'dorian', register: 'mid' },
            indian: { scale: 'kafi', rasa: 'shānta' },
            eastAsian: { scale: 'hirajoshi' },
            middleEastern: { scale: 'bayati' }
        },

        // Culture-specific emotion concepts
        saudade: { // Portuguese: Deep longing, nostalgia
            base: { mood: -0.3, tension: 0.5, tempo: 0.6, density: 0.4 },
            western: { scale: 'dorian', register: 'mid' },
            description: 'Portuguese longing and nostalgia'
        },

        monoNoAware: { // Japanese: Wistful awareness of impermanence
            base: { mood: -0.2, tension: 0.3, tempo: 0.4, density: 0.2 },
            eastAsian: { scale: 'inScale', aesthetic: 'impermanence' },
            description: 'Japanese wistfulness, transient beauty'
        },

        duende: { // Spanish: Deep soul, passion
            base: { mood: 0.3, tension: 0.8, tempo: 0.9, density: 0.7 },
            middleEastern: { scale: 'hijaz' },
            description: 'Spanish soul and passion'
        },

        hiraeth: { // Welsh: Homesickness, longing for home
            base: { mood: -0.4, tension: 0.4, tempo: 0.5, density: 0.3 },
            western: { scale: 'aeolian', register: 'mid' },
            description: 'Welsh longing for home'
        },

        wabisabi: { // Japanese: Beauty in imperfection
            base: { mood: 0.2, tension: 0.2, tempo: 0.5, density: 0.3 },
            eastAsian: { scale: 'hirajoshi', aesthetic: 'imperfection' },
            description: 'Japanese beauty in imperfection'
        },

        sisu: { // Finnish: Stoic determination
            base: { mood: 0.1, tension: 0.6, tempo: 0.7, density: 0.5 },
            western: { scale: 'dorian', register: 'low-mid' },
            description: 'Finnish stoic determination'
        }
    },

    /**
     * Temporal words affect tempo and rhythm
     */
    temporalWords: {
        rush: { tempo: 1.5, tension: 0.7, pulseWeight: 0.8 },
        hurry: { tempo: 1.4, tension: 0.6, pulseWeight: 0.7 },
        slow: { tempo: 0.5, tension: 0.2, droneWeight: 0.8 },
        gradual: { tempo: 0.6, tension: 0.2 },
        sudden: { tempo: 1.3, tension: 0.8, dynamics: 1.5 },
        eternal: { tempo: 0.3, density: 0.9, droneWeight: 1.0 },
        fleeting: { tempo: 1.1, density: 0.2, duration: 0.5 },
        pause: { tempo: 0.3, density: 0.1, silence: 2000 },
        wait: { tempo: 0.4, tension: 0.4, suspendHarmony: true }
    },

    /**
     * Spatial words affect density, reverb, and register
     */
    spatialWords: {
        vast: { density: 0.2, reverbSize: 'cathedral', register: 'low', spread: 1.0 },
        enormous: { density: 0.3, reverbSize: 'hall', register: 'low' },
        tiny: { density: 0.8, reverbSize: 'small', register: 'high' },
        intimate: { density: 0.5, reverbSize: 'room', register: 'mid' },
        distant: { density: 0.2, reverbSize: 'cathedral', highPass: 0.3 },
        close: { density: 0.7, reverbSize: 'small', lowPass: 0.6 },
        deep: { density: 0.4, register: 'low', reverbSize: 'hall' },
        high: { density: 0.3, register: 'high', brightness: 0.8 },
        wide: { density: 0.3, spread: 1.0, reverbSize: 'hall' },
        narrow: { density: 0.7, spread: 0.2, reverbSize: 'small' },
        crowded: { density: 0.9, tension: 0.6, reverbSize: 'small' },
        empty: { density: 0.1, tension: 0.2, reverbSize: 'cathedral' },
        hollow: { density: 0.2, register: 'mid', resonance: 0.8 }
    },

    /**
     * Textural/tactile words affect timbre and synthesis parameters
     */
    texturalWords: {
        smooth: { filterCutoff: 0.7, vibrato: 0.2, waveform: 'sine' },
        rough: { filterCutoff: 0.3, detune: 12, waveform: 'square' },
        soft: { filterCutoff: 0.8, attack: 1000, dynamics: 0.6 },
        hard: { filterCutoff: 0.4, attack: 10, dynamics: 0.9 },
        sharp: { filterCutoff: 0.2, attack: 5, brightness: 0.9 },
        dull: { filterCutoff: 0.5, release: 2000, brightness: 0.3 },
        warm: { filterCutoff: 0.6, waveform: 'triangle', lowPass: 0.6 },
        cold: { filterCutoff: 0.8, waveform: 'sine', highPass: 0.4 },
        crystalline: { instrument: 'bells', filterCutoff: 0.9, shimmer: 1.0 },
        muddy: { filterCutoff: 0.3, register: 'low', clarity: 0.2 },
        transparent: { density: 0.3, filterCutoff: 0.8, reverbMix: 0.7 },
        thick: { density: 0.8, filterCutoff: 0.4, voices: 6 },
        thin: { density: 0.2, filterCutoff: 0.7, voices: 2 }
    },

    /**
     * Color words (synesthetic mapping)
     */
    colorWords: {
        red: { mood: 0.2, tension: 0.7, warmth: 0.9, register: 'mid-low' },
        orange: { mood: 0.6, tension: 0.4, warmth: 0.8, register: 'mid' },
        yellow: { mood: 0.8, tension: 0.3, brightness: 1.0, register: 'high' },
        green: { mood: 0.4, tension: 0.2, balance: 0.8, register: 'mid' },
        blue: { mood: -0.2, tension: 0.3, coolness: 0.8, register: 'mid' },
        indigo: { mood: -0.3, tension: 0.5, depth: 0.8, register: 'mid-low' },
        violet: { mood: 0.3, tension: 0.6, mystery: 0.9, register: 'high' },
        purple: { mood: 0.1, tension: 0.5, richness: 0.9, register: 'mid' },
        white: { mood: 0.9, tension: 0.1, brightness: 1.0, density: 0.2 },
        black: { mood: -0.8, tension: 0.7, darkness: 1.0, density: 0.1 },
        gray: { mood: 0.0, tension: 0.3, neutrality: 1.0, density: 0.4 },
        gold: { mood: 0.7, tension: 0.3, shimmer: 1.0, instrument: 'bells' },
        silver: { mood: 0.5, tension: 0.4, brightness: 0.8, instrument: 'bells' },
        crimson: { mood: -0.1, tension: 0.8, intensity: 0.9, register: 'low' },
        azure: { mood: 0.4, tension: 0.2, coolness: 0.9, register: 'high' },
        emerald: { mood: 0.5, tension: 0.2, lushness: 0.9, register: 'mid' }
    },

    /**
     * Nature words map to specific instruments and textures
     */
    natureWords: {
        ocean: { instrument: 'drone', register: 'low', waveMotion: true, density: 0.4 },
        sea: { instrument: 'pad', register: 'low', waveMotion: true, density: 0.4 },
        wave: { instrument: 'swell', dynamics: 0.8, crescendo: true },
        water: { instrument: 'texture', fluidity: 0.9, filterMod: 0.7 },
        river: { instrument: 'pulse', flow: 0.8, continuity: true },
        rain: { instrument: 'texture', density: 0.6, staccato: true },
        storm: { instrument: 'atmosphere', tension: 0.9, dynamics: 1.2 },
        wind: { instrument: 'atmosphere', breathiness: 0.9, movement: true },
        forest: { instrument: 'pad', density: 0.6, complexity: 0.7 },
        tree: { instrument: 'drone', stability: 0.9, register: 'mid-low' },
        mountain: { instrument: 'drone', register: 'low', grandeur: 1.0 },
        sky: { instrument: 'atmosphere', register: 'high', openness: 1.0 },
        cloud: { instrument: 'pad', density: 0.3, movement: 0.5 },
        sun: { instrument: 'bells', brightness: 1.0, register: 'high' },
        moon: { instrument: 'pad', luminosity: 0.6, coolness: 0.8 },
        star: { instrument: 'texture', density: 0.2, sparkle: 1.0 },
        fire: { instrument: 'texture', intensity: 0.9, flicker: true },
        earth: { instrument: 'drone', register: 'low', grounding: 1.0 },
        stone: { instrument: 'pad', solidity: 1.0, register: 'low' },
        flower: { instrument: 'melody', delicacy: 0.9, register: 'high' },
        bird: { instrument: 'melody', register: 'high', ornamentation: 0.8 },
        night: { instrument: 'atmosphere', mood: -0.3, density: 0.2 },
        dawn: { instrument: 'pad', mood: 0.5, brightness: 0.7, emergence: true },
        dusk: { instrument: 'atmosphere', mood: -0.1, warmth: 0.8, fadeOut: true }
    },

    /**
     * Abstract concepts
     */
    abstractConcepts: {
        infinity: { tempo: 0.3, density: 0.7, droneWeight: 1.0, duration: 'extended' },
        void: { density: 0.05, tension: 0.6, silence: 3000 },
        chaos: { tension: 0.95, density: 0.9, randomness: 1.0 },
        order: { tension: 0.2, pattern: true, regularity: 1.0 },
        time: { pulseWeight: 0.8, continuity: true },
        space: { reverbSize: 'cathedral', density: 0.2, spread: 1.0 },
        memory: { mood: -0.2, echo: true, delayWeight: 0.8 },
        dream: { mood: 0.3, tension: 0.4, surreal: true, filterMod: 0.8 },
        truth: { clarity: 0.9, simplicity: 0.8, fundamentalWeight: 1.0 },
        mystery: { tension: 0.6, ambiguity: 0.9, scale: 'wholeTone' },
        shadow: { mood: -0.6, brightness: 0.1, register: 'low' },
        light: { mood: 0.8, brightness: 1.0, register: 'high' },
        silence: { density: 0.0, pause: 5000 },
        sound: { density: 0.6, presence: 1.0 },
        beginning: { emergence: true, crescendo: true, simplicity: 0.8 },
        end: { fadeOut: true, resolution: true, tonicWeight: 1.0 }
    },

    /**
     * Get parameters for a specific word
     */
    getWordParameters(word) {
        const lowerWord = word.toLowerCase();

        // Check all categories
        return (
            this.emotionKeywords[lowerWord] ||
            this.temporalWords[lowerWord] ||
            this.spatialWords[lowerWord] ||
            this.texturalWords[lowerWord] ||
            this.colorWords[lowerWord] ||
            this.natureWords[lowerWord] ||
            this.abstractConcepts[lowerWord] ||
            null
        );
    },

    /**
     * Get emotion-specific parameters with cultural context
     */
    getEmotionParameters(emotion, culturalContext = 'western') {
        const emotionData = this.emotionKeywords[emotion.toLowerCase()];
        if (!emotionData) return null;

        const params = { ...emotionData.base };

        // Add cultural-specific parameters
        if (emotionData[culturalContext]) {
            Object.assign(params, emotionData[culturalContext]);
        }

        return params;
    }
};
