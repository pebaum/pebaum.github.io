/**
 * GenerativeSequencer - Self-playing musical pattern generator
 * Controller influences the generation rather than directly triggering notes
 */

class GenerativeSequencer {
  constructor(synthEngine) {
    this.synth = synthEngine;
    this.running = false;

    // Callbacks
    this.onNotePlay = null; // Callback for when notes are played

    // Timing
    this.bpm = 120;
    this.stepInterval = null;
    this.currentStep = 0;
    this.stepsPerBar = 16; // 16th notes

    // Generative parameters (influenced by controller)
    this.params = {
      noteDensity: 0.4,        // Probability of note triggering (0-1)
      rhythmComplexity: 0.5,   // How complex the rhythm is (0-1)
      melodyRange: 2,          // Octave range for melodies (1-4)
      patternLength: 8,        // Pattern length in steps
      harmonyDensity: 0.2,     // Probability of chord notes (0-1)
      velocity: 0.7,           // Note velocity
      octaveShift: 0           // Octave transposition (-2 to +2)
    };

    // Pattern state
    this.currentPattern = [];
    this.lastNote = null;
    this.direction = 1; // 1 for up, -1 for down

    // Rhythm patterns (Euclidean-inspired)
    this.rhythmPatterns = [
      [1, 0, 0, 0, 1, 0, 0, 0],  // Basic kick pattern
      [1, 0, 1, 0, 1, 0, 1, 0],  // Eighth notes
      [1, 0, 0, 1, 0, 0, 1, 0],  // Syncopated
      [1, 0, 1, 1, 0, 1, 0, 0],  // Complex
      [1, 1, 0, 1, 0, 1, 1, 0]   // Dense
    ];

    this.currentRhythmPattern = this.rhythmPatterns[0];
  }

  /**
   * Start the generative sequencer
   */
  start() {
    if (this.running) return;

    this.running = true;
    this.currentStep = 0;
    this._generatePattern();
    this._scheduleNextStep();

    console.log('🎵 Generative sequencer started');
  }

  /**
   * Stop the sequencer
   */
  stop() {
    this.running = false;
    if (this.stepInterval) {
      clearTimeout(this.stepInterval);
      this.stepInterval = null;
    }
    console.log('⏹ Generative sequencer stopped');
  }

  /**
   * Schedule next step
   */
  _scheduleNextStep() {
    if (!this.running) return;

    const stepDuration = (60000 / this.bpm) / 4; // 16th note duration in ms

    this.stepInterval = setTimeout(() => {
      this._processStep();
      this._scheduleNextStep();
    }, stepDuration);
  }

  /**
   * Process a single step
   */
  _processStep() {
    // Check if rhythm pattern allows note on this step
    const rhythmIndex = this.currentStep % this.currentRhythmPattern.length;
    const rhythmActive = this.currentRhythmPattern[rhythmIndex];

    // Probability-based note triggering
    const shouldTrigger = rhythmActive && Math.random() < this.params.noteDensity;

    if (shouldTrigger) {
      this._playGenerativeNote();

      // Occasional harmony note
      if (Math.random() < this.params.harmonyDensity) {
        setTimeout(() => {
          this._playGenerativeNote(true);
        }, 50);
      }
    }

    // Advance step
    this.currentStep++;

    // Regenerate pattern periodically
    if (this.currentStep % this.params.patternLength === 0) {
      this._generatePattern();
    }
  }

  /**
   * Play a generative note
   */
  _playGenerativeNote(isHarmony = false) {
    const scaleSize = this.synth.scaleNotes.length;
    if (scaleSize === 0) return;

    let noteIndex;

    if (isHarmony && this.lastNote !== null) {
      // Play harmony note (3rd or 5th above)
      const interval = Math.random() < 0.5 ? 2 : 4; // 3rd or 5th in scale degrees
      noteIndex = (this.lastNote + interval) % scaleSize;
    } else {
      // Choose note based on pattern and melody range
      noteIndex = this._chooseNextNote();
    }

    // Apply octave shift
    let finalIndex = noteIndex + (this.params.octaveShift * 12);
    finalIndex = Math.max(0, Math.min(scaleSize - 1, finalIndex));

    // Play note with velocity variation
    const velocity = this.params.velocity * (0.8 + Math.random() * 0.4);
    this.synth.playScaleNote(finalIndex, velocity);

    // Notify callback
    if (this.onNotePlay) {
      this.onNotePlay(noteIndex % 12); // Pass note index modulo 12 for grid visualization
    }

    if (!isHarmony) {
      this.lastNote = noteIndex;
    }
  }

