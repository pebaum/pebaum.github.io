/**
 * Pulse Agent for Drift
 * Creates repeating ostinato patterns
 * Inspired by: ICO (handpan), Hosono, Skyrim
 */

class PulseAgent extends BaseAgent {
  constructor(conductor) {
    super('Pulse', conductor);
    this.minInterval = 20000;  // 20 seconds
    this.maxInterval = 60000;  // 1 minute
    this.isPatternRunning = false;
    this.patternTimeout = null;
    this.noteTimeouts = [];
  }
  
  init() {
    // Create instruments
    this.bell = DriftSynths.createGlassBell();
    this.handpan = DriftSynths.createHandpan();
    this.piano = DriftSynths.createSoftPiano();
    this.harp = DriftSynths.createHarp();
    this.marimba = DriftSynths.createMarimba();
    this.guitar = DriftSynths.createAcousticGuitar();
    
    // Output mixer
    this.output = new Tone.Gain(0.3);
    
    this.bell.output.connect(this.output);
    this.handpan.output.connect(this.output);
    this.piano.output.connect(this.output);
    this.harp.output.connect(this.output);
    this.marimba.output.connect(this.output);
    this.guitar.output.connect(this.output);
    
    return this;
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    if (this.isPatternRunning) return false;    
    const state = this.getConductorState();
    
    // Need moderate density for pulse patterns
    if (state.density < 0.3 || state.density > 0.8) return false;
    
    // Check if mid/high has room
    if (!GlobalListener.hasBandRoom('mid', 0.4)) return false;
    
    return super.shouldPlay();
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    
    // Generate pattern
    const pattern = this._generatePattern(state);
    
    // Select instrument based on mood
    let instrument;
    if (state.mood > 0.6) {
      // Bright: bells, harp, marimba, guitar
      instrument = DriftRandom.weightedChoice([
        { value: this.bell, weight: 0.25 },
        { value: this.harp, weight: 0.3 },
        { value: this.marimba, weight: 0.25 },
        { value: this.guitar, weight: 0.2 }
      ]);
    } else if (state.mood < 0.35) {
      // Dark: handpan, piano, guitar
      instrument = DriftRandom.weightedChoice([
        { value: this.handpan, weight: 0.4 },
        { value: this.piano, weight: 0.35 },
        { value: this.guitar, weight: 0.25 }
      ]);
    } else {
      // Balanced: any
      instrument = DriftRandom.choice([this.bell, this.handpan, this.piano, this.harp, this.marimba, this.guitar]);
    }
    
    // Start the pattern
    this._playPattern(pattern, instrument, state);
    
    const instrumentName = instrument === this.bell ? 'bell' : 
                          instrument === this.handpan ? 'handpan' :
                          instrument === this.piano ? 'piano' :
                          instrument === this.harp ? 'harp' :
                          instrument === this.marimba ? 'marimba' : 'guitar';
    console.log(`Pulse: ${pattern.length}-note ${instrumentName} pattern`);
  }
  
  _generatePattern(state) {
    // Use prime number lengths (Eno technique)
    const lengths = [5, 7, 11, 13];
    const patternLength = DriftRandom.choice(lengths);
    
    // Get scale notes
    const scaleNotes = this.getScaleNotes(2);
    const baseIndex = Math.floor(scaleNotes.length / 3); // Lower-mid range    
    // Generate pattern with some structure
    const pattern = [];
    let currentIndex = baseIndex;
    
    for (let i = 0; i < patternLength; i++) {
      // Occasional rest
      if (DriftRandom.chance(0.15)) {
        pattern.push(null);
        continue;
      }
      
      // Step movement with occasional leaps
      const step = DriftRandom.chance(0.8) 
        ? DriftRandom.rangeInt(-1, 1)  // Step
        : DriftRandom.rangeInt(-3, 3); // Leap
      
      currentIndex = Math.max(0, Math.min(scaleNotes.length - 1, currentIndex + step));
      pattern.push(scaleNotes[currentIndex]);
    }
    
    return pattern;
  }
  
  _playPattern(pattern, instrument, state) {
    this.isPatternRunning = true;
    
    // Tempo based on overall feeling (very slow)
    const noteInterval = 800 + (1 - state.tension) * 1200; // 800-2000ms
    
    // How many times to repeat
    const repetitions = DriftRandom.rangeInt(4, 12);
    const totalDuration = pattern.length * noteInterval * repetitions;
    
    // Velocity curve (slight variation)
    const baseVelocity = 0.3 + state.tension * 0.2;
    
    let noteIndex = 0;
    let rep = 0;
    
    const playNext = () => {
      if (!this.isPatternRunning) return;
      
      const note = pattern[noteIndex];
      
      if (note !== null) {
        const freq = DriftMusic.midiToFreq(note);
        const velocity = baseVelocity + DriftRandom.range(-0.05, 0.05);
        
        // Play note
        if (instrument === this.bell) {
          instrument.synth.triggerAttackRelease(freq, '4n', Tone.now(), velocity);
        } else if (instrument === this.handpan) {
          instrument.trigger(freq, Tone.now(), velocity);
        } else if (instrument === this.piano) {
          instrument.synth.triggerAttackRelease(freq, '2n', Tone.now(), velocity);
        }
      }
      
      noteIndex++;
      if (noteIndex >= pattern.length) {
        noteIndex = 0;
        rep++;
        
        if (rep >= repetitions) {
          this._stopPattern();
          return;
        }
      }
      
      // Schedule next note
      const timeout = setTimeout(playNext, noteInterval);
      this.noteTimeouts.push(timeout);
    };
    
    // Start playing
    playNext();
    
    // Safety timeout
    this.patternTimeout = setTimeout(() => {
      this._stopPattern();
    }, totalDuration + 5000);
  }
  
  _stopPattern() {
    this.isPatternRunning = false;
    this.isPlaying = false;
    
    // Clear all timeouts
    for (const timeout of this.noteTimeouts) {
      clearTimeout(timeout);
    }
    this.noteTimeouts = [];
    
    if (this.patternTimeout) {
      clearTimeout(this.patternTimeout);
      this.patternTimeout = null;
    }
  }
  
  stop() {
    super.stop();
    this._stopPattern();
  }
  
  onPhaseChange(event) {
    if (event.phase === 'genesis' || event.phase === 'dissolution') {
      this.setEnabled(false);
    } else if (event.phase === 'awakening') {
      this.setEnabled(true);
      this.minInterval = 90000;
    } else if (event.phase === 'flowering') {
      this.minInterval = 60000;
    }
  }
  
  onKeyChangePending(event) {
    // Stop current pattern before key change
    if (this.isPatternRunning) {
      console.log('Pulse: Stopping for key change');
      this._stopPattern();
    }
  }
  
  dispose() {
    this.stop();
    this.bell?.dispose();
    this.handpan?.dispose();
    this.piano?.dispose();
    super.dispose();
  }
}

// Make available globally
window.PulseAgent = PulseAgent;
