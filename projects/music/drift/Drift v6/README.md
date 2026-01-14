# DRIFT v6 — STELLAR DEPARTURE

Explorers leave a home star, traveling to distant points of light. Each star plays a note. Chords and melodies emerge organically over five minutes of contemplation.

## CONCEPT

Inspired by **Brian Eno's** generative systems, **Harumi Hosono's** warm analog textures, and **Disasterpeace's** melodic sophistication (Fez, Hyper Light Drifter), DRIFT v6 is a living musical system where:

- **Explorers** spawn from a central home star
- They drift outward through the galaxy, colliding with **stars**
- Each **star** is a musical note - position determines pitch
- As explorers touch stars, they trigger sounds
- Multiple explorers create **layered canons** and **emergent chords**
- The music evolves through **5 phases** over 5 minutes

## MUSICAL DESIGN

### Scales (Pentatonic & Modal)
- **Ryukyu** - Okinawan pentatonic (Hosono-inspired)
- **Hirajoshi** - Japanese contemplative scale
- **In Sen** - Japanese mystery scale
- **Minor/Major Pentatonic** - Classic warm tones
- **Dorian/Mixolydian** - Modal (Fez-like)

### Star Types (Disasterpeace-inspired Variety)
Each star has a musical character that determines how it sounds when triggered:

- **Single Notes** (40%) - Simple, clean tones
- **Chords** (25%) - 3-4 notes with humanized arpeggiation (Hyper Light Drifter style)
- **Arpeggios** (20%) - Melodic sequences of 4-6 notes with loose timing
- **Ostinatos** (15%) - Short repeating patterns (2-4 notes, 2-3 repetitions)

### Humanization & Emergence
- **Non-grid timing** - Notes delayed by 5-40ms for organic feel
- **Rhythmic variance** - Arpeggios and ostinatos have variable note spacing
- **Pitch variance** - ±4 cents detune per oscillator for analog warmth
- **Volume variance** - Subtle gain randomization (±10-15%)
- **Probability layers** - Stars have individual voice probabilities (50-100%)
- **Phase-based density** - Not every star trigger produces sound

### Synthesis (Warm & Analog)
- **Multi-oscillator voices** - 3 detuned oscillators per note for warmth
- **Age-based timbres** - Sine (young) → Triangle → Square (ancient)
- **Warm lowpass filtering** - Opens and closes based on brightness
- **Shimmer reverb** - 5-second convolution for space
- **Prominent tape delay** - 375ms dotted-eighth with filtered feedback (HLD style)
- **Ambient pads** - Occasional 3-4 note chords with variable timing/duration
- **Dynamic compression** - Cohesive analog glue

## 5-MINUTE ARC

### Phase 1: Awakening (0:00-0:45)
- 1 explorer, 8s spawning
- Sparse, intimate
- 35% note density - lots of space and silence

### Phase 2: Expansion (0:45-1:45)
- 3 explorers, 5s spawning
- Growing complexity
- 55% density - emergence of patterns

### Phase 3: Flourishing (1:45-3:15)
- 5 explorers, 3.5s spawning
- Peak activity and richness
- 75% density - layered but not overwhelming

### Phase 4: Reflection (3:15-4:15)
- 3 explorers, 5s spawning
- Contemplative cooling
- 50% density - return to space

### Phase 5: Return (4:15-5:00)
- 1 explorer, 8s spawning
- Return to simplicity
- 25% density - fade into silence

## VISUAL DESIGN

**Brutalist Minimalism**:
- Black void with subtle white stars
- Explorers leave glowing trails
- Stars pulse when triggered
- Subtle constellation lines between nearby stars
- Clean IBM Plex Mono UI in corners

## TECHNICAL

- **Web Audio API** real-time synthesis
- **Canvas** rendering
- **Collision detection** between explorers and stars
- **Phase-based dynamics** - explorer count, spawn rate, note density
- **16 voice limit** for performance
- **Pause/Resume** with audio context suspension
- **Keyboard controls** - Space (pause), R (restart), ↑↓ (volume)

## INTERACTION

- **Begin** - Click to start
- **Pause/Resume** - Space or P key, or button
- **Restart** - R key or button (generates new scale and galaxy)
- **Volume** - Arrow keys or slider

## UI ELEMENTS

**Top Left**: Root note, elapsed time
**Top Right**: Explorer count, max depth reached
**Bottom Left**: Current phase name
**Bottom Right**: Scale/mode, active voices

## PHILOSOPHY

This piece explores:
- **Emergence** - Complex music from simple rules, patterns responding to each other
- **Contemplation** - Spacious, allowing room for thought and silence
- **Impermanence** - Every run is unique, every star has its own character
- **Warmth** - Analog-inspired synthesis over cold digital tones
- **Humanization** - Loose timing, subtle variations, organic feel
- **Patience** - Slow evolution over 5 minutes

Like Eno's Music for Airports or Disasterpeace's Hyper Light Drifter soundtrack, this creates an ambient landscape that rewards patient listening. The music doesn't play on a grid—notes trigger with human timing, chords arpeggiate loosely, ostinatos weave polyrhythmic patterns. The explorers are not controlled—they drift naturally, discovering melodies and chords through their journey, building something beautiful and unpredictable.

## INSPIRATION

**Brian Eno** - Generative systems, Music for Airports, ambient philosophy
**Harumi Hosono** - Warm analog synthesis, Ryukyu scales, Tropical Dandy
**Disasterpeace (Fez)** - Mathematical beauty, polymetric patterns, mystery
**Disasterpeace (HLD)** - Emotional pads, melancholic warmth
**Gorogoa OST** - Contemplative minimalism, space and silence

---

*DRIFT v6 — STELLAR DEPARTURE*
*January 2026*
*A contemplative journey through generated sound*
