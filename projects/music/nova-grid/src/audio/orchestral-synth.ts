/**
 * Nova Grid - Orchestral Synthesizer
 * Wave Notation 2 inspired instruments: Harp, Piano, Flute, Vibraphone
 */

import * as Tone from 'tone';
import { NoteEvent, Wall } from '../engine/types';

// ============================================================================
// INSTRUMENT TYPES
// ============================================================================

export type InstrumentType = 'harp' | 'piano' | 'flute' | 'vibraphone';

// ============================================================================
// ORCHESTRAL ENGINE
// ============================================================================

export class OrchestralSynth {
  // Individual instruments
  private harp: Tone.PolySynth | null = null;
  private piano: Tone.PolySynth | null = null;
  private flute: Tone.MonoSynth | null = null;
  private vibraphone: Tone.PolySynth | null = null;

  // Shared effects
  private reverb: Tone.Reverb | null = null;
  private master: Tone.Volume | null = null;

  private initialized: boolean = false;

  constructor() {}

  /**
   * Initialize all instruments
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await Tone.start();

    // Create Harp - bright, plucked, shimmering
    this.harp = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.001,
        decay: 1.5,
        sustain: 0,
        release: 2.5,
      },
      volume: -8,
    });

    // Create Piano - bell-like, resonant
    this.piano = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.2,
        release: 3.0,
      },
      volume: -10,
    });

    // Create Flute - breathy, pure, melodic
    this.flute = new Tone.MonoSynth({
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.8,
        release: 1.5,
      },
      filterEnvelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.6,
        release: 1.0,
        baseFrequency: 800,
        octaves: 2,
      },
      volume: -12,
    });

    // Create Vibraphone - metallic, shimmering, percussive
    this.vibraphone = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.001,
        decay: 2.0,
        sustain: 0.1,
        release: 3.0,
      },
      modulation: {
        type: 'sine',
      },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.2,
        release: 1.5,
      },
      volume: -6,
    });

    // Create deep reverb (essential for Wave Notation 2 aesthetic)
    this.reverb = new Tone.Reverb({
      decay: 8.0,  // Very long reverb tail
      preDelay: 0.01,
    });

    this.master = new Tone.Volume(-3);

    // Connect everything through reverb
    if (this.harp && this.piano && this.flute && this.vibraphone && this.reverb && this.master) {
      this.harp.connect(this.reverb);
      this.piano.connect(this.reverb);
      this.flute.connect(this.reverb);
      this.vibraphone.connect(this.reverb);

      this.reverb.connect(this.master);
      this.master.toDestination();
    }

    await this.reverb.generate();

    this.initialized = true;
  }

  /**
   * Get instrument for specific wall
   * North = Harp (high, shimmering)
   * East = Vibraphone (metallic, percussive)
   * South = Piano (harmonic foundation)
   * West = Flute (melodic voice)
   */
  private getInstrumentForWall(wall: Wall): Tone.PolySynth | Tone.MonoSynth | null {
    switch (wall) {
      case Wall.NORTH:
        return this.harp;
      case Wall.EAST:
        return this.vibraphone;
      case Wall.SOUTH:
        return this.piano;
      case Wall.WEST:
        return this.flute;
      default:
        return this.piano;
    }
  }

  /**
   * Play a note event with the appropriate instrument
   */
  playNote(event: NoteEvent): void {
    if (!this.initialized) {
      console.warn('Orchestral synth not initialized');
      return;
    }

    const instrument = this.getInstrumentForWall(event.wall);
    if (!instrument) return;

    const note = Tone.Frequency(event.midiNote, 'midi').toNote();
    const velocity = event.velocity / 127;
    const duration = event.duration / 1000; // Convert ms to seconds

    // Longer durations for more sustained, ambient sound
    const extendedDuration = Math.max(duration, 2.0);

    if (instrument instanceof Tone.MonoSynth) {
      // For flute (MonoSynth) - trigger attack and release separately
      instrument.triggerAttackRelease(note, extendedDuration, undefined, velocity);
    } else {
      // For polyphonic instruments
      instrument.triggerAttackRelease(note, extendedDuration, undefined, velocity);
    }
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
    if (this.harp) this.harp.releaseAll();
    if (this.piano) this.piano.releaseAll();
    if (this.vibraphone) this.vibraphone.releaseAll();
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
   * Get instrument name for wall (for UI display)
   */
  static getInstrumentName(wall: Wall): string {
    switch (wall) {
      case Wall.NORTH:
        return 'Harp';
      case Wall.EAST:
        return 'Vibraphone';
      case Wall.SOUTH:
        return 'Piano';
      case Wall.WEST:
        return 'Flute';
      default:
        return 'Piano';
    }
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.harp?.dispose();
    this.piano?.dispose();
    this.flute?.dispose();
    this.vibraphone?.dispose();
    this.reverb?.dispose();
    this.master?.dispose();

    this.harp = null;
    this.piano = null;
    this.flute = null;
    this.vibraphone = null;
    this.reverb = null;
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
// GLOBAL ORCHESTRAL SYNTH INSTANCE
// ============================================================================

let globalOrchestralSynth: OrchestralSynth | null = null;

/**
 * Get or create global orchestral synth instance
 */
export function getGlobalOrchestralSynth(): OrchestralSynth {
  if (!globalOrchestralSynth) {
    globalOrchestralSynth = new OrchestralSynth();
  }
  return globalOrchestralSynth;
}

/**
 * Initialize global orchestral synth
 */
export async function initializeGlobalOrchestralSynth(): Promise<void> {
  const synth = getGlobalOrchestralSynth();
  await synth.initialize();
}

/**
 * Dispose global orchestral synth
 */
export function disposeGlobalOrchestralSynth(): void {
  if (globalOrchestralSynth) {
    globalOrchestralSynth.dispose();
    globalOrchestralSynth = null;
  }
}
