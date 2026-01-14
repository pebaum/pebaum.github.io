/**
 * Ritual Agent for Drift
 * Creates singing bowls, bells, gongs - ceremonial sounds
 * Inspired by: Deep Listening, Hamel Organum, Sakamoto async
 */

class RitualAgent extends BaseAgent {
  constructor(conductor) {
    super('Ritual', conductor);
    this.minInterval = 35000;  // 35 seconds
    this.maxInterval = 90000;  // 90 seconds
    this.activeRituals = [];
  }
  
  init() {
    // Singing bowl
    this.bowl = DriftSynths.createSingingBowl();
    
    // Large gong
    this.gong = this._createGong();
    
    // Temple bell (different from glass bell)
    this.templeBell = this._createTempleBell();
    
    // Conch shell
    this.conch = DriftSynths.createConchShell();
    
    // Bowed glass
    this.bowedGlass = DriftSynths.createBowedGlass();
    
    // Struck metal pipes
    this.struckMetal = DriftSynths.createStruckMetal();
    
    // Output
    this.output = new Tone.Gain(0.3);
    
    this.bowl.output.connect(this.output);
    this.gong.output.connect(this.output);
    this.templeBell.output.connect(this.output);
    this.conch.output.connect(this.output);
    this.bowedGlass.output.connect(this.output);
    this.struckMetal.output.connect(this.output);
    
    return this;
  }
  
  _createGong() {
    // Gong: metallic with long decay and complex harmonics
    const synth = new Tone.MetalSynth({
      frequency: 80,
      envelope: {
        attack: 0.01,
        decay: 8,
        release: 6
      },
      harmonicity: 3.1,
      modulationIndex: 16,
      resonance: 2000,
      octaves: 1.5
    });
    
    // Low pass to remove harshness
    const filter = new Tone.Filter({
      frequency: 1500,
      type: 'lowpass'
    });
    
    // Long reverb tail built in via gain envelope
    const gain = new Tone.Gain(0.4);
    
    synth.connect(filter);
    filter.connect(gain);
    
    return {
      synth,
      output: gain,
      trigger: (time, velocity) => synth.triggerAttackRelease('C1', 8, time, velocity),
      dispose: () => {
        synth.dispose();
        filter.dispose();
        gain.dispose();
      }
    };
  }
  
  _createTempleBell() {
    // Temple bell: pure tone with beating
    const fundamental = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 6, sustain: 0.1, release: 8 }
    });
    
    // Slightly detuned for beating
    const beating = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 5, sustain: 0.05, release: 7 }
    });
    
    const mixer = new Tone.Gain(0.5);
    const beatingGain = new Tone.Gain(0.3);
    
    fundamental.connect(mixer);
    beating.connect(beatingGain);
    beatingGain.connect(mixer);
    
    return {
      fundamental,
      beating,
      output: mixer,
      trigger: (freq, time, velocity) => {
        fundamental.triggerAttackRelease(freq, 6, time, velocity);
        beating.triggerAttackRelease(freq * 1.003, 5, time, velocity * 0.6); // Slight detune
      },
      dispose: () => {
        fundamental.dispose();
        beating.dispose();
        mixer.dispose();
        beatingGain.dispose();
      }
    };
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    
    const state = this.getConductorState();
    
    // Ritual sounds work at any mood but need space
    if (!GlobalListener.hasRoom(0.4)) return false;
    
    // More likely at lower tension (contemplative)
    if (state.tension > 0.6 && !DriftRandom.chance(0.3)) return false;
    
    return super.shouldPlay();
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    const now = Tone.now();
    
    // Choose ritual sound
    const ritualType = DriftRandom.weightedChoice([
      { value: 'bowl', weight: 0.3 },
      { value: 'gong', weight: 0.15 },
      { value: 'templeBell', weight: 0.2 },
      { value: 'conch', weight: 0.1 },
      { value: 'bowedGlass', weight: 0.1 },
      { value: 'struckMetal', weight: 0.15 }
    ]);
    
    // Get note
    const root = state.harmonicCenter;
    const intervals = [0, 7, 12, -12]; // Root, fifth, octave up/down
    const interval = DriftRandom.choice(intervals);
    const noteMidi = root + interval;
    const freq = DriftMusic.midiToFreq(noteMidi);
    const note = DriftMusic.midiToNote(noteMidi);
    
    const velocity = 0.3 + DriftRandom.range(0, 0.2);
    
    switch (ritualType) {
      case 'bowl':
        this.bowl.trigger(freq, now, velocity);
        console.log(`Ritual: Singing bowl at ${note}`);
        break;
        
      case 'gong':
        this.gong.trigger(now, velocity * 0.7);
        console.log(`Ritual: Gong strike`);
        break;
        
      case 'templeBell':
        // Temple bells often higher
        const bellFreq = freq * (DriftRandom.chance(0.5) ? 2 : 1);
        this.templeBell.trigger(bellFreq, now, velocity);
        console.log(`Ritual: Temple bell at ${DriftMusic.midiToNote(noteMidi + (bellFreq > freq ? 12 : 0))}`);
        break;
        
      case 'conch':
        // Long droning sound
        this.conch.triggerAttackRelease(note, '8n', now, velocity * 0.8);
        console.log(`Ritual: Conch shell drone at ${note}`);
        break;
        
      case 'bowedGlass':
        // Ethereal singing glass
        const glassNote = DriftMusic.midiToNote(noteMidi + 12); // Octave up
        this.bowedGlass.triggerAttackRelease(glassNote, '4n', now, velocity * 0.6);
        console.log(`Ritual: Bowed glass at ${glassNote}`);
        break;
        
      case 'struckMetal':
        // Industrial struck metal pipes
        this.struckMetal.trigger(freq * 2, now, velocity * 0.5);
        console.log(`Ritual: Struck metal at ${note}`);
        break;
    }
    
    // Mark as done after decay
    const id = setTimeout(() => {
      this._removeRitual(id);
    }, 10000);
    
    this.activeRituals.push({ id, type: ritualType });
  }
  
  _removeRitual(id) {
    this.activeRituals = this.activeRituals.filter(r => r.id !== id);
    if (this.activeRituals.length === 0) {
      this.isPlaying = false;
    }
  }
  
  stop() {
    super.stop();
    for (const ritual of this.activeRituals) {
      clearTimeout(ritual.id);
    }
    this.activeRituals = [];
  }
  
  dispose() {
    this.stop();
    this.bowl?.dispose();
    this.gong?.dispose();
    this.templeBell?.dispose();
    this.output?.dispose();
  }
}

window.RitualAgent = RitualAgent;
