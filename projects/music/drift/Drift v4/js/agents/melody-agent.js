/**
 * Melody Agent for Drift
 * Creates rare, precious melodic phrases
 * Inspired by: Skyrim, FFXIII, ICO, Tunic
 */

class MelodyAgent extends BaseAgent {
  constructor(conductor) {
    super('Melody', conductor);
    this.minInterval = 45000;   // 45 seconds
    this.maxInterval = 120000;  // 2 minutes
    this.isPlayingMelody = false;
    this.noteTimeouts = [];
  }
  
  init() {
    // Create melodic instruments
    this.flute = DriftSynths.createFluteLead();
    this.piano = DriftSynths.createSoftPiano();
    this.bell = DriftSynths.createGlassBell();
    this.cello = DriftSynths.createCello();
    this.violin = DriftSynths.createViolin();
    this.musicBox = DriftSynths.createMusicBox();
    
    // Output with auto-panner for spatial movement
    this.output = new Tone.Gain(0.35);
    
    this.flute.output.connect(this.output);
    this.piano.output.connect(this.output);
    this.bell.output.connect(this.output);
    this.cello.output.connect(this.output);
    this.violin.output.connect(this.output);
    this.musicBox.output.connect(this.output);
    
    return this;
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    if (this.isPlayingMelody) return false;
    
    const state = this.getConductorState();
    
    // Only play during mid-density (flowering phase)
    if (state.density < 0.35 || state.density > 0.75) return false;    
    // Check if there's room in the mix
    if (!GlobalListener.hasRoom(0.6)) return false;
    if (!GlobalListener.hasBandRoom('mid', 0.35)) return false;
    
    // More likely at moderate tension
    const tensionBonus = state.tension > 0.3 && state.tension < 0.7 ? 0.1 : 0;
    
    return super.shouldPlay() || DriftRandom.chance(tensionBonus);
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    
    // Generate melodic phrase
    const melody = this._generateMelody(state);
    
    // Select instrument based on mood
    let instrument;
    if (state.mood > 0.6) {
      // Bright: flute, piano, violin, music box
      instrument = DriftRandom.weightedChoice([
        { value: this.flute, weight: 0.35 },
        { value: this.piano, weight: 0.25 },
        { value: this.violin, weight: 0.2 },
        { value: this.musicBox, weight: 0.2 }
      ]);
    } else if (state.mood < 0.35) {
      // Dark: cello, bell, violin
      instrument = DriftRandom.weightedChoice([
        { value: this.cello, weight: 0.45 },
        { value: this.bell, weight: 0.3 },
        { value: this.violin, weight: 0.25 }
      ]);
    } else {
      // Balanced: any
      instrument = DriftRandom.choice([this.flute, this.piano, this.bell, this.cello, this.violin, this.musicBox]);
    }
    
    // Play the melody
    this._playMelody(melody, instrument, state);
    
    const instrumentName = instrument === this.flute ? 'flute' :
                          instrument === this.piano ? 'piano' :
                          instrument === this.cello ? 'cello' :
                          instrument === this.violin ? 'violin' :
                          instrument === this.musicBox ? 'music box' : 'bell';
    
    // Notify conductor (for potential doubling by other agents)
    this.conductor.broadcast({
      type: 'MELODY_START',
      notes: melody,
      duration: melody.length * 1000
    });
    
    console.log(`Melody: Playing ${melody.length}-note phrase on ${instrument === this.flute ? 'flute' : instrument === this.piano ? 'piano' : 'bell'}`);
  }
  
  _generateMelody(state) {
    // Select contour type based on mood
    let contourType;
    if (state.mood > 0.6) {
      contourType = DriftRandom.choice(['rise-fall', 'arch', 'wave']);
    } else if (state.mood < 0.3) {
      contourType = DriftRandom.choice(['fall', 'wave']);
    } else {
      contourType = DriftRandom.choice(['rise-fall', 'fall', 'arch', 'leap-fall']);
    }
    
    // Phrase length
    const length = DriftRandom.rangeInt(4, 8);
    
    // Get scale notes in melodic range
    const scaleNotes = DriftMusic.getScaleNotes(state.harmonicCenter + 24, state.scale, 2);
    
    // Starting note (mid-range of available notes)
    const startIndex = Math.floor(scaleNotes.length / 2);
    const startNote = scaleNotes[startIndex];
    
    // Generate melody following contour
    const melody = DriftMusic.generateContour(startNote, contourType, length, scaleNotes);
    
    return melody;
  }
  
