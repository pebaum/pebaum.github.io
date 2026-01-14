/**
 * Main Application - Generative Granular Ambient
 * Orchestrates the entire system
 */

class App {
  constructor() {
    this.audioIO = null;
    this.engine = null;
    this.conductor = null;
    this.visualization = null;
    this.running = false;
    this.paused = false;
    this.updateInterval = null;

    this.init();
  }

  /**
   * Initialize app
   */
  init() {
    this.audioIO = new AudioIO();
    this.setupSampleInput();

    // Sample loaded callback
    this.audioIO.onSampleLoaded = (buffer) => {
      this.onSampleLoaded(buffer);
    };
  }

  /**
   * Setup sample input controls
   */
  setupSampleInput() {
    // Record button
    const recordBtn = document.getElementById('record-btn');
    const stopRecordBtn = document.getElementById('stop-record-btn');
    const recordingUI = document.getElementById('recording-ui');

    recordBtn.addEventListener('click', async () => {
      const success = await this.audioIO.startMicRecording();
      if (success) {
        recordBtn.style.display = 'none';
        document.getElementById('upload-btn').style.display = 'none';
        document.getElementById('drop-zone').style.display = 'none';
        recordingUI.style.display = 'flex';
      }
    });

    stopRecordBtn.addEventListener('click', () => {
      this.audioIO.stopMicRecording();
    });

    // Upload button
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');

    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await this.audioIO.loadFromFile(file);
      }
    });

    // Drag and drop
    const dropZone = document.getElementById('drop-zone');

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('audio/')) {
        await this.audioIO.loadFromFile(file);
      } else {
        alert('Please drop an audio file');
      }
    });

    // Start button
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
      this.start();
    });
  }

  /**
   * Handle sample loaded
   */
  onSampleLoaded(buffer) {
    // Update UI
    const sampleName = document.getElementById('sample-name');
    if (sampleName) {
      sampleName.textContent = buffer.duration.toFixed(1) + 's audio';
    }

    // Hide recording UI
    document.getElementById('recording-ui').style.display = 'none';

    // Show sample loaded section
    document.getElementById('sample-loaded').style.display = 'block';

    // Initialize audio components
    if (!this.audioIO.audioContext) {
      this.audioIO.init();
    }

    this.engine = new GranularEngine(this.audioIO.audioContext);
    this.engine.loadSample(buffer);

    this.conductor = new Conductor(this.engine);

    const canvas = document.getElementById('canvas');
    this.visualization = new Visualization(canvas, this.conductor);
    this.visualization.loadSample(buffer);
  }

  /**
   * Start the generative composition
   */
  async start() {
    if (!this.engine || !this.conductor) {
      alert('Please load a sample first');
      return;
    }

    // Resume audio context (required for user interaction)
    if (this.audioIO.audioContext.state === 'suspended') {
      await this.audioIO.audioContext.resume();
    }

    console.log('Starting generative composition...');
    console.log('Audio context state:', this.audioIO.audioContext.state);
    console.log('Sample buffer loaded:', !!this.engine.sampleBuffer);

    // Hide overlay
    document.getElementById('overlay').classList.add('hidden');

    // Show info and controls
    document.getElementById('info').style.display = 'block';
    document.getElementById('controls').style.display = 'flex';

    // Set volume to max BEFORE starting
    if (this.engine) {
      this.engine.setVolume(4.0); // Match Drift v7's max gain
      console.log('Volume set to max');
    }

    // Start conductor
    this.conductor.start();
    console.log('Conductor started with', this.conductor.voices.length, 'voices');

    // Start visualization
    this.visualization.start();

    // Start UI update loop
    this.running = true;
    this.updateUI();
    this.updateInterval = setInterval(() => {
      this.updateUI();
    }, 100);

    // Setup playback controls
    this.setupPlaybackControls();
  }

  /**
   * Setup playback controls
   */
  setupPlaybackControls() {
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    const volumeSlider = document.getElementById('volume-slider');

    // Pause/Resume
    pauseBtn.addEventListener('click', () => {
      if (this.paused) {
        this.resume();
        pauseBtn.textContent = 'Pause';
      } else {
        this.pause();
        pauseBtn.textContent = 'Resume';
      }
    });

    // Restart
    restartBtn.addEventListener('click', () => {
      this.restart();
    });

    // Volume
    volumeSlider.addEventListener('input', (e) => {
      const volume = parseFloat(e.target.value) / 100;
      if (this.engine) {
        this.engine.setVolume(volume * 4.0); // Match Drift v7's gain
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.running) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          pauseBtn.click();
          break;
        case 'r':
          e.preventDefault();
          restartBtn.click();
          break;
      }
    });
  }

  /**
   * Update UI
   */
  updateUI() {
    if (!this.running || !this.conductor) return;

    const info = this.conductor.getInfo();

    document.getElementById('elapsed').textContent = info.elapsed;
    document.getElementById('scale-name').textContent = `${info.rootName} ${info.scaleName}`;
    document.getElementById('voice-count').textContent = info.voiceCount;
    document.getElementById('active-grains').textContent = info.activeGrains;
  }

  /**
   * Pause
   */
  pause() {
    this.paused = true;
    if (this.audioIO.audioContext && this.audioIO.audioContext.state === 'running') {
      this.audioIO.audioContext.suspend();
    }
  }

  /**
   * Resume
   */
  resume() {
    this.paused = false;
    if (this.audioIO.audioContext && this.audioIO.audioContext.state === 'suspended') {
      this.audioIO.audioContext.resume();
    }
  }

  /**
   * Restart
   */
  restart() {
    // Stop current composition
    if (this.conductor) {
      this.conductor.stop();
    }

    // Wait a moment then restart
    setTimeout(() => {
      if (this.conductor) {
        this.conductor.start();
      }
    }, 300);
  }
}

// Initialize app when page loads
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  window.app = app; // Make available globally for debugging
});

// Keep audio running in background
document.addEventListener('visibilitychange', () => {
  if (window.app && window.app.audioIO && window.app.audioIO.audioContext) {
    const ctx = window.app.audioIO.audioContext;
    if (!document.hidden && ctx.state === 'suspended') {
      ctx.resume();
    }
  }
});

// Periodic resume check (for mobile)
setInterval(() => {
  if (window.app && window.app.running && !window.app.paused) {
    const ctx = window.app.audioIO?.audioContext;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }
}, 1000);
