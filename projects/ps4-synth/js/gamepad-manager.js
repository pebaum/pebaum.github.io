/**
 * GamepadManager - Manages PS4 controller input
 * Polls gamepad state and provides normalized values
 */

class GamepadManager {
  constructor() {
    this.gamepad = null;
    this.connected = false;
    this.previousButtonStates = new Array(17).fill(false);
    this.previousAxes = new Array(4).fill(0);
    this.onButtonPress = null;  // Callback: (buttonIndex) => {}
    this.onButtonRelease = null; // Callback: (buttonIndex) => {}
    this.onAxisChange = null;   // Callback: (axisIndex, value) => {}
    this.onConnect = null;       // Callback: () => {}
    this.onDisconnect = null;    // Callback: () => {}

    // Deadzone for analog sticks (prevents drift)
    this.axisDeadzone = 0.1;

    // Threshold for detecting axis changes
    this.axisChangeThreshold = 0.02;

    this._setupEventListeners();
  }

  _setupEventListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      this.gamepad = e.gamepad;
      this.connected = true;
      if (this.onConnect) this.onConnect(e.gamepad);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected');
      this.gamepad = null;
      this.connected = false;
      if (this.onDisconnect) this.onDisconnect();
    });
  }

  /**
   * Start polling the gamepad
   * Call this in your main loop (requestAnimationFrame)
   */
  poll() {
    // Get latest gamepad state
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    // Find connected gamepad (usually index 0)
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.gamepad = gamepads[i];
        break;
      }
    }

    if (!this.gamepad) {
      this.connected = false;
      return;
    }

    this.connected = true;
    this._checkButtons();
    this._checkAxes();
  }

  _checkButtons() {
    if (!this.gamepad) return;

    for (let i = 0; i < this.gamepad.buttons.length; i++) {
      const button = this.gamepad.buttons[i];
      const isPressed = button.pressed;
      const wasPressed = this.previousButtonStates[i];

      // Button just pressed
      if (isPressed && !wasPressed) {
        if (this.onButtonPress) {
          this.onButtonPress(i, button.value);
        }
      }

      // Button just released
      if (!isPressed && wasPressed) {
        if (this.onButtonRelease) {
          this.onButtonRelease(i);
        }
      }

      this.previousButtonStates[i] = isPressed;
    }
  }

  _checkAxes() {
    if (!this.gamepad) return;

    for (let i = 0; i < this.gamepad.axes.length; i++) {
      const value = this._applyDeadzone(this.gamepad.axes[i]);
      const previousValue = this.previousAxes[i];

      // Detect significant axis change
      if (Math.abs(value - previousValue) > this.axisChangeThreshold) {
        if (this.onAxisChange) {
          this.onAxisChange(i, value);
        }
        this.previousAxes[i] = value;
      }
    }
  }

  _applyDeadzone(value) {
    if (Math.abs(value) < this.axisDeadzone) {
      return 0;
    }
    // Scale remaining range to 0-1
    const sign = Math.sign(value);
    const magnitude = Math.abs(value);
    return sign * ((magnitude - this.axisDeadzone) / (1 - this.axisDeadzone));
  }

  /**
   * Get current state of a button (0-16)
   * @returns {boolean} True if pressed
   */
  getButton(index) {
    if (!this.gamepad || index >= this.gamepad.buttons.length) return false;
    return this.gamepad.buttons[index].pressed;
  }

  /**
   * Get analog value of a button (0-1)
   * Useful for L2/R2 triggers
   */
  getButtonValue(index) {
    if (!this.gamepad || index >= this.gamepad.buttons.length) return 0;
    return this.gamepad.buttons[index].value;
  }

  /**
   * Get current axis value (0-3)
   * @returns {number} Value from -1 to 1 (with deadzone applied)
   */
  getAxis(index) {
    if (!this.gamepad || index >= this.gamepad.axes.length) return 0;
    return this._applyDeadzone(this.gamepad.axes[index]);
  }

  /**
   * Get all current axis values
   * @returns {Array} [leftX, leftY, rightX, rightY]
   */
  getAllAxes() {
    if (!this.gamepad) return [0, 0, 0, 0];
    return [
      this.getAxis(0), // Left X
      this.getAxis(1), // Left Y
      this.getAxis(2), // Right X
      this.getAxis(3)  // Right Y
    ];
  }

  /**
   * Get human-readable button name
   */
  getButtonName(index) {
    const names = {
      0: 'X',
      1: 'Circle',
      2: 'Square',
      3: 'Triangle',
      4: 'L1',
      5: 'R1',
      6: 'L2',
      7: 'R2',
      8: 'Share',
      9: 'Options',
      10: 'L3',
      11: 'R3',
      12: 'D-Up',
      13: 'D-Down',
      14: 'D-Left',
      15: 'D-Right',
      16: 'PS'
    };
    return names[index] || `Button ${index}`;
  }

  /**
   * Get human-readable axis name
   */
  getAxisName(index) {
    const names = {
      0: 'Left Stick X',
      1: 'Left Stick Y',
      2: 'Right Stick X',
      3: 'Right Stick Y'
    };
    return names[index] || `Axis ${index}`;
  }

  /**
   * Check if controller is connected
   */
  isConnected() {
    return this.connected && this.gamepad !== null;
  }
}

// Make available globally
window.GamepadManager = GamepadManager;
