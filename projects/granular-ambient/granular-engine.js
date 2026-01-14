/**
 * Granular Synthesis Engine - Ambient Mode
 * Optimized for smooth continuous textures for generative composition
 */

class GranularEngine {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.sampleBuffer = null;
    this.activeGrains = [];
    this.maxGrains = 128; // More grains for smooth texture

    // Smooth preset parameters (locked for consistency)
    this.smoothPreset = {
      grainSize: 200, // ms - medium grains for smoothness
      grainDensity: 100, // grains/sec - high density for continuity
      positionRandom: 5, // % - slight scatter
      envelopeType: 'cosine', // smooth fade
      attackShape: 50,
      releaseShape: 50
    };

    // Audio routing
    this.createAudioNodes();
  }

  /**
   * Create audio node graph
   */
  createAudioNodes() {
    // Main outputs for spatial routing
    this.dryOutput = this.audioContext.createGain();
    this.wetOutput = this.audioContext.createGain();

    // Master reverb (shared across all voices)
    this.reverb = this.audioContext.createConvolver();
    this.reverbMix = this.audioContext.createGain();
    this.createReverbIR(2.5);

    this.reverbMix.gain.value = 0.5;

    // Master output
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1.0;

    // Compressor for smooth dynamics
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 6;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.3;

    // High-pass to remove rumble
    this.hpFilter = this.audioContext.createBiquadFilter();
    this.hpFilter.type = 'highpass';
    this.hpFilter.frequency.value = 45;
    this.hpFilter.Q.value = 0.7;

    // Connect: dry + reverb → master → compressor → hp → destination
    this.dryOutput.connect(this.masterGain);
    this.wetOutput.connect(this.reverb);
    this.reverb.connect(this.reverbMix);
    this.reverbMix.connect(this.masterGain);
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.hpFilter);
    this.hpFilter.connect(this.audioContext.destination);
  }

  /**
   * Create reverb impulse response
   */
  createReverbIR(duration) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    const L = impulse.getChannelData(0);
    const R = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.pow(1 - t / duration, 2.5);
      L[i] = (Math.random() * 2 - 1) * env * 0.3;
      R[i] = (Math.random() * 2 - 1) * env * 0.3;
    }

    this.reverb.buffer = impulse;
  }

  /**
   * Load sample buffer
   */
  loadSample(buffer) {
    this.sampleBuffer = buffer;
  }

  /**
   * Trigger a grain cloud (burst of grains)
   * Called by Voice system
   */
  triggerGrainCloud(params) {
    if (!this.sampleBuffer) {
      console.error('Cannot trigger grain cloud: no sample buffer');
      return;
    }

    const {
      position = 0.5,      // 0-1: position in sample
      pitch = 0,           // semitones
      duration = 15,       // seconds for this cloud
      density = this.smoothPreset.grainDensity,
      pan = 0,             // -1 to 1
      reverbDepth = 0.5,   // 0 to 1
      reverse = false,     // reverse playback
      grainSizeMultiplier = 1.0  // grain size variation
    } = params;

    // Calculate how many grains to schedule
    const totalGrains = Math.floor(duration * density);
    const grainInterval = 1000 / density; // ms between grains

    console.log(`Scheduling grain cloud: ${totalGrains} grains over ${duration}s, pitch: ${pitch.toFixed(1)} semitones, reverse: ${reverse}`);

    // Schedule all grains in this cloud
    for (let i = 0; i < totalGrains; i++) {
      setTimeout(() => {
        this.triggerSingleGrain({
          position,
          pitch,
          pan,
          reverbDepth,
          reverse,
          grainSizeMultiplier
        });
      }, i * grainInterval);
    }
  }

  /**
   * Trigger a single grain
   */
  triggerSingleGrain(params) {
    if (!this.sampleBuffer) return;

    // Clean up finished grains
    this.activeGrains = this.activeGrains.filter(g => g.isActive);

    // Limit concurrent grains
    if (this.activeGrains.length >= this.maxGrains) {
      return;
    }

    const {
      position = 0.5,
      pitch = 0,
      pan = 0,
      reverbDepth = 0.5,
      reverse = false,
      grainSizeMultiplier = 1.0
    } = params;

    const now = this.audioContext.currentTime;

    // Apply grain size multiplier
    const grainDuration = (this.smoothPreset.grainSize / 1000) * grainSizeMultiplier;

    // Add slight position randomization
    const randomOffset = (DriftRandom.gaussian(0, 1) * this.smoothPreset.positionRandom / 100);
    const actualPosition = Math.max(0, Math.min(1, position + randomOffset));
    const startTime = actualPosition * this.sampleBuffer.duration;

    // Calculate playback rate from pitch (semitones to ratio)
    let playbackRate = Math.pow(2, pitch / 12);

    // Apply reverse if needed
    if (reverse) {
      playbackRate = -playbackRate;
    }

    // Create grain nodes
    const source = this.audioContext.createBufferSource();
    source.buffer = this.sampleBuffer;
    source.playbackRate.value = playbackRate;

    // Add slight detune for warmth (like Drift v7)
    source.detune.value = DriftRandom.range(-4, 4);

    // Envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.value = 0;

    // Panner
    const panner = this.audioContext.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan + DriftRandom.range(-0.1, 0.1)));

    // Spatial split: dry vs wet (reverb)
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();

    // Reverb depth controls dry/wet balance
    dryGain.gain.value = 0.6 - (reverbDepth * 0.5);
    wetGain.gain.value = 0.4 + (reverbDepth * 0.6);

    // Connect
    source.connect(envelope);
    envelope.connect(panner);
    panner.connect(dryGain);
    panner.connect(wetGain);
    dryGain.connect(this.dryOutput);
    wetGain.connect(this.wetOutput);

    // Apply smooth cosine envelope
    this.applyEnvelope(envelope.gain, now, grainDuration);

    // Start grain
    source.start(now, startTime, grainDuration);

    // Track grain
    const grain = {
      source,
      envelope,
      isActive: true,
      endTime: now + grainDuration
    };

    // Cleanup when done
    source.onended = () => {
      grain.isActive = false;
      try {
        source.disconnect();
        envelope.disconnect();
        panner.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
      } catch (e) {
        // Already disconnected
      }
    };

    this.activeGrains.push(grain);
  }

  /**
   * Apply smooth envelope
   */
  applyEnvelope(gainParam, startTime, duration) {
    const attackPct = this.smoothPreset.attackShape / 100;
    const releasePct = this.smoothPreset.releaseShape / 100;

    const attackTime = attackPct * duration * 0.5;
    const releaseTime = releasePct * duration * 0.5;
    const sustainTime = duration - attackTime - releaseTime;

    // Cosine envelope for ultra-smooth fades
    gainParam.setValueAtTime(0, startTime);
    gainParam.setTargetAtTime(0.024, startTime, attackTime / 3);

    const releaseStart = startTime + attackTime + sustainTime;
    gainParam.setTargetAtTime(0, releaseStart, releaseTime / 3);
  }

  /**
   * Get active grain count
   */
  getActiveGrainCount() {
    return this.activeGrains.filter(g => g.isActive).length;
  }

  /**
   * Set master volume
   */
  setVolume(volume) {
    this.masterGain.gain.value = volume;
  }
}

// Make available globally
window.GranularEngine = GranularEngine;
