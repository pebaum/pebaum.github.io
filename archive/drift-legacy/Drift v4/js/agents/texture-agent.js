/**
 * Texture Agent for Drift
 * Creates ambient textures: breath, wind, noise
 * Inspired by: Tunic, Sakamoto async, Lorn
 */

class TextureAgent extends BaseAgent {
  constructor(conductor) {
    super('Texture', conductor);
    this.minInterval = 10000;
    this.maxInterval = 45000;
    this.isBreathRunning = false;
  }
  
  init() {
    // Create texture sources
    this.breath = DriftSynths.createBreathTexture();
    
    // Additional noise layer
    this.noiseLayer = new Tone.Noise('brown');
    this.noiseFilter = new Tone.Filter({
      frequency: 500,
      type: 'lowpass',
      rolloff: -24
    });
    this.noiseGain = new Tone.Gain(0);
    
    this.noiseLayer.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    
    // Output mixer
    this.output = new Tone.Gain(0.25);
    
    this.breath.output.connect(this.output);
    this.noiseGain.connect(this.output);
    
    return this;
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    
    const state = this.getConductorState();
    
    // Textures can fill silence
    if (GlobalListener.needsActivity(8)) {
      return true;
    }
    
    // More likely at higher density
    const densityBonus = state.density * 0.3;
    
    return super.shouldPlay() || DriftRandom.chance(densityBonus * 0.1);
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    
    // Decide what kind of texture
    if (!this.isBreathRunning && DriftRandom.chance(0.6)) {
      this._startBreath(state);
    } else {
      this._playNoiseSwell(state);
    }
  }
  
  _startBreath(state) {
    if (this.isBreathRunning) return;
    
    this.breath.start();
    this.breath.setIntensity(0.3 + state.density * 0.4);
    this.isBreathRunning = true;
    
    // Run for a random duration (reduced for performance)
    const duration = DriftRandom.range(15, 30) * 1000;
    
    setTimeout(() => {
      this._stopBreath();
    }, duration);
    
    console.log(`Texture: Starting breath for ${(duration/1000).toFixed(1)}s`);
  }
  
  _stopBreath() {
    this.breath.stop();
    this.isBreathRunning = false;
    this.isPlaying = false;
  }
  
  _playNoiseSwell(state) {
    // Brown noise swell
    if (!this.noiseLayer.state || this.noiseLayer.state !== 'started') {
      this.noiseLayer.start();
    }
    
    const peakGain = 0.1 + state.tension * 0.15;
    const swellTime = DriftRandom.range(5, 15);
    const holdTime = DriftRandom.range(2, 8);
    const releaseTime = DriftRandom.range(5, 15);
    
    // Swell envelope
    this.noiseGain.gain.rampTo(peakGain, swellTime);
    
    setTimeout(() => {
      this.noiseGain.gain.rampTo(0, releaseTime);
      setTimeout(() => {
        this.isPlaying = false;
      }, releaseTime * 1000);
    }, (swellTime + holdTime) * 1000);
    
    console.log(`Texture: Noise swell, peak ${peakGain.toFixed(2)}`);
  }
  
  stop() {
    super.stop();
    this._stopBreath();
    this.noiseGain.gain.rampTo(0, 2);
    setTimeout(() => {
      if (this.noiseLayer.state === 'started') {
        this.noiseLayer.stop();
      }
    }, 2000);
  }
  
  update(deltaTime) {
    super.update(deltaTime);
    
    // Continuously adjust breath intensity based on state
    if (this.isBreathRunning) {
      const state = this.getConductorState();
      this.breath.setIntensity(0.3 + state.density * 0.4);
    }
  }
  
  onPhaseChange(event) {
    if (event.phase === 'genesis') {
      this.setEnabled(true);
      this.minInterval = 5000; // More active texture at start
    } else if (event.phase === 'flowering') {
      this.minInterval = 15000;
    }
  }
  
  onDissolving(event) {
    // Keep subtle texture during dissolution
    this.minInterval = 20000;
  }
  
  dispose() {
    this.stop();
    this.breath?.dispose();
    this.noiseLayer?.dispose();
    this.noiseFilter?.dispose();
    this.noiseGain?.dispose();
    super.dispose();
  }
}

// Make available globally
window.TextureAgent = TextureAgent;
