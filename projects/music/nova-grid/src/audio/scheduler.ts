/**
 * Nova3 Web - Audio Scheduler
 * Handles BPM-synced timing for the generative engine
 */

import * as Tone from 'tone';
import { TimingParams } from '../engine/types';

// ============================================================================
// SCHEDULER
// ============================================================================

export type SchedulerCallback = () => void;

export class Nova3Scheduler {
  private loop: Tone.Loop | null = null;
  private bpm: number = 120;
  private timeUnits: number = 16; // 16th notes
  private swing: number = 0;
  private doubleTime: boolean = false;
  private halfTime: boolean = false;
  private callback: SchedulerCallback | null = null;
  private isRunning: boolean = false;

  constructor() {}

  /**
   * Set the callback to be called on each step
   */
  setCallback(callback: SchedulerCallback): void {
    this.callback = callback;
  }

  /**
   * Update timing parameters
   */
  setTiming(params: Partial<TimingParams>): void {
    if (params.bpm !== undefined) {
      this.bpm = params.bpm;
      Tone.Transport.bpm.value = this.calculateEffectiveBPM();
    }

    if (params.timeUnits !== undefined) {
      this.timeUnits = params.timeUnits;
      this.updateLoopInterval();
    }

    if (params.swing !== undefined) {
      this.swing = params.swing;
      this.updateSwing();
    }
  }

  /**
   * Calculate effective BPM (accounting for double/half time)
   */
  private calculateEffectiveBPM(): number {
    let effectiveBPM = this.bpm;

    if (this.doubleTime) {
      effectiveBPM *= 2;
    }

    if (this.halfTime) {
      effectiveBPM /= 2;
    }

    return effectiveBPM;
  }

  /**
   * Convert time units to Tone.js notation
   */
  private getTimeNotation(): Tone.Unit.Time {
    // Map time units to Tone.js notation
    // e.g., 4 = quarter note, 8 = eighth note, 16 = sixteenth note
    return `${this.timeUnits}n` as Tone.Unit.Time;
  }

  /**
   * Update loop interval
   */
  private updateLoopInterval(): void {
    if (this.loop) {
      this.loop.interval = this.getTimeNotation();
    }
  }

  /**
   * Update swing amount
   */
  private updateSwing(): void {
    // Tone.js swing is 0-1, where 0.5 is straight and 1 is maximum swing
    // Our swing is 0-1, so we map it to Tone's range
    const toneSwing = 0.5 + (this.swing * 0.5);
    Tone.Transport.swing = toneSwing;
    Tone.Transport.swingSubdivision = `${this.timeUnits}n` as Tone.Unit.Subdivision;
  }

  /**
   * Set double time
   */
  setDoubleTime(enabled: boolean): void {
    this.doubleTime = enabled;
    if (this.doubleTime) {
      this.halfTime = false; // Can't be both
    }
    Tone.Transport.bpm.value = this.calculateEffectiveBPM();
  }

  /**
   * Set half time
   */
  setHalfTime(enabled: boolean): void {
    this.halfTime = enabled;
    if (this.halfTime) {
      this.doubleTime = false; // Can't be both
    }
    Tone.Transport.bpm.value = this.calculateEffectiveBPM();
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    await Tone.start();

    // Set initial BPM
    Tone.Transport.bpm.value = this.calculateEffectiveBPM();

    // Create loop
    this.loop = new Tone.Loop((time) => {
      if (this.callback) {
        // Schedule callback slightly ahead for better timing
        Tone.Draw.schedule(() => {
          this.callback!();
        }, time);
      }
    }, this.getTimeNotation());

    // Start loop and transport
    this.loop.start(0);
    Tone.Transport.start();

    this.isRunning = true;
    this.updateSwing();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.loop) {
      this.loop.stop();
      this.loop.dispose();
      this.loop = null;
    }

    Tone.Transport.stop();
    this.isRunning = false;
  }

  /**
   * Pause the scheduler
   */
  pause(): void {
    if (this.isRunning) {
      Tone.Transport.pause();
    }
  }

  /**
   * Resume the scheduler
   */
  resume(): void {
    if (this.isRunning) {
      Tone.Transport.start();
    }
  }

  /**
   * Get current BPM
   */
  getBPM(): number {
    return this.bpm;
  }

  /**
   * Get effective BPM (with double/half time)
   */
  getEffectiveBPM(): number {
    return this.calculateEffectiveBPM();
  }

  /**
   * Check if running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get current transport time
   */
  getCurrentTime(): number {
    return Tone.Transport.seconds;
  }

  /**
   * Reset transport to beginning
   */
  reset(): void {
    Tone.Transport.position = 0;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    this.callback = null;
  }
}

// ============================================================================
// GLOBAL SCHEDULER INSTANCE
// ============================================================================

let globalScheduler: Nova3Scheduler | null = null;

/**
 * Get or create global scheduler instance
 */
export function getGlobalScheduler(): Nova3Scheduler {
  if (!globalScheduler) {
    globalScheduler = new Nova3Scheduler();
  }
  return globalScheduler;
}

/**
 * Dispose global scheduler
 */
export function disposeGlobalScheduler(): void {
  if (globalScheduler) {
    globalScheduler.dispose();
    globalScheduler = null;
  }
}
