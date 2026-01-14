/**
 * Nova3 Web - Audio Synthesizer
 * Web Audio-based synthesis using Tone.js
 */

import * as Tone from 'tone';
import { NoteEvent } from '../engine/types';

// ============================================================================
// SYNTH TYPES
// ============================================================================

export type SynthType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'fm' | 'am';

export interface SynthParams {
  type: SynthType;
  attack: number;      // Attack time in seconds
  decay: number;       // Decay time in seconds
  sustain: number;     // Sustain level (0-1)
  release: number;     // Release time in seconds
  filterFreq: number;  // Filter cutoff frequency
  filterRes: number;   // Filter resonance
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  reverbMix: number;   // Reverb wet/dry (0-1)
  delayMix: number;    // Delay wet/dry (0-1)
  delayTime: number;   // Delay time in seconds
  delayFeedback: number; // Delay feedback (0-1)
}

// ============================================================================
// NOVA3 SYNTH ENGINE
// ============================================================================

export class Nova3Synth {
  private synth: Tone.PolySynth | null = null;
  private filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private reverbWet: Tone.CrossFade | null = null;
  private delayWet: Tone.CrossFade | null = null;
  private master: Tone.Volume | null = null;

  private params: SynthParams;
  private initialized: boolean = false;

  constructor() {
    this.params = this.getDefaultParams();
  }

  /**
   * Initialize the synthesizer
   * Must be called after user interaction (browser audio policy)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await Tone.start();

    // Create synth based on type
    this.createSynth();

    // Create effects chain
    this.filter = new Tone.Filter({
      frequency: this.params.filterFreq,
      type: this.params.filterType,
      rolloff: -24,
      Q: this.params.filterRes,
    });

    this.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: this.params.reverbMix,
    });

    this.delay = new Tone.FeedbackDelay({
      delayTime: this.params.delayTime,
      feedback: this.params.delayFeedback,
      wet: this.params.delayMix,
    });

    this.master = new Tone.Volume(0);

    // Connect effects chain
    if (this.synth && this.filter && this.reverb && this.delay && this.master) {
      this.synth.connect(this.filter);
      this.filter.connect(this.reverb);
      this.reverb.connect(this.delay);
      this.delay.connect(this.master);
      this.master.toDestination();
    }

    await this.reverb.generate();

    this.initialized = true;
  }

  /**
   * Create the polyphonic synthesizer
   */
  private createSynth(): void {
    const envelope = {
      attack: this.params.attack,
      decay: this.params.decay,
      sustain: this.params.sustain,
      release: this.params.release,
    };

    switch (this.params.type) {
      case 'sine':
      case 'square':
      case 'sawtooth':
      case 'triangle':
        this.synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: this.params.type },
          envelope,
        });
        break;

      case 'fm':
        this.synth = new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: 3,
          modulationIndex: 10,
          envelope,
          modulation: { type: 'square' },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0,
            release: 0.2,
          },
        });
        break;

      case 'am':
        this.synth = new Tone.PolySynth(Tone.AMSynth, {
          harmonicity: 2,
          envelope,
          modulation: { type: 'sine' },
          modulationEnvelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0,
            release: 0.3,
          },
        });
        break;
    }

    this.synth?.set({ volume: -6 }); // Slight volume reduction for headroom
  }

  /**
   * Get default synth parameters
   */
  private getDefaultParams(): SynthParams {
    return {
      type: 'sine',
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.5,
      filterFreq: 2000,
      filterRes: 1,
      filterType: 'lowpass',
      reverbMix: 0.2,
      delayMix: 0.1,
      delayTime: 0.25,
      delayFeedback: 0.3,
    };
  }

  /**
   * Update synth parameters
   */
  setParams(params: Partial<SynthParams>): void {
    this.params = { ...this.params, ...params };

    if (!this.initialized) {
      return;
    }

    // Update envelope
    if (this.synth) {
      const envelope = {
        attack: this.params.attack,
        decay: this.params.decay,
        sustain: this.params.sustain,
        release: this.params.release,
      };
      this.synth.set({ envelope });
    }

    // Update filter
    if (this.filter) {
      this.filter.frequency.value = this.params.filterFreq;
      this.filter.Q.value = this.params.filterRes;
      this.filter.type = this.params.filterType;
    }

    // Update reverb
    if (this.reverb) {
      this.reverb.wet.value = this.params.reverbMix;
    }

    // Update delay
    if (this.delay) {
      this.delay.delayTime.value = this.params.delayTime;
      this.delay.feedback.value = this.params.delayFeedback;
      this.delay.wet.value = this.params.delayMix;
    }

    // If synth type changed, recreate synth
    if (params.type && params.type !== this.synth?.name) {
      this.recreateSynth();
    }
  }

  /**
   * Recreate synth (when type changes)
   */
  private async recreateSynth(): Promise<void> {
    // Disconnect old synth
    if (this.synth && this.filter) {
      this.synth.disconnect(this.filter);
      this.synth.dispose();
    }

    // Create new synth
    this.createSynth();

    // Reconnect
    if (this.synth && this.filter) {
      this.synth.connect(this.filter);
    }
  }

  /**
   * Get current parameters
   */
  getParams(): SynthParams {
    return { ...this.params };
  }

  /**
   * Play a note event
   */
  playNote(event: NoteEvent): void {
    if (!this.initialized || !this.synth) {
      console.warn('Synth not initialized. Call initialize() first.');
      return;
    }

    const note = Tone.Frequency(event.midiNote, 'midi').toNote();
    const velocity = event.velocity / 127; // Normalize to 0-1
    const duration = event.duration / 1000; // Convert ms to seconds

    this.synth.triggerAttackRelease(note, duration, undefined, velocity);
  }

  /**
   * Play multiple notes
   */
  playNotes(events: NoteEvent[]): void {
    for (const event of events) {
      this.playNote(event);
    }
  }

  /**
   * Stop all notes immediately
   */
  stopAll(): void {
    if (this.synth) {
      this.synth.releaseAll();
    }
  }

  /**
   * Set master volume (in decibels)
   */
  setVolume(db: number): void {
    if (this.master) {
      this.master.volume.value = db;
    }
  }

  /**
   * Mute/unmute
   */
  setMute(muted: boolean): void {
    if (this.master) {
      this.master.mute = muted;
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.synth?.dispose();
    this.filter?.dispose();
    this.reverb?.dispose();
    this.delay?.dispose();
    this.master?.dispose();

    this.synth = null;
    this.filter = null;
    this.reverb = null;
    this.delay = null;
    this.master = null;
    this.initialized = false;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// ============================================================================
// GLOBAL SYNTH INSTANCE
// ============================================================================

let globalSynth: Nova3Synth | null = null;

/**
 * Get or create global synth instance
 */
export function getGlobalSynth(): Nova3Synth {
  if (!globalSynth) {
    globalSynth = new Nova3Synth();
  }
  return globalSynth;
}

/**
 * Initialize global synth
 */
export async function initializeGlobalSynth(): Promise<void> {
  const synth = getGlobalSynth();
  await synth.initialize();
}

/**
 * Dispose global synth
 */
export function disposeGlobalSynth(): void {
  if (globalSynth) {
    globalSynth.dispose();
    globalSynth = null;
  }
}
