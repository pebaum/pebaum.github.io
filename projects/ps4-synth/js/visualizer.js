/**
 * Visualizer - Abstract Bauhaus-style visualizations
 * Waveform, notes, effects, and parameters
 */

class Visualizer {
  constructor(synthEngine) {
    this.synth = synthEngine;
    this.running = false;

    // Canvases
    this.waveformCanvas = null;
    this.waveformCtx = null;
    this.effectsCanvas = null;
    this.effectsCtx = null;

    // Analyzer
    this.analyzer = null;
    this.dataArray = null;
    this.frequencyData = null;

    // Note grid
    this.noteGrid = null;
    this.noteCells = [];

    // Parameter meters
    this.paramMeters = null;
    this.meterElements = {};

    // Animation
    this.animationId = null;
    this.effectsRotation = 0;
    this.audioIntensity = 0;
  }

  /**
   * Initialize visualizer
   */
  init() {
    // Setup waveform canvas
    this.waveformCanvas = document.getElementById('waveform-canvas');
    if (this.waveformCanvas) {
      this.waveformCtx = this.waveformCanvas.getContext('2d');
      this._resizeCanvas(this.waveformCanvas);
    }

    // Setup effects canvas
    this.effectsCanvas = document.getElementById('effects-canvas');
    if (this.effectsCanvas) {
      this.effectsCtx = this.effectsCanvas.getContext('2d');
      this._resizeCanvas(this.effectsCanvas);
    }

    // Setup analyzer
    if (this.synth.ctx) {
      this.analyzer = this.synth.ctx.createAnalyser();
      this.analyzer.fftSize = 2048;
      this.analyzer.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
      this.frequencyData = new Uint8Array(this.analyzer.frequencyBinCount);

      // Connect analyzer to master output
      this.synth.masterGain.connect(this.analyzer);
    }

    // Setup note grid
    this._setupNoteGrid();

    // Setup parameter meters
    this._setupParameterMeters();

    console.log('Visualizer initialized');
  }

  /**
   * Resize canvas to match display size
   */
  _resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  /**
   * Setup note grid cells
   */
  _setupNoteGrid() {
    this.noteGrid = document.getElementById('note-grid');
    if (!this.noteGrid) return;

    // Create 12 cells (4x3 grid)
    for (let i = 0; i < 12; i++) {
      const cell = document.createElement('div');
      cell.className = 'note-cell';
      cell.dataset.index = i;
      this.noteGrid.appendChild(cell);
      this.noteCells.push(cell);
    }
  }

  /**
   * Setup parameter meters
   */
  _setupParameterMeters() {
    this.paramMeters = document.getElementById('param-meters');
    if (!this.paramMeters) return;

    const params = [
      'FILTER FREQ',
      'RESONANCE',
      'REVERB',
      'DELAY',
      'PITCH BEND',
      'VOLUME',
      'BITCRUSH',
      'TAPE SAT',
      'AUDIO LEVEL'
    ];

    params.forEach(param => {
      const meter = document.createElement('div');
      meter.className = 'param-meter';

      const label = document.createElement('div');
      label.className = 'param-label';
      label.textContent = param;

      const bar = document.createElement('div');
      bar.className = 'param-bar';

      const fill = document.createElement('div');
      fill.className = 'param-fill';
      fill.style.width = '0%';

      bar.appendChild(fill);
      meter.appendChild(label);
      meter.appendChild(bar);
      this.paramMeters.appendChild(meter);

      this.meterElements[param] = fill;
    });
  }

  /**
   * Start visualization loop
   */
  start() {
    if (this.running) return;
    this.running = true;
    this._animate();
  }

