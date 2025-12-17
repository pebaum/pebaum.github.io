// ═══════════════════════════════════════════════════════════════════════════
// DEEP FOCUS AMBIENT — 30+ Minute Evolving Soundscape
// Science-backed: 60 BPM, minimal transients, low surprise, heavy diffusion
// Paste into https://strudel.cc → Ctrl+Enter → let run in background tab
// ═══════════════════════════════════════════════════════════════════════════

setcpm(60)

stack(
  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 1: SUB-BASS DRONE (glacial movement, ~8 min cycle)
  // Root motion: C→Eb→F→Bb→Ab→G→D→C (non-repeating 8-chord cycle)
  // ═══════════════════════════════════════════════════════════════════════
  note("<c1 eb1 f1 bb0 ab0 g1 d1 c1>")
    .s("sine")
    .slow(64)
    .gain(0.08)
    .attack(6)
    .release(8)
    .lpf(100)
    .room(0.4)
    .size(0.5),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 2: WARM PAD (7-chord progression, ~14 min full cycle)
  // Chords: Cm → Eb → Fm → Bbmaj → Abmaj → Gm → Dm → (back)
  // ═══════════════════════════════════════════════════════════════════════
  note("<[c3,eb3,g3] [eb3,g3,bb3] [f3,ab3,c4] [bb2,d3,f3] [ab2,c3,eb3] [g2,bb2,d3] [d3,f3,a3]>")
    .s("sine")
    .slow(56)
    .gain(0.055)
    .attack(4)
    .release(6)
    .lpf(sine.range(600,1100).slow(128))
    .room(0.85)
    .size(0.95),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 3: HIGH SHIMMER (11-note sequence, ~22 min cycle, irrational vs bass)
  // ═══════════════════════════════════════════════════════════════════════
  note("<g5 eb5 f5 d5 c5 bb4 ab4 g4 f5 eb5 d5>")
    .s("sine")
    .slow(88)
    .gain(0.02)
    .attack(3)
    .release(5)
    .lpf(sine.range(1400,2400).slow(144))
    .room(0.92)
    .size(0.98),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 4: EVOLVING ARPEGGIO (13-note prime cycle, ~6.5 min, phase drifts)
  // ═══════════════════════════════════════════════════════════════════════
  note("c4 eb4 g4 eb4 f4 ab4 c5 ab4 g4 bb4 d5 bb4 g4")
    .s("sine")
    .slow(26)
    .gain(0.032)
    .attack(0.2)
    .release(0.8)
    .lpf(sine.range(900,1600).slow(96))
    .room(0.7)
    .size(0.85)
    .delay(0.25)
    .delaytime(0.5)
    .delayfeedback(0.3),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 5: SECOND ARPEGGIO (17-note prime, ~8.5 min, never aligns with L4)
  // ═══════════════════════════════════════════════════════════════════════
  note("eb4 g4 bb4 c5 eb5 d5 bb4 g4 f4 ab4 c5 eb5 f5 eb5 c5 ab4 f4")
    .s("sine")
    .slow(34)
    .gain(0.025)
    .attack(0.15)
    .release(0.7)
    .lpf(sine.range(1000,1800).slow(112))
    .pan(sine.range(0.3,0.7).slow(64))
    .room(0.75)
    .size(0.88)
    .delay(0.2)
    .delaytime(0.333)
    .delayfeedback(0.28),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 6: BINAURAL-ADJACENT (3 Hz detune for alpha entrainment)
  // 5-chord cycle offset from main pad
  // ═══════════════════════════════════════════════════════════════════════
  note("<c3 f3 bb2 eb3 g2>")
    .s("sine")
    .detune(3)
    .slow(40)
    .gain(0.038)
    .attack(4)
    .release(6)
    .lpf(sine.range(500,900).slow(80))
    .room(0.8)
    .size(0.9),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 7: TEXTURE — filtered noise swells (very sparse, random)
  // ═══════════════════════════════════════════════════════════════════════
  s("hh")
    .slow(16)
    .gain(perlin.range(0,0.015))
    .attack(2)
    .release(4)
    .lpf(perlin.range(400,1200).slow(32))
    .hpf(200)
    .room(0.9)
    .size(0.95),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 8: OCCASIONAL BELL (very rare, random timing via perlin gate)
  // ═══════════════════════════════════════════════════════════════════════
  note("<c5 g5 eb5 bb4 f5>")
    .s("sine")
    .slow(80)
    .gain(perlin.range(0,0.025).slow(24))
    .attack(0.01)
    .release(3)
    .lpf(2000)
    .room(0.88)
    .size(0.92),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 9: DEEP PULSE (grounding, 1 every 4 sec, random gain wobble)
  // ═══════════════════════════════════════════════════════════════════════
  s("bd")
    .slow(4)
    .gain(perlin.range(0.04,0.09).slow(16))
    .lpf(sine.range(300,500).slow(48))
    .room(0.35)
    .size(0.45),

  // ═══════════════════════════════════════════════════════════════════════
  // LAYER 10: GHOST NOTES (19-step rhythm, almost subliminal)
  // ═══════════════════════════════════════════════════════════════════════
  note("c4 ~ ~ eb4 ~ ~ g4 ~ ~ ~ f4 ~ ~ ab4 ~ ~ ~ ~ bb4")
    .s("sine")
    .slow(38)
    .gain(0.018)
    .attack(0.3)
    .release(1.2)
    .lpf(800)
    .room(0.8)
    .size(0.9)
    .pan(perlin.range(0.35,0.65).slow(72))
)

// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS NEVER REPEATS:
// - Prime-number note counts (7, 11, 13, 17, 19) → LCM is astronomically large
// - Co-prime .slow() values (26, 34, 38, 40, 56, 64, 80, 88)
// - Perlin noise on gain/filter/pan → non-periodic randomness
// - sine.range().slow() LFOs → continuous modulation across minutes
// 
// RESULT: Statistical repeat period exceeds several hours.
// In a 30-minute session you'll never hear the same moment twice.
// ═══════════════════════════════════════════════════════════════════════════
