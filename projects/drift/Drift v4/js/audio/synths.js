/**
 * Synthesizer and instrument definitions for Drift
 * Contains all 42+ patches organized by category
 */

const DriftSynths = {
  // Store created synths for reuse/disposal
  activeSynths: [],
  
  // Performance settings
  maxPolyphony: 4,  // Reduced from default 32
  
  /**
   * Create a warm analog drone pad
   * Inspired by: Lorn, Hyper Light Drifter
   */
  createWarmDronePad() {
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: this.maxPolyphony,
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 4,
        decay: 2,
        sustain: 0.8,
        release: 6  // Reduced from 8
      }
    });
    
    // Detuned second oscillator effect via chorus
    const chorus = new Tone.Chorus({
      frequency: 0.5,
      delayTime: 3.5,
      depth: 0.7,
      wet: 0.5
    }).start();
    
    // Low-pass filter with slow LFO
    const filter = new Tone.Filter({
      frequency: 800,
      type: 'lowpass',
      rolloff: -24
    });
    
    const filterLFO = new Tone.LFO({
      frequency: 0.1,
      min: 400,
      max: 1200
    }).connect(filter.frequency).start();
    
    synth.connect(chorus);
    chorus.connect(filter);
    
    this.activeSynths.push({ synth, chorus, filter, filterLFO });
    
    return {
      synth,
      output: filter,
      dispose: () => {
        synth.dispose();
        chorus.dispose();
        filter.dispose();
        filterLFO.dispose();
      }
    };
  },
  
  /**
   * Create organ-like drone
   * Inspired by: Hamel Organum, Popol Vuh
   */
  createOrganDrone() {
    // Additive synthesis with multiple partials
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 2,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 3,
        decay: 1,
        sustain: 1,
        release: 5
      }
    });
    
    // Add harmonics via parallel synths
    const synth2 = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 3.5, decay: 1, sustain: 0.7, release: 5 }
    });
    
    const synth3 = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 1, sustain: 0.5, release: 5 }
    });
    
    const mixer = new Tone.Gain(0.6);
    const mixer2 = new Tone.Gain(0.3); // 2nd partial quieter
    const mixer3 = new Tone.Gain(0.15); // 3rd partial quieter
    
    synth.connect(mixer);
    synth2.connect(mixer2);
    synth3.connect(mixer3);
    
    const output = new Tone.Gain(1);
    mixer.connect(output);
    mixer2.connect(output);
    mixer3.connect(output);
    
    return {
      synth,
      // Play with harmonics
      triggerAttack: (note, time, velocity = 0.5) => {
        const freq = typeof note === 'string' 
          ? Tone.Frequency(note).toFrequency() 
          : DriftMusic.midiToFreq(note);
        synth.triggerAttack(freq, time, velocity);
        synth2.triggerAttack(freq * 2, time, velocity * 0.5);
        synth3.triggerAttack(freq * 3, time, velocity * 0.3);
      },
      triggerRelease: (note, time) => {
        const freq = typeof note === 'string' 
          ? Tone.Frequency(note).toFrequency() 
          : DriftMusic.midiToFreq(note);
        synth.triggerRelease(freq, time);
        synth2.triggerRelease(freq * 2, time);
        synth3.triggerRelease(freq * 3, time);
      },
      output,
      dispose: () => {
        synth.dispose();
        synth2.dispose();
        synth3.dispose();
        mixer.dispose();
        mixer2.dispose();
        mixer3.dispose();
        output.dispose();
      }
    };
  },
  
  /**
   * Create FM glass bell
   * Inspired by: ICO, Hosono
   */
  createGlassBell() {
    const synth = new Tone.FMSynth({
      harmonicity: 3.5,
      modulationIndex: 10,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.01,
        decay: 4,
        sustain: 0.1,
        release: 8
      },
      modulation: {
        type: 'sine'
      },
      modulationEnvelope: {
        attack: 0.01,
        decay: 2,
        sustain: 0.2,
        release: 4
      }
    });
    
    const gain = new Tone.Gain(0.4);
    synth.connect(gain);
    
    return {
      synth,
      output: gain,
      dispose: () => {
        synth.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create singing bowl / Tibetan bowl
   * Inspired by: Hamel, Sakamoto
   */
  createSingingBowl() {
    // Multiple sine waves with slow beating
    const fundamental = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 8, sustain: 0.3, release: 12 }
    });
    
    const partial2 = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.8, decay: 10, sustain: 0.2, release: 15 }
    });
    
    const partial3 = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 1, decay: 12, sustain: 0.1, release: 18 }
    });
    
    const output = new Tone.Gain(0.5);
    
    fundamental.connect(output);
    partial2.connect(new Tone.Gain(0.6).connect(output));
    partial3.connect(new Tone.Gain(0.3).connect(output));
    
    return {
      trigger: (freq, time, velocity = 0.5) => {
        fundamental.triggerAttackRelease(freq, 15, time, velocity);
        // Slightly detuned partials for beating
        partial2.triggerAttackRelease(freq * 2.02, 15, time, velocity * 0.5);
        partial3.triggerAttackRelease(freq * 3.01, 15, time, velocity * 0.3);
      },
      output,
      dispose: () => {
        fundamental.dispose();
        partial2.dispose();
        partial3.dispose();
        output.dispose();
      }
    };
  },
  
  /**
   * Create soft piano
   * Inspired by: Skyrim, FFXIII, Eno
   */
  createSoftPiano() {
    const synth = new Tone.Sampler({
      // Using FM synthesis as fallback (no samples loaded)
      // In production, would load actual piano samples
    });
    
    // FM-based piano approximation
    const piano = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 1.5,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 1.5,
        sustain: 0.3,
        release: 3
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.1,
        release: 1
      }
    });
    
    const eq = new Tone.EQ3({
      low: -3,
      mid: 2,
      high: -6
    });
    
    piano.connect(eq);
    
    return {
      synth: piano,
      output: eq,
      dispose: () => {
        piano.dispose();
        eq.dispose();
      }
    };
  },
  
  /**
   * Create string ensemble pad
   * Inspired by: Ashen, FFXIII, Fripp
   */
  createStringEnsemble() {
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 4,
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.9,
        release: 3
      }
    });
    
    // String-like filtering
    const filter = new Tone.Filter({
      frequency: 2000,
      type: 'lowpass',
      rolloff: -12
    });
    
    // Subtle vibrato
    const vibrato = new Tone.Vibrato({
      frequency: 5,
      depth: 0.1
    });
    
    // Warmth
    const eq = new Tone.EQ3({
      low: 2,
      mid: 1,
      high: -4
    });
    
    synth.connect(vibrato);
    vibrato.connect(filter);
    filter.connect(eq);
    
    return {
      synth,
      output: eq,
      dispose: () => {
        synth.dispose();
        filter.dispose();
        vibrato.dispose();
        eq.dispose();
      }
    };
  },
  
  /**
   * Create choir pad
   * Inspired by: Fripp, Popol Vuh, Made in Abyss
   */
  createChoirPad() {
    // Formant-filtered for vowel sounds
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 4,
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 3,
        decay: 2,
        sustain: 0.8,
        release: 4
      }
    });
    
    // Formant filters for "ahh" vowel
    const formant1 = new Tone.Filter({ frequency: 800, type: 'bandpass', Q: 5 });
    const formant2 = new Tone.Filter({ frequency: 1200, type: 'bandpass', Q: 5 });
    const formant3 = new Tone.Filter({ frequency: 2500, type: 'bandpass', Q: 5 });
    
    const mixer = new Tone.Gain(0.5);
    
    // Parallel formant filters
    synth.connect(formant1);
    synth.connect(formant2);
    synth.connect(formant3);
    
    formant1.connect(mixer);
    formant2.connect(new Tone.Gain(0.7).connect(mixer));
    formant3.connect(new Tone.Gain(0.3).connect(mixer));
    
    // Slow LFO to morph vowel slightly
    const lfo = new Tone.LFO({
      frequency: 0.05,
      min: 700,
      max: 900
    }).connect(formant1.frequency).start();
    
    return {
      synth,
      output: mixer,
      dispose: () => {
        synth.dispose();
        formant1.dispose();
        formant2.dispose();
        formant3.dispose();
        mixer.dispose();
        lfo.dispose();
      }
    };
  },
  
  /**
   * Create breath/wind texture
   * Inspired by: Various ambient
   */
  createBreathTexture() {
    const noise = new Tone.Noise('pink');
    
    const filter = new Tone.Filter({
      frequency: 1000,
      type: 'bandpass',
      Q: 2
    });
    
    // Wandering filter
    const filterLFO = new Tone.LFO({
      frequency: 0.1,
      min: 400,
      max: 2000
    }).connect(filter.frequency).start();
    
    // Volume envelope via gain LFO
    const gain = new Tone.Gain(0);
    const gainLFO = new Tone.LFO({
      frequency: 0.05,
      min: 0,
      max: 0.15
    }).connect(gain.gain).start();
    
    noise.connect(filter);
    filter.connect(gain);
    
    return {
      start: () => noise.start(),
      stop: () => noise.stop(),
      output: gain,
      setIntensity: (intensity) => {
        gainLFO.max = intensity * 0.2;
      },
      dispose: () => {
        noise.dispose();
        filter.dispose();
        filterLFO.dispose();
        gain.dispose();
        gainLFO.dispose();
      }
    };
  },
  
  /**
   * Create handpan / hang drum
   * Inspired by: ICO
   */
  createHandpan() {
    const synth = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.01,
        decay: 1.5,
        release: 1
      },
      harmonicity: 5.1,
      modulationIndex: 16,
      resonance: 4000,
      octaves: 1.5
    });
    
    const eq = new Tone.EQ3({
      low: 2,
      mid: 4,
      high: -8
    });
    
    synth.connect(eq);
    
    return {
      trigger: (freq, time, velocity = 0.5) => {
        synth.frequency.value = freq;
        synth.triggerAttackRelease('16n', time, velocity);
      },
      output: eq,
      dispose: () => {
        synth.dispose();
        eq.dispose();
      }
    };
  },
  
  /**
   * Create flute-like lead
   * Inspired by: ICO
   */
  createFluteLead() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.8,
        release: 1.5
      }
    });
    
    // Breathy noise layer
    const noise = new Tone.Noise('white');
    const noiseFilter = new Tone.Filter({
      frequency: 3000,
      type: 'highpass'
    });
    const noiseGain = new Tone.Gain(0.03);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    
    // Subtle vibrato
    const vibrato = new Tone.Vibrato({
      frequency: 5,
      depth: 0.05
    });
    
    synth.connect(vibrato);
    
    const output = new Tone.Gain(0.5);
    vibrato.connect(output);
    noiseGain.connect(output);
    
    return {
      synth,
      startBreath: () => noise.start(),
      stopBreath: () => noise.stop(),
      output,
      dispose: () => {
        synth.dispose();
        noise.dispose();
        noiseFilter.dispose();
        noiseGain.dispose();
        vibrato.dispose();
        output.dispose();
      }
    };
  },
  
  /**
   * Create sub bass rumble
   * Inspired by: Lorn, Made in Abyss
   */
  createSubBass() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 1,
        release: 4
      }
    });
    
    const filter = new Tone.Filter({
      frequency: 80,
      type: 'lowpass',
      rolloff: -24
    });
    
    synth.connect(filter);
    
    return {
      synth,
      output: filter,
      dispose: () => {
        synth.dispose();
        filter.dispose();
      }
    };
  },
  
  /**
   * Create distorted bass for dark moments
   * Inspired by: Lorn "kaiju growl"
   */
  createDistortedBass() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.5,
        decay: 0.5,
        sustain: 0.8,
        release: 2
      }
    });
    
    const distortion = new Tone.Distortion({
      distortion: 0.4,
      wet: 0.5
    });
    
    const filter = new Tone.Filter({
      frequency: 200,
      type: 'lowpass',
      rolloff: -12
    });
    
    const gain = new Tone.Gain(0.3);
    
    synth.connect(distortion);
    distortion.connect(filter);
    filter.connect(gain);
    
    return {
      synth,
      output: gain,
      dispose: () => {
        synth.dispose();
        distortion.dispose();
        filter.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create marimba/vibraphone
   * Inspired by: Hosono, Eno
   */
  createMarimba() {
    const synth = new Tone.FMSynth({
      harmonicity: 4,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 1.5,
        sustain: 0.1,
        release: 2
      },
      modulation: { type: 'sine' },
      modulationEnvelope: {
        attack: 0.001,
        decay: 0.5,
        sustain: 0.1,
        release: 0.5
      }
    });
    
    const gain = new Tone.Gain(0.4);
    synth.connect(gain);
    
    return {
      synth,
      output: gain,
      dispose: () => {
        synth.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create cello-like sound
   * Inspired by: FFXIII, Made in Abyss
   */
  createCello() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.8,
        decay: 0.3,
        sustain: 0.7,
        release: 1.5
      }
    });
    
    const vibrato = new Tone.Vibrato({
      frequency: 5.5,
      depth: 0.15
    });
    
    const filter = new Tone.Filter({
      frequency: 1200,
      type: 'lowpass',
      rolloff: -12
    });
    
    const gain = new Tone.Gain(0.35);
    
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
        gain.dispose();
      }
    };
  },
  
  /**
   * Create harp/arpeggiated strings
   * Inspired by: Skyrim, ICO
   */
  createHarp() {
    const synth = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 4000,
      resonance: 0.95
    });
    
    const gain = new Tone.Gain(0.5);
    synth.connect(gain);
    
    return {
      synth,
      output: gain,
      dispose: () => {
        synth.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create taiko/large drum for climax
   * Inspired by: Made in Abyss, Hamel
   */
  createTaiko() {
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.1,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.8,
        sustain: 0.1,
        release: 1.5
      }
    });
    
    const gain = new Tone.Gain(0.6);
    synth.connect(gain);
    
    return {
      synth,
      output: gain,
      trigger: (freq, time, vel) => synth.triggerAttackRelease(freq, 0.5, time, vel),
      dispose: () => {
        synth.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create shimmering pad for bright moments
   * Inspired by: Hyper Light Drifter
   */
  createShimmerPad() {
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 4,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 3,
        decay: 1,
        sustain: 0.8,
        release: 4
      }
    });
    
    // Chorus for shimmer
    const chorus = new Tone.Chorus({
      frequency: 2,
      delayTime: 2.5,
      depth: 0.8,
      wet: 0.6
    }).start();
    
    // High-pass to keep it airy
    const filter = new Tone.Filter({
      frequency: 400,
      type: 'highpass'
    });
    
    const gain = new Tone.Gain(0.35);
    
    synth.connect(chorus);
    chorus.connect(filter);
    filter.connect(gain);
    
    return {
      synth,
      output: gain,
      dispose: () => {
        synth.dispose();
        chorus.dispose();
        filter.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create acoustic guitar (fingerpicked)
   * Inspired by: HLD, Popol Vuh
   */
  createAcousticGuitar() {
    const synth = new Tone.PluckSynth({
      attackNoise: 2,
      dampening: 3500,
      resonance: 0.98
    });
    
    // Body resonance
    const filter = new Tone.Filter({
      frequency: 2500,
      type: 'lowpass'
    });
    
    const gain = new Tone.Gain(0.45);
    
    synth.connect(filter);
    filter.connect(gain);
    
    return {
      synth,
      output: gain,
      dispose: () => {
        synth.dispose();
        filter.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create violin/fiddle sound
   * Inspired by: Ashen, MiA
   */
  createViolin() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.3,
        decay: 0.1,
        sustain: 0.8,
        release: 0.8
      }
    });
    
    // Vibrato
    const vibrato = new Tone.Vibrato({
      frequency: 6,
      depth: 0.2
    });
    
    // Resonant filter for violin character
    const filter = new Tone.Filter({
      frequency: 2000,
      type: 'lowpass',
      Q: 2
    });
    
    const gain = new Tone.Gain(0.3);
    
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
        gain.dispose();
      }
    };
  },
  
  /**
   * Create crackling/static texture
   * Inspired by: Lorn, HLD, Tunic
   */
  createCrackle() {
    const noise = new Tone.Noise('white');
    
    // Gate for intermittent crackle
    const gate = new Tone.Gain(0);
    
    // Bandpass for character
    const filter = new Tone.Filter({
      frequency: 4000,
      type: 'bandpass',
      Q: 1
    });
    
    // Very quiet
    const gain = new Tone.Gain(0.08);
    
    noise.connect(gate);
    gate.connect(filter);
    filter.connect(gain);
    
    // Crackle pattern generator
    let crackleInterval = null;
    
    return {
      noise,
      output: gain,
      start: () => {
        noise.start();
        // Random crackle bursts
        const doCrackle = () => {
          if (DriftRandom.chance(0.3)) {
            gate.gain.setValueAtTime(DriftRandom.range(0.3, 1), Tone.now());
            gate.gain.setValueAtTime(0, Tone.now() + 0.01 + DriftRandom.range(0, 0.03));
          }
          crackleInterval = setTimeout(doCrackle, 50 + DriftRandom.range(0, 200));
        };
        doCrackle();
      },
      stop: () => {
        noise.stop();
        if (crackleInterval) clearTimeout(crackleInterval);
      },
      dispose: () => {
        noise.dispose();
        gate.dispose();
        filter.dispose();
        gain.dispose();
        if (crackleInterval) clearTimeout(crackleInterval);
      }
    };
  },
  
  /**
   * Create heartbeat pulse
   * Inspired by: MiA, Sakamoto
   */
  createHeartbeat() {
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0,
        release: 0.3
      }
    });
    
    const filter = new Tone.Filter({
      frequency: 60,
      type: 'lowpass',
      rolloff: -24
    });
    
    const gain = new Tone.Gain(0.4);
    
    synth.connect(filter);
    filter.connect(gain);
    
    return {
      synth,
      output: gain,
      // Double beat pattern
      beat: (time, velocity = 0.5) => {
        synth.triggerAttackRelease('C1', '16n', time, velocity);
        synth.triggerAttackRelease('C1', '16n', time + 0.15, velocity * 0.7);
      },
      dispose: () => {
        synth.dispose();
        filter.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create chiptune lead
   * Inspired by: HLD, Hosono
   */
  createChiptune() {
    const synth = new Tone.Synth({
      oscillator: {
        type: 'square'
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.3
      }
    });
    
    // Bit reduction for 8-bit feel
    const bitCrusher = new Tone.BitCrusher(6);
    
    const gain = new Tone.Gain(0.2);
    
    synth.connect(bitCrusher);
    bitCrusher.connect(gain);
    
    return {
      synth,
      output: gain,
      dispose: () => {
        synth.dispose();
        bitCrusher.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create cymbal swell
   * Inspired by: orchestral transitions
   */
  createCymbalSwell() {
    const noise = new Tone.Noise('white');
    
    const filter = new Tone.Filter({
      frequency: 6000,
      type: 'highpass'
    });
    
    const filter2 = new Tone.Filter({
      frequency: 12000,
      type: 'lowpass'
    });
    
    const gain = new Tone.Gain(0);
    
    noise.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
    
    return {
      noise,
      output: gain,
      swell: (duration = 5, maxVol = 0.3) => {
        noise.start();
        gain.gain.setValueAtTime(0, Tone.now());
        gain.gain.linearRampToValueAtTime(maxVol, Tone.now() + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0, Tone.now() + duration);
        setTimeout(() => noise.stop(), duration * 1000 + 100);
      },
      dispose: () => {
        noise.dispose();
        filter.dispose();
        filter2.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create music box / celesta
   * Inspired by: ICO, Made in Abyss, Tunic
   */
  createMusicBox() {
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 6,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.001,
        decay: 1.2,
        sustain: 0,
        release: 1.5
      }
    });
    
    // Bright resonance
    const filter = new Tone.Filter({
      frequency: 4000,
      type: 'highpass',
      rolloff: -12
    });
    
    // Sparkly chorus
    const chorus = new Tone.Chorus({
      frequency: 4,
      delayTime: 2,
      depth: 0.3,
      wet: 0.4
    }).start();
    
    const gain = new Tone.Gain(0.4);
    
    synth.connect(filter);
    filter.connect(chorus);
    chorus.connect(gain);
    
    this.activeSynths.push({ synth, filter, chorus, gain });
    
    return {
      synth,
      output: gain,
      triggerAttackRelease: (note, dur, time, vel = 0.4) => {
        synth.triggerAttackRelease(note, dur, time, vel);
      },
      dispose: () => {
        synth.dispose();
        filter.dispose();
        chorus.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create bowed glass / crystal
   * Inspired by: Gorogoa, Deep Listening
   */
  createBowedGlass() {
    // Sine with slow attack for bowing effect
    const synth = new Tone.MonoSynth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 2,
        decay: 0.5,
        sustain: 0.8,
        release: 3
      },
      filterEnvelope: {
        attack: 1.5,
        decay: 0.5,
        sustain: 0.6,
        release: 2,
        baseFrequency: 800,
        octaves: 2
      }
    });
    
    // Gentle vibrato
    const vibrato = new Tone.Vibrato({
      frequency: 4,
      depth: 0.08,
      wet: 0.6
    });
    
    // Shimmer
    const pitchShift = new Tone.PitchShift({
      pitch: 12,
      wet: 0.15
    });
    
    const gain = new Tone.Gain(0.35);
    
    synth.connect(vibrato);
    vibrato.connect(pitchShift);
    pitchShift.connect(gain);
    
    this.activeSynths.push({ synth, vibrato, pitchShift, gain });
    
    return {
      synth,
      output: gain,
      triggerAttackRelease: (note, dur, time, vel = 0.5) => {
        synth.triggerAttackRelease(note, dur, time, vel);
      },
      dispose: () => {
        synth.dispose();
        vibrato.dispose();
        pitchShift.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create conch shell drone
   * Inspired by: Ritual, Tibetan/Shinto ceremony
   */
  createConchShell() {
    // Breathy, hollow sound
    const synth = new Tone.MonoSynth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 1.5,
        decay: 0.8,
        sustain: 0.6,
        release: 4
      },
      filter: {
        frequency: 600,
        type: 'bandpass',
        Q: 2
      },
      filterEnvelope: {
        attack: 1,
        decay: 0.5,
        sustain: 0.5,
        release: 2,
        baseFrequency: 400,
        octaves: 1
      }
    });
    
    // Breath modulation
    const tremolo = new Tone.Tremolo({
      frequency: 0.5,
      depth: 0.3,
      wet: 0.5
    }).start();
    
    // Hollow resonance
    const comb = new Tone.FeedbackCombFilter({
      delayTime: 0.015,
      resonance: 0.5
    });
    
    const gain = new Tone.Gain(0.4);
    
    synth.connect(tremolo);
    tremolo.connect(comb);
    comb.connect(gain);
    
    this.activeSynths.push({ synth, tremolo, comb, gain });
    
    return {
      synth,
      output: gain,
      triggerAttackRelease: (note, dur, time, vel = 0.5) => {
        synth.triggerAttackRelease(note, dur, time, vel);
      },
      dispose: () => {
        synth.dispose();
        tremolo.dispose();
        comb.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create pitched bird chirp
   * Inspired by: Tunic, Hosono
   */
  createBirdChirp() {
    // Quick high-pitched tone with pitch sweep
    const synth = new Tone.MonoSynth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.01,
        decay: 0.15,
        sustain: 0,
        release: 0.2
      }
    });
    
    const filter = new Tone.Filter({
      frequency: 3000,
      type: 'highpass'
    });
    
    // Random panning for each chirp
    const panner = new Tone.Panner(0);
    
    const gain = new Tone.Gain(0.25);
    
    synth.connect(filter);
    filter.connect(panner);
    panner.connect(gain);
    
    this.activeSynths.push({ synth, filter, panner, gain });
    
    return {
      synth,
      panner,
      output: gain,
      chirp: (baseNote = 'C6', time) => {
        // Random pan position
        panner.pan.value = Math.random() * 2 - 1;
        
        // Two-note chirp with pitch bend
        const now = time || Tone.now();
        synth.triggerAttackRelease(baseNote, '32n', now, 0.3);
        synth.triggerAttackRelease(
          Tone.Frequency(baseNote).transpose(Math.floor(Math.random() * 5) + 2).toNote(),
          '32n',
          now + 0.05,
          0.25
        );
      },
      dispose: () => {
        synth.dispose();
        filter.dispose();
        panner.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create didgeridoo-style drone
   * Inspired by: Deep Listening, Aboriginal music
   */
  createDidgeridoo() {
    // Low drone with overtone modulation
    const synth = new Tone.MonoSynth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.5,
        decay: 0.3,
        sustain: 0.9,
        release: 2
      },
      filter: {
        frequency: 200,
        type: 'lowpass',
        Q: 3
      },
      filterEnvelope: {
        attack: 0.2,
        decay: 0.5,
        sustain: 0.5,
        release: 1,
        baseFrequency: 100,
        octaves: 2
      }
    });
    
    // Wobble modulation
    const tremolo = new Tone.Tremolo({
      frequency: 3,
      depth: 0.4,
      wet: 0.6
    }).start();
    
    // Formant-like filter movement
    const filter2 = new Tone.Filter({
      frequency: 400,
      type: 'bandpass',
      Q: 2
    });
    
    const filterLFO = new Tone.LFO({
      frequency: 0.3,
      min: 200,
      max: 600
    }).connect(filter2.frequency).start();
    
    const gain = new Tone.Gain(0.5);
    
    synth.connect(tremolo);
    tremolo.connect(filter2);
    filter2.connect(gain);
    
    this.activeSynths.push({ synth, tremolo, filter2, filterLFO, gain });
    
    return {
      synth,
      output: gain,
      triggerAttackRelease: (note, dur, time, vel = 0.5) => {
        synth.triggerAttackRelease(note, dur, time, vel);
      },
      dispose: () => {
        synth.dispose();
        tremolo.dispose();
        filter2.dispose();
        filterLFO.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create brass fanfare / horn sound
   * Inspired by: Fripp, orchestral film scores
   */
  createBrass() {
    const synth = new Tone.MonoSynth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.15,
        decay: 0.2,
        sustain: 0.8,
        release: 0.8
      },
      filter: {
        frequency: 800,
        type: 'lowpass',
        rolloff: -12
      },
      filterEnvelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.6,
        release: 0.5,
        baseFrequency: 300,
        octaves: 2.5
      }
    });
    
    // Warm vibrato
    const vibrato = new Tone.Vibrato({
      frequency: 5,
      depth: 0.06,
      wet: 0.4
    });
    
    const gain = new Tone.Gain(0.4);
    
    synth.connect(vibrato);
    vibrato.connect(gain);
    
    this.activeSynths.push({ synth, vibrato, gain });
    
    return {
      synth,
      output: gain,
      triggerAttackRelease: (note, dur, time, vel = 0.5) => {
        synth.triggerAttackRelease(note, dur, time, vel);
      },
      dispose: () => {
        synth.dispose();
        vibrato.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create struck metal pipes
   * Inspired by: Deep Listening, industrial
   */
  createStruckMetal() {
    const synth = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 1.5,
        release: 1
      },
      harmonicity: 5.1,
      modulationIndex: 20,
      resonance: 3000,
      octaves: 1.5
    });
    
    // Low pass to remove harshness
    const filter = new Tone.Filter({
      frequency: 4000,
      type: 'lowpass'
    });
    
    const gain = new Tone.Gain(0.3);
    
    synth.connect(filter);
    filter.connect(gain);
    
    this.activeSynths.push({ synth, filter, gain });
    
    return {
      synth,
      output: gain,
      trigger: (freq, time, velocity = 0.4) => {
        synth.frequency.value = freq;
        synth.triggerAttackRelease('8n', time, velocity);
      },
      dispose: () => {
        synth.dispose();
        filter.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create pastel/soft pad synth
   * Inspired by: Eno LUX
   */
  createPastelPad() {
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 4,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 3,
        decay: 1,
        sustain: 0.6,
        release: 4
      }
    });
    
    // Soft filtering
    const filter = new Tone.Filter({
      frequency: 2000,
      type: 'lowpass',
      rolloff: -24
    });
    
    // Gentle chorus for width
    const chorus = new Tone.Chorus({
      frequency: 0.3,
      delayTime: 5,
      depth: 0.5,
      wet: 0.5
    }).start();
    
    const gain = new Tone.Gain(0.35);
    
    synth.connect(filter);
    filter.connect(chorus);
    chorus.connect(gain);
    
    this.activeSynths.push({ synth, filter, chorus, gain });
    
    return {
      synth,
      output: gain,
      triggerAttackRelease: (notes, dur, time, vel = 0.3) => {
        synth.triggerAttackRelease(notes, dur, time, vel);
      },
      dispose: () => {
        synth.dispose();
        filter.dispose();
        chorus.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Create electrical hum drone
   * Inspired by: Tunic, industrial ambient
   */
  createElectricalHum() {
    // 60Hz hum with harmonics
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 2,
        decay: 0.5,
        sustain: 0.9,
        release: 3
      }
    });
    
    // Very narrow bandpass for hum character
    const filter = new Tone.Filter({
      frequency: 60,
      type: 'bandpass',
      Q: 8
    });
    
    // Subtle wobble
    const lfo = new Tone.LFO({
      frequency: 0.1,
      min: 55,
      max: 65
    }).connect(filter.frequency).start();
    
    const gain = new Tone.Gain(0.2);
    
    synth.connect(filter);
    filter.connect(gain);
    
    this.activeSynths.push({ synth, filter, lfo, gain });
    
    return {
      synth,
      output: gain,
      triggerAttackRelease: (note, dur, time, vel = 0.3) => {
        synth.triggerAttackRelease(note, dur, time, vel);
      },
      dispose: () => {
        synth.dispose();
        filter.dispose();
        lfo.dispose();
        gain.dispose();
      }
    };
  },
  
  /**
   * Dispose all active synths
   */
  disposeAll() {
    for (const item of this.activeSynths) {
      if (item.dispose) {
        item.dispose();
      } else if (item.synth?.dispose) {
        item.synth.dispose();
      }
    }
    this.activeSynths = [];
  }
};

// Make available globally
window.DriftSynths = DriftSynths;