  /**
   * Stop visualization
   */
  stop() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Main animation loop
   */
  _animate() {
    if (!this.running) return;

    this._drawWaveform();
    this._drawEffects();
    this._updateParameters();

    this.animationId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Draw waveform (oscilloscope)
   */
  _drawWaveform() {
    if (!this.waveformCtx || !this.analyzer) return;

    const canvas = this.waveformCanvas;
    const ctx = this.waveformCtx;
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;

    // Get waveform data
    this.analyzer.getByteTimeDomainData(this.dataArray);

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = width / this.dataArray.length;
    let x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }

  /**
   * Draw effects visualization (abstract geometric patterns)
   */
  _drawEffects() {
    if (!this.effectsCtx || !this.analyzer) return;

    const canvas = this.effectsCanvas;
    const ctx = this.effectsCtx;
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;

    // Get frequency data
    this.analyzer.getByteFrequencyData(this.dataArray);

    // Calculate average frequency
    const sum = this.dataArray.reduce((a, b) => a + b, 0);
    const avg = sum / this.dataArray.length;
    const intensity = avg / 255;

    // Clear with fade effect for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw multiple layers of rotating geometric patterns
    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Outer rotating square
    ctx.save();
    ctx.rotate(this.effectsRotation);
    const outerSize = Math.max(50, intensity * 150);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + intensity * 0.5})`;
    ctx.lineWidth = 2 + intensity * 2;
    ctx.strokeRect(-outerSize / 2, -outerSize / 2, outerSize, outerSize);
    ctx.restore();

    // Middle rotating circle
    ctx.save();
    ctx.rotate(this.effectsRotation * -0.7);
    const midSize = Math.max(40, intensity * 100);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + intensity * 0.4})`;
    ctx.lineWidth = 1.5 + intensity * 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, midSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inner rotating triangle
    ctx.save();
    ctx.rotate(this.effectsRotation * 1.5);
    const innerSize = Math.max(20, intensity * 60);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 + intensity * 0.3})`;
    ctx.lineWidth = 1 + intensity;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const x = Math.cos(angle) * innerSize / 2;
      const y = Math.sin(angle) * innerSize / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Frequency bars in circle (audio-reactive)
    const barCount = 12;
    const radius = 70 + intensity * 30;
    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor((i / barCount) * (this.dataArray.length / 4));
      const barHeight = (this.dataArray[freqIndex] / 255) * 40;
      const angle = (i / barCount) * Math.PI * 2;

      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + (this.dataArray[freqIndex] / 255) * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, radius);
      ctx.lineTo(0, radius + barHeight);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Increment rotation based on audio intensity
    this.effectsRotation += 0.01 + intensity * 0.03;
  }

  /**
   * Update parameter meters
   */
  _updateParameters() {
    if (!this.synth.initialized) return;

    // Calculate audio level from frequency data
    this.analyzer.getByteFrequencyData(this.frequencyData);
    const audioSum = this.frequencyData.reduce((a, b) => a + b, 0);
    const audioLevel = audioSum / (this.frequencyData.length * 255);
    this.audioIntensity = audioLevel;

    // Map synth parameters to meter values (0-1)
    const params = {
      'FILTER FREQ': (this.synth.parameters.filterFrequency - 800) / (8000 - 800),
      'RESONANCE': (this.synth.parameters.filterResonance - 0.5) / (8 - 0.5),
      'REVERB': this.synth.parameters.reverbMix,
      'DELAY': this.synth.parameters.delayMix,
      'PITCH BEND': (this.synth.parameters.pitchBend + 7) / 14, // -7 to +7
      'VOLUME': this.synth.parameters.masterVolume,
      'BITCRUSH': this.synth.parameters.bitcrushAmount,
      'TAPE SAT': this.synth.parameters.distortionAmount,
      'AUDIO LEVEL': audioLevel
    };

    for (const [label, value] of Object.entries(params)) {
      if (this.meterElements[label]) {
        const clampedValue = Math.max(0, Math.min(1, value));
        this.meterElements[label].style.width = `${clampedValue * 100}%`;
      }
    }
  }

  /**
   * Flash a note cell
   */
  flashNote(index) {
    if (!this.noteCells[index]) return;

    const cell = this.noteCells[index];
    cell.classList.add('active');

    setTimeout(() => {
      cell.classList.remove('active');
    }, 200);
  }

  /**
   * Update status text
   */
  updateStatus(text) {
    const status = document.getElementById('status');
    if (status) {
      status.textContent = text;
    }
  }
}

// Make available globally
window.Visualizer = Visualizer;
