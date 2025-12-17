// ═══════════════════════════════════════════════════════════════════════════
// WAVE NOTATION — Yoshimura-inspired Ambient
// Inspired by: Hiroshi Yoshimura's "Wave Notation 2", "GREEN", "AIR IN RESORT"
// Wide stereo field, oceanic panning, crystalline gestures
// 
// Deep spatial movement — notes drift across the stereo field
// Like watching light patterns on water
// 
// Paste into https://strudel.cc → Ctrl+Enter
// ═══════════════════════════════════════════════════════════════════════════

setcpm(60) // Normal note duration — patterns stretched via .slow()

stack(
  // ═══════════════════════════════════════════════════════════════════════
  // PIANO CELL 1: The main melodic gesture (Hosono-style sparse piano)
  // Pentatonic with occasional color — C D E G A (major pentatonic)
  // 11-note phrase, lots of space
  // ═══════════════════════════════════════════════════════════════════════
  note("c4 ~ e4 ~ ~ g4 ~ ~ ~ a4 ~")
    .s("sine")
    .slow(66)
    .gain(0.055)
    .attack(0.008)
    .release(2.5)
    .lpf(2200)
    .pan(sine.range(0.1,0.9).slow(47))
    .room(0.7)
    .size(0.85)
    .delay(0.25)
    .delaytime(0.375)
    .delayfeedback(0.32),

  // ═══════════════════════════════════════════════════════════════════════
  // PIANO CELL 2: Answering phrase (offset, different rhythm)
  // 13-note phrase — prime, never aligns with Cell 1
  // Pans opposite direction from Cell 1
  // ═══════════════════════════════════════════════════════════════════════
  note("~ ~ g4 ~ ~ ~ e4 ~ c5 ~ ~ ~ a4")
    .s("sine")
    .slow(78)
    .gain(0.048)
    .attack(0.01)
    .release(2.8)
    .lpf(2000)
    .pan(sine.range(0.9,0.1).slow(53))
    .room(0.72)
    .size(0.84)
    .delay(0.22)
    .delaytime(0.5)
    .delayfeedback(0.28),

  // ═══════════════════════════════════════════════════════════════════════
  // PIANO CELL 3: Lower register response
  // 7-note phrase — creates gentle bass movement
  // Slow majestic panning sweep
  // ═══════════════════════════════════════════════════════════════════════
  note("c3 ~ ~ ~ g3 ~ e3")
    .s("sine")
    .slow(84)
    .gain(0.042)
    .attack(0.012)
    .release(3)
    .lpf(1200)
    .pan(sine.range(0.25,0.75).slow(120))
    .room(0.6)
    .size(0.75),

  // ═══════════════════════════════════════════════════════════════════════
  // HIGH BELL: Occasional sparkle (crystalline Yoshimura bells)
  // 17-note sparse pattern — prime
  // Extreme stereo — appears from random positions
  // ═══════════════════════════════════════════════════════════════════════
  note("~ ~ ~ ~ e5 ~ ~ ~ ~ ~ ~ g5 ~ ~ ~ ~ c6")
    .s("sine")
    .slow(102)
    .gain(perlin.range(0.02,0.045).slow(24))
    .attack(0.005)
    .release(4)
    .lpf(3500)
    .pan(perlin.range(0,1).slow(19))
    .room(0.8)
    .size(0.9)
    .delay(0.35)
    .delaytime(0.333)
    .delayfeedback(0.4),

  // ═══════════════════════════════════════════════════════════════════════
  // CHORD PAD: Wide stereo wash (Wave Notation style)
  // Open voicing — C and G only, no third
  // Very slow pan drift — oceanic movement
  // ═══════════════════════════════════════════════════════════════════════
  note("<[c3,g3] ~ ~ [g2,d3] ~ ~ ~ [c3,g3] ~ ~ ~ ~ [e3,b3] ~ ~ ~>")
    .s("sine")
    .slow(384)
    .gain(perlin.range(0,0.04).slow(32))
    .attack(3.5)
    .release(6)
    .lpf(sine.range(450,850).slow(96))
    .pan(sine.range(0.15,0.85).slow(180))
    .room(0.88)
    .size(0.95),

  // ═══════════════════════════════════════════════════════════════════════
  // ARPEGGIO WASH: Gentle rising figure (like "GREEN")
  // Creates forward motion without urgency
  // 19-note cycle — wide stereo sweep
  // ═══════════════════════════════════════════════════════════════════════
  note("c4 ~ e4 ~ g4 ~ ~ a4 ~ ~ ~ g4 ~ e4 ~ ~ ~ c4 ~")
    .s("sine")
    .slow(228)
    .gain(0.03)
    .attack(0.15)
    .release(2)
    .lpf(1700)
    .pan(sine.range(0.05,0.95).slow(72))
    .room(0.75)
    .size(0.88)
    .delay(0.28)
    .delaytime(0.25)
    .delayfeedback(0.35),

  // ═══════════════════════════════════════════════════════════════════════
  // BASS PULSE: Soft, widely spaced (oceanic undertow)
  // Not a drone — discrete events with silence between
  // 5-note cycle for grounding, subtle stereo drift
  // ═══════════════════════════════════════════════════════════════════════
  note("<c2 ~ ~ g1 ~>")
    .s("sine")
    .slow(120)
    .gain(0.052)
    .attack(0.08)
    .release(4.5)
    .lpf(170)
    .pan(sine.range(0.35,0.65).slow(150))
    .room(0.5)
    .size(0.6),

  // ═══════════════════════════════════════════════════════════════════════
  // TEXTURE: Filtered clicks (like wave foam, distant chimes)
  // Very sparse, appears from random positions
  // ═══════════════════════════════════════════════════════════════════════
  s("hh")
    .slow(36)
    .gain(perlin.range(0,0.02).slow(16))
    .attack(0.01)
    .release(1)
    .lpf(perlin.range(1400,2800).slow(40))
    .hpf(900)
    .pan(perlin.range(0,1).slow(11))
    .room(0.82)
    .size(0.9),

  // ═══════════════════════════════════════════════════════════════════════
  // MELODIC FRAGMENT 4: High descending phrase (like light on water)
  // 23-note cycle — sweeps across stereo field
  // ═══════════════════════════════════════════════════════════════════════
  note("~ ~ ~ ~ ~ a5 ~ g5 ~ ~ ~ ~ e5 ~ ~ ~ ~ ~ ~ ~ c5 ~ ~")
    .s("sine")
    .slow(138)
    .gain(perlin.range(0.018,0.04).slow(20))
    .attack(0.02)
    .release(2.5)
    .lpf(3000)
    .pan(sine.range(0,1).slow(31))
    .room(0.78)
    .size(0.88)
    .delay(0.3)
    .delaytime(0.666)
    .delayfeedback(0.38),

  // ═══════════════════════════════════════════════════════════════════════
  // COUNTER MELODY: Mid-range, offset timing
  // Creates gentle counterpoint — slow panning opposite direction
  // 29-note cycle — prime
  // ═══════════════════════════════════════════════════════════════════════
  note("~ ~ d4 ~ ~ ~ ~ ~ ~ g4 ~ ~ ~ ~ ~ ~ a4 ~ ~ ~ ~ ~ ~ ~ ~ e4 ~ ~ ~")
    .s("sine")
    .slow(174)
    .gain(0.04)
    .attack(0.015)
    .release(2.8)
    .lpf(1900)
    .pan(sine.range(0.85,0.15).slow(67))
    .room(0.7)
    .size(0.82),

  // ═══════════════════════════════════════════════════════════════════════
  // SHIMMER: Very high, very quiet (air and light)
  // Extreme stereo — crystalline moments across the whole field
  // 31-note cycle — prime
  // ═══════════════════════════════════════════════════════════════════════
  note("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ e6 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ c6 ~ ~ ~ g5")
    .s("sine")
    .slow(372)
    .gain(perlin.range(0,0.025).slow(28))
    .attack(0.008)
    .release(5)
    .lpf(4500)
    .pan(perlin.range(0,1).slow(23))
    .room(0.92)
    .size(0.96)
)

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN PRINCIPLES (Wave Notation 2 style):
//
// 1. WIDE STEREO FIELD
//    → Notes sweep across full L-R spectrum (0.0 to 1.0)
//    → Different layers pan at different rates/directions
//    → Creates oceanic, immersive spatial movement
//
// 2. PANNING AS COMPOSITIONAL ELEMENT
//    → sine.range() for smooth sweeping motion
//    → perlin.range() for organic, unpredictable positioning
//    → Prime cycle lengths prevent sync (47, 53, 67, etc.)
//
// 3. MAJOR PENTATONIC (C D E G A)
//    → Yoshimura's crystalline brightness
//    → No tension, pure open space
//    → Water and light associations
//
// 4. DEEP REVERB + DELAY
//    → Large room sizes (0.75-0.96)
//    → High reverb amounts (0.7-0.92)
//    → Delays at musical intervals create self-counterpoint
//
// 5. SLOW EVERYTHING
//    → 60 CPM base with .slow(66-384)
//    → ~10 events per minute overall
//    → Time stretches, space opens up
//
// 6. PERLIN NOISE FOR ORGANIC BREATH
//    → Gain controlled by perlin = layers fade in/out
//    → Panning controlled by perlin = unpredictable spatial placement
//    → Nothing is static
//
// RESULT: Oceanic ambient with immersive stereo movement.
// Like watching sunlight patterns shift across water surface.
// ═══════════════════════════════════════════════════════════════════════════