  /**
   * Choose next note based on melody algorithm
   */
  _chooseNextNote() {
    const scaleSize = this.synth.scaleNotes.length;

    // Random walk with melody range constraint
    if (this.lastNote === null) {
      // Start in middle range
      return Math.floor(scaleSize * 0.4) + Math.floor(Math.random() * Math.floor(scaleSize * 0.2));
    }

    // Constrain to melody range
    const rangeSize = Math.floor(scaleSize * (this.params.melodyRange / 4));
    const minNote = Math.floor(scaleSize * 0.3);
    const maxNote = Math.min(scaleSize - 1, minNote + rangeSize);

    // Weighted random walk (tends to move in current direction)
    const stepSize = Math.floor(1 + Math.random() * 3); // 1-3 scale steps
    let nextNote;

    if (Math.random() < 0.7) {
      // Continue in current direction
      nextNote = this.lastNote + (this.direction * stepSize);
    } else {
      // Change direction
      this.direction *= -1;
      nextNote = this.lastNote + (this.direction * stepSize);
    }

    // Bounce at boundaries
    if (nextNote > maxNote) {
      nextNote = maxNote;
      this.direction = -1;
    } else if (nextNote < minNote) {
      nextNote = minNote;
      this.direction = 1;
    }

    return Math.floor(nextNote);
  }

  /**
   * Generate a new pattern
   */
  _generatePattern() {
    // Select rhythm pattern based on complexity
    const patternIndex = Math.floor(this.params.rhythmComplexity * (this.rhythmPatterns.length - 1));
    this.currentRhythmPattern = this.rhythmPatterns[patternIndex];

    // Occasionally randomize rhythm pattern
    if (Math.random() < 0.3) {
      this.currentRhythmPattern = this.rhythmPatterns[
        Math.floor(Math.random() * this.rhythmPatterns.length)
      ];
    }
  }

  /**
   * Set tempo (BPM)
   */
  setTempo(bpm) {
    this.bpm = Math.max(60, Math.min(240, bpm));
  }

  /**
   * Set note density (0-1)
   */
  setNoteDensity(value) {
    this.params.noteDensity = Math.max(0, Math.min(1, value));
  }

  /**
   * Set rhythm complexity (0-1)
   */
  setRhythmComplexity(value) {
    this.params.rhythmComplexity = Math.max(0, Math.min(1, value));
  }

  /**
   * Set melody range (1-4 octaves)
   */
  setMelodyRange(value) {
    this.params.melodyRange = Math.max(1, Math.min(4, value));
  }

  /**
   * Set pattern length (4-32 steps)
   */
  setPatternLength(steps) {
    this.params.patternLength = Math.max(4, Math.min(32, steps));
  }

  /**
   * Set harmony density (0-1)
   */
  setHarmonyDensity(value) {
    this.params.harmonyDensity = Math.max(0, Math.min(1, value));
  }

  /**
   * Set note velocity (0-1)
   */
  setVelocity(value) {
    this.params.velocity = Math.max(0.1, Math.min(1, value));
  }

  /**
   * Set octave shift (-2 to +2)
   */
  setOctaveShift(value) {
    this.params.octaveShift = Math.floor(Math.max(-2, Math.min(2, value)));
  }

  /**
   * Get current parameters (for UI display)
   */
  getParams() {
    return { ...this.params, bpm: this.bpm };
  }
}

// Make available globally
window.GenerativeSequencer = GenerativeSequencer;
