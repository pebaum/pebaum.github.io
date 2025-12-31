/**
 * Musical scales and harmonic data for Drift
 */

const DriftScales = {
  // Scale intervals from root (in semitones)
  scales: {
    // Primary ambient modes
    'dorian':     [0, 2, 3, 5, 7, 9, 10],      // Warm, hopeful
    'aeolian':    [0, 2, 3, 5, 7, 8, 10],      // Natural minor, melancholic
    'phrygian':   [0, 1, 3, 5, 7, 8, 10],      // Dark, mysterious
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],      // Bright, floating
    'lydian':     [0, 2, 4, 6, 7, 9, 11],      // Ethereal, dreamy
    
    // Additional useful scales
    'major':      [0, 2, 4, 5, 7, 9, 11],
    'minor':      [0, 2, 3, 5, 7, 8, 10],      // Same as aeolian
    'pentatonic': [0, 2, 4, 7, 9],             // Safe, folk-like
    'pentatonicMinor': [0, 3, 5, 7, 10],       // Darker pentatonic
    
    // Exotic/world scales
    'japanese':   [0, 1, 5, 7, 8],             // In scale
    'arabian':    [0, 2, 4, 5, 6, 8, 10],
    'hungarian':  [0, 2, 3, 6, 7, 8, 11],
    
    // Minimalist
    'wholeTone':  [0, 2, 4, 6, 8, 10],         // Dreamy, floating
    'chromatic':  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  },
  
  // Mood to scale mapping
  moodScales: {
    dark:      ['phrygian', 'aeolian'],
    neutral:   ['dorian', 'aeolian', 'pentatonicMinor'],
    hopeful:   ['dorian', 'mixolydian'],
    bright:    ['lydian', 'mixolydian', 'major'],
    ethereal:  ['lydian', 'wholeTone', 'pentatonic'],
    mysterious: ['phrygian', 'japanese', 'wholeTone']
  },
  
  /**
   * Get appropriate scale for mood value
   * @param {number} mood - 0 (dark) to 1 (bright)
   */
  getScaleForMood(mood) {
    if (mood < 0.2) return DriftRandom.choice(this.moodScales.dark);
    if (mood < 0.4) return DriftRandom.choice(this.moodScales.neutral);
    if (mood < 0.6) return DriftRandom.choice(this.moodScales.hopeful);
    if (mood < 0.8) return DriftRandom.choice(this.moodScales.bright);
    return DriftRandom.choice(this.moodScales.ethereal);
  },
  
  // Common chord progressions (as scale degrees)
  progressions: {
    // Simple and calming
    simple: [
      [1],           // Just root
      [1, 4],        // I - IV
      [1, 5],        // I - V
      [1, 4, 5],     // I - IV - V (ICO style)
    ],
    
    // More movement
    moving: [
      [1, 6, 4, 5],        // I - vi - IV - V
      [1, 5, 6, 4],        // I - V - vi - IV
      [1, 4, 6, 5],        // I - IV - vi - V
      [6, 4, 1, 5],        // vi - IV - I - V
    ],
    
    // Rich/impressionist (FFXIII style)
    rich: [
      [1, 2, 4, 5],        // I - ii - IV - V
      [1, 3, 4, 5],        // I - iii - IV - V
      [1, 6, 2, 5],        // I - vi - ii - V
      [4, 5, 3, 6],        // IV - V - iii - vi
    ],
    
    // Modal/ambiguous
    modal: [
      [1, 7],              // i - VII (aeolian)
      [1, 3, 7],           // i - III - VII
      [1, 4, 7],           // i - iv - VII
      [1, 6, 3, 7],        // i - vi - III - VII
    ]
  },
  
  /**
   * Get chord progression for mood
   */
  getProgressionForMood(mood, complexity = 'simple') {
    // Lower mood = more modal, higher = more major
    if (mood < 0.3) {
      return DriftRandom.choice(this.progressions.modal);
    }
    if (complexity === 'rich' && mood > 0.4) {
      return DriftRandom.choice(this.progressions.rich);
    }
    if (mood > 0.5 && DriftRandom.chance(0.5)) {
      return DriftRandom.choice(this.progressions.moving);
    }
    return DriftRandom.choice(this.progressions.simple);
  },
  
  // Voicing types with their characteristics
  voicings: {
    'fifth':   { intervals: [0, 7], character: 'open, medieval' },
    'triad':   { intervals: [0, 4, 7], character: 'full, stable' },
    'minor':   { intervals: [0, 3, 7], character: 'melancholic' },
    'sus2':    { intervals: [0, 2, 7], character: 'ambiguous, floating' },
    'sus4':    { intervals: [0, 5, 7], character: 'tense, unresolved' },
    'add9':    { intervals: [0, 4, 7, 14], character: 'lush, modern' },
    'quartal': { intervals: [0, 5, 10], character: 'open, jazzy' },
    'maj7':    { intervals: [0, 4, 7, 11], character: 'dreamy, sophisticated' },
    'min7':    { intervals: [0, 3, 7, 10], character: 'warm, melancholic' }
  },
  
  /**
   * Get voicing for mood
   */
  getVoicingForMood(mood) {
    if (mood < 0.3) {
      return DriftRandom.choice(['fifth', 'minor', 'sus2']);
    }
    if (mood < 0.5) {
      return DriftRandom.choice(['minor', 'sus4', 'min7']);
    }
    if (mood < 0.7) {
      return DriftRandom.choice(['triad', 'sus2', 'add9']);
    }
    return DriftRandom.choice(['maj7', 'add9', 'quartal']);
  },
  
  // Microtonal settings (Gorogoa-inspired)
  microtonal: {
    enabled: false,
    baseFreq: 424,  // A4 = 424Hz instead of 440Hz
    
    // Detuning in cents for specific scale degrees
    detuneMap: {
      0: 0,     // Root stays pure
      1: -10,   // Minor 2nd slightly flat
      2: +15,   // Major 2nd slightly sharp
      3: 0,
      4: +5,
      5: 0,
      6: -20,   // 6th noticeably flat
      7: +10,
      8: -5,
      9: 0,
      10: +8,
      11: -12
    },
    
    /**
     * Get detuning for a scale degree
     */
    getDetune(semitones) {
      if (!this.enabled) return 0;
      const degree = ((semitones % 12) + 12) % 12;
      return this.detuneMap[degree] || 0;
    }
  },
  
  /**
   * Enable/disable microtonal mode
   */
  setMicrotonal(enabled) {
    this.microtonal.enabled = enabled;
    if (enabled) {
      DriftMusic.A4 = this.microtonal.baseFreq;
    } else {
      DriftMusic.A4 = 440;
    }
  }
};

// Make available globally
window.DriftScales = DriftScales;
