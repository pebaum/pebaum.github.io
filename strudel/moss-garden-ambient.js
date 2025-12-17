// ═══════════════════════════════════════════════════════════════════════════
// MOSS GARDEN — Infinite Evolving Ambient
// Inspired by: Eno's "Music for Airports", Japanese garden aesthetics,
// the sound of rain on leaves, wind through bamboo, stones in water
// 
// Paste into https://strudel.cc → Ctrl+Enter → let it breathe
// ═══════════════════════════════════════════════════════════════════════════

setcpm(48) // Slower than breath (~0.8 Hz) — contemplative stillness

stack(
  // ═══════════════════════════════════════════════════════════════════════
  // EARTH: Deep root tone (almost subliminal, felt more than heard)
  // Pentatonic-adjacent: removes tension, pure groundedness
  // 11-note cycle (~22 min) — prime, never aligns
  // ═══════════════════════════════════════════════════════════════════════
  note("<a0 e1 a1 d1 e1 a0 b0 e1 d1 a0 e1>")
    .s("sine")
    .slow(88)
    .gain(0.06)
    .attack(8)
    .release(12)
    .lpf(80)
    .room(0.5)
    .size(0.6),

  // ═══════════════════════════════════════════════════════════════════════
  // STONE: Low resonant hum (like a singing bowl left to decay)
  // 7-note cycle (~14 min)
  // ═══════════════════════════════════════════════════════════════════════
  note("<a1 e2 d2 a1 b1 e2 a1>")
    .s("sine")
    .slow(56)
    .gain(0.045)
    .attack(6)
    .release(10)
    .lpf(sine.range(150,280).slow(120))
    .room(0.6)
    .size(0.7),

  // ═══════════════════════════════════════════════════════════════════════
  // WATER: Gentle pad — open fifths and fourths (no thirds = no tension)
  // Voiced like Japanese gagaku — hollow, ancient
  // 13-chord cycle (~26 min) — prime
  // ═══════════════════════════════════════════════════════════════════════
  note("<[a2,e3] [e3,b3] [d3,a3] [a2,e3] [b2,e3] [e3,a3] [d3,a3] [a2,d3] [e3,b3] [b2,e3] [a2,e3] [d3,e3] [e3,a3]>")
    .s("sine")
    .slow(104)
    .gain(0.04)
    .attack(5)
    .release(8)
    .lpf(sine.range(400,700).slow(160))
    .room(0.88)
    .size(0.96),

  // ═══════════════════════════════════════════════════════════════════════
  // MIST: High ethereal shimmer (like light through fog)
  // 17-note cycle (~34 min) — prime, drifts against everything
  // ═══════════════════════════════════════════════════════════════════════
  note("<e5 a4 b4 e5 d5 a4 e5 b4 a4 d5 e5 a4 b4 d5 e5 a4 b4>")
    .s("sine")
    .slow(136)
    .gain(perlin.range(0.008,0.022).slow(48))
    .attack(4)
    .release(7)
    .lpf(sine.range(1600,2800).slow(200))
    .room(0.94)
    .size(0.98),

  // ═══════════════════════════════════════════════════════════════════════
  // BAMBOO: Sparse melodic gesture (like wind chimes, rarely struck)
  // Pentatonic only: A D E (no B to keep it floating)
  // 19-note cycle (~19 min) — prime
  // ═══════════════════════════════════════════════════════════════════════
  note("a4 ~ ~ ~ e4 ~ ~ ~ ~ d5 ~ ~ ~ ~ ~ a4 ~ ~ e5")
    .s("sine")
    .slow(38)
    .gain(perlin.range(0,0.028).slow(32))
    .attack(0.08)
    .release(4)
    .lpf(1800)
    .room(0.85)
    .size(0.92)
    .delay(0.35)
    .delaytime(0.666)
    .delayfeedback(0.4),

  // ═══════════════════════════════════════════════════════════════════════
  // MOSS: Second melodic voice (gentler, lower, offset rhythm)
  // 23-note cycle (~23 min) — prime, largest offset
  // ═══════════════════════════════════════════════════════════════════════
  note("~ d4 ~ ~ ~ a3 ~ ~ ~ ~ e4 ~ ~ ~ ~ ~ d4 ~ ~ ~ ~ a3 ~")
    .s("sine")
    .slow(46)
    .gain(perlin.range(0,0.024).slow(40))
    .attack(0.12)
    .release(5)
    .lpf(1400)
    .pan(sine.range(0.35,0.65).slow(88))
    .room(0.82)
    .size(0.9)
    .delay(0.28)
    .delaytime(0.5)
    .delayfeedback(0.35),

  // ═══════════════════════════════════════════════════════════════════════
  // RAIN: Filtered texture (like distant rain on a temple roof)
  // Random density via perlin
  // ═══════════════════════════════════════════════════════════════════════
  s("hh")
    .slow(8)
    .gain(perlin.range(0,0.012).slow(24))
    .attack(1.5)
    .release(3)
    .lpf(perlin.range(300,800).slow(56))
    .hpf(150)
    .room(0.92)
    .size(0.96),

  // ═══════════════════════════════════════════════════════════════════════
  // DEW: Occasional high bell (like a single water droplet)
  // 29-note sparse cycle — largest prime, ultra-rare
  // ═══════════════════════════════════════════════════════════════════════
  note("~ ~ ~ ~ ~ e6 ~ ~ ~ ~ ~ ~ ~ ~ a5 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ d6")
    .s("sine")
    .slow(116)
    .gain(perlin.range(0,0.018).slow(64))
    .attack(0.005)
    .release(6)
    .lpf(3000)
    .room(0.9)
    .size(0.95),

  // ═══════════════════════════════════════════════════════════════════════
  // BREATH: Sub-bass swell (like the garden itself breathing)
  // 5-note cycle (~10 min) — small prime for grounding pulse
  // ═══════════════════════════════════════════════════════════════════════
  note("<a1 e1 d1 a1 e1>")
    .s("sine")
    .slow(40)
    .gain(perlin.range(0.02,0.05).slow(20))
    .attack(8)
    .release(12)
    .lpf(60)
    .room(0.4)
    .size(0.5),

  // ═══════════════════════════════════════════════════════════════════════
  // WIND: Very slow filter sweep on sustained tone (like wind through pines)
  // Single note, but filter movement creates all the life
  // ═══════════════════════════════════════════════════════════════════════
  note("e3")
    .s("sine")
    .gain(0.025)
    .attack(10)
    .release(15)
    .lpf(sine.range(200,600).slow(180))
    .room(0.85)
    .size(0.92),

  // ═══════════════════════════════════════════════════════════════════════
  // LANTERN: Warm mid-range glow (like candlelight flickering)
  // 31-note cycle — prime, creates gentle harmonic color
  // ═══════════════════════════════════════════════════════════════════════
  note("<a3 ~ e3 ~ ~ d3 ~ ~ ~ a3 ~ ~ e3 ~ ~ ~ d3 ~ ~ ~ ~ a3 ~ ~ ~ e3 ~ ~ ~ ~ d3>")
    .s("sine")
    .slow(62)
    .gain(perlin.range(0.01,0.03).slow(36))
    .attack(2)
    .release(6)
    .lpf(sine.range(600,1000).slow(144))
    .room(0.78)
    .size(0.88),

  // ═══════════════════════════════════════════════════════════════════════
  // PATH: Walking bass (extremely sparse, like footsteps on gravel)
  // 37-note cycle — large prime for ultra-long non-repetition
  // ═══════════════════════════════════════════════════════════════════════
  note("a2 ~ ~ ~ ~ ~ ~ e2 ~ ~ ~ ~ ~ ~ ~ ~ d2 ~ ~ ~ ~ ~ ~ ~ ~ ~ a2 ~ ~ ~ ~ ~ ~ ~ ~ ~ e2")
    .s("sine")
    .slow(74)
    .gain(perlin.range(0,0.035).slow(28))
    .attack(0.15)
    .release(3)
    .lpf(400)
    .room(0.6)
    .size(0.7)
)

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN PRINCIPLES:
//
// 1. PENTATONIC PURITY (A, D, E only — no B or F#)
//    → No leading tones, no tension, no resolution needed
//    → Like Japanese "yo" scale: floating, timeless
//
// 2. OPEN VOICINGS (fifths, fourths, octaves — no thirds)
//    → Ancient, hollow sound — neither major nor minor
//    → Gagaku-inspired: the music of Shinto shrines
//
// 3. PRIME NUMBER CYCLES (5, 7, 11, 13, 17, 19, 23, 29, 31, 37)
//    → LCM exceeds 10 billion — will never repeat in your lifetime
//    → Each layer drifts independently like clouds
//
// 4. PERLIN NOISE ON GAIN/FILTER
//    → Organic "breathing" — not mechanical, not random
//    → Like watching moss grow, imperceptibly alive
//
// 5. EXTREME REVERB + SLOW ATTACKS
//    → No transients to startle
//    → Sound emerges from silence like mist
//
// 6. 48 CPM (~0.8 Hz)
//    → Slower than resting breath
//    → Induces parasympathetic (rest/digest) state
//
// RESULT: A living garden of sound.
// Leave it running for hours. It will never repeat.
// ═══════════════════════════════════════════════════════════════════════════
