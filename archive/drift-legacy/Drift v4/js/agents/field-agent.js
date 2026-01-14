/**
 * Field Recording Agent for Drift
 * Creates environmental/natural textures
 * Inspired by: Hosono (nature sounds), Eno (ambient environments)
 */

class FieldAgent extends BaseAgent {
  constructor(conductor) {
    super('Field', conductor);
    this.minInterval = 25000;
    this.maxInterval = 70000;
    this.activeFields = [];
  }
  
  init() {
    this.wind = this._createWind();
    this.water = this._createWater();
    this.rumble = this._createRumble();
    this.bird = DriftSynths.createBirdChirp();
    
    this.output = new Tone.Gain(0.25);
    
    this.wind.output.connect(this.output);
    this.water.output.connect(this.output);
    this.rumble.output.connect(this.output);
    this.bird.output.connect(this.output);
    
    return this;
  }
  
  _createWind() {
    const noise = new Tone.Noise('pink');
    
    const filter = new Tone.Filter({
      frequency: 800,
      type: 'bandpass',
      Q: 0.5
    });
    
    const gustLFO = new Tone.LFO({
      frequency: 0.15,
      min: 400,
      max: 1500,
      type: 'sine'
    }).connect(filter.frequency).start();
    
    const gain = new Tone.Gain(0);
    const volumeLFO = new Tone.LFO({
      frequency: 0.08,
      min: 0,
      max: 0.4,
      type: 'sine'
    }).connect(gain.gain).start();
    
    noise.connect(filter);
    filter.connect(gain);
    
    return {
      noise,
      filter,
      gain,
      start: function() { noise.start(); },
      stop: function() { noise.stop(); },
      output: gain,
      dispose: function() {
        noise.dispose();
        filter.dispose();
        gustLFO.dispose();
        volumeLFO.dispose();
        gain.dispose();
      }
    };
  }
  
  _createWater() {
    const noise = new Tone.Noise('white');
    
    const filter = new Tone.Filter({
      frequency: 3000,
      type: 'highpass'
    });
    
    const filter2 = new Tone.Filter({
      frequency: 8000,
      type: 'lowpass'
    });
    
    const lfo = new Tone.LFO({
      frequency: 0.2,
      min: 2000,
      max: 5000
    }).connect(filter.frequency).start();
    
    const gain = new Tone.Gain(0);
    
    noise.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
    
    return {
      noise,
      gain,
      start: function() { noise.start(); },
      stop: function() { noise.stop(); },
      output: gain,
      dispose: function() {
        noise.dispose();
        filter.dispose();
        filter2.dispose();
        lfo.dispose();
        gain.dispose();
      }
    };
  }
  
  _createRumble() {
    const noise = new Tone.Noise('brown');
    
    const filter = new Tone.Filter({
      frequency: 100,
      type: 'lowpass',
      rolloff: -24
    });
    
    const gain = new Tone.Gain(0);
    
    noise.connect(filter);
    filter.connect(gain);
    
    return {
      noise,
      gain,
      start: function() { noise.start(); },
      stop: function() { noise.stop(); },
      output: gain,
      dispose: function() {
        noise.dispose();
        filter.dispose();
        gain.dispose();
      }
    };
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    
    const state = this.getConductorState();
    if (state.density > 0.7 && !DriftRandom.chance(0.3)) return false;
    
    return super.shouldPlay();
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    
    let fieldType;
    if (state.mood < 0.35) {
      fieldType = DriftRandom.chance(0.6) ? 'rumble' : 'wind';
    } else if (state.mood > 0.65) {
      fieldType = DriftRandom.weightedChoice([
        { value: 'water', weight: 0.35 },
        { value: 'wind', weight: 0.35 },
        { value: 'bird', weight: 0.3 }
      ]);
    } else {
      fieldType = DriftRandom.choice(['wind', 'water', 'rumble', 'bird']);
    }
    
    if (fieldType === 'bird') {
      this._playBirdChirps(state);
      return;
    }
    
    const field = this[fieldType];
    const duration = 10 + DriftRandom.range(0, 15);
    const maxVolume = 0.2 + state.tension * 0.15;
    
    field.start();
    field.gain.gain.rampTo(maxVolume, 3);
    
    const id = setTimeout(() => {
      field.gain.gain.rampTo(0, 4);
      setTimeout(() => {
        field.stop();
        this._removeField(id);
      }, 4500);
    }, duration * 1000);
    
    this.activeFields.push({ id: id, type: fieldType });
    console.log('Field: ' + fieldType + ' for ' + duration.toFixed(0) + 's');
  }
  
  _playBirdChirps(state) {
    const numChirps = 3 + Math.floor(Math.random() * 5);
    const duration = 5 + Math.random() * 10;
    
    const scale = DriftScales.buildScale(state.harmonicCenter, state.scale);
    const highNotes = scale.filter(function(n) { return n >= 84; });
    
    const self = this;
    for (let i = 0; i < numChirps; i++) {
      const delay = (i / numChirps) * duration + Math.random() * 2;
      setTimeout(function() {
        const baseNote = highNotes.length > 0 
          ? DriftMusic.midiToNote(DriftRandom.choice(highNotes))
          : 'C6';
        self.bird.chirp(baseNote);
      }, delay * 1000);
    }
    
    const id = setTimeout(function() {
      self._removeField(id);
    }, (duration + 2) * 1000);
    
    this.activeFields.push({ id: id, type: 'bird' });
    console.log('Field: Bird chirps (' + numChirps + ' calls)');
  }
  
  _removeField(id) {
    this.activeFields = this.activeFields.filter(function(f) { return f.id !== id; });
    if (this.activeFields.length === 0) {
      this.isPlaying = false;
    }
  }
  
  stop() {
    super.stop();
    
    for (let i = 0; i < this.activeFields.length; i++) {
      clearTimeout(this.activeFields[i].id);
    }
    
    if (this.wind) {
      this.wind.stop();
      this.wind.gain.gain.value = 0;
    }
    if (this.water) {
      this.water.stop();
      this.water.gain.gain.value = 0;
    }
    if (this.rumble) {
      this.rumble.stop();
      this.rumble.gain.gain.value = 0;
    }
    this.activeFields = [];
  }
  
  dispose() {
    this.stop();
    if (this.wind) this.wind.dispose();
    if (this.water) this.water.dispose();
    if (this.rumble) this.rumble.dispose();
    if (this.output) this.output.dispose();
  }
}

window.FieldAgent = FieldAgent;
