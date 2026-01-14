# EMERGENCE — Generative Ambient Installation

A generative music system where overlapping loops of different lengths create emergent patterns and harmonies.

## CONCEPT

Inspired by **Brian Eno's** Music for Airports, **Górecki's** Symphony of Sorrowful Songs, **Disasterpeace's** Hyper Light Drifter, and **Steve Reich's** phasing techniques.

Multiple independent voices loop at different periods (6-30 seconds). As they drift in and out of phase with each other, unexpected harmonies and rhythmic patterns emerge. Every session generates a completely unique composition.

## MUSICAL ARCHITECTURE

### Voice Types

**SWELLS** (2-3 voices)
- Long pad notes or chords
- 15-30 second periods
- Low and mid registers
- Deep, contemplative foundation
- Think Górecki's sorrowful strings or Eno's ambient textures

**OSTINATOS** (3-4 voices)
- Repeating 2-4 note patterns
- 6-12 second periods
- Mid and high registers
- Hypnotic, pulsing rhythms
- Creates polyrhythmic layers as they phase against each other

**MOTIFS** (2-3 voices)
- Melodic fragments of 3-6 notes
- 8-16 second periods
- Mid and high registers
- Lyrical, expressive phrases
- Disasterpeace-style melodic storytelling

### Emergence Through Phasing

Each voice loops independently. When a 7-second loop plays against an 11-second loop, they create a pattern that only repeats every 77 seconds. With 7-9 voices of different lengths, the full pattern might take hours (or never) to repeat.

This creates:
- **Harmonic surprises** - notes that weren't "composed" to align suddenly do
- **Rhythmic complexity** - polyrhythms emerge from simple patterns
- **Evolving density** - sometimes sparse, sometimes rich
- **Unpredictability** - you can't anticipate what comes next

### Sound Design

- **Multi-oscillator synthesis** - 2 detuned oscillators per note for analog warmth
- **Modal scales** - Dorian, Phrygian, Lydian, Hirajoshi, In Sen, Pentatonic
- **Deep reverb** - 6-second decay for spacious atmosphere
- **Prominent delay** - 0.5s (half note) with feedback
- **Warm filtering** - Lowpass filters that open based on register
- **Dynamic compression** - Cohesive glue across all voices
- **Humanization** - Slight timing and pitch variance per note

## VISUAL DESIGN

**Brutalist Terminal Aesthetic**
- Green monospace text on black (classic terminal)
- ASCII bars showing loop position
- Each voice type has its own character:
  - `===` Swells
  - `---` Ostinatos
  - `···` Motifs
- Minimal, functional, honest
- No decorative elements
- Information-dense but readable

## TECHNICAL

- **Web Audio API** real-time synthesis
- **Pure JavaScript** - no dependencies
- **Generative** - fresh composition each session
- **Non-repeating** - emergent patterns from phase relationships
- **Background playback** - continues when tab is not active
- **7-9 concurrent voices** - carefully balanced for clarity

## INTERACTION

- **Begin** - Click to start
- **Pause/Resume** - Space or button
- **Restart** - R key or button (generates new composition)

## PHILOSOPHY

This piece explores:
- **Emergence** - Complex patterns from simple rules
- **Phase relationships** - Steve Reich's minimalist techniques
- **Contemplation** - Slow, patient listening
- **Impermanence** - Every session is unique and unrepeatable
- **Warmth** - Analog-inspired synthesis
- **Honesty** - Brutalist aesthetic shows the system transparently

Unlike traditional composition where every note is predetermined, this system creates a framework where music emerges from the interaction of independent loops. You're not hearing a recording—you're witnessing a live generative process.

The terminal interface makes the system visible: you can see each loop's position, watch them drift in and out of phase, understand why certain moments sound the way they do. It's both music and a visualization of its own creation.

## INSPIRATION

**Brian Eno** - Generative systems, Music for Airports, ambient philosophy
**Henryk Górecki** - Symphony No. 3 "Sorrowful Songs" - sustained melancholy
**Disasterpeace** - Hyper Light Drifter OST - emotional pads, warm synthesis
**Steve Reich** - Music for 18 Musicians, phasing techniques
**Wave Notation** - Graphical representation of temporal structures
**Terminal aesthetics** - Unix, brutalism, honest interfaces

---

*EMERGENCE*
*January 2026*
*A living musical system*
