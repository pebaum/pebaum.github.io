/**
 * Effects chain for Drift
 * Reverb, delay, compression, spatial processing
 */

const DriftEffects = {
  // Main output chain
  masterGain: null,
  limiter: null,
  compressor: null,
  
  // Reverb system (multiple modes)
  reverbs: {},
  currentReverb: null,
  reverbWet: null,
  
  // Delay
  delay: null,
  delayWet: null,
  
  // Sidechain compressor
  sidechain: null,
  sidechainEnvelope: null,
  
  // Auto-panner for spatial movement
  autoPanner: null,
  
  // Bit crusher for dark mood
  bitCrusher: null,
  
  // Current settings
  settings: {
    reverbMode: 'hall',
    delayTime: 0.5,
    delayFeedback: 0.3,
    sidechainEnabled: false,
    autoPanEnabled: true,
    bitCrushEnabled: false
  },
  
  /**
   * Initialize all effects
   */
  async init() {
    // Master output chain
    this.limiter = new Tone.Limiter(-1).toDestination();
    this.masterGain = new Tone.Gain(0.8).connect(this.limiter);
    
    // Compressor for glue
    this.compressor = new Tone.Compressor({
      threshold: -20,
      ratio: 3,
      attack: 0.1,
      release: 0.4
    }).connect(this.masterGain);
    
    // Create reverb modes
    await this._initReverbs();
    
    // Delay
    this.delay = new Tone.FeedbackDelay({
      delayTime: 0.5,
      feedback: 0.3,
      wet: 0
    }).connect(this.compressor);
    
    this.delayWet = new Tone.Gain(0.2).connect(this.delay);
    
    // Auto-panner (ICO-style spatial movement)
    this.autoPanner = new Tone.AutoPanner({
      frequency: 0.05, // Very slow
      depth: 0.4
    }).connect(this.compressor);
    this.autoPanner.start();
    
    // Sidechain envelope follower
    this.sidechainEnvelope = new Tone.Follower(0.1);
    
    // Bit crusher (for dark moods)
    this.bitCrusher = new Tone.BitCrusher({
      bits: 12
    });
    this.bitCrusher.wet.value = 0;
    
    this.isInitialized = true;
    console.log('Effects initialized');
    return this;
  },
  
  /**
   * Initialize multiple reverb modes
   */
  async _initReverbs() {
    // Reduced decay times for better performance
    // Reverbs are CPU-intensive, especially long ones
    
    this.reverbConfigs = {
      hall: { decay: 4, preDelay: 0.03, wet: 0.4 },
      cathedral: { decay: 6, preDelay: 0.05, wet: 0.5 },
      cistern: { decay: 8, preDelay: 0.06, wet: 0.5 },  // Reduced from 30s!
      intimate: { decay: 1.2, preDelay: 0.01, wet: 0.2 },
      floating: { decay: 2, preDelay: 0.02, wet: 0.3 }
    };
    
    // Only create one reverb initially (hall)
    const config = this.reverbConfigs.hall;
    const reverb = new Tone.Reverb({
      decay: config.decay,
      preDelay: config.preDelay,
      wet: config.wet
    });
    await reverb.generate();
    reverb.connect(this.compressor);
    this.reverbs.hall = reverb;
    
    // Start with hall
    this.currentReverb = this.reverbs.hall;
    this.settings.reverbMode = 'hall';
  },
  
  /**
   * Get the main output for instruments to connect to
   */
  getOutput() {
    return this.compressor;
  },
  
  /**
   * Get reverb send (instruments connect here for reverb)
   */
  getReverbSend() {
    return this.currentReverb;
  },
  
  /**
   * Get delay send
   */
  getDelaySend() {
    return this.delayWet;
  },
  
  /**
   * Get auto-panner (for melodic elements)
   */
  getAutoPanner() {
    return this.autoPanner;
  },
  
  /**
   * Switch reverb mode (creates on-demand)
   */
  async setReverbMode(mode, transitionTime = 2) {
    if (!this.reverbConfigs[mode]) {
      console.warn(`Unknown reverb mode: ${mode}`);
      return;
    }
    
    // Don't switch if already on this mode
    if (this.settings.reverbMode === mode) return;
    
    // Create reverb on-demand if not exists
    if (!this.reverbs[mode]) {
      const config = this.reverbConfigs[mode];
      const reverb = new Tone.Reverb({
        decay: config.decay,
        preDelay: config.preDelay,
        wet: 0  // Start silent
      });
      await reverb.generate();
      reverb.connect(this.compressor);
      this.reverbs[mode] = reverb;
    }
    
    // Cross-fade between reverbs
    const oldReverb = this.currentReverb;
    const newReverb = this.reverbs[mode];
    const newConfig = this.reverbConfigs[mode];
    
    // Fade out old, fade in new
    if (oldReverb !== newReverb) {
      oldReverb.wet.rampTo(0, transitionTime);
      newReverb.wet.rampTo(newConfig.wet, transitionTime);
      
      setTimeout(() => {
        this.currentReverb = newReverb;
      }, transitionTime * 1000);
    }
    
    this.settings.reverbMode = mode;
  },
  
  /**
   * Set reverb wetness
   */
  setReverbWet(wet, rampTime = 1) {
    this.currentReverb.wet.rampTo(wet, rampTime);
  },
  
  /**
   * Set delay parameters
   */
  setDelay(time, feedback, wet, rampTime = 1) {
    this.delay.delayTime.rampTo(time, rampTime);
    this.delay.feedback.rampTo(feedback, rampTime);
    this.delayWet.gain.rampTo(wet, rampTime);
  },
  
  /**
   * Set auto-panner speed and depth
   */
  setAutoPan(frequency, depth) {
    this.autoPanner.frequency.value = frequency;
    this.autoPanner.depth.value = depth;
  },
  
  /**
   * Enable/disable auto-panner
   */
  enableAutoPan(enabled) {
    if (enabled) {
      this.autoPanner.start();
    } else {
      this.autoPanner.stop();
    }
    this.settings.autoPanEnabled = enabled;
  },
  
  /**
   * Set bit crusher (for dark moods)
   */
  setBitCrush(enabled, bits = 12) {
    this.bitCrusher.bits.value = bits;
    this.bitCrusher.wet.rampTo(enabled ? 0.3 : 0, 2);
    this.settings.bitCrushEnabled = enabled;
  },
  
  /**
   * Set master volume
   */
  setMasterVolume(volume, rampTime = 1) {
    this.masterGain.gain.rampTo(volume, rampTime);
  },
  
  /**
   * Trigger a random glitch effect (rare)
   * Inspired by: Sakamoto async
   */
  triggerGlitch() {
    if (!this.isInitialized) return;
    
    const glitchType = DriftRandom.choice(['stutter', 'dropout', 'bitcrush']);
    
    switch (glitchType) {
      case 'stutter':
        // Brief repeat/stutter
        const stutterTime = 0.05 + DriftRandom.range(0, 0.1);
        this.delay.delayTime.setValueAtTime(stutterTime, Tone.now());
        this.delay.feedback.setValueAtTime(0.8, Tone.now());
        setTimeout(() => {
          this.delay.delayTime.rampTo(0.5, 0.5);
          this.delay.feedback.rampTo(0.3, 0.5);
        }, 200);
        console.log('Glitch: stutter');
        break;
        
      case 'dropout':
        // Brief silence
        const currentVol = this.masterGain.gain.value;
        this.masterGain.gain.setValueAtTime(0, Tone.now());
        setTimeout(() => {
          this.masterGain.gain.rampTo(currentVol, 0.1);
        }, 50 + DriftRandom.range(0, 100));
        console.log('Glitch: dropout');
        break;
        
      case 'bitcrush':
        // Momentary heavy crush
        this.bitCrusher.bits.value = 4;
        this.bitCrusher.wet.setValueAtTime(0.8, Tone.now());
        setTimeout(() => {
          this.bitCrusher.bits.value = 12;
          this.bitCrusher.wet.rampTo(0, 0.5);
        }, 100 + DriftRandom.range(0, 150));
        console.log('Glitch: bitcrush');
        break;
    }
  },
  
  /**
   * Update effects based on conductor state
   * Throttled to reduce CPU usage
   */
  lastEffectUpdate: 0,
  effectUpdateInterval: 2000, // Only update effects every 2 seconds
  
  updateFromConductor(state) {
    const now = Date.now();
    
    // Throttle heavy effect changes
    if (now - this.lastEffectUpdate < this.effectUpdateInterval) {
      // Still allow rare glitch/silence events
      if (DriftRandom.chance(0.0001)) {
        this.triggerGlitch();
      }
      if (DriftRandom.chance(0.00002)) {
        this.triggerSilenceDrop();
      }
      return;
    }
    this.lastEffectUpdate = now;
    
    // Darker mood = different reverb, maybe bit crush
    if (state.mood < 0.2) {
      this.setReverbMode('cathedral');
      this.setBitCrush(true, 10);
    } else if (state.mood < 0.4) {
      this.setReverbMode('hall');
      this.setBitCrush(false);
    } else if (state.mood > 0.7) {
      this.setReverbMode('floating');
      this.setBitCrush(false);
    } else {
      this.setReverbMode('hall');
      this.setBitCrush(false);
    }
    
    // Higher tension = slower auto-pan
    const panSpeed = 0.02 + (1 - state.tension) * 0.08;
    this.setAutoPan(panSpeed, 0.3 + state.tension * 0.2);
    
    // Delay feedback increases with density (capped for stability)
    const delayFeedback = Math.min(0.4, 0.2 + state.density * 0.2);
    this.setDelay(0.5, delayFeedback, 0.15);
    
    // Rare sudden drop to silence (Lorn style)
    if (DriftRandom.chance(0.00005)) {
      this.triggerSilenceDrop();
    }
  },
  
  /**
   * Trigger a sudden drop to silence, then gradual return
   * Inspired by: Lorn REMNANT
   */
  triggerSilenceDrop() {
    if (!this.isInitialized) return;
    
    const currentVolume = this.masterGain.gain.value;
    const silenceDuration = 1 + DriftRandom.range(0, 2); // 1-3 seconds
    
    // Quick drop
    this.masterGain.gain.rampTo(0, 0.05);
    
    // Gradual return
    setTimeout(() => {
      this.masterGain.gain.rampTo(currentVolume, 2);
    }, silenceDuration * 1000);
    
    console.log(`Silence drop: ${silenceDuration.toFixed(1)}s`);
  },
  
  /**
   * Trigger sidechain-style breathing effect (HLD style)
   */
  triggerSidechainPump(duration = 0.3) {
    if (!this.isInitialized) return;
    
    const currentVolume = this.masterGain.gain.value;
    const now = Tone.now();
    
    this.masterGain.gain.setValueAtTime(currentVolume, now);
    this.masterGain.gain.linearRampToValueAtTime(currentVolume * 0.4, now + 0.02);
    this.masterGain.gain.linearRampToValueAtTime(currentVolume, now + duration);
  },
  
  isInitialized: false,
  
  /**
   * Cleanup
   */
  dispose() {
    this.masterGain?.dispose();
    this.limiter?.dispose();
    this.compressor?.dispose();
    this.delay?.dispose();
    this.autoPanner?.dispose();
    this.bitCrusher?.dispose();
    
    for (const reverb of Object.values(this.reverbs)) {
      reverb?.dispose();
    }
    this.isInitialized = false;
  }
};

// Make available globally
window.DriftEffects = DriftEffects;
