/**
 * SynthEngine - Multi-oscillator synth with effects
 * Based on patterns from Textscape and Drift series
 */

// Musical scales (same pattern as other projects)
const SCALES = {
  'Minor Pentatonic': [0, 3, 5, 7, 10],
  'Major Pentatonic': [0, 2, 4, 7, 9],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Hirajoshi': [0, 2, 3, 7, 8],
  'In Sen': [0, 1, 5, 7, 10],
  'Ryukyu': [0, 4, 5, 7, 11],
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

class SynthVoice {
  constructor(audioContext, destination, wowFlutterNode = null) {
    this.ctx = audioContext;
    this.destination = destination;
    this.wowFlutterNode = wowFlutterNode;
    this.active = false;

    // Multi-oscillator setup (2-3 oscillators per voice)
    this.oscillators = [];
    this.gains = [];
    this.voiceGain = this.ctx.createGain();
    this.voiceGain.gain.value = 0;
    this.voiceGain.connect(destination);

    // Envelope parameters
    this.envelope = {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.7,
      release: 0.5
    };

    this.currentNote = null;
  }

  /**
   * Start a note with multi-oscillator synthesis
   */
  start(frequency, velocity = 1.0) {
    if (this.active) {
      this.stop();
    }

    this.active = true;
    this.currentNote = frequency;
    const now = this.ctx.currentTime;

    // Create 3 detuned oscillators for warm chip-tune sound (Disasterpeace style)
    const oscillatorConfigs = [
      { type: 'square', detune: 0, gain: 0.3 },      // Pulse wave (chip-tune)
      { type: 'triangle', detune: -3, gain: 0.25 },  // Triangle (warm)
      { type: 'square', detune: 5, gain: 0.15 }      // Detuned pulse (thickness)
    ];

    oscillatorConfigs.forEach(config => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = config.type;
      osc.frequency.value = frequency;
      osc.detune.value = config.detune;

      // Connect wow/flutter modulation if available
      if (this.wowFlutterNode) {
        this.wowFlutterNode.connect(osc.detune);
      }

      gain.gain.value = config.gain * velocity;

      osc.connect(gain);
      gain.connect(this.voiceGain);
      osc.start(now);

      this.oscillators.push(osc);
      this.gains.push(gain);
    });

    // ADSR envelope
    const targetVolume = 0.3 * velocity;
    this.voiceGain.gain.cancelScheduledValues(now);
    this.voiceGain.gain.setValueAtTime(0, now);
    this.voiceGain.gain.linearRampToValueAtTime(
      targetVolume,
      now + this.envelope.attack
    );
    this.voiceGain.gain.linearRampToValueAtTime(
      targetVolume * this.envelope.sustain,
      now + this.envelope.attack + this.envelope.decay
    );

    // Auto-release after max 2 seconds to prevent stuck notes
    setTimeout(() => {
      if (this.active) {
        this.stop();
      }
    }, 2000);
  }

  /**
   * Stop the voice with release envelope
   */
  stop() {
    if (!this.active) return;

    const now = this.ctx.currentTime;
    const releaseTime = Math.min(this.envelope.release, 0.5); // Cap release at 500ms

    this.voiceGain.gain.cancelScheduledValues(now);
    this.voiceGain.gain.setValueAtTime(this.voiceGain.gain.value, now);
    this.voiceGain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    // Clean up oscillators after release
    this.oscillators.forEach(osc => {
      try {
        osc.stop(now + releaseTime + 0.05);
      } catch (e) {
        // Oscillator may already be stopped
      }
    });

    // Mark inactive immediately to allow voice reuse
    this.active = false;

    // Clean up references after release
    setTimeout(() => {
      this.oscillators.forEach(osc => {
        try {
          osc.disconnect();
        } catch (e) {}
      });
      this.gains.forEach(gain => {
        try {
          gain.disconnect();
        } catch (e) {}
      });
      this.oscillators = [];
      this.gains = [];
    }, (releaseTime + 0.1) * 1000);
  }

  /**
   * Update pitch in real-time (pitch bend)
   */
  setPitch(frequency) {
    if (!this.active) return;
    const now = this.ctx.currentTime;
    this.oscillators.forEach(osc => {
      osc.frequency.setTargetAtTime(frequency, now, 0.01);
    });
    this.currentNote = frequency;
  }

  /**
   * Update envelope parameters
   */
  setEnvelope(attack, decay, sustain, release) {
    this.envelope.attack = attack;
    this.envelope.decay = decay;
    this.envelope.sustain = sustain;
    this.envelope.release = release;
  }
}

