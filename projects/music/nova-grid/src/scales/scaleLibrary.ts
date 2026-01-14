/**
 * Nova3 Web - Scale Library
 * Manages musical scales for note generation
 */

import { Scale } from '../engine/types';

// ============================================================================
// SCALE DEFINITIONS
// ============================================================================

/**
 * Built-in scale library
 * Each scale is an array of MIDI note offsets from the root
 * Maximum 17 notes per scale (Nova3 standard)
 */

export const SCALE_LIBRARY: Record<string, Scale> = {
  // ====================
  // PENTATONIC SCALES (5 notes)
  // ====================
  'major-pentatonic': {
    id: 'major-pentatonic',
    name: 'Major Pentatonic',
    notes: [0, 2, 4, 7, 9],
  },

  'minor-pentatonic': {
    id: 'minor-pentatonic',
    name: 'Minor Pentatonic',
    notes: [0, 3, 5, 7, 10],
  },

  'egyptian': {
    id: 'egyptian',
    name: 'Egyptian',
    notes: [0, 2, 5, 7, 10],
  },

  'hirajoshi': {
    id: 'hirajoshi',
    name: 'Hirajoshi',
    notes: [0, 2, 3, 7, 8],
  },

  'in-sen': {
    id: 'in-sen',
    name: 'In Sen',
    notes: [0, 1, 5, 7, 10],
  },

  'iwato': {
    id: 'iwato',
    name: 'Iwato',
    notes: [0, 1, 5, 6, 10],
  },

  'kumoi': {
    id: 'kumoi',
    name: 'Kumoi',
    notes: [0, 2, 3, 7, 9],
  },

  'pelog': {
    id: 'pelog',
    name: 'Pelog',
    notes: [0, 1, 3, 7, 8],
  },

  // ====================
  // HEXATONIC SCALES (6 notes)
  // ====================
  'whole-tone': {
    id: 'whole-tone',
    name: 'Whole Tone',
    notes: [0, 2, 4, 6, 8, 10],
  },

  'augmented': {
    id: 'augmented',
    name: 'Augmented',
    notes: [0, 3, 4, 7, 8, 11],
  },

  'prometheus': {
    id: 'prometheus',
    name: 'Prometheus',
    notes: [0, 2, 4, 6, 9, 10],
  },

  'tritone': {
    id: 'tritone',
    name: 'Tritone',
    notes: [0, 1, 4, 6, 7, 10],
  },

  'blues': {
    id: 'blues',
    name: 'Blues',
    notes: [0, 3, 5, 6, 7, 10],
  },

  // ====================
  // HEPTATONIC SCALES (7 notes)
  // ====================
  'major': {
    id: 'major',
    name: 'Major (Ionian)',
    notes: [0, 2, 4, 5, 7, 9, 11],
  },

  'minor': {
    id: 'minor',
    name: 'Natural Minor (Aeolian)',
    notes: [0, 2, 3, 5, 7, 8, 10],
  },

  'dorian': {
    id: 'dorian',
    name: 'Dorian',
    notes: [0, 2, 3, 5, 7, 9, 10],
  },

  'phrygian': {
    id: 'phrygian',
    name: 'Phrygian',
    notes: [0, 1, 3, 5, 7, 8, 10],
  },

  'lydian': {
    id: 'lydian',
    name: 'Lydian',
    notes: [0, 2, 4, 6, 7, 9, 11],
  },

  'mixolydian': {
    id: 'mixolydian',
    name: 'Mixolydian',
    notes: [0, 2, 4, 5, 7, 9, 10],
  },

  'locrian': {
    id: 'locrian',
    name: 'Locrian',
    notes: [0, 1, 3, 5, 6, 8, 10],
  },

  'harmonic-minor': {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    notes: [0, 2, 3, 5, 7, 8, 11],
  },

  'melodic-minor': {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    notes: [0, 2, 3, 5, 7, 9, 11],
  },

  'gypsy': {
    id: 'gypsy',
    name: 'Gypsy',
    notes: [0, 1, 4, 5, 7, 8, 11],
  },

  'spanish': {
    id: 'spanish',
    name: 'Spanish (Phrygian Dominant)',
    notes: [0, 1, 4, 5, 7, 8, 10],
  },

  'jewish': {
    id: 'jewish',
    name: 'Jewish (Ahava Raba)',
    notes: [0, 1, 4, 5, 7, 8, 10],
  },

  'arabic': {
    id: 'arabic',
    name: 'Arabic',
    notes: [0, 1, 4, 5, 7, 8, 11],
  },

  'persian': {
    id: 'persian',
    name: 'Persian',
    notes: [0, 1, 4, 5, 6, 8, 11],
  },

  'byzantine': {
    id: 'byzantine',
    name: 'Byzantine',
    notes: [0, 1, 4, 5, 7, 8, 11],
  },

  'oriental': {
    id: 'oriental',
    name: 'Oriental',
    notes: [0, 1, 4, 5, 6, 9, 10],
  },

  'romanian': {
    id: 'romanian',
    name: 'Romanian',
    notes: [0, 2, 3, 6, 7, 9, 10],
  },

  'hungarian-minor': {
    id: 'hungarian-minor',
    name: 'Hungarian Minor',
    notes: [0, 2, 3, 6, 7, 8, 11],
  },

  'neapolitan-minor': {
    id: 'neapolitan-minor',
    name: 'Neapolitan Minor',
    notes: [0, 1, 3, 5, 7, 8, 11],
  },

  'neapolitan-major': {
    id: 'neapolitan-major',
    name: 'Neapolitan Major',
    notes: [0, 1, 3, 5, 7, 9, 11],
  },

  'enigmatic': {
    id: 'enigmatic',
    name: 'Enigmatic',
    notes: [0, 1, 4, 6, 8, 10, 11],
  },

  // ====================
  // OCTATONIC SCALES (8 notes)
  // ====================
  'diminished': {
    id: 'diminished',
    name: 'Diminished (Half-Whole)',
    notes: [0, 1, 3, 4, 6, 7, 9, 10],
  },

  'dominant-diminished': {
    id: 'dominant-diminished',
    name: 'Dominant Diminished (Whole-Half)',
    notes: [0, 2, 3, 5, 6, 8, 9, 11],
  },

  'bebop-major': {
    id: 'bebop-major',
    name: 'Bebop Major',
    notes: [0, 2, 4, 5, 7, 8, 9, 11],
  },

  'bebop-minor': {
    id: 'bebop-minor',
    name: 'Bebop Minor',
    notes: [0, 2, 3, 5, 7, 8, 9, 10],
  },

  'bebop-dominant': {
    id: 'bebop-dominant',
    name: 'Bebop Dominant',
    notes: [0, 2, 4, 5, 7, 9, 10, 11],
  },

  // ====================
  // CHROMATIC (12 notes)
  // ====================
  'chromatic': {
    id: 'chromatic',
    name: 'Chromatic',
    notes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },

  // ====================
  // MICROTONAL / EXPERIMENTAL (using quarter tones represented as decimals)
  // Note: These will be rounded to nearest MIDI note
  // ====================
  'slendro': {
    id: 'slendro',
    name: 'Slendro',
    notes: [0, 2, 5, 7, 9],
  },

  'mavila': {
    id: 'mavila',
    name: 'Mavila',
    notes: [0, 2, 4, 7, 9],
  },

  // ====================
  // CHORDS (for harmonic sequences)
  // ====================
  'major-triad': {
    id: 'major-triad',
    name: 'Major Triad',
    notes: [0, 4, 7],
  },

  'minor-triad': {
    id: 'minor-triad',
    name: 'Minor Triad',
    notes: [0, 3, 7],
  },

  'diminished-triad': {
    id: 'diminished-triad',
    name: 'Diminished Triad',
    notes: [0, 3, 6],
  },

  'augmented-triad': {
    id: 'augmented-triad',
    name: 'Augmented Triad',
    notes: [0, 4, 8],
  },

  'major-seventh': {
    id: 'major-seventh',
    name: 'Major Seventh',
    notes: [0, 4, 7, 11],
  },

  'minor-seventh': {
    id: 'minor-seventh',
    name: 'Minor Seventh',
    notes: [0, 3, 7, 10],
  },

  'dominant-seventh': {
    id: 'dominant-seventh',
    name: 'Dominant Seventh',
    notes: [0, 4, 7, 10],
  },

  'diminished-seventh': {
    id: 'diminished-seventh',
    name: 'Diminished Seventh',
    notes: [0, 3, 6, 9],
  },
};

