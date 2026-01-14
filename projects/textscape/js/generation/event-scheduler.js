/**
 * Event Scheduler - Manages playback timing and coordination
 *
 * Handles:
 * - Scheduling all musical events from composition
 * - Playback control (play, pause, stop)
 * - Progress tracking
 * - Event callbacks for visualization
 */

class EventScheduler {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.composition = null;
        this.scheduledEvents = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.pausedDuration = 0;

        this.onProgress = null; // Callback for progress updates
        this.onEvent = null; // Callback when events trigger
        this.onComplete = null; // Callback when playback completes
    }

    /**
     * Load a composition for playback
     */
    loadComposition(composition) {
        this.stop(); // Stop any current playback
        this.composition = composition;
        this.scheduledEvents = [];
    }

    /**
     * Start playback
     */
    async play() {
        if (!this.composition) {
            console.warn('No composition loaded');
            return;
        }

        // Initialize audio engine if needed
        if (!this.audioEngine.isInitialized) {
            await this.audioEngine.initialize();
        }

        await this.audioEngine.resume();

        // Handle resume from pause
        if (this.isPaused) {
            this.pausedDuration += this.audioEngine.getCurrentTime() - this.pauseTime;
            this.isPaused = false;
            this.isPlaying = true;
            this.scheduleRemainingEvents();
            this.startProgressTracking();
            return;
        }

        // Fresh start
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = this.audioEngine.getCurrentTime();
        this.pausedDuration = 0;

        // Apply effects settings from composition
        this.applyEffectsSettings();

        // Schedule all events
        this.scheduleAllEvents();

        // Start progress tracking
        this.startProgressTracking();

        // Schedule completion callback
        setTimeout(() => {
            if (this.isPlaying) {
                this.stop();
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        }, this.composition.duration);
    }

    /**
     * Pause playback
     */
    pause() {
        if (!this.isPlaying || this.isPaused) return;

        this.isPaused = true;
        this.isPlaying = false;
        this.pauseTime = this.audioEngine.getCurrentTime();

        // Cancel all scheduled events
        this.cancelScheduledEvents();

        // Stop progress tracking
        this.stopProgressTracking();
    }

    /**
     * Stop playback
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;

        // Stop all audio
        this.audioEngine.stopAll();

        // Cancel all scheduled events
        this.cancelScheduledEvents();

        // Stop progress tracking
        this.stopProgressTracking();

        // Reset times
        this.startTime = 0;
        this.pauseTime = 0;
        this.pausedDuration = 0;
    }

    /**
     * Apply effects settings from composition
     */
    applyEffectsSettings() {
        const effects = this.composition.params.effects;

        this.audioEngine.setReverbSize(effects.reverbSize);
        this.audioEngine.setReverbMix(effects.reverbMix);
        this.audioEngine.setDelayTime(effects.delayTime);
        this.audioEngine.setDelayFeedback(0.3);
        this.audioEngine.setLowPass(effects.lowPass);
        this.audioEngine.setHighPass(effects.highPass);
    }

    /**
     * Schedule all events from composition
     */
    scheduleAllEvents() {
        const timeline = this.composition.timeline;
        const audioStartTime = this.audioEngine.getCurrentTime();

        for (const [voiceType, events] of Object.entries(timeline)) {
            for (const event of events) {
                const scheduleTime = audioStartTime + (event.time / 1000); // Convert ms to seconds

                const timeoutId = setTimeout(() => {
                    if (!this.isPlaying) return;

                    this.playEvent(voiceType, event);

                    if (this.onEvent) {
                        this.onEvent(voiceType, event);
                    }
                }, event.time);

                this.scheduledEvents.push(timeoutId);
            }
        }
    }

    /**
     * Schedule only events that haven't been played yet (for resume)
     */
    scheduleRemainingEvents() {
        const timeline = this.composition.timeline;
        const elapsed = this.getElapsedTime();
        const audioStartTime = this.audioEngine.getCurrentTime();

        for (const [voiceType, events] of Object.entries(timeline)) {
            for (const event of events) {
                // Only schedule events that haven't happened yet
                if (event.time > elapsed) {
                    const remainingTime = event.time - elapsed;

                    const timeoutId = setTimeout(() => {
                        if (!this.isPlaying) return;

                        this.playEvent(voiceType, event);

                        if (this.onEvent) {
                            this.onEvent(voiceType, event);
                        }
                    }, remainingTime);

                    this.scheduledEvents.push(timeoutId);
                }
            }
        }
    }

    /**
     * Play a single event
     */
    playEvent(voiceType, event) {
        if (event.type === 'note') {
            this.audioEngine.playNote(
                voiceType,
                event.frequency,
                event.duration,
                event.velocity
            );
        }
    }

    /**
     * Cancel all scheduled events
     */
    cancelScheduledEvents() {
        for (const timeoutId of this.scheduledEvents) {
            clearTimeout(timeoutId);
        }
        this.scheduledEvents = [];
    }

    /**
     * Start progress tracking
     */
    startProgressTracking() {
        this.progressInterval = setInterval(() => {
            if (!this.isPlaying) return;

            const progress = this.getProgress();

            if (this.onProgress) {
                this.onProgress(progress);
            }
        }, 100); // Update every 100ms
    }

    /**
     * Stop progress tracking
     */
    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    /**
     * Get current playback progress (0 to 1)
     */
    getProgress() {
        if (!this.composition) return 0;

        const elapsed = this.getElapsedTime();
        return Math.min(elapsed / this.composition.duration, 1.0);
    }

    /**
     * Get elapsed time in milliseconds
     */
    getElapsedTime() {
        if (this.isPaused) {
            return (this.pauseTime - this.startTime - this.pausedDuration) * 1000;
        }

        if (!this.isPlaying) {
            return 0;
        }

        return (this.audioEngine.getCurrentTime() - this.startTime - this.pausedDuration) * 1000;
    }

    /**
     * Get remaining time in milliseconds
     */
    getRemainingTime() {
        if (!this.composition) return 0;

        return Math.max(0, this.composition.duration - this.getElapsedTime());
    }

    /**
     * Format time for display (mm:ss)
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Check if currently playing
     */
    getIsPlaying() {
        return this.isPlaying;
    }

    /**
     * Check if paused
     */
    getIsPaused() {
        return this.isPaused;
    }
}
