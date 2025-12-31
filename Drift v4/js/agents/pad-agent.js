/**
 * Pad Agent for Drift
 * Creates sustained harmonic pads and chords
 * Inspired by: Hyper Light Drifter, Ashen, FFXIII
 */

class PadAgent extends BaseAgent {
  constructor(conductor) {
    super('Pad', conductor);
    this.minInterval = 10000;  // 10 seconds
    this.maxInterval = 30000;  // 30 seconds
    this.activePads = [];
    this.maxConcurrentPads = 1;  // Reduced from 2
    this.currentDegree = 0;
    this.progressionIndex = 0;
  }
  
  init() {
    // Create pad synths
    this.strings = DriftSynths.createStringEnsemble();
    this.choir = DriftSynths.createChoirPad();
    this.shimmer = DriftSynths.createShimmerPad();
    this.pastel = DriftSynths.createPastelPad();
    
    // Output mixer
    this.output = new Tone.Gain(0.35);
    
    this.strings.output.connect(this.output);
    this.choir.output.connect(this.output);
    this.shimmer.output.connect(this.output);
    this.pastel.output.connect(this.output);
    
    return this;
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    
    const state = this.getConductorState();
    
    // Need some density for pads
    if (state.density < 0.2) return false;
    
    // Check if mid frequency band has room
    if (!GlobalListener.hasBandRoom('mid', 0.5)) return false;
    
    // Check concurrent limit
    if (this.activePads.length >= this.maxConcurrentPads) return false;
    
    return super.shouldPlay();
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    const now = Tone.now();
    
    // Get voicing type based on mood
    const voicing = DriftScales.getVoicingForMood(state.mood);
    
    // Use progression - step through it sequentially for coherence
    const progression = DriftScales.getProgressionForMood(state.mood);
    this.progressionIndex = (this.progressionIndex + 1) % progression.length;
    const degree = progression[this.progressionIndex];
    
    // Build chord
    const chordNotes = DriftMusic.getChord(
      state.harmonicCenter + 12, // One octave up from bass
      state.scale,
      degree,
      voicing
    );
    
    // Open voicing for ambient spread
    const spreadNotes = DriftMusic.openVoicing(chordNotes, 3);
    
    // Convert to frequencies
    const frequencies = spreadNotes.map(midi => DriftMusic.midiToFreq(midi));
    
    // Select synth based on mood
    let synth;
    if (state.mood > 0.65) {
      // Bright mood: shimmer, choir, or pastel
      synth = DriftRandom.weightedChoice([
        { value: this.shimmer, weight: 0.4 },
        { value: this.choir, weight: 0.3 },
        { value: this.pastel, weight: 0.3 }
      ]);
    } else if (state.mood < 0.35) {
      // Dark mood: strings
      synth = this.strings;
    } else {
      // Balanced: weighted choice
      synth = DriftRandom.weightedChoice([
        { value: this.strings, weight: 0.4 },
        { value: this.choir, weight: 0.25 },
        { value: this.shimmer, weight: 0.15 },
        { value: this.pastel, weight: 0.2 }
      ]);
    }
    
    // Duration based on density (reduced for performance)
    const duration = 10 + state.density * 10; // 10-20 seconds
    
    // Velocity based on tension (but not too loud)
    const velocity = 0.25 + state.tension * 0.25;
    
    // Play the chord
    synth.synth.triggerAttack(frequencies, now, velocity);
    
    // Schedule release
    const padId = setTimeout(() => {
      synth.synth.triggerRelease(frequencies, Tone.now());
      this._removePad(padId);
    }, duration * 1000);
    
    this.activePads.push({ id: padId, synth, notes: frequencies });
    
    console.log(`Pad: ${voicing} chord, degree ${degree}, ${duration.toFixed(0)}s`);
  }
  
  _removePad(padId) {
    this.activePads = this.activePads.filter(p => p.id !== padId);
    if (this.activePads.length === 0) {
      this.isPlaying = false;
    }
  }
  
  stop() {
    super.stop();
    
    for (const pad of this.activePads) {
      clearTimeout(pad.id);
      pad.synth.synth.triggerRelease(pad.notes, Tone.now());
    }
    this.activePads = [];
  }
  
  onKeyChangePending(event) {
    // Release pads with longer release to blend
    console.log('Pad: Key change coming, releasing...');
  }
  
  onPhaseChange(event) {
    if (event.phase === 'genesis') {
      this.setEnabled(false); // No pads in genesis
    } else if (event.phase === 'awakening') {
      this.setEnabled(true);
      this.maxConcurrentPads = 1;
    } else if (event.phase === 'flowering') {
      this.maxConcurrentPads = 2;
      this.minInterval = 10000;
    } else if (event.phase === 'dissolution') {
      this.maxConcurrentPads = 1;
      this.minInterval = 30000;
    }
  }
  
  onClimaxBuilding(event) {
    // More pads during climax
    this.maxConcurrentPads = 3;
    this.minInterval = 8000;
  }
  
  dispose() {
    this.stop();
    this.strings?.dispose();
    this.choir?.dispose();
    super.dispose();
  }
}

// Make available globally
window.PadAgent = PadAgent;
