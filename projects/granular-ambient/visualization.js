/**
 * Visualization Module
 * Waveform + geometric voice visualization (inspired by Drift v7)
 */

class Visualization {
  constructor(canvas, conductor) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.conductor = conductor;
    this.sampleBuffer = null;
    this.waveformData = null;
    this.isAnimating = false;
    this.animationFrame = null;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Resize canvas to match container
   */
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Load sample and generate waveform data
   */
  loadSample(buffer) {
    this.sampleBuffer = buffer;
    this.generateWaveformData();
  }

  /**
   * Generate waveform data for background
   */
  generateWaveformData() {
    if (!this.sampleBuffer) return;

    const channelData = this.sampleBuffer.getChannelData(0);
    const samples = channelData.length;
    const width = this.canvas.width;

    const step = Math.ceil(samples / width);
    this.waveformData = [];

    for (let i = 0; i < width; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      let min = 1, max = -1;

      for (let j = start; j < end; j++) {
        const val = channelData[j];
        if (val < min) min = val;
        if (val > max) max = val;
      }

      this.waveformData.push({ min, max });
    }
  }

  /**
   * Start animation
   */
  start() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.animate();
  }

  /**
   * Stop animation
   */
  stop() {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating) return;

    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  /**
   * Main draw function
   */
  draw() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const centerX = W / 2;
    const centerY = H / 2;
    const time = Date.now() * 0.001;

    // Fade trail effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.fillRect(0, 0, W, H);

    // Draw waveform background (very subtle)
    this.drawWaveform(W, H);

    // Get voices from conductor
    const voices = this.conductor ? this.conductor.getVoices() : [];

    // Separate by register (like Drift v7)
    const lowVoices = voices.filter(v => v.register === 'low');
    const midVoices = voices.filter(v => v.register === 'mid');
    const highVoices = voices.filter(v => v.register === 'high');

    // Draw LOW VOICES - Horizontal waves (bass foundation)
    lowVoices.forEach((voice, i) => {
      const y = centerY + (i - lowVoices.length / 2 + 0.5) * 80;
      const amplitude = 30 + voice.phase * 60;
      const thickness = 8 + voice.phase * 12;
      const opacity = 0.2 + voice.phase * 0.5;

      this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.lineWidth = thickness;
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();
      for (let x = 0; x <= W; x += 5) {
        const waveY = y + Math.sin((x / 100) + (voice.phase * Math.PI * 2) + time * 0.5) * amplitude;
        if (x === 0) this.ctx.moveTo(x, waveY);
        else this.ctx.lineTo(x, waveY);
      }
      this.ctx.stroke();
    });

    // Draw MID VOICES - Expanding circles (melody)
    midVoices.forEach((voice, i) => {
      const angle = (i / midVoices.length) * Math.PI * 2;
      const orbitRadius = Math.min(W, H) * 0.2;
      const x = centerX + Math.cos(angle + time * 0.3) * orbitRadius;
      const y = centerY + Math.sin(angle + time * 0.3) * orbitRadius;

      const radius = 20 + voice.phase * 80;
      const opacity = 0.15 + voice.phase * 0.5;

      // Outer circle
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Inner fill when active
      if (voice.phase > 0.7) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Center dot
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Line to center
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    });

    // Draw HIGH VOICES - Vertical lines (treble)
    highVoices.forEach((voice, i) => {
      const x = (W / (highVoices.length + 1)) * (i + 1);
      const maxHeight = H * 0.35;
      const height = maxHeight * voice.phase;
      const opacity = 0.2 + voice.phase * 0.6;

      // Vertical line
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, centerY - height);
      this.ctx.lineTo(x, centerY + height);
      this.ctx.stroke();

      // Arcs when near completion
      if (voice.phase > 0.6) {
        const arcRadius = 30 + voice.phase * 40;

        this.ctx.beginPath();
        this.ctx.arc(x, centerY - height, arcRadius, 0, Math.PI, true);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(x, centerY + height, arcRadius, 0, Math.PI);
        this.ctx.stroke();
      }

      // Horizontal crossbar
      const crossbarWidth = 40 + voice.phase * 60;
      this.ctx.beginPath();
      this.ctx.moveTo(x - crossbarWidth, centerY);
      this.ctx.lineTo(x + crossbarWidth, centerY);
      this.ctx.stroke();
    });

    // Central pulse (conductor heartbeat)
    const pulseSize = 8 + Math.sin(time * 2) * 4;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Outer ring
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, pulseSize + 10, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  /**
   * Draw waveform background
   */
  drawWaveform(W, H) {
    if (!this.waveformData) return;

    const centerY = H / 2;
    const amplitude = H * 0.15;

    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.waveformData.length; i++) {
      const x = (i / this.waveformData.length) * W;
      const { min, max } = this.waveformData[i];

      const y1 = centerY + min * amplitude;
      const y2 = centerY + max * amplitude;

      this.ctx.moveTo(x, y1);
      this.ctx.lineTo(x, y2);
    }

    this.ctx.stroke();
  }
}

// Make available globally
window.Visualization = Visualization;
