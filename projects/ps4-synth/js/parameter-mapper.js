/**
 * ParameterMapper - Randomizes gamepad -> synth parameter mappings
 * The core of the "figure it out each time" mechanic
 */

class ParameterMapper {
  constructor(synthEngine) {
    this.synth = synthEngine;
    this.mappings = {
      axes: {},      // axis index -> parameter name
      buttons: {}    // button index -> note index
    };

    // Define available performance parameters for axis mapping
    // Focus on real-time expressive controls
    this.availableAxisParams = [
      { name: 'pitchBend', min: -7, max: 7, curve: 'linear' },                   // Pitch bend in semitones
      { name: 'reverbMix', min: 0.1, max: 0.8, curve: 'linear' },                // Reverb amount
      { name: 'delayMix', min: 0, max: 0.6, curve: 'linear' },                   // Delay amount
      { name: 'filterFrequency', min: 800, max: 8000, curve: 'exponential' },    // Filter sweep
      { name: 'filterResonance', min: 0.5, max: 8, curve: 'linear' },            // Filter resonance
      { name: 'masterVolume', min: 0.3, max: 0.8, curve: 'linear' },             // Volume
      { name: 'vibrato', min: 0, max: 8, curve: 'linear' },                      // Vibrato depth (cents)
      { name: 'tremolo', min: 0, max: 0.6, curve: 'linear' }                     // Tremolo depth
    ];

    this.lastAxisValues = [0, 0, 0, 0];
    this.activeNotes = new Map(); // Track held notes for sustain
    this.chordMode = false; // Arrow keys toggle chord mode
  }

  /**
   * Randomize all mappings
   * This is called on init and when user presses "Re-randomize"
   */
  randomize() {
    console.log('🎲 Randomizing control mappings...');

    // Shuffle performance parameters for axes
    const shuffledParams = DriftRandom.shuffle([...this.availableAxisParams]);

    // Map each axis to a performance parameter (1 per axis for clarity)
    this.mappings.axes = {
      0: shuffledParams[0], // Left stick X
      1: shuffledParams[1], // Left stick Y
      2: shuffledParams[2], // Right stick X
      3: shuffledParams[3]  // Right stick Y
    };

    // Face buttons trigger notes
    const faceButtons = [0, 1, 2, 3]; // X, Circle, Square, Triangle
    const shoulderButtons = [4, 5, 6, 7]; // L1, R1, L2, R2

    const scaleSize = this.synth.scaleNotes.length;
    this.mappings.buttons = {};

    // Assign face buttons to different notes in the scale
    faceButtons.forEach((buttonIndex, i) => {
      const noteIndex = Math.floor((i / faceButtons.length) * scaleSize);
      this.mappings.buttons[buttonIndex] = noteIndex;
    });

    // Assign shoulder buttons to other notes
    shoulderButtons.forEach((buttonIndex, i) => {
      const noteIndex = Math.floor(scaleSize * 0.5) + Math.floor((i / shoulderButtons.length) * (scaleSize * 0.5));
      this.mappings.buttons[buttonIndex] = noteIndex;
    });

    // D-pad arrows: chord modifiers (not notes)
    this.mappings.buttons[12] = 'chordMajor';    // D-Up = major triad
    this.mappings.buttons[13] = 'chordMinor';    // D-Down = minor triad
    this.mappings.buttons[14] = 'chordSus';      // D-Left = suspended
    this.mappings.buttons[15] = 'chord7th';      // D-Right = 7th chord

    // Special buttons
    this.mappings.buttons[8] = 'randomScale';  // Share = Random scale
    this.mappings.buttons[9] = 'stopAll';      // Options = Stop all notes

    console.log('🎹 Control mappings randomized');
    console.log('Buttons: Direct note control');
    console.log('Arrows: Chord modes');
    console.log('Sticks: Performance effects');
  }

  /**
   * Process axis change - controls performance parameters
   */
  processAxis(axisIndex, value) {
    const param = this.mappings.axes[axisIndex];
    if (!param) return;

    // Convert -1..1 to 0..1
    const normalized = (value + 1) / 2;

    // Apply curve and scale to range
    let scaled;
    if (param.curve === 'exponential') {
      // Exponential curve for frequency-like parameters
      const expValue = Math.pow(normalized, 2);
      scaled = param.min * Math.pow(param.max / param.min, expValue);
    } else {
      // Linear
      scaled = param.min + normalized * (param.max - param.min);
    }

    // Call the appropriate synth method
    this._setParameter(param.name, scaled);
  }

  /**
   * Process button press - triggers notes or chords
   */
  processButtonPress(buttonIndex, velocity) {
    const mapping = this.mappings.buttons[buttonIndex];

    if (mapping === 'randomScale') {
      // Change to random scale
      const scales = this.synth.getScaleNames();
      const newScale = DriftRandom.choice(scales);
      this.synth.setScale(newScale);
      console.log('🎵 Scale changed to:', newScale);

    } else if (mapping === 'stopAll') {
      // Stop all playing notes
      this.synth.stopAll();
      this.activeNotes.clear();
      console.log('🔇 All notes stopped');

    } else if (typeof mapping === 'string' && mapping.startsWith('chord')) {
      // Set chord mode
      this.currentChordType = mapping;
      console.log('🎹 Chord mode:', mapping);

    } else if (typeof mapping === 'number') {
      // Play note (with chord if chord mode active)
      if (!this.activeNotes.has(buttonIndex)) {
        if (this.currentChordType) {
          // Play chord
          this._playChord(mapping, velocity);
        } else {
          // Play single note
          this.synth.playScaleNote(mapping, velocity);
        }
        this.activeNotes.set(buttonIndex, mapping);
      }
    }
  }

