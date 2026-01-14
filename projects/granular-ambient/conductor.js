/**
 * Conductor Class - Composition System
 * Manages voices, scales, and generative composition (from Drift v7)
 */

// Musical scales
const SCALES = {
  'Minor Pent': [0, 3, 5, 7, 10],
  'Major Pent': [0, 2, 4, 7, 9],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Hirajoshi': [0, 2, 3, 7, 8],
  'In Sen': [0, 1, 5, 7, 10],
  'Ryukyu': [0, 4, 5, 7, 11]
};

const ROOT_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

class Conductor {
  constructor(engine) {
    this.engine = engine;
    this.voices = [];
    this.running = false;
    this.startTime = 0;

    // Scale
    this.rootMidi = 36;
    this.rootName = 'C';
    this.scaleName = 'Dorian';
    this.scale = [];

    // Update loop
    this.updateInterval = null;
  }

  /**
   * Generate musical scale
   */
  generateScale() {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    this.rootMidi = 24 + DriftRandom.rangeInt(0, 7); // Lower register
    this.rootName = ROOT_NOTES[this.rootMidi % 12];
    this.scaleName = pick(Object.keys(SCALES));
    const intervals = SCALES[this.scaleName];

    this.scale = [];
    for (let octave = 0; octave < 5; octave++) {
      intervals.forEach(interval => {
        const midi = this.rootMidi + (octave * 12) + interval;
        if (midi >= 24 && midi <= 96) {
          this.scale.push(midi);
        }
      });
    }

    // Make scale globally available for voices
    window.scale = this.scale;
  }

  /**
   * Generate voices (7-9 overlapping loops)
   */
  generateVoices() {
    this.voices = [];

    const numVoices = DriftRandom.rangeInt(7, 9);

    for (let i = 0; i < numVoices; i++) {
      // Loop periods: mix of short, medium, and long
      let period;
      if (i < 3) {
        // Foundation voices - shorter loops (8-24s)
        period = DriftRandom.choice([8, 11, 13, 15, 17, 19, 21, 24]);
      } else if (i < 6) {
        // Textural voices - medium loops (25-50s)
        period = DriftRandom.choice([27, 31, 37, 41, 47]);
      } else {
        // Event voices - long loops (60-90s)
        period = DriftRandom.choice([61, 71, 79, 89]);
      }

      // Register distribution
      let register;
      if (i < 2) {
        register = 'low';    // 2 low voices (foundation)
      } else if (i < 5) {
        register = 'mid';    // 3 mid voices (body)
      } else {
        register = 'high';   // 2-4 high voices (sparkle)
      }

      const voice = new Voice(this.engine, register, period);
      this.voices.push(voice);
    }

    // Stagger initial triggers to avoid everything starting together
    this.voices.forEach((voice, i) => {
      voice.lastTrigger = Date.now() - DriftRandom.range(0, voice.period * 1000);
      voice.age = DriftRandom.range(0, voice.period * 1000);
    });
  }

  /**
   * Start the composition
   */
  start() {
    if (this.running) return;

    this.generateScale();
    this.generateVoices();

    this.running = true;
    this.startTime = Date.now();

    // Main update loop
    this.updateInterval = setInterval(() => {
      this.update();
    }, 50);
  }

  /**
   * Stop the composition
   */
  stop() {
    this.running = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update all voices
   */
  update() {
    if (!this.running) return;

    const dt = 50; // ms
    this.voices.forEach(voice => voice.update(dt));
  }

  /**
   * Get elapsed time
   */
  getElapsedTime() {
    if (!this.running) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Get composition info
   */
  getInfo() {
    const elapsed = this.getElapsedTime();
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);

    return {
      elapsed: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      rootName: this.rootName,
      scaleName: this.scaleName,
      voiceCount: this.voices.length,
      activeGrains: this.engine.getActiveGrainCount()
    };
  }

  /**
   * Get voices for visualization
   */
  getVoices() {
    return this.voices;
  }
}

// Make available globally
window.Conductor = Conductor;
