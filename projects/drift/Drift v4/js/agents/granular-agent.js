/**
 * Granular Agent for Drift
 * Creates glitchy, fragmented textures
 * Inspired by: Lorn, Ashen (fragmented memories), Hyper Light Drifter
 */

class GranularAgent extends BaseAgent {
  constructor(conductor) {
    super('Granular', conductor);
    this.minInterval = 40000;  // 40 seconds
    this.maxInterval = 100000; // 100 seconds
    this.isGrainPlaying = false;
    this.grainTimeouts = [];
  }
  
  init() {
    // Source synth to "granularize"
    this.source = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.1 }
    });
    
    // Bit crusher for digital degradation
    this.bitCrusher = new Tone.BitCrusher(8);
    
    // Tremolo for choppy effect
    this.tremolo = new Tone.Tremolo({
      frequency: 15,
      depth: 0.8,
      spread: 0
    }).start();
    
    // Filter
    this.filter = new Tone.Filter({
      frequency: 2000,
      type: 'lowpass'
    });
    
    // Output
    this.output = new Tone.Gain(0.2);
    
    this.source.connect(this.bitCrusher);
    this.bitCrusher.connect(this.tremolo);
    this.tremolo.connect(this.filter);
    this.filter.connect(this.output);
    
    return this;
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    if (this.isGrainPlaying) return false;
    
    const state = this.getConductorState();
    
    // Granular works best at darker moods or higher tension
    if (state.mood > 0.6 && state.tension < 0.4) return false;
    
    // Need some room
    if (!GlobalListener.hasRoom(0.45)) return false;
    
    return super.shouldPlay();
  }
  
  play() {
    super.play();
    this.isGrainPlaying = true;
    
    const state = this.getConductorState();
    
    // Adjust bit depth based on mood (darker = more crushed)
    const bits = Math.floor(6 + state.mood * 6); // 6-12 bits
    this.bitCrusher.bits.value = bits;
    
    // Tremolo speed based on tension
    this.tremolo.frequency.value = 8 + state.tension * 20; // 8-28 Hz
    
    // Create a grain cloud
    const numGrains = 8 + Math.floor(DriftRandom.range(0, 12));
    const duration = 4 + DriftRandom.range(0, 6); // 4-10 seconds
    const grainSpacing = (duration * 1000) / numGrains;
    
    // Notes from scale
    const scaleNotes = this.getScaleNotes(2);
    const baseIndex = Math.floor(scaleNotes.length / 2);
    
    // Schedule grains
    for (let i = 0; i < numGrains; i++) {
      const delay = i * grainSpacing + DriftRandom.range(-grainSpacing * 0.3, grainSpacing * 0.3);
      
      const timeout = setTimeout(() => {
        const noteIndex = baseIndex + Math.floor(DriftRandom.gaussian() * 3);
        const clampedIndex = Math.max(0, Math.min(scaleNotes.length - 1, noteIndex));
        const note = scaleNotes[clampedIndex];
        const freq = DriftMusic.midiToFreq(note);
        
        const grainDuration = 0.05 + DriftRandom.range(0, 0.15);
        const velocity = 0.2 + DriftRandom.range(0, 0.3);
        
        this.source.triggerAttackRelease(freq, grainDuration, Tone.now(), velocity);
      }, Math.max(0, delay));
      
      this.grainTimeouts.push(timeout);
    }
    
    // End grain cloud
    const endTimeout = setTimeout(() => {
      this.isGrainPlaying = false;
      this.grainTimeouts = [];
    }, duration * 1000 + 500);
    
    this.grainTimeouts.push(endTimeout);
    
    console.log(`Granular: ${numGrains} grains over ${duration.toFixed(1)}s, ${bits} bits`);
  }
  
  stop() {
    super.stop();
    
    for (const timeout of this.grainTimeouts) {
      clearTimeout(timeout);
    }
    this.grainTimeouts = [];
    this.isGrainPlaying = false;
  }
  
  dispose() {
    this.stop();
    this.source?.dispose();
    this.bitCrusher?.dispose();
    this.tremolo?.dispose();
    this.filter?.dispose();
    this.output?.dispose();
  }
}

window.GranularAgent = GranularAgent;