  /**
   * Process button release - stop held notes
   */
  processButtonRelease(buttonIndex) {
    const mapping = this.mappings.buttons[buttonIndex];

    // Clear chord mode when arrow key released
    if (typeof mapping === 'string' && mapping.startsWith('chord')) {
      this.currentChordType = null;
      console.log('🎹 Chord mode off');
    }

    // Remove from active notes
    this.activeNotes.delete(buttonIndex);
  }

  /**
   * Play a chord based on root note and chord type
   */
  _playChord(rootNoteIndex, velocity) {
    const scaleSize = this.synth.scaleNotes.length;

    // Define chord intervals (in scale degrees)
    let intervals = [0]; // Root note

    switch (this.currentChordType) {
      case 'chordMajor':
        intervals = [0, 2, 4]; // Root, 3rd, 5th (major triad)
        break;
      case 'chordMinor':
        intervals = [0, 2, 4]; // Same intervals, but will sound different based on scale
        break;
      case 'chordSus':
        intervals = [0, 1, 4]; // Root, 2nd, 5th (suspended)
        break;
      case 'chord7th':
        intervals = [0, 2, 4, 6]; // Root, 3rd, 5th, 7th
        break;
    }

    // Play each note in the chord
    intervals.forEach((interval, i) => {
      const noteIndex = (rootNoteIndex + interval) % scaleSize;
      // Slight velocity variation for humanization
      const chordVelocity = velocity * (0.9 + i * 0.05);
      this.synth.playScaleNote(noteIndex, chordVelocity);
    });
  }

  /**
   * Set a synth parameter by name
   */
  _setParameter(paramName, value) {
    switch (paramName) {
      case 'filterFrequency':
        this.synth.setFilterFrequency(value);
        break;
      case 'filterResonance':
        this.synth.setFilterResonance(value);
        break;
      case 'reverbMix':
        this.synth.setReverbMix(value);
        break;
      case 'delayMix':
        this.synth.setDelayMix(value);
        break;
      case 'masterVolume':
        this.synth.setVolume(value);
        break;
      case 'pitchBend':
        this.synth.setPitchBend(value);
        break;
      case 'vibrato':
        this.synth.setWowFlutterAmount(value / 100); // Convert cents to 0-1
        this.synth.setWowFlutterSpeed(0.4); // Fixed vibrato speed ~5Hz
        break;
      case 'tremolo':
        this.synth.setTremolo(value);
        break;
    }
  }

  /**
   * Get current mappings (for UI display)
   */
  getCurrentMappings() {
    // Build button mappings display
    const noteButtons = {};
    const chordButtons = {};

    for (const [btnIdx, mapping] of Object.entries(this.mappings.buttons)) {
      const buttonName = this._getButtonName(parseInt(btnIdx));

      if (typeof mapping === 'number') {
        noteButtons[buttonName] = `Note ${mapping}`;
      } else if (typeof mapping === 'string' && mapping.startsWith('chord')) {
        const chordType = mapping.replace('chord', '');
        chordButtons[buttonName] = `${chordType} Chord`;
      }
    }

    return {
      axes: {
        'Left Stick X': this.mappings.axes[0] ? this.getParameterDisplayName(this.mappings.axes[0].name) : 'None',
        'Left Stick Y': this.mappings.axes[1] ? this.getParameterDisplayName(this.mappings.axes[1].name) : 'None',
        'Right Stick X': this.mappings.axes[2] ? this.getParameterDisplayName(this.mappings.axes[2].name) : 'None',
        'Right Stick Y': this.mappings.axes[3] ? this.getParameterDisplayName(this.mappings.axes[3].name) : 'None'
      },
      noteButtons: noteButtons,
      chordButtons: chordButtons,
      specialActions: {
        'Share': 'Random Scale',
        'Options': 'Stop All Notes'
      }
    };
  }

  /**
   * Get human-readable button name
   */
  _getButtonName(buttonIndex) {
    const names = {
      0: 'X',
      1: 'Circle',
      2: 'Square',
      3: 'Triangle',
      4: 'L1',
      5: 'R1',
      6: 'L2',
      7: 'R2',
      8: 'Share',
      9: 'Options',
      12: 'D-Up',
      13: 'D-Down',
      14: 'D-Left',
      15: 'D-Right'
    };
    return names[buttonIndex] || `Button ${buttonIndex}`;
  }

  /**
   * Get human-readable parameter name
   */
  getParameterDisplayName(paramName) {
    const displayNames = {
      // Performance parameters
      'pitchBend': 'Pitch Bend',
      'reverbMix': 'Reverb Amount',
      'delayMix': 'Delay Amount',
      'filterFrequency': 'Filter Cutoff',
      'filterResonance': 'Filter Resonance',
      'masterVolume': 'Volume',
      'vibrato': 'Vibrato',
      'tremolo': 'Tremolo'
    };
    return displayNames[paramName] || paramName;
  }
}

// Make available globally
window.ParameterMapper = ParameterMapper;
