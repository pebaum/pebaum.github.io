/**
 * Swell Agent for Drift
 * Creates rare orchestral climax moments
 * Inspired by: Fripp soundscapes, Made in Abyss, Hamel Organum
 */

class SwellAgent extends BaseAgent {
  constructor(conductor) {
    super('Swell', conductor);
    this.minInterval = 180000;  // 3 minutes minimum
    this.maxInterval = 420000;  // 7 minutes max
    this.isSwelling = false;
    this.swellTimeout = null;
    this.lastSwellTime = 0;
  }
  
  init() {
    // Use multiple synths for big sound
    this.shimmerPad = DriftSynths.createShimmerPad();
    this.strings = DriftSynths.createStringEnsemble();
    this.choir = DriftSynths.createChoirPad();
    this.taiko = DriftSynths.createTaiko();
    this.brass = DriftSynths.createBrass();
    
    // Master swell gain
    this.output = new Tone.Gain(0);
    
    this.shimmerPad.output.connect(this.output);
    this.strings.output.connect(this.output);
    this.choir.output.connect(this.output);
    this.taiko.output.connect(this.output);
    this.brass.output.connect(this.output);
    
    return this;
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    if (this.isSwelling) return false;
    
    const state = this.getConductorState();
    const timeSinceLast = Date.now() - this.lastSwellTime;
    
    // Need at least 3 minutes since last swell
    if (timeSinceLast < 180000) return false;
    
    // More likely at higher tension and density
    const swellChance = (state.tension * state.density) * 0.0001;
    
    // Also check if audio is relatively full (good moment for climax)
    const readings = GlobalListener.getReadings();
    if (readings.rms < 0.15) return false; // Too quiet, not the right moment
    
    return DriftRandom.chance(swellChance);
  }
  
  play() {
    super.play();
    this.isSwelling = true;
    this.lastSwellTime = Date.now();
    
    const state = this.getConductorState();
    
    // Announce swell building
    this.conductor.broadcast({
      type: 'CLIMAX_BUILDING'
    });
    
    console.log('Swell: Building climax...');
    
    const root = state.harmonicCenter;
    const rootFreq = DriftMusic.midiToFreq(root);
    
    // Build over 15-25 seconds
    const buildDuration = 15 + DriftRandom.range(0, 10);
    const peakDuration = 5 + DriftRandom.range(0, 5);
    const fadeDuration = 10 + DriftRandom.range(0, 10);
    
    const now = Tone.now();
    
    // Start quiet and build
    this.output.gain.setValueAtTime(0, now);
    this.output.gain.linearRampToValueAtTime(0.6, now + buildDuration);
    
    // Shimmer pad - high register chord
    const shimmerNotes = [
      rootFreq * 2,      // Root octave up
      rootFreq * 2.5,    // Fifth
      rootFreq * 3,      // Octave + fifth
    ];
    this.shimmerPad.synth.triggerAttack(shimmerNotes, now, 0.3);
    
    // Strings - mid register
    const stringNotes = [
      rootFreq,
      rootFreq * 1.25,   // Third
      rootFreq * 1.5,    // Fifth
    ];
    this.strings.synth.triggerAttack(stringNotes, now + 2, 0.4);
    
    // Choir joins later
    const choirNotes = [rootFreq * 0.5, rootFreq, rootFreq * 1.5];
    this.choir.synth.triggerAttack(choirNotes, now + buildDuration * 0.5, 0.35);
    
    // Brass fanfare at build point (rare, dramatic - Fripp style)
    if (DriftRandom.chance(0.35)) {
      const brassNote = DriftMusic.midiToNote(root + 12); // Octave up
      const brassTime = now + buildDuration * 0.6;
      this.brass.triggerAttackRelease(brassNote, '2n', brassTime, 0.5);
      // Second brass note
      if (DriftRandom.chance(0.5)) {
        const brassNote2 = DriftMusic.midiToNote(root + 7); // Fifth
        this.brass.triggerAttackRelease(brassNote2, '2n', brassTime + 1.5, 0.4);
      }
    }
    
    // Taiko at peak (rare, dramatic)
    if (DriftRandom.chance(0.4)) {
      const taikoTime = now + buildDuration;
      this.taiko.trigger(rootFreq * 0.25, taikoTime, 0.7);
      // Second hit
      if (DriftRandom.chance(0.5)) {
        this.taiko.trigger(rootFreq * 0.25, taikoTime + 0.8, 0.5);
      }
    }
    
    // Hold at peak
    const peakTime = now + buildDuration;
    this.output.gain.setValueAtTime(0.6, peakTime);
    this.output.gain.setValueAtTime(0.6, peakTime + peakDuration);
    
    // Fade out
    const fadeStartTime = peakTime + peakDuration;
    this.output.gain.linearRampToValueAtTime(0, fadeStartTime + fadeDuration);
    
    // Release all
    const totalDuration = buildDuration + peakDuration + fadeDuration;
    
    this.swellTimeout = setTimeout(() => {
      this.shimmerPad.synth.releaseAll();
      this.strings.synth.releaseAll();
      this.choir.synth.releaseAll();
      
      this.isSwelling = false;
      console.log('Swell: Climax complete');
      
      // Announce dissolution
      this.conductor.broadcast({
        type: 'CLIMAX_ENDED'
      });
    }, totalDuration * 1000);
  }
  
  stop() {
    super.stop();
    
    if (this.swellTimeout) {
      clearTimeout(this.swellTimeout);
    }
    
    this.shimmerPad?.synth?.releaseAll();
    this.strings?.synth?.releaseAll();
    this.choir?.synth?.releaseAll();
    this.output?.gain?.cancelScheduledValues(Tone.now());
    this.output?.gain?.setValueAtTime(0, Tone.now());
    
    this.isSwelling = false;
  }
  
  dispose() {
    this.stop();
    this.shimmerPad?.dispose();
    this.strings?.dispose();
    this.choir?.dispose();
    this.taiko?.dispose();
    this.output?.dispose();
  }
}

window.SwellAgent = SwellAgent;
