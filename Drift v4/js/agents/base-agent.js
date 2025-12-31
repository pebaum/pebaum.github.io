/**
 * Base Agent class for Drift
 * All instrument agents inherit from this
 */

class BaseAgent {
  constructor(name, conductor) {
    this.name = name;
    this.conductor = conductor;
    this.isPlaying = false;
    this.lastPlayTime = 0;
    this.minInterval = 5000; // Minimum ms between events
    this.maxInterval = 30000;
    this.synth = null;
    this.output = null;
    this.enabled = true;
    this.volume = 0.5;
  }
  
  /**
   * Initialize the agent's instruments
   * Override in subclasses
   */
  init() {
    throw new Error('Subclass must implement init()');
  }
  
  /**
   * Connect to effects chain
   */
  connect(destination, reverbSend = null, delaySend = null) {
    if (this.output) {
      // Dry signal
      this.output.connect(destination);
      
      // Reverb send
      if (reverbSend) {
        this.output.connect(reverbSend);
      }
      
      // Delay send (usually less)
      if (delaySend) {
        const delaySendGain = new Tone.Gain(0.3);
        this.output.connect(delaySendGain);
        delaySendGain.connect(delaySend);
      }
    }
  }
  
  /**
   * Check if this agent should play now
   * Override in subclasses for specific logic
   */
  shouldPlay() {
    if (!this.enabled) return false;
        // Check conductor limits first
    if (this.conductor && !this.conductor.canAgentTrigger()) {
      return false;
    }
        const now = Date.now();
    const timeSinceLastPlay = now - this.lastPlayTime;
    
    // Basic timing check
    if (timeSinceLastPlay < this.minInterval) return false;
    
    // Random chance based on interval
    const playChance = (timeSinceLastPlay - this.minInterval) / 
                       (this.maxInterval - this.minInterval);
    
    return DriftRandom.chance(Math.min(playChance, 0.5));
  }
  
  /**
   * Main update loop - called by conductor
   */
  update(deltaTime) {
    if (!this.enabled) return;
    
    if (this.shouldPlay()) {
      this.play();
    }
  }
  
  /**
   * Play/trigger the agent
   * Override in subclasses
   */
  play() {
    this.lastPlayTime = Date.now();
    this.isPlaying = true;
    GlobalListener.markEvent();    
    // Mark trigger in conductor for spacing
    if (this.conductor) {
      this.conductor.markAgentTrigger();
    }  }
  
  /**
   * Stop playing
   */
  stop() {
    this.isPlaying = false;
  }
  
  /**
   * Receive broadcast from conductor
   */
  receive(event) {
    switch (event.type) {
      case 'KEY_CHANGE_PENDING':
        this.onKeyChangePending(event);
        break;
      case 'PHASE_CHANGE':
        this.onPhaseChange(event);
        break;
      case 'DENSITY_CHANGE':
        this.onDensityChange(event);
        break;
      case 'CLIMAX_BUILDING':
        this.onClimaxBuilding(event);
        break;
      case 'DISSOLVING':
        this.onDissolving(event);
        break;
    }
  }
  
  // Event handlers - override in subclasses
  onKeyChangePending(event) {}
  onPhaseChange(event) {}
  onDensityChange(event) {}
  onClimaxBuilding(event) {}
  onDissolving(event) {}
  
  /**
   * Get current state from conductor
   */
  getConductorState() {
    return this.conductor.getState();
  }
  
  /**
   * Get available scale notes
   */
  getScaleNotes(octaves = 2) {
    const state = this.getConductorState();
    return DriftMusic.getScaleNotes(state.harmonicCenter, state.scale, octaves);
  }
  
  /**
   * Get a note from the current scale
   */
  getScaleNote(degreeOffset = 0) {
    const notes = this.getScaleNotes(3);
    const baseIndex = Math.floor(notes.length / 2);
    const index = Math.max(0, Math.min(notes.length - 1, baseIndex + degreeOffset));
    return notes[index];
  }
  
  /**
   * Set volume
   */
  setVolume(vol, rampTime = 1) {
    this.volume = vol;
    if (this.output?.gain) {
      this.output.gain.rampTo(vol, rampTime);
    }
  }
  
  /**
   * Enable/disable
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.stop();
    if (this.synth?.dispose) {
      this.synth.dispose();
    }
    if (this.output?.dispose) {
      this.output.dispose();
    }
  }
}

// Make available globally
window.BaseAgent = BaseAgent;
