/**
 * Voice Class - Looping Granular Voice
 * Like Drift v7 voices, but triggers grain clouds instead of oscillators
 */

class Voice {
  constructor(engine, register, period) {
    this.engine = engine;
    this.register = register; // 'low', 'mid', 'high'
    this.period = period; // Loop period in seconds
    this.lastTrigger = 0;
    this.age = 0;
    this.phase = 0; // 0-1: position in current loop
    this.active = true;
    this.loopCount = 0;

    // SPATIAL MOVEMENT - organic panning and depth (from Drift v7)
    this.panPosition = 0; // Current pan (-1 to 1)
    this.panSpeed = DriftRandom.range(0.15, 0.35); // Cycles per minute
    this.panPhase = DriftRandom.range(0, Math.PI * 2);

    this.depth = DriftRandom.range(0.3, 0.7); // 0=close/dry, 1=far/wet
    this.depthSpeed = DriftRandom.range(0.1, 0.25); // Cycles per minute
    this.depthPhase = DriftRandom.range(0, Math.PI * 2);

    // Playback position in sample (varies per register)
    this.samplePosition = this.getRegisterPosition();

    // VOICE VARIATION - each voice has unique processing characteristics
    // 30% chance of reverse playback
    this.reverse = Math.random() < 0.3;

    // Grain size variation (some voices use smaller or larger grains)
    this.grainSizeMultiplier = DriftRandom.range(0.7, 1.5);

    // Reverb depth variation (some voices are dryer, some wetter)
    this.reverbMultiplier = DriftRandom.range(0.6, 1.4);

    // Density variation (some voices are sparser)
    this.densityMultiplier = DriftRandom.range(0.8, 1.2);
  }

  /**
   * Get sample position range based on register
   */
  getRegisterPosition() {
    switch (this.register) {
      case 'low':
        return DriftRandom.range(0.1, 0.3); // Early in sample
      case 'mid':
        return DriftRandom.range(0.3, 0.7); // Middle of sample
      case 'high':
        return DriftRandom.range(0.6, 0.9); // Later in sample
      default:
        return 0.5;
    }
  }

  /**
   * Update voice state
   */
  update(dt) {
    if (!this.active) return;

    this.age += dt;
    this.phase = (this.age % (this.period * 1000)) / (this.period * 1000);

    // Update spatial movement - slow organic drift
    const timeInMinutes = this.age / 60000;

    // Pan oscillates left-right
    this.panPosition = Math.sin((timeInMinutes * this.panSpeed * Math.PI * 2) + this.panPhase) * 0.7;

    // Depth oscillates near-far
    this.depth = 0.5 + Math.sin((timeInMinutes * this.depthSpeed * Math.PI * 2) + this.depthPhase) * 0.3;

    const now = Date.now();
    const elapsed = now - this.lastTrigger;

    // Trigger when loop period completes
    if (elapsed >= this.period * 1000) {
      // High probability (85%) - mostly yes, sometimes skip for variation
      if (Math.random() < 0.85) {
        this.trigger();
      }
      this.lastTrigger = now;
    }
  }

  /**
   * Trigger grain cloud
   */
  trigger() {
    if (!this.engine || !this.engine.sampleBuffer) {
      console.warn('Voice trigger failed: engine or sample not available');
      return;
    }

    this.loopCount++;

    // Get pitch transposition based on register and current scale
    const pitch = this.getPitchFromScale();

    // Debug logging (only for first few triggers)
    if (this.loopCount <= 3) {
      console.log(`Voice ${this.register} triggering (loop ${this.loopCount}), pitch: ${pitch.toFixed(1)} semitones`);
    }

    // Cloud duration varies by register
    const isHighRegister = this.register === 'high';
    const duration = isHighRegister ? DriftRandom.range(8, 14) : DriftRandom.range(12, 20);

    // Grain density (higher register = slightly sparser for clarity)
    const baseDensity = isHighRegister ? DriftRandom.range(60, 90) : DriftRandom.range(80, 120);
    const density = baseDensity * this.densityMultiplier;

    // Slightly vary sample position for organic feel
    const position = this.samplePosition + DriftRandom.range(-0.05, 0.05);

    // Apply reverb depth multiplier
    const reverbDepth = Math.max(0, Math.min(1, this.depth * this.reverbMultiplier));

    // Trigger the grain cloud with voice-specific variations
    this.engine.triggerGrainCloud({
      position: Math.max(0, Math.min(1, position)),
      pitch: pitch,
      duration: duration,
      density: density,
      pan: this.panPosition,
      reverbDepth: reverbDepth,
      reverse: this.reverse,
      grainSizeMultiplier: this.grainSizeMultiplier
    });
  }

  /**
   * Get pitch from scale based on register
   */
  getPitchFromScale() {
    if (!window.scale || window.scale.length === 0) {
      return window.pitchTransposeOffset || 0; // Just normalize to middle C if no scale
    }

    // Get register index in scale
    const registerIndex = {
      'low': Math.floor(window.scale.length * 0.15),
      'mid': Math.floor(window.scale.length * 0.45),
      'high': Math.floor(window.scale.length * 0.75)
    }[this.register];

    // Pick note from scale with slight variation
    const variation = DriftRandom.rangeInt(-3, 3);
    const index = Math.max(0, Math.min(window.scale.length - 1, registerIndex + variation));
    const midi = window.scale[index];

    // Convert to pitch shift in semitones
    // Target is middle C (MIDI 60), but we need to account for the input pitch
    const baseMidi = 60;
    const scalePitch = midi - baseMidi;

    // Add the detected pitch offset to normalize input to middle C
    const pitchOffset = window.pitchTransposeOffset || 0;

    return scalePitch + pitchOffset;
  }

  /**
   * Get voice name for display
   */
  getName() {
    const registerNames = {
      'low': 'LOW',
      'mid': 'MID',
      'high': 'HIGH'
    };
    return `${registerNames[this.register]} (${this.period.toFixed(1)}s)`;
  }
}

// Make available globally
window.Voice = Voice;
