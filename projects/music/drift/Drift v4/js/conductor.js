/**
 * Conductor for Drift
 * Central orchestrator managing global state, agents, and evolution
 */

const Conductor = {
  // Global state
  state: {
    mood: 0.5,           // 0 = dark, 1 = bright
    density: 0.4,        // 0 = sparse, 1 = rich (start fuller)
    tension: 0.3,        // 0 = calm, 1 = intense
    tempo: 0.3,          // Events per second
    harmonicCenter: 48,  // MIDI note (C3)
    scale: 'dorian',
    elapsedTime: 0
  },
  
  // Performance limits
  performance: {
    maxConcurrentAgents: 4,      // Max agents playing at once
    maxVoicesTotal: 12,          // Total polyphony limit
    currentVoices: 0,
    updateThrottle: 50,          // ms between update cycles
    lastAgentTrigger: 0,
    minAgentSpacing: 500         // ms between any agent triggers
  },
  
  // Agents
  agents: [],
  
  // Timing
  startTime: 0,
  lastUpdateTime: 0,
  lastThrottledUpdate: 0,
  updateInterval: null,
  isRunning: false,
  
  // Callbacks
  onStateChange: null,
  
  /**
   * Initialize the conductor
   */
  async init() {
    // Initialize effects first
    await DriftEffects.init();
    
    // Initialize global listener
    GlobalListener.init();
    
    // Create agents
    this.agents = [
      new DroneAgent(this),
      new PadAgent(this),
      new TextureAgent(this),
      new PulseAgent(this),
      new MelodyAgent(this),
      new VocalAgent(this),
      new FieldAgent(this),
      new RitualAgent(this),
      new GranularAgent(this),
      new SwellAgent(this),
      new AtmosphereAgent(this)
    ];
    
    // Initialize each agent
    for (const agent of this.agents) {
      try {
        console.log(`Initializing agent: ${agent.name}`);
        agent.init();
        agent.connect(
          DriftEffects.getOutput(),
          DriftEffects.getReverbSend(),
          DriftEffects.getDelaySend()
        );
        console.log(`Agent ${agent.name} initialized`);
      } catch (err) {
        console.error(`Failed to init agent ${agent.name}:`, err);
        throw err;
      }
    }
    
    // Set initial state
    this._randomizeInitialState();
    
    console.log('Conductor initialized');
    return this;
  },
  
  /**
   * Start the performance
   */
  async start() {
    if (this.isRunning) return;
    
    // Start Tone.js
    await Tone.start();
    console.log('Audio context started');
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    
    // Start update loop
    this._startUpdateLoop();
    
    // Start with multiple sounds quickly
    setTimeout(() => {
      const droneAgent = this.agents.find(a => a.name === 'Drone');
      if (droneAgent) droneAgent.play();
    }, 500);
    
    setTimeout(() => {
      const padAgent = this.agents.find(a => a.name === 'Pad');
      if (padAgent) padAgent.play();
    }, 2000);
    
    setTimeout(() => {
      const textureAgent = this.agents.find(a => a.name === 'Texture');
      if (textureAgent) textureAgent.play();
    }, 3500);
    
    console.log('Performance started');
  },
  
  /**
   * Stop the performance
   */
  stop() {
    this.isRunning = false;
    
    if (this.updateInterval) {
      cancelAnimationFrame(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Stop all agents
    for (const agent of this.agents) {
      agent.stop();
    }
    
    console.log('Performance stopped');
  },
  
  /**
   * Pause/resume
   */
  togglePause() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.isRunning = true;
      this.lastUpdateTime = Date.now();
      this._startUpdateLoop();
    }
  },
  
  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  },
  
  /**
   * Check if we can start a new voice
   */
  canAddVoices(count = 1) {
    return this.performance.currentVoices + count <= this.performance.maxVoicesTotal;
  },
  
  /**
   * Reserve voices (call before playing)
   */
  reserveVoices(count = 1) {
    if (!this.canAddVoices(count)) return false;
    this.performance.currentVoices += count;
    return true;
  },
  
  /**
   * Release voices (call when done)
   */
  releaseVoices(count = 1) {
    this.performance.currentVoices = Math.max(0, this.performance.currentVoices - count);
  },
  
  /**
   * Check if an agent can trigger (spacing limit)
   */
  canAgentTrigger() {
    const now = Date.now();
    if (now - this.performance.lastAgentTrigger < this.performance.minAgentSpacing) {
      return false;
    }
    // Count currently playing agents
    const playingCount = this.agents.filter(a => a.isPlaying).length;
    return playingCount < this.performance.maxConcurrentAgents;
  },
  
  /**
   * Mark that an agent triggered
   */
  markAgentTrigger() {
    this.performance.lastAgentTrigger = Date.now();
  },
  
  /**
   * Broadcast event to all agents
   */
  broadcast(event) {
    for (const agent of this.agents) {
      agent.receive(event);
    }
  },
  
  /**
   * Start the main update loop
   */
  _startUpdateLoop() {
    const update = () => {
      if (!this.isRunning) return;
      
      const now = Date.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = now;
      
      // Update elapsed time
      this.state.elapsedTime = (now - this.startTime) / 1000;
      
      // Throttle heavy operations
      const shouldDoHeavyUpdate = (now - this.lastThrottledUpdate) >= this.performance.updateThrottle;
      
      if (shouldDoHeavyUpdate) {
        this.lastThrottledUpdate = now;
        
        // Evolve state
        this._evolve(deltaTime * (this.performance.updateThrottle / 16.67)); // Compensate for throttle
        
        // Update effects based on state (less frequently)
        DriftEffects.updateFromConductor(this.state);
        
        // Update agents (only some per frame to spread load)
        const agentsPerUpdate = Math.ceil(this.agents.length / 3);
        const startIdx = Math.floor((now / this.performance.updateThrottle) % 3) * agentsPerUpdate;
        for (let i = startIdx; i < Math.min(startIdx + agentsPerUpdate, this.agents.length); i++) {
          this.agents[i].update(deltaTime);
        }
      }
      
      // Notify listeners (for UI - can be every frame)
      if (this.onStateChange) {
        this.onStateChange(this.state);
      }
      
      this.updateInterval = requestAnimationFrame(update);
    };
    
    update();
  },
  
  /**
   * Evolve state parameters over time
   */
  _evolve(deltaTime) {
    const time = this.state.elapsedTime;
    
    // Mood drifts over ~3 minute cycles (faster evolution)
    const moodNoise = DriftRandom.fbm(time * 0.006, 0, 3, 0.5);
    this.state.mood = Math.max(0.15, Math.min(0.85, 0.5 + moodNoise * 0.4));
    
    // Density evolves continuously with noise
    const densityNoise = DriftRandom.fbm(time * 0.004 + 50, 0, 3, 0.5);
    this.state.density = Math.max(0.25, Math.min(0.75, 0.5 + densityNoise * 0.3));
    
    // Tension varies independently
    const tensionNoise = DriftRandom.fbm(time * 0.005 + 100, 0, 2, 0.5);
    this.state.tension = Math.max(0.15, Math.min(0.7, 0.35 + tensionNoise * 0.3));
    
    // Scale changes every few minutes on average
    if (DriftRandom.chance(0.0003 * deltaTime)) {
      this.state.scale = DriftScales.getScaleForMood(this.state.mood);
      console.log(`Scale shift: ${this.state.scale}`);
    }
    
    // Key changes occasionally
    if (DriftRandom.chance(0.00015 * deltaTime)) {
      this._changeKey();
    }
  },
  
  /**
   * Change harmonic center (key)
   */
  _changeKey() {
    const currentRoot = this.state.harmonicCenter;
    
    // Move by fourth, fifth, or step
    const intervals = [-7, -5, -2, 2, 5, 7];
    const interval = DriftRandom.choice(intervals);
    const newRoot = currentRoot + interval;
    
    // Keep in reasonable range
    this.state.harmonicCenter = Math.max(36, Math.min(60, newRoot));
    
    // Announce to agents
    this.broadcast({
      type: 'KEY_CHANGE_PENDING',
      newRoot: this.state.harmonicCenter,
      inSeconds: 30
    });
    
    console.log(`Key change: ${DriftMusic.midiToNote(currentRoot)} → ${DriftMusic.midiToNote(this.state.harmonicCenter)}`);
  },
  
  /**
   * Randomize initial state for variety
   */
  _randomizeInitialState() {
    // Random starting key
    const roots = [48, 50, 52, 53, 55, 57]; // C, D, E, F, G, A
    this.state.harmonicCenter = DriftRandom.choice(roots);
    
    // Random starting scale
    this.state.scale = DriftRandom.choice(['dorian', 'aeolian', 'mixolydian']);
    
    // Slightly randomize mood
    this.state.mood = 0.4 + DriftRandom.range(0, 0.3);
    
    console.log(`Initial state: ${DriftMusic.midiToNote(this.state.harmonicCenter)} ${this.state.scale}`);
  },
  
  /**
   * Cleanup
   */
  dispose() {
    this.stop();
    
    for (const agent of this.agents) {
      agent.dispose();
    }
    
    DriftEffects.dispose();
    GlobalListener.dispose();
    DriftSynths.disposeAll();
  }
};

// Make available globally
window.Conductor = Conductor;
