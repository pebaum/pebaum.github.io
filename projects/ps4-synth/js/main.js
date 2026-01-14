/**
 * Main application controller
 * Orchestrates gamepad, synth, and parameter mapping
 */

class PS4SynthApp {
  constructor() {
    this.gamepad = null;
    this.synth = null;
    this.sequencer = null;
    this.mapper = null;
    this.visualizer = null;
    this.running = false;
    this.showMappings = false;

    // UI elements
    this.ui = {
      status: null,
      startButton: null,
      randomizeButton: null,
      toggleMappingsButton: null,
      mappingsDisplay: null
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('PS4 Synth initializing...');

    // Get UI elements
    this.ui.status = document.getElementById('status');
    this.ui.startButton = document.getElementById('start-button');
    this.ui.randomizeButton = document.getElementById('randomize-button');
    this.ui.toggleMappingsButton = document.getElementById('toggle-mappings');
    this.ui.mappingsDisplay = document.getElementById('mappings-display');

    // Initialize components
    this.gamepad = new GamepadManager();
    this.synth = new SynthEngine();
    this.visualizer = new Visualizer(this.synth);
    this.mapper = new ParameterMapper(this.synth);

    // Set up gamepad callbacks
    this.gamepad.onConnect = (gp) => {
      this.visualizer.updateStatus('CONTROLLER CONNECTED');
      this.ui.startButton.disabled = false;
    };

    this.gamepad.onDisconnect = () => {
      this.visualizer.updateStatus('CONTROLLER DISCONNECTED');
      if (this.running) {
        this.stop();
      }
    };

    this.gamepad.onButtonPress = (buttonIndex, value) => {
      if (!this.running) return;
      this.mapper.processButtonPress(buttonIndex, value);
      // Flash note visualization
      const mapping = this.mapper.mappings.buttons[buttonIndex];
      if (typeof mapping === 'number') {
        this.visualizer.flashNote(mapping % 12);
      }
    };

    this.gamepad.onButtonRelease = (buttonIndex) => {
      if (!this.running) return;
      this.mapper.processButtonRelease(buttonIndex);
    };

    this.gamepad.onAxisChange = (axisIndex, value) => {
      if (!this.running) return;
      this.mapper.processAxis(axisIndex, value);
    };

    // Set up UI button handlers
    this.ui.startButton.addEventListener('click', () => this.start());
    this.ui.randomizeButton.addEventListener('click', () => this.randomize());
    this.ui.toggleMappingsButton.addEventListener('click', () => this.toggleMappings());

    // Check if controller is already connected
    const gamepads = navigator.getGamepads();
    if (gamepads) {
      for (const gp of gamepads) {
        if (gp) {
          this.gamepad.gamepad = gp;
          this.gamepad.connected = true;
          this._updateStatus(`Connected: ${gp.id}`, 'connected');
          this.ui.startButton.disabled = false;
          break;
        }
      }
    }

    if (!this.gamepad.isConnected()) {
      this.visualizer.updateStatus('WAITING FOR CONTROLLER');
    }

    console.log('PS4 Synth ready');
  }

  /**
   * Start the synth (user interaction required for AudioContext)
   */
  async start() {
    if (this.running) return;

    try {
      // Initialize audio
      await this.synth.init();

      // Initialize visualizer
      this.visualizer.init();

      // Randomize initial mappings
      this.mapper.randomize();

      // Start polling loop
      this.running = true;
      this.visualizer.updateStatus('READY TO PLAY');
      this.ui.startButton.textContent = 'PLAYING';
      this.ui.startButton.disabled = true;
      this.ui.randomizeButton.disabled = false;
      this.ui.toggleMappingsButton.disabled = false;

      // Start visualization
      this.visualizer.start();

      this._animationLoop();

      console.log('🎹 PS4 Synth ready');
    } catch (error) {
      console.error('Failed to start synth:', error);
      this.visualizer.updateStatus('ERROR');
    }
  }

  /**
   * Stop the synth
   */
  stop() {
    this.running = false;
    this.synth.stopAll();
    this.visualizer.stop();
    this.visualizer.updateStatus('STOPPED');
    this.ui.startButton.textContent = 'START';
    this.ui.startButton.disabled = false;
    this.ui.randomizeButton.disabled = true;
    this.ui.toggleMappingsButton.disabled = true;
  }

  /**
   * Randomize mappings
   */
  randomize() {
    this.mapper.randomize();
    this.visualizer.updateStatus('CONTROLS RANDOMIZED');

    // Update mappings display if visible
    if (this.showMappings) {
      this._displayMappings();
    }
  }

  /**
   * Toggle mappings display
   */
  toggleMappings() {
    this.showMappings = !this.showMappings;
    if (this.showMappings) {
      this._displayMappings();
      this.ui.mappingsDisplay.classList.remove('hidden');
      this.ui.toggleMappingsButton.textContent = 'HIDE';
    } else {
      this.ui.mappingsDisplay.classList.add('hidden');
      this.ui.toggleMappingsButton.textContent = 'REVEAL';
    }
  }

  /**
   * Display current mappings
   */
  _displayMappings() {
    const mappings = this.mapper.getCurrentMappings();

    let html = '<h3>CURRENT MAPPINGS</h3>';

    html += '<div class="mapping-section"><h4>ANALOG STICKS</h4><ul>';
    for (const [axis, params] of Object.entries(mappings.axes)) {
      html += `<li><strong>${axis}:</strong> <span>${params}</span></li>`;
    }
    html += '</ul></div>';

    html += '<div class="mapping-section"><h4>NOTE BUTTONS</h4><ul>';
    for (const [button, note] of Object.entries(mappings.noteButtons)) {
      html += `<li><strong>${button}:</strong> <span>${note}</span></li>`;
    }
    html += '</ul></div>';

    html += '<div class="mapping-section"><h4>CHORD ARROWS</h4><ul>';
    for (const [button, chord] of Object.entries(mappings.chordButtons)) {
      html += `<li><strong>${button}:</strong> <span>${chord}</span></li>`;
    }
    html += '</ul></div>';

    html += '<div class="mapping-section"><h4>SPECIAL BUTTONS</h4><ul>';
    for (const [button, action] of Object.entries(mappings.specialActions)) {
      html += `<li><strong>${button}:</strong> <span>${action}</span></li>`;
    }
    html += '</ul></div>';

    this.ui.mappingsDisplay.innerHTML = html;
  }

  /**
   * Main animation loop
   */
  _animationLoop() {
    if (!this.running) return;

    // Poll gamepad
    this.gamepad.poll();

    // Continue loop
    requestAnimationFrame(() => this._animationLoop());
  }

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new PS4SynthApp();
  await app.init();

  // Make available globally for debugging
  window.app = app;
});
