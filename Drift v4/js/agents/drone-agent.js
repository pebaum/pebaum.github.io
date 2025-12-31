/**
 * Drone Agent for Drift
 * Creates long, sustained drone tones
 * Inspired by: Deep Listening, Popol Vuh, Lorn
 */

class DroneAgent extends BaseAgent {
  constructor(conductor) {
    super('Drone', conductor);
    this.minInterval = 15000;  // 15 seconds minimum
    this.maxInterval = 45000;  // 45 seconds max
    this.activeDrones = [];
    this.maxConcurrentDrones = 1;  // Reduced from 2
    this.droneDuration = 25000; // 25 seconds
  }
  
  init() {
    // Create main drone synth
    this.warmPad = DriftSynths.createWarmDronePad();
    this.organDrone = DriftSynths.createOrganDrone();
    this.subBass = DriftSynths.createSubBass();
    this.distortedBass = DriftSynths.createDistortedBass();
    this.didgeridoo = DriftSynths.createDidgeridoo();
    this.electricalHum = DriftSynths.createElectricalHum();
    
    // Output mixer
    this.output = new Tone.Gain(0.4);
    
    this.warmPad.output.connect(this.output);
    this.organDrone.output.connect(this.output);
    this.subBass.output.connect(this.output);
    this.distortedBass.output.connect(this.output);
    this.didgeridoo.output.connect(this.output);
    this.electricalHum.output.connect(this.output);
    
    return this;
  }
  
  shouldPlay() {
    if (!this.enabled) return false;
    
    const state = this.getConductorState();
    
    // Need minimum density for drones
    if (state.density < 0.1) return false;
    
    // Check if low frequency band has room
    if (!GlobalListener.hasBandRoom('low', 0.4)) return false;
    
    // Check concurrent limit
    if (this.activeDrones.length >= this.maxConcurrentDrones) return false;
    
    // Time-based check
    return super.shouldPlay();
  }
  
  play() {
    super.play();
    
    const state = this.getConductorState();
    const now = Tone.now();
    
    // Select note from scale (root, fifth, or octave below)
    const rootMidi = state.harmonicCenter;
    const intervals = [0, -12, 7, -5]; // Root, octave down, fifth, fourth down
    const interval = DriftRandom.choice(intervals);
    const noteMidi = rootMidi + interval;
    const freq = DriftMusic.midiToFreq(noteMidi);
    
    // Select synth based on mood and tension
    let synth;
    if (state.mood < 0.25 && state.tension > 0.5) {
      // Very dark + tense: distorted bass (Lorn-style)
      synth = this.distortedBass;
    } else if (state.mood < 0.35) {
      // Dark mood: organ, sub, or didgeridoo
      synth = DriftRandom.weightedChoice([
        { value: this.organDrone, weight: 0.4 },
        { value: this.subBass, weight: 0.35 },
        { value: this.didgeridoo, weight: 0.15 },
        { value: this.electricalHum, weight: 0.1 }
      ]);
    } else if (state.mood > 0.65) {
      // Bright mood: warm pad
      synth = this.warmPad;
    } else {
      // Mixed
      synth = DriftRandom.choice([this.warmPad, this.organDrone, this.subBass, this.didgeridoo]);
    }
    
    // Calculate duration based on density (reduced for performance)
    const baseDuration = 15 + state.density * 15; // 15-30 seconds
    const duration = baseDuration + DriftRandom.range(-3, 3);
    
    // Velocity based on tension
    const velocity = 0.3 + state.tension * 0.3;
    
    // Determine synth type for logging
    const synthName = synth === this.organDrone ? 'organ' :
                     synth === this.subBass ? 'sub' :
                     synth === this.distortedBass ? 'distorted' :
                     synth === this.didgeridoo ? 'didgeridoo' :
                     synth === this.electricalHum ? 'electricalHum' : 'warmPad';
    
    // Play the drone
    if (synth === this.organDrone) {
      synth.triggerAttack(noteMidi, now, velocity);
      
      // Schedule release
      const droneId = setTimeout(() => {
        synth.triggerRelease(noteMidi, Tone.now());
        this._removeDrone(droneId);
      }, duration * 1000);
      
      this.activeDrones.push({ id: droneId, synth, note: noteMidi });
    } else if (synth === this.subBass || synth === this.distortedBass) {
      synth.synth.triggerAttack(freq, now, velocity);
      
      const droneId = setTimeout(() => {
        synth.synth.triggerRelease(Tone.now());
        this._removeDrone(droneId);
      }, duration * 1000);
      
      this.activeDrones.push({ id: droneId, synth, note: freq });
    } else if (synth === this.didgeridoo || synth === this.electricalHum) {
      const note = DriftMusic.midiToNote(noteMidi);
      synth.triggerAttackRelease(note, duration + 's', now, velocity);
      
      const droneId = setTimeout(() => {
        this._removeDrone(droneId);
      }, duration * 1000);
      
      this.activeDrones.push({ id: droneId, synth, note: noteMidi });
    } else {
      // Warm pad (polyphonic)
      synth.synth.triggerAttack(freq, now, velocity);
      
      const droneId = setTimeout(() => {
        synth.synth.triggerRelease(freq, Tone.now());
        this._removeDrone(droneId);
      }, duration * 1000);
      
      this.activeDrones.push({ id: droneId, synth, note: freq });
    }
    
    console.log(`Drone: ${synthName} at ${DriftMusic.midiToNote(noteMidi)}, ${duration.toFixed(0)}s`);
  }
  
  _removeDrone(droneId) {
    this.activeDrones = this.activeDrones.filter(d => d.id !== droneId);
    if (this.activeDrones.length === 0) {
      this.isPlaying = false;
    }
  }
  
  stop() {
    super.stop();
    
    // Release all active drones
    for (const drone of this.activeDrones) {
      clearTimeout(drone.id);
      
      if (drone.synth === this.organDrone) {
        drone.synth.triggerRelease(drone.note, Tone.now());
      } else if (drone.synth.synth) {
        drone.synth.synth.triggerRelease(drone.note, Tone.now());
      }
    }
    this.activeDrones = [];
  }
  
  onKeyChangePending(event) {
    // Start releasing current drones to prepare for key change
    console.log('Drone: Key change coming, preparing...');
    // Could fade out or prepare pivot tones
  }
  
  onDissolving(event) {
    // Reduce max drones during dissolution
    this.maxConcurrentDrones = 1;
    this.minInterval = 60000;
  }
  
  onPhaseChange(event) {
    if (event.phase === 'genesis') {
      this.maxConcurrentDrones = 1;
      this.minInterval = 10000; // More active at start
    } else if (event.phase === 'flowering') {
      this.maxConcurrentDrones = 2;
      this.minInterval = 30000;
    }
  }
  
  dispose() {
    this.stop();
    this.warmPad?.dispose();
    this.organDrone?.dispose();
    this.subBass?.dispose();
    super.dispose();
  }
}

// Make available globally
window.DroneAgent = DroneAgent;
