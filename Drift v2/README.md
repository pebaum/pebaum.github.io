# Drift - Generative Ambient Music

**by Peter Baumgartner**

Drift is a browser-based generative ambient music synthesizer that creates endless, evolving soundscapes using Web Audio API. No two listening sessions are ever the same.

---

## Overview

Drift orchestrates five virtual instruments—Cello, Celeste, Harp, Rhodes, and Vibraphone—each operating semi-independently with their own "weather" parameters, effects chains, and behavioral tendencies. The system continuously makes musical decisions: when to play, what notes to choose, how to voice chords, when to rest, and how to evolve over time.

The result is an organic, slowly-shifting ambient piece that can play indefinitely.

---

## Architecture

### Audio Engine

Built on Web Audio API with the following signal flow:

```
Oscillator → Gain (envelope) → Channel Effects → Master Gain → Output
                                    ↓
                              [Delay, Reverb, EQ, Pan, Vibrato, Tremolo]
```

Each of the 5 instruments has:
- Its own oscillator bank
- Independent ADSR envelope
- Dedicated effects chain
- Per-channel mixer

### Synthesis

- **Waveforms**: Simple oscillator types (sine, triangle) per instrument
- **Layering**: Optional detuned oscillator layering for richness
- **Envelopes**: Weather-reactive attack/decay/sustain/release curves

---

## The Five Instruments

| Instrument | Character | Waveform | Role |
|------------|-----------|----------|------|
| **Cello** | Warm, sustained | Triangle | Foundation, drones |
| **Celeste** | Bell-like, crystalline | Sine | Ornamental melodies |
| **Harp** | Plucked, resonant | Triangle | Arpeggios, sweeps |
| **Rhodes** | Electric piano warmth | Sine | Chordal pads |
| **Vibraphone** | Metallic shimmer | Sine | Accents, color |

Each instrument can operate in three modes:
- **CHORD (CHD)**: Plays chord voicings, sustained pads
- **MELODY (MEL)**: Plays single-note melodic lines
- **OFF**: Silent, resting

Approximately every 10 seconds, the system checks each instrument for a possible mode change; each check has a 30% chance to change that instrument’s mode (so actual mode changes per instrument typically occur every ~30–35 seconds on average).

---

## Musical System

### Chord Generation

Drift uses an extensive chord vocabulary:

