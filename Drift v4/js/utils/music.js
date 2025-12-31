/**
 * Music utilities for Drift
 * Note/frequency conversions, intervals, chord building
 */

const DriftMusic = {
  // A4 = 440Hz standard (can be changed for microtonal)
  A4: 440,
  
  // Note names
  noteNames: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  
  /**
   * Convert MIDI note number to frequency
   * @param {number} midi - MIDI note (0-127, 60 = middle C)
   * @param {number} detuneCents - Optional detuning in cents
   */
  midiToFreq(midi, detuneCents = 0) {
    const detuneRatio = Math.pow(2, detuneCents / 1200);
    return this.A4 * Math.pow(2, (midi - 69) / 12) * detuneRatio;
  },
  
  /**
   * Convert frequency to MIDI note
   */
  freqToMidi(freq) {
    return 69 + 12 * Math.log2(freq / this.A4);
  },
  
  /**
   * Parse note string to MIDI number
   * @param {string} note - e.g., "C4", "F#3", "Bb5"
   */
  noteToMidi(note) {
    const match = note.match(/^([A-G])([#b]?)(-?\d+)$/i);
    if (!match) return null;
    
    let noteName = match[1].toUpperCase();
    const accidental = match[2];
    const octave = parseInt(match[3]);
    
    let noteIndex = this.noteNames.indexOf(noteName);
    if (noteIndex === -1) return null;
    
    if (accidental === '#') noteIndex++;
    if (accidental === 'b') noteIndex--;
    
    return (octave + 1) * 12 + noteIndex;
  },
  
  /**
   * Convert MIDI to note string
   */
  midiToNote(midi) {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return this.noteNames[noteIndex] + octave;
  },
  
  /**
   * Get frequency from note string
   */
  noteToFreq(note, detuneCents = 0) {
    const midi = this.noteToMidi(note);
    return midi !== null ? this.midiToFreq(midi, detuneCents) : null;
  },
  
  /**
   * Transpose a MIDI note by semitones
   */
  transpose(midi, semitones) {
    return midi + semitones;
  },
  
  /**
   * Get notes in a scale
   * @param {number} root - Root MIDI note
   * @param {string} scaleName - Scale name from DriftScales
   * @param {number} octaves - Number of octaves
   */
  getScaleNotes(root, scaleName, octaves = 1) {
    const intervals = DriftScales.scales[scaleName];
    if (!intervals) return [];
    
    const notes = [];
    for (let oct = 0; oct < octaves; oct++) {
      for (const interval of intervals) {
        notes.push(root + interval + (oct * 12));
      }
    }
    notes.push(root + octaves * 12); // Add final octave
    return notes;
  },
  
  /**
   * Get a chord from a scale degree
   * @param {number} root - Root MIDI note
   * @param {string} scaleName - Scale name
   * @param {number} degree - Scale degree (1-7)
   * @param {string} voicing - Voicing type
   */
  getChord(root, scaleName, degree, voicing = 'triad') {
    const scaleNotes = this.getScaleNotes(root, scaleName, 2);
    const degreeIndex = degree - 1;
    
    switch (voicing) {
      case 'triad':
        return [
          scaleNotes[degreeIndex],
          scaleNotes[degreeIndex + 2],
          scaleNotes[degreeIndex + 4]
        ];
      case 'seventh':
        return [
          scaleNotes[degreeIndex],
          scaleNotes[degreeIndex + 2],
          scaleNotes[degreeIndex + 4],
          scaleNotes[degreeIndex + 6]
        ];
      case 'fifth':
        return [
          scaleNotes[degreeIndex],
          scaleNotes[degreeIndex] + 7 // Perfect fifth
        ];
      case 'quartal':
        return [
          scaleNotes[degreeIndex],
          scaleNotes[degreeIndex] + 5,
          scaleNotes[degreeIndex] + 10
        ];
      case 'add9':
        return [
          scaleNotes[degreeIndex],
          scaleNotes[degreeIndex + 2],
          scaleNotes[degreeIndex + 4],
          scaleNotes[degreeIndex] + 14 // 9th
        ];
      default:
        return [scaleNotes[degreeIndex]];
    }
  },
  
  /**
   * Spread chord notes across octaves (open voicing)
   */
  openVoicing(notes, baseOctave = 3) {
    const baseMidi = baseOctave * 12 + 12; // C of that octave
    const result = [];
    
    notes.forEach((note, i) => {
      // Normalize to within octave
      const normalized = ((note % 12) + 12) % 12;
      // Spread across octaves
      const octaveOffset = Math.floor(i / 2) * 12;
      result.push(baseMidi + normalized + octaveOffset);
    });
    
    return result.sort((a, b) => a - b);
  },
  
  /**
   * Generate a melodic contour
   * @param {number} startNote - Starting MIDI note
   * @param {string} contourType - Type of melodic shape
   * @param {number} length - Number of notes
   * @param {Array} scaleNotes - Available scale notes
   */
  generateContour(startNote, contourType, length, scaleNotes) {
    const contours = {
      'rise-fall': () => {
        const mid = Math.floor(length / 2);
        return Array(length).fill(0).map((_, i) => {
          if (i < mid) return Math.floor(i * 2 / mid);
          return Math.floor((length - i - 1) * 2 / (length - mid));
        });
      },
      'fall': () => Array(length).fill(0).map((_, i) => -Math.floor(i * 3 / length)),
      'arch': () => {
        const mid = Math.floor(length / 2);
        return Array(length).fill(0).map((_, i) => {
          const dist = Math.abs(i - mid);
          return Math.floor((mid - dist) * 2 / mid);
        });
      },
      'wave': () => Array(length).fill(0).map((_, i) => Math.round(Math.sin(i * Math.PI / 2))),
      'leap-fall': () => [3, ...Array(length - 1).fill(0).map((_, i) => 2 - Math.floor(i * 3 / (length - 1)))]
    };
    
    const contour = contours[contourType] ? contours[contourType]() : contours['rise-fall']();
    
    // Find starting position in scale
    let scaleIndex = scaleNotes.findIndex(n => n >= startNote);
    if (scaleIndex === -1) scaleIndex = Math.floor(scaleNotes.length / 2);
    
    // Build melody following contour
    const melody = [scaleNotes[scaleIndex]];
    let currentIndex = scaleIndex;
    
    for (let i = 1; i < length; i++) {
      const step = contour[i] - contour[i - 1];
      currentIndex = Math.max(0, Math.min(scaleNotes.length - 1, currentIndex + step));
      melody.push(scaleNotes[currentIndex]);
    }
    
    return melody;
  },
  
  /**
   * Quantize a frequency to the nearest scale note
   */
  quantizeToScale(freq, root, scaleName) {
    const midi = this.freqToMidi(freq);
    const scaleNotes = this.getScaleNotes(root - 24, scaleName, 6); // Wide range
    
    let closest = scaleNotes[0];
    let minDist = Math.abs(midi - closest);
    
    for (const note of scaleNotes) {
      const dist = Math.abs(midi - note);
      if (dist < minDist) {
        minDist = dist;
        closest = note;
      }
    }
    
    return this.midiToFreq(closest);
  },
  
  /**
   * Get rhythmic duration in seconds
   * @param {string} duration - Duration string (e.g., '4n', '8n', '2n')
   * @param {number} bpm - Beats per minute
   */
  durationToSeconds(duration, bpm = 60) {
    const beatDuration = 60 / bpm;
    
    const durations = {
      '1n': beatDuration * 4,
      '2n': beatDuration * 2,
      '4n': beatDuration,
      '8n': beatDuration / 2,
      '16n': beatDuration / 4,
      '2t': beatDuration * 4 / 3,
      '4t': beatDuration * 2 / 3,
      '8t': beatDuration / 3
    };
    
    return durations[duration] || beatDuration;
  }
};

// Make available globally
window.DriftMusic = DriftMusic;