class SynthEngine {
  constructor() {
    this.ctx = null;
    this.voices = [];
    this.numVoices = 4; // Polyphony
    this.currentVoiceIndex = 0;

    // Effects chain
    this.filter = null;
    this.reverb = null;
    this.delay = null;
    this.compressor = null;
    this.masterGain = null;
    this.bitcrusher = null;
    this.distortion = null;
    this.wowFlutter = null;
    this.wowFlutterOsc = null;

    // Musical parameters
    this.rootNote = 36; // C2
    this.currentScale = SCALES['Minor Pentatonic'];
    this.scaleNotes = [];

    // Controllable parameters (will be mapped to gamepad)
    // Tuned for Disasterpeace-style warm chip-tune aesthetic
    this.parameters = {
      masterVolume: 0.5,
      filterFrequency: 3500,  // Brighter, more open
      filterResonance: 2,      // Subtle, not aggressive
      reverbMix: 0.45,         // Lush but not overwhelming
      delayTime: 0.375,        // Rhythmic (dotted 8th at 120bpm)
      delayFeedback: 0.35,     // Musical repeats
      delayMix: 0.25,          // Subtle delay presence
      attack: 0.005,           // Quick but not clicky
      release: 0.3,            // Short, chip-tune style
      detune: 0,
      pitchBend: 0,
      bitcrushAmount: 0.15,    // Very subtle (warm lo-fi, not harsh)
      sampleRateReduction: 0.2,
      distortionAmount: 0.12,  // Gentle tape warmth
      wowFlutterAmount: 0.08,  // Very subtle pitch drift
      wowFlutterSpeed: 0.3,    // Slow, gentle warble
    };

    this.initialized = false;
  }

  /**
   * Initialize audio context and effects chain
   */
  async init() {
    if (this.initialized) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Effects chain setup
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.parameters.masterVolume;

    // Bitcrusher (using WaveShaper for bit reduction)
    this.bitcrusher = this.ctx.createWaveShaper();
    this._updateBitcrusher();

    // Distortion (tape saturation)
    this.distortion = this.ctx.createWaveShaper();
    this.distortion.oversample = '4x';
    this._updateDistortion();

    // Filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.parameters.filterFrequency;
    this.filter.Q.value = this.parameters.filterResonance;

    // Gentle compression for musical glue (not heavy limiting)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.15;

    // Create reverb (convolution)
    this.reverb = await this._createReverb();
    this.reverbDry = this.ctx.createGain();
    this.reverbWet = this.ctx.createGain();
    this.reverbDry.gain.value = 1 - this.parameters.reverbMix;
    this.reverbWet.gain.value = this.parameters.reverbMix;

    // Create delay
    this.delay = this.ctx.createDelay(2.0);
    this.delay.delayTime.value = this.parameters.delayTime;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = this.parameters.delayFeedback;
    this.delayDry = this.ctx.createGain();
    this.delayWet = this.ctx.createGain();
    this.delayDry.gain.value = 1 - this.parameters.delayMix;
    this.delayWet.gain.value = this.parameters.delayMix;

    // Wire up effects chain:
    // Voices -> Bitcrusher -> Distortion -> Filter -> [Dry + Wet(Reverb)] -> [Dry + Wet(Delay)] -> Compressor -> Master -> Output

    // Voice bus (all voices connect here)
    this.voiceBus = this.ctx.createGain();
    this.voiceBus.connect(this.bitcrusher);

    // Bitcrusher -> Distortion -> Filter
    this.bitcrusher.connect(this.distortion);
    this.distortion.connect(this.filter);

    // Filter -> Reverb split
    this.filter.connect(this.reverbDry);
    this.filter.connect(this.reverb);
    this.reverb.connect(this.reverbWet);

    // Reverb merge -> Delay split
    const reverbMerge = this.ctx.createGain();
    this.reverbDry.connect(reverbMerge);
    this.reverbWet.connect(reverbMerge);

    reverbMerge.connect(this.delayDry);
    reverbMerge.connect(this.delay);
    this.delay.connect(this.delayWet);
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);

    // Delay merge -> Compressor -> Master -> Output
    const delayMerge = this.ctx.createGain();
    this.delayDry.connect(delayMerge);
    this.delayWet.connect(delayMerge);
    delayMerge.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Start wow/flutter LFO
    this._startWowFlutter();

    // Create voice pool
    for (let i = 0; i < this.numVoices; i++) {
      this.voices.push(new SynthVoice(this.ctx, this.voiceBus, this.wowFlutter));
    }

    // Generate scale notes
    this._generateScaleNotes();