**Basic Types:**
- Major/Minor triads and inversions
- 7th chords (maj7, min7, dom7, dim7, m7b5)
- Extended chords (9ths, 11ths, 13ths)
- Suspended chords (sus2, sus4)
- Added tone chords (add9, add11, 6th chords)
- Altered chords (7#9, 7b9, 7#11)
- Slash chords (chord/bass note)

**Voicing Selection:**
Voicings are chosen based on the "expansiveness" weather parameter:
- Low expansiveness → tight, clustered voicings
- High expansiveness → wide, orchestral spread

### Scales & Key

- **Root Note**: Selectable (C through B)
- **Quality**: Major or Minor
- **Key Modulation**: Automatic key changes every ~3 minutes
  - Related keys preferred (relative major/minor, dominants, subdominants)
  - Smooth voice-leading during transitions

### Melody Generation

When in melody mode, instruments generate patterns using:
- **Inverted Retrograde**: Melodies can be played backwards and/or pitch-inverted
- **Contour Following**: New notes chosen from nearby scale tones
- **Variable Speed**: Melody pace adjusts with weather

---

## Weather System

The "weather" is the heart of Drift's organic behavior. Each instrument has 12 independent weather parameters that slowly drift between 0 and 1:

| Parameter | Low Value | High Value |
|-----------|-----------|------------|
| **Presence** | Quiet, background | Prominent, forward |
| **Density** | Sparse notes | Busy, frequent |
| **Intimacy** | Distant, reverberant | Close, dry |
| **Breath** | Soft attack | Sharp attack |
| **Decay** | Short notes | Long, sustained |
| **Drift** | Stable pitch | Wobbly, detuned |
| **Depth** | Bass register | Treble register |
| **Suspension** | Tight timing | Rubato, flexible |
| **Solitude** | Responsive to others | Independent |
| **Memory** | Novel patterns | Repeating familiar |
| **Complexity** | Simple triads | Extended/altered chords |
| **Expansiveness** | Tight voicings | Wide orchestral spread |

### Weather Behavior

- Parameters drift independently toward random targets
- Momentum: 60% chance to continue current direction
- Extremes: 10% chance to jump to very high or low values
- Each parameter has its own timing (some change quickly, others slowly)

---

## Effects System

Each channel has a complete effects chain:

### Vibrato
- **Amount**: Wet/dry mix
- **Depth**: Pitch deviation range
- **Speed**: LFO rate

### Tremolo
- **Amount**: Wet/dry mix
- **Depth**: Volume modulation range
- **Speed**: LFO rate

### Delay
- **Time**: Echo delay length
- **Amount**: Wet/dry mix
- **Feedback**: Echo repetitions

### Reverb
- **Amount**: Wet/dry mix
- **Decay**: Reverb tail length
- **Tone**: Brightness/darkness

### EQ (3-band)
- **Low**: Bass adjustment (-12dB to +12dB)
- **Mid**: Midrange adjustment
- **High**: Treble adjustment

### Pan
- **Position**: Stereo placement (-1 to +1)

### Parameter Drift

Effect parameters continuously "ebb and flow":
- Grouped by type (modulation, delay, reverb, EQ, dynamics)
- Random drift speeds: subtle (30%), normal (60%), large (10%)
- Variable timing: 0.5s to 60s between changes
- Creates organic, breathing textures

---

## User Interface

### Header
- Title and author attribution
- Link to this documentation

### Composition Data (Ticket)
- **ROOT**: Current key center (clickable to change)
- **QUAL**: Major/Minor (clickable)
- **CHORD**: Current chord voicing (clickable)
- **TIME**: Elapsed playback time
- **ID**: Decorative barcode

### Control Row
- **[▶] INIT**: Initialize and start playback
- **[↻] RAND**: Randomize configuration
- **[■] STOP**: Stop playback
- **[↓] SAVE**: Save configuration to JSON
- **[↑] LOAD**: Load saved configuration
- **[●] REC**: Record audio output

### Instrument Streams

Five vertical columns showing real-time activity:

**Stream Header:**
- Instrument name
- Mode indicator (CHD/MEL/OFF)

**Activity Log:**
- Note events with pitch names
- Chord symbols
- Decision indicators

**Mixer Section:**
- Per-channel effect levels (visual bars)
- Pan position (center marker)
- EQ settings (3 markers)

**Weather Section:**
- 12 weather parameter bars per channel
- Hover for parameter descriptions

### System Log
Scrolling log showing:
- Note events
- Chord changes
- Effect modifications
- System decisions
- Weather shifts

---

## Visual Design

### Color Palette
- **Background**: Pure black (#000)
- **Primary text**: Cream (#e8e4d9)
- **Secondary text**: Warm grey (#a8a49c)
- **Muted elements**: Dark grey (#4a4540)
- **Borders**: Near-black (#1a1a1a)

### Animations
- All UI changes use smooth CSS transitions
- Transition durations are randomized (1-10 seconds)
- Creates fluid, organic visual movement
- No jarring or "notchy" updates

---

## Technical Details

### Browser Requirements
- Modern browser with Web Audio API support
- Chrome, Firefox, Safari, Edge recommended
- JavaScript enabled

### Performance
- Oscillators created/destroyed per note
- Minimal DOM updates
- Lazy audio context initialization

### State
- All parameters seeded randomly on load
- Save/Load feature for configuration persistence

---

## Controls Summary

| Action | Result |
|--------|--------|
| Click **[▶] INIT** | Start generative playback |
| Click **[■] STOP** | Stop playback |
| Click **[↻] RAND** | Randomize configuration |
| Click **[↓] SAVE** | Save config to JSON file |
| Click **[↑] LOAD** | Load saved config |
| Click **[●] REC** | Record audio output |
| Change **ROOT** | Modulate to new key |
| Change **QUAL** | Switch Major/Minor |
| Change **CHORD** | Force specific chord |

---

## Philosophy

Drift is designed to be:

- **Ambient**: Background-friendly, non-intrusive
- **Generative**: Always creating, never looping
- **Organic**: Weather-driven variation, not rigid sequences
- **Visual**: UI reflects the music's internal state
- **Meditative**: Slow evolution, no sudden changes

The goal is music that feels alive—breathing, drifting, evolving—like watching clouds or listening to distant wind chimes.

---

## Credits

**Drift** - Generative Ambient Music  
Created by Peter Baumgartner  
Built with Web Audio API  
December 2025

---

*Let it play. Let it drift.*
