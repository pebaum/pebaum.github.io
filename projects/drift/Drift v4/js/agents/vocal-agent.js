/**
 * Vocal Agent for Drift
 * Creates ethereal vocal textures and choir pads
 * Inspired by: Popol Vuh, Made in Abyss, FFXIII
 */

class VocalAgent extends BaseAgent {
  constructor(conductor) {
    super('Vocal', conductor);
    this.minInterval = 30000;  // 30 seconds
    this.maxInterval = 90000;  // 90 seconds
    this.activeVocals = [];
    this.maxConcurrent = 2;
  }
  
  init() {
    // Create choir pad
    this.choir = DriftSynths.createChoirPad();
    
    // Create a second vocal texture - humming/drone voice
    this.hum = this._createHumVoice();
    
    // Output
    this.output = new Tone.Gain(0.35);
    
    this.choir.output.connect(this.output);
    this.hum.output.connect(this.output);
    
    return this;
  }
  
  _createHumVoice() {
    // Low humming voice with vibrato
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.8,
        release: 4
      }
    });
    
    // Vibrato
    const vibrato = new Tone.Vibrato({
      frequency: 5,
      depth: 0.1
    });
    
    // Formant-ish filter
    const filter = new Tone.Filter({
      frequency: 400,
      type: 'bandpass',
      Q: 2
    });
    
    // Slow filter movement
    const filterLFO = new Tone.LFO({
      frequency: 0.08,
      min: 300,
      max: 600
    }).connect(filter.frequency).start();
    
    const gain = new Tone.Gain(0.5);
    
    synth.connect(vibrato);
    vibrato.connect(filter);
    filter.connect(gain);
    
    return {
      synth,
      output: gain,
      dispose: () => {
        synth.dispose();
        vibrato.dispose();
        filter.dispose();
        filterLFO.dispose();
        gain.dispose();
      }
    };
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    
    const state = this.getConductorState();
    
    // Vocals work best at higher mood (brighter)
    if (state.mood < 0.3) return false;
    
    // Need mid-range room
    if (!GlobalListener.hasBandRoom('mid', 0.35)) return false;
    
    // Check concurrent
    if (this.activeVocals.length >= this.maxConcurrent) return false;
    
    return super.shouldPlay();
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    const now = Tone.now();
    
    // Choose vocal type based on mood
    const useChoir = state.mood > 0.5 || DriftRandom.chance(0.4);
    
    // Get notes - vocals often use thirds and fifths
    const root = state.harmonicCenter;
    const intervals = [0, 4, 7, 12]; // Root, major 3rd, 5th, octave
    const interval = DriftRandom.choice(intervals);
    const noteMidi = root + interval;
    const freq = DriftMusic.midiToFreq(noteMidi);
    
    // Duration
    const duration = 8 + DriftRandom.range(0, 12); // 8-20 seconds
    const velocity = 0.25 + state.mood * 0.2;
    
    if (useChoir) {
      // Choir chord
      const chordNotes = [freq, freq * 1.25, freq * 1.5]; // Root, 3rd, 5th
      this.choir.synth.triggerAttack(chordNotes, now, velocity);
      
      const id = setTimeout(() => {
        this.choir.synth.triggerRelease(chordNotes, Tone.now());
        this._removeVocal(id);
      }, duration * 1000);
      
      this.activeVocals.push({ id, type: 'choir' });
      console.log(`Vocal: Choir chord at ${DriftMusic.midiToNote(noteMidi)}`);
    } else {
      // Single hum voice
      this.hum.synth.triggerAttack(freq, now, velocity);
      
      const id = setTimeout(() => {
        this.hum.synth.triggerRelease(Tone.now());
        this._removeVocal(id);
      }, duration * 1000);
      
      this.activeVocals.push({ id, type: 'hum' });
      console.log(`Vocal: Hum at ${DriftMusic.midiToNote(noteMidi)}`);
    }
  }
  
  _removeVocal(id) {
    this.activeVocals = this.activeVocals.filter(v => v.id !== id);
    if (this.activeVocals.length === 0) {
      this.isPlaying = false;
    }
  }
  
  stop() {
    super.stop();
    
    for (const vocal of this.activeVocals) {
      clearTimeout(vocal.id);
    }
    
    this.choir?.synth?.releaseAll();
    this.hum?.synth?.triggerRelease();
    this.activeVocals = [];
  }
  
  dispose() {
    this.stop();
    this.choir?.dispose();
    this.hum?.dispose();
    this.output?.dispose();
  }
}

window.VocalAgent = VocalAgent;