    this.initialized = true;
    console.log('SynthEngine initialized');
  }

  /**
   * Create reverb using impulse response
   */
  async _createReverb() {
    const convolver = this.ctx.createConvolver();
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2.5; // 2.5 second reverb
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Update bitcrusher curve
   * Subtle bit reduction for warm lo-fi texture (not harsh)
   */
  _updateBitcrusher() {
    const amount = this.parameters.bitcrushAmount;
    const samples = 65536;
    const curve = new Float32Array(samples);

    // Bit depth reduction (8-16 bits - stays musical)
    const bits = Math.floor(8 + (1 - amount) * 8);
    const levels = Math.pow(2, bits);

    for (let i = 0; i < samples; i++) {
      const x = (i * 2 / samples) - 1; // -1 to 1
      // Quantize to bit depth
      const quantized = Math.round(x * levels) / levels;
      curve[i] = quantized;
    }

    this.bitcrusher.curve = curve;
  }

  /**
   * Update distortion/saturation curve
   * Warm, gentle tape saturation (Disasterpeace style)
   */
  _updateDistortion() {
    const amount = this.parameters.distortionAmount;
    const samples = 65536;
    const curve = new Float32Array(samples);
    const drive = 1 + amount * 8; // Gentler drive for warmth, not harshness

    for (let i = 0; i < samples; i++) {
      const x = (i * 2 / samples) - 1;
      // Very soft clipping for analog warmth
      const driven = x * drive;
      // Gentle tape-style saturation
      curve[i] = Math.tanh(driven) * 0.9;
    }

    this.distortion.curve = curve;
  }

  /**
   * Start wow/flutter modulation (tape speed variations)
   */
  _startWowFlutter() {
    // Create LFO for pitch modulation
    this.wowFlutterOsc = this.ctx.createOscillator();
    this.wowFlutter = this.ctx.createGain();

    // Very slow LFO for tape-style wow/flutter
    const speed = 0.2 + this.parameters.wowFlutterSpeed * 2; // 0.2-2.2 Hz
    this.wowFlutterOsc.frequency.value = speed;
    this.wowFlutterOsc.type = 'sine';

    // Amount of pitch variation (in cents)
    const amount = this.parameters.wowFlutterAmount * 15; // 0-15 cents
    this.wowFlutter.gain.value = amount;

    this.wowFlutterOsc.connect(this.wowFlutter);
    this.wowFlutterOsc.start();

    // Connect to all voice oscillators (done in playNote)
  }

  /**
   * Generate scale notes across multiple octaves
   */
  _generateScaleNotes() {
    this.scaleNotes = [];
    for (let octave = 0; octave < 4; octave++) {
      for (const interval of this.currentScale) {
        const midi = this.rootNote + octave * 12 + interval;
        this.scaleNotes.push(midi);
      }
    }
  }

  /**
   * Convert MIDI note to frequency
   */
  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Play a note from the scale (0 = lowest note in scale)
   */
  playScaleNote(noteIndex, velocity = 1.0) {
    const midi = this.scaleNotes[noteIndex % this.scaleNotes.length];
    const freq = this.midiToFreq(midi + this.parameters.pitchBend);
    this.playNote(freq, velocity);
  }

  /**
   * Play a note at specific frequency
   */
  playNote(frequency, velocity = 1.0) {
    if (!this.initialized) return;

    const voice = this.voices[this.currentVoiceIndex];
    voice.setEnvelope(
      this.parameters.attack,
      0.2,
      0.7,
      this.parameters.release
    );
    voice.start(frequency, velocity);

    this.currentVoiceIndex = (this.currentVoiceIndex + 1) % this.numVoices;
  }

  /**
   * Stop all voices
   */
  stopAll() {
    this.voices.forEach(voice => voice.stop());
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(value) {
    this.parameters.masterVolume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.parameters.masterVolume,
        this.ctx.currentTime,
        0.01
      );
    }
  }

  /**
   * Set filter frequency (20-20000 Hz)
   */
  setFilterFrequency(value) {
    this.parameters.filterFrequency = Math.max(20, Math.min(20000, value));
    if (this.filter) {
      this.filter.frequency.setTargetAtTime(
        this.parameters.filterFrequency,
        this.ctx.currentTime,
        0.01
      );
    }
  }

  /**
   * Set filter resonance (0-30)
   */
  setFilterResonance(value) {
    this.parameters.filterResonance = Math.max(0, Math.min(30, value));
    if (this.filter) {
      this.filter.Q.setTargetAtTime(
        this.parameters.filterResonance,
        this.ctx.currentTime,
        0.01
      );
    }
  }

  /**
   * Set reverb mix (0-1)
   */
  setReverbMix(value) {
    this.parameters.reverbMix = Math.max(0, Math.min(1, value));
    if (this.reverbDry && this.reverbWet) {
      const now = this.ctx.currentTime;
      this.reverbDry.gain.setTargetAtTime(1 - value, now, 0.01);
      this.reverbWet.gain.setTargetAtTime(value, now, 0.01);
    }
  }

  /**
   * Set delay time (0-2 seconds)
   */
  setDelayTime(value) {
    this.parameters.delayTime = Math.max(0.01, Math.min(2, value));
    if (this.delay) {
      this.delay.delayTime.setTargetAtTime(
        this.parameters.delayTime,
        this.ctx.currentTime,
        0.01
      );
    }
  }

  /**
   * Set delay feedback (0-0.9)
   */
  setDelayFeedback(value) {
    this.parameters.delayFeedback = Math.max(0, Math.min(0.9, value));
    if (this.delayFeedback) {
      this.delayFeedback.gain.setTargetAtTime(
        this.parameters.delayFeedback,
        this.ctx.currentTime,
        0.01
      );
    }
  }

  /**
   * Set delay mix (0-1)
   */
  setDelayMix(value) {
    this.parameters.delayMix = Math.max(0, Math.min(1, value));
    if (this.delayDry && this.delayWet) {
      const now = this.ctx.currentTime;
      this.delayDry.gain.setTargetAtTime(1 - value, now, 0.01);
      this.delayWet.gain.setTargetAtTime(value, now, 0.01);
    }
  }

  /**
   * Set attack time (0.001-3 seconds)
   */
  setAttack(value) {
    this.parameters.attack = Math.max(0.001, Math.min(3, value));
  }

  /**
   * Set release time (0.01-5 seconds)
   */
  setRelease(value) {
    this.parameters.release = Math.max(0.01, Math.min(5, value));
  }

  /**
   * Set pitch bend (-12 to +12 semitones)
   */
  setPitchBend(value) {
    this.parameters.pitchBend = Math.max(-12, Math.min(12, value));
  }

  /**
   * Change scale and regenerate notes
   */
  setScale(scaleName) {
    if (SCALES[scaleName]) {
      this.currentScale = SCALES[scaleName];
      this._generateScaleNotes();
    }
  }

  /**
   * Set root note (MIDI)
   */
  setRootNote(midi) {
    this.rootNote = Math.max(24, Math.min(48, midi));
    this._generateScaleNotes();
  }

  /**
   * Get list of available scales
   */
  getScaleNames() {
    return Object.keys(SCALES);
  }

  /**
   * Set bitcrush amount (0-1)
   */
  setBitcrushAmount(value) {
    this.parameters.bitcrushAmount = Math.max(0, Math.min(1, value));
    this._updateBitcrusher();
  }

  /**
   * Set sample rate reduction (0-1)
   * Note: This is simulated via bitcrushing
   */
  setSampleRateReduction(value) {
    this.parameters.sampleRateReduction = Math.max(0, Math.min(1, value));
    // Affects bitcrusher indirectly
    this._updateBitcrusher();
  }

  /**
   * Set distortion/saturation amount (0-1)
   */
  setDistortionAmount(value) {
    this.parameters.distortionAmount = Math.max(0, Math.min(1, value));
    this._updateDistortion();
  }

  /**
   * Set wow/flutter amount (0-1)
   */
  setWowFlutterAmount(value) {
    this.parameters.wowFlutterAmount = Math.max(0, Math.min(1, value));
    if (this.wowFlutter) {
      const amount = value * 15; // 0-15 cents
      this.wowFlutter.gain.setTargetAtTime(amount, this.ctx.currentTime, 0.01);
    }
  }

  /**
   * Set wow/flutter speed (0-1)
   */
  setWowFlutterSpeed(value) {
    this.parameters.wowFlutterSpeed = Math.max(0, Math.min(1, value));
    if (this.wowFlutterOsc) {
      const speed = 0.2 + value * 2; // 0.2-2.2 Hz
      this.wowFlutterOsc.frequency.setTargetAtTime(speed, this.ctx.currentTime, 0.01);
    }
  }

  /**
   * Set tremolo amount (0-1)
   * Note: Simplified implementation - modulates master volume
   */
  setTremolo(value) {
    // For now, tremolo is implemented via wow/flutter on volume
    // A full implementation would use a separate LFO on masterGain
    this.parameters.tremolo = Math.max(0, Math.min(1, value));
    // TODO: Implement dedicated tremolo LFO if needed
  }
}

// Make available globally
window.SynthEngine = SynthEngine;
window.SCALES = SCALES;
