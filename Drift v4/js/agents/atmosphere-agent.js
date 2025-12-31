/**
 * Atmosphere Agent for Drift
 * Creates lo-fi textures, crackle, heartbeat - subtle background layers
 * Inspired by: Tunic (lo-fi), Lorn (static), MiA (heartbeat), Sakamoto
 */

class AtmosphereAgent extends BaseAgent {
  constructor(conductor) {
    super('Atmosphere', conductor);
    this.minInterval = 60000;   // 1 minute
    this.maxInterval = 180000;  // 3 minutes
    this.isCrackleRunning = false;
    this.isHeartbeatRunning = false;
    this.heartbeatInterval = null;
  }
  
  init() {
    // Crackle/static texture
    this.crackle = DriftSynths.createCrackle();
    
    // Heartbeat for intimate moments
    this.heartbeat = DriftSynths.createHeartbeat();
    
    // Cymbal swell for transitions
    this.cymbal = DriftSynths.createCymbalSwell();
    
    // Output
    this.output = new Tone.Gain(0.25);
    
    this.crackle.output.connect(this.output);
    this.heartbeat.output.connect(this.output);
    this.cymbal.output.connect(this.output);
    
    return this;
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    
    const state = this.getConductorState();
    
    // Atmosphere elements work best at moderate to low density
    if (state.density > 0.7) return false;
    
    return super.shouldPlay();
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    
    // Choose atmosphere type based on mood and tension
    let atmosphereType;
    
    if (state.mood < 0.3 && state.tension > 0.4) {
      // Dark + tense: heartbeat
      atmosphereType = 'heartbeat';
    } else if (state.mood < 0.4) {
      // Dark: crackle/static
      atmosphereType = 'crackle';
    } else if (state.tension > 0.6) {
      // High tension: cymbal swell
      atmosphereType = 'cymbal';
    } else {
      // Random choice weighted by mood
      atmosphereType = DriftRandom.weightedChoice([
        { value: 'crackle', weight: 0.4 },
        { value: 'heartbeat', weight: 0.3 },
        { value: 'cymbal', weight: 0.3 }
      ]);
    }
    
    switch (atmosphereType) {
      case 'crackle':
        this._startCrackle(state);
        break;
      case 'heartbeat':
        this._startHeartbeat(state);
        break;
      case 'cymbal':
        this._playCymbalSwell(state);
        break;
    }
  }
  
  _startCrackle(state) {
    if (this.isCrackleRunning) return;
    
    this.isCrackleRunning = true;
    this.crackle.start();
    
    const duration = 15 + DriftRandom.range(0, 25); // 15-40 seconds
    
    console.log(`Atmosphere: Crackle for ${duration.toFixed(0)}s`);
    
    setTimeout(() => {
      this.crackle.stop();
      this.isCrackleRunning = false;
    }, duration * 1000);
  }
  
  _startHeartbeat(state) {
    if (this.isHeartbeatRunning) return;
    
    this.isHeartbeatRunning = true;
    
    // BPM based on tension (60-80 BPM)
    const bpm = 60 + state.tension * 20;
    const beatInterval = 60000 / bpm;
    
    const duration = 20 + DriftRandom.range(0, 20); // 20-40 seconds
    const numBeats = Math.floor((duration * 1000) / beatInterval);
    
    console.log(`Atmosphere: Heartbeat at ${bpm.toFixed(0)} BPM for ${duration.toFixed(0)}s`);
    
    let beatCount = 0;
    
    const doBeat = () => {
      if (beatCount >= numBeats || !this.isHeartbeatRunning) {
        this.isHeartbeatRunning = false;
        return;
      }
      
      const velocity = 0.4 + state.tension * 0.2;
      this.heartbeat.beat(Tone.now(), velocity);
      beatCount++;
      
      this.heartbeatInterval = setTimeout(doBeat, beatInterval);
    };
    
    doBeat();
  }
  
  _playCymbalSwell(state) {
    const duration = 4 + DriftRandom.range(0, 4); // 4-8 seconds
    const volume = 0.15 + state.tension * 0.15;
    
    console.log(`Atmosphere: Cymbal swell, ${duration.toFixed(0)}s`);
    
    this.cymbal.swell(duration, volume);
  }
  
  stop() {
    super.stop();
    
    this.crackle?.stop();
    this.isCrackleRunning = false;
    
    if (this.heartbeatInterval) {
      clearTimeout(this.heartbeatInterval);
    }
    this.isHeartbeatRunning = false;
  }
  
  dispose() {
    this.stop();
    this.crackle?.dispose();
    this.heartbeat?.dispose();
    this.cymbal?.dispose();
    this.output?.dispose();
  }
}

window.AtmosphereAgent = AtmosphereAgent;
