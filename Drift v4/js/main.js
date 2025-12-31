/**
 * Main entry point for Drift
 * Handles UI and initialization
 */

const DriftApp = {
  isInitialized: false,
  isPaused: false,
  
  // DOM elements
  elements: {
    initializeBtn: null,
    pauseBtn: null,
    volumeSlider: null,
    elapsed: null,
    phase: null,
    status: null,
    controls: null,
    visualization: null
  },
  
  // Visualization
  visualCtx: null,
  visualCanvas: null,
  particles: [],
  
  /**
   * Initialize the app
   */
  init() {
    // Get DOM elements
    this.elements = {
      initializeBtn: document.getElementById('initializeBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      volumeSlider: document.getElementById('volumeSlider'),
      elapsed: document.getElementById('elapsed'),
      phase: document.getElementById('phase'),
      status: document.getElementById('status'),
      controls: document.getElementById('controls'),
      visualization: document.getElementById('visualization')
    };
    
    // Set up event listeners
    this.elements.initializeBtn.addEventListener('click', () => this.handleInitialize());
    this.elements.pauseBtn.addEventListener('click', () => this.handlePause());
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e.target.value));
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.isInitialized) {
        e.preventDefault();
        this.handlePause();
      }
    });
    
    // Set up visualization canvas
    this._initVisualization();
    
    console.log('Drift app ready');
  },
  
  /**
   * Handle initialize button click
   */
  async handleInitialize() {
    if (this.isInitialized) {
      // Already running - could restart
      return;
    }
    
    // Update UI
    this.elements.initializeBtn.classList.add('active');
    this.elements.initializeBtn.querySelector('.btn-text').textContent = 'Initializing...';
    
    try {
      // Initialize conductor
      console.log('Starting conductor init...');
      await Conductor.init();
      console.log('Conductor initialized');
      
      // Set up callbacks
      Conductor.onStateChange = (state) => this.updateUI(state);
      
      // Start the performance
      console.log('Starting performance...');
      await Conductor.start();
      console.log('Performance started');
      
      this.isInitialized = true;
      
      // Update UI
      this.elements.initializeBtn.querySelector('.btn-text').textContent = 'Playing';
      this.elements.status.classList.add('visible');
      this.elements.controls.classList.remove('hidden');
      
      // Start visualization
      this._startVisualization();
      
    } catch (error) {
      console.error('Failed to initialize:', error);
      console.error('Error stack:', error.stack);
      this.elements.initializeBtn.querySelector('.btn-text').textContent = 'Error - Click to retry';
      this.elements.initializeBtn.classList.remove('active');
    }
  },
  
  /**
   * Handle pause button
   */
  handlePause() {
    if (!this.isInitialized) return;
    
    this.isPaused = !this.isPaused;
    Conductor.togglePause();
    
    this.elements.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
    this.elements.initializeBtn.querySelector('.btn-text').textContent = 
      this.isPaused ? 'Paused' : 'Playing';
  },
  
  /**
   * Handle volume slider change
   */
  handleVolumeChange(value) {
    const volume = value / 100;
    DriftEffects.setMasterVolume(volume);
  },
  
  /**
   * Update UI with current state
   */
  updateUI(state) {
    // Update elapsed time
    const minutes = Math.floor(state.elapsedTime / 60);
    const seconds = Math.floor(state.elapsedTime % 60);
    this.elements.elapsed.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update mood indicator
    if (this.elements.phase) {
      const moodText = state.mood < 0.35 ? 'dark' : state.mood > 0.65 ? 'bright' : 'balanced';
      this.elements.phase.textContent = `${moodText} · ${state.scale}`;
    }
    
    // Update visualization colors based on mood
    this._updateVisualizationMood(state.mood);
  },
  
  /**
   * Initialize visualization canvas
   */
  _initVisualization() {
    this.visualCanvas = document.createElement('canvas');
    this.visualCanvas.width = window.innerWidth;
    this.visualCanvas.height = window.innerHeight;
    this.visualCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
    this.elements.visualization.appendChild(this.visualCanvas);
    
    this.visualCtx = this.visualCanvas.getContext('2d');
    
    // Handle resize
    window.addEventListener('resize', () => {
      this.visualCanvas.width = window.innerWidth;
      this.visualCanvas.height = window.innerHeight;
    });
    
    // Initialize particles
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * this.visualCanvas.width,
        y: Math.random() * this.visualCanvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.3
      });
    }
  },
  
  /**
   * Start visualization loop
   */
  _startVisualization() {
    const render = () => {
      if (!this.isInitialized) return;
      
      this._renderVisualization();
      requestAnimationFrame(render);
    };
    render();
  },
  
  /**
   * Render visualization frame
   */
  _renderVisualization() {
    const ctx = this.visualCtx;
    const w = this.visualCanvas.width;
    const h = this.visualCanvas.height;
    
    // Fade previous frame
    ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
    ctx.fillRect(0, 0, w, h);
    
    // Get audio data if available
    const waveform = GlobalListener.getWaveform();
    const readings = GlobalListener.getReadings();
    
    // Draw particles
    for (const p of this.particles) {
      // Move particle
      p.x += p.vx;
      p.y += p.vy;
      
      // React to audio
      if (readings.rms > 0.01) {
        p.vx += (Math.random() - 0.5) * readings.rms * 0.5;
        p.vy += (Math.random() - 0.5) * readings.rms * 0.5;
      }
      
      // Dampen
      p.vx *= 0.99;
      p.vy *= 0.99;
      
      // Wrap around
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      
      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this._currentColor.r}, ${this._currentColor.g}, ${this._currentColor.b}, ${p.alpha})`;
      ctx.fill();
    }
    
    // Draw subtle waveform in center
    if (waveform && waveform.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${this._currentColor.r}, ${this._currentColor.g}, ${this._currentColor.b}, 0.1)`;
      ctx.lineWidth = 1;
      
      const sliceWidth = w / waveform.length;
      let x = 0;
      
      for (let i = 0; i < waveform.length; i++) {
        const v = (waveform[i] + 1) / 2;
        const y = h / 2 + (v - 0.5) * h * 0.2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      
      ctx.stroke();
    }
  },
  
  _currentColor: { r: 120, g: 160, b: 200 },
  
  /**
   * Update visualization colors based on mood
   */
  _updateVisualizationMood(mood) {
    // Interpolate between cool (dark mood) and warm (bright mood)
    const coolColor = { r: 80, g: 120, b: 180 };
    const warmColor = { r: 180, g: 140, b: 100 };
    
    this._currentColor = {
      r: Math.round(coolColor.r + (warmColor.r - coolColor.r) * mood),
      g: Math.round(coolColor.g + (warmColor.g - coolColor.g) * mood),
      b: Math.round(coolColor.b + (warmColor.b - coolColor.b) * mood)
    };
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  DriftApp.init();
});