  _playMelody(melody, instrument, state) {
    this.isPlayingMelody = true;
    
    // Decide if we should double the melody (Skyrim-style)
    const shouldDouble = DriftRandom.chance(0.3);
    let doublingInstrument = null;
    if (shouldDouble) {
      // Pick a complementary instrument for doubling
      if (instrument === this.flute) {
        doublingInstrument = DriftRandom.chance(0.5) ? this.piano : this.bell;
      } else if (instrument === this.piano) {
        doublingInstrument = this.bell;
      }
      if (doublingInstrument) {
        console.log('Melody: Doubling with second voice');
      }
    }
    
    // Note timing
    const baseInterval = 600 + (1 - state.tension) * 800; // 600-1400ms
    const velocity = 0.35 + state.mood * 0.15;
    
    // Play each note
    melody.forEach((noteMidi, index) => {
      const delay = index * baseInterval;
      const timeout = setTimeout(() => {
        if (!this.isPlayingMelody) return;
        
        const freq = DriftMusic.midiToFreq(noteMidi);
        const noteVelocity = velocity + DriftRandom.range(-0.05, 0.05);
        
        // Slight timing humanization
        const humanize = DriftRandom.range(-20, 20);
        
        setTimeout(() => {
          if (instrument === this.flute) {
            instrument.synth.triggerAttackRelease(freq, '4n', Tone.now(), noteVelocity);
          } else if (instrument === this.piano) {
            instrument.synth.triggerAttackRelease(freq, '2n', Tone.now(), noteVelocity);
          } else if (instrument === this.bell) {
            instrument.synth.triggerAttackRelease(freq, '2n', Tone.now(), noteVelocity);
          } else if (instrument === this.cello) {
            instrument.synth.triggerAttackRelease(freq, '2n', Tone.now(), noteVelocity);
          }
          
          // Doubling voice (slightly delayed, different octave, quieter)
          if (doublingInstrument && DriftRandom.chance(0.7)) {
            const doubleDelay = 50 + DriftRandom.range(0, 100);
            const doubleFreq = freq * (DriftRandom.chance(0.5) ? 0.5 : 2); // Octave up or down
            setTimeout(() => {
              if (doublingInstrument === this.bell) {
                doublingInstrument.synth.triggerAttackRelease(doubleFreq, '2n', Tone.now(), noteVelocity * 0.5);
              } else if (doublingInstrument === this.piano) {
                doublingInstrument.synth.triggerAttackRelease(doubleFreq, '2n', Tone.now(), noteVelocity * 0.5);
              }
            }, doubleDelay);
          }
        }, Math.max(0, humanize));
        
      }, delay);
      
      this.noteTimeouts.push(timeout);
    });
    
    // End melody after last note
    const totalDuration = melody.length * baseInterval + 2000;
    const endTimeout = setTimeout(() => {
      this._endMelody();
    }, totalDuration);
    
    this.noteTimeouts.push(endTimeout);
  }
  
  _endMelody() {
    this.isPlayingMelody = false;
    this.isPlaying = false;
    
    // Clear timeouts
    for (const timeout of this.noteTimeouts) {
      clearTimeout(timeout);
    }
    this.noteTimeouts = [];
    
    // Notify conductor
    this.conductor.broadcast({ type: 'MELODY_END' });
  }
  
  stop() {
    super.stop();
    this._endMelody();
  }
  
  onPhaseChange(event) {
    if (event.phase === 'genesis' || event.phase === 'awakening') {
      this.setEnabled(false);
    } else if (event.phase === 'flowering') {
      this.setEnabled(true);
      this.minInterval = 90000;
    } else if (event.phase === 'contemplation') {
      this.minInterval = 120000;
    } else if (event.phase === 'dissolution') {
      this.setEnabled(false);
    }
  }
  
  onKeyChangePending(event) {
    // Don't start new melody if key change coming
    if (this.isPlayingMelody) {
      console.log('Melody: Finishing phrase before key change');
    }
  }
  
  dispose() {
    this.stop();
    this.flute?.dispose();
    this.piano?.dispose();
    this.bell?.dispose();
    super.dispose();
  }
}

// Make available globally
window.MelodyAgent = MelodyAgent;
