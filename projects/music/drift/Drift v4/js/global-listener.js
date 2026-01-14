/**
 * Global audio listener/analyzer for Drift
 * Tracks RMS, spectral content, density for self-aware behavior
 */

const GlobalListener = {
  // Analyzers
  meter: null,
  fft: null,
  waveform: null,
  
  // Current readings
  readings: {
    rms: 0,
    peak: 0,
    spectralCentroid: 0,
    lowEnergy: 0,
    midEnergy: 0,
    highEnergy: 0,
    silenceDuration: 0
  },
  
  // Tracking
  lastEventTime: 0,
  isInitialized: false,
  updateInterval: null,
  lastUpdateTime: 0,
  updateThrottle: 100,  // Only analyze every 100ms (10 times/sec)
  
  /**
   * Initialize the listener
   */
  init() {
    // RMS meter
    this.meter = new Tone.Meter({
      smoothing: 0.8
    });
    
    // FFT analyzer
    this.fft = new Tone.FFT(256);
    
    // Waveform
    this.waveform = new Tone.Waveform(256);
    
    // Connect to master output
    Tone.Destination.connect(this.meter);
    Tone.Destination.connect(this.fft);
    Tone.Destination.connect(this.waveform);
    
    this.isInitialized = true;
    this.lastEventTime = Tone.now();
    
    // Start update loop
    this._startUpdateLoop();
    
    console.log('Global listener initialized');
    return this;
  },
  
  /**
   * Start the analysis update loop
   */
  _startUpdateLoop() {
    const update = () => {
      if (!this.isInitialized) return;
      
      // Throttle analysis to reduce CPU
      const now = Date.now();
      if (now - this.lastUpdateTime >= this.updateThrottle) {
        this.lastUpdateTime = now;
        this._updateReadings();
      }
      
      this.updateInterval = requestAnimationFrame(update);
    };
    update();
  },
  
  /**
   * Update all readings
   */
  _updateReadings() {
    // RMS level
    const level = this.meter.getValue();
    this.readings.rms = this._dbToLinear(level);
    this.readings.peak = Math.max(this.readings.peak * 0.99, this.readings.rms);
    
    // FFT analysis
    const fftValues = this.fft.getValue();
    this._analyzeSpectrum(fftValues);
    
    // Silence tracking
    if (this.readings.rms < 0.01) {
      this.readings.silenceDuration = Tone.now() - this.lastEventTime;
    } else {
      this.lastEventTime = Tone.now();
      this.readings.silenceDuration = 0;
    }
  },
  
  /**
   * Analyze spectrum for band energies and centroid
   */
  _analyzeSpectrum(fftValues) {
    const binCount = fftValues.length;
    const sampleRate = Tone.context.sampleRate;
    const binWidth = sampleRate / (binCount * 2);
    
    let lowSum = 0, midSum = 0, highSum = 0;
    let weightedSum = 0, totalEnergy = 0;
    let lowCount = 0, midCount = 0, highCount = 0;
    
    for (let i = 0; i < binCount; i++) {
      const freq = i * binWidth;
      const magnitude = this._dbToLinear(fftValues[i]);
      
      // Band energies
      if (freq < 200) {
        lowSum += magnitude;
        lowCount++;
      } else if (freq < 2000) {
        midSum += magnitude;
        midCount++;
      } else {
        highSum += magnitude;
        highCount++;
      }
      
      // Spectral centroid
      weightedSum += freq * magnitude;
      totalEnergy += magnitude;
    }
    
    this.readings.lowEnergy = lowCount > 0 ? lowSum / lowCount : 0;
    this.readings.midEnergy = midCount > 0 ? midSum / midCount : 0;
    this.readings.highEnergy = highCount > 0 ? highSum / highCount : 0;
    this.readings.spectralCentroid = totalEnergy > 0 ? weightedSum / totalEnergy : 0;
  },
  
  /**
   * Convert dB to linear (0-1)
   */
  _dbToLinear(db) {
    return Math.pow(10, db / 20);
  },
  
  /**
   * Get current readings
   */
  getReadings() {
    return { ...this.readings };
  },
  
  /**
   * Check if a frequency band has room
   * @param {string} band - 'low', 'mid', 'high'
   * @param {number} threshold - Energy threshold (0-1)
   */
  hasBandRoom(band, threshold = 0.3) {
    const energy = this.readings[`${band}Energy`] || 0;
    return energy < threshold;
  },
  
  /**
   * Check if overall mix has room
   */
  hasRoom(threshold = 0.5) {
    return this.readings.rms < threshold;
  },
  
  /**
   * Get silence duration in seconds
   */
  getSilenceDuration() {
    return this.readings.silenceDuration;
  },
  
  /**
   * Check if it's been quiet too long
   */
  needsActivity(minSilence = 5) {
    return this.readings.silenceDuration > minSilence;
  },
  
  /**
   * Get waveform data for visualization
   */
  getWaveform() {
    return this.waveform ? this.waveform.getValue() : [];
  },
  
  /**
   * Get FFT data for visualization
   */
  getFFT() {
    return this.fft ? this.fft.getValue() : [];
  },
  
  /**
   * Mark that an event occurred (for silence tracking)
   */
  markEvent() {
    this.lastEventTime = Tone.now();
  },
  
  /**
   * Cleanup
   */
  dispose() {
    this.isInitialized = false;
    if (this.updateInterval) {
      cancelAnimationFrame(this.updateInterval);
    }
    this.meter?.dispose();
    this.fft?.dispose();
    this.waveform?.dispose();
  }
};

// Make available globally
window.GlobalListener = GlobalListener;