// ============================================================================
// SCALE LIBRARY UTILITIES
// ============================================================================

/**
 * Get all scale IDs
 */
export function getAllScaleIds(): string[] {
  return Object.keys(SCALE_LIBRARY);
}

/**
 * Get scale by ID
 */
export function getScale(id: string): Scale | undefined {
  return SCALE_LIBRARY[id];
}

/**
 * Get all scales
 */
export function getAllScales(): Scale[] {
  return Object.values(SCALE_LIBRARY);
}

/**
 * Get scale notes as Map (for engine)
 */
export function getScaleLibraryAsMap(): Map<string, number[]> {
  const map = new Map<string, number[]>();

  for (const [id, scale] of Object.entries(SCALE_LIBRARY)) {
    map.set(id, scale.notes);
  }

  return map;
}

/**
 * Get MIDI note from scale at position
 */
export function getScaleNote(
  scale: Scale,
  rootPitch: number,
  index: number,
  rotation: number = 0,
  direction: 'forward' | 'reverse' = 'forward'
): number {
  if (scale.notes.length === 0) {
    return rootPitch;
  }

  // Wrap index to scale length
  const wrappedIndex = ((index % scale.notes.length) + scale.notes.length) % scale.notes.length;

  // Apply rotation
  const rotatedIndex = (wrappedIndex + rotation) % scale.notes.length;

  // Apply direction
  const finalIndex = direction === 'forward'
    ? rotatedIndex
    : scale.notes.length - 1 - rotatedIndex;

  return rootPitch + scale.notes[finalIndex];
}

/**
 * Parse scale from text format (Nova3 .txt files)
 * Format: one MIDI note number per line, comments start with ;
 */
export function parseScaleFile(content: string, id: string, name?: string): Scale {
  const lines = content.split('\n');
  const notes: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (trimmed === '' || trimmed.startsWith(';')) {
      continue;
    }

    const noteValue = parseInt(trimmed, 10);
    if (!isNaN(noteValue)) {
      notes.push(noteValue);
    }
  }

  // Limit to 17 notes (Nova3 standard)
  const limitedNotes = notes.slice(0, 17);

  return {
    id,
    name: name || id,
    notes: limitedNotes,
  };
}

/**
 * Convert scale to text format (for export)
 */
export function scaleToText(scale: Scale): string {
  const lines = [
    `; ${scale.name}`,
    `; ${scale.notes.length} notes`,
    '',
  ];

  for (const note of scale.notes) {
    lines.push(note.toString());
  }

  return lines.join('\n');
}
