// ═══════════════════════════════════════════════════════════════════════════
// AUSTIN BELLS — An 80s Prog Rock Holiday Jingle
// In the style of: Genesis, Yes, Rush, Marillion
// Synth pads, sequenced arpeggios, gated drums, epic builds
// 
// Paste into https://strudel.cc → Ctrl+Enter → feel the drama
// ═══════════════════════════════════════════════════════════════════════════

setcpm(110) // 80s prog tempo — driving, theatrical

stack(
  // ═══════════════════════════════════════════════════════════════════════
  // FOUNDATION: Moog-style bass — punchy, syncopated, Tony Levin vibes
  // Chromatic movement, prog complexity
  // ═══════════════════════════════════════════════════════════════════════
  note("e2 e2 ~ e2 g2 ~ a2 b2 e2 e2 ~ d2 ~ c2 b1 ~")
    .s("sawtooth")
    .slow(4)
    .gain(0.09)
    .attack(0.01)
    .release(0.2)
    .lpf(sine.range(300, 600).slow(8))
    .room(0.3)
    .size(0.4),

  // ═══════════════════════════════════════════════════════════════════════
  // SLEIGH BELLS: FM synth bells — DX7 electric piano feel
  // "Jingle Bells" motif, crystalline and precise
  // ═══════════════════════════════════════════════════════════════════════
  note("e5 e5 e5 ~ e5 e5 e5 ~ e5 g5 c5 d5 e5 ~ ~ ~")
    .s("sine")
    .fm(2)
    .fmh(4)
    .slow(4)
    .gain(0.055)
    .attack(0.005)
    .release(0.8)
    .lpf(4500)
    .room(0.6)
    .size(0.7)
    .delay(0.25)
    .delaytime(0.1875)
    .delayfeedback(0.4),

  // ═══════════════════════════════════════════════════════════════════════
  // SEQUENCER 1: Classic prog arpeggio — Steve Howe meets Tony Banks
  // Fast 16th notes, filtered sweep
  // ═══════════════════════════════════════════════════════════════════════
  note("e4 b4 e5 b4 g4 b4 e5 g5 e4 b4 e5 b4 g4 e5 b5 e5")
    .s("square")
    .slow(2)
    .gain(0.035)
    .attack(0.005)
    .release(0.1)
    .lpf(sine.range(800, 3500).slow(8))
    .room(0.5)
    .size(0.6)
    .delay(0.3)
    .delaytime(0.125)
    .delayfeedback(0.35),

  // ═══════════════════════════════════════════════════════════════════════
  // SEQUENCER 2: Counter-arpeggio — polyrhythmic tension
  // Offset timing creates prog complexity
  // ═══════════════════════════════════════════════════════════════════════
  note("b4 g4 e4 g4 b4 e5 g5 e5 b4 g4 d4 g4 b4 d5 g5 b5")
    .s("square")
    .slow(2.5)
    .gain(0.03)
    .attack(0.005)
    .release(0.12)
    .lpf(sine.range(600, 3000).slow(12))
    .pan(sine.range(0.2, 0.8).slow(4))
    .room(0.55)
    .size(0.65)
    .delay(0.25)
    .delaytime(0.1666)
    .delayfeedback(0.3),

  // ═══════════════════════════════════════════════════════════════════════
  // SYNTH PAD: Lush polysynth — Oberheim/Prophet vibes
  // Rich chords, slow filter sweep, very 80s
  // ═══════════════════════════════════════════════════════════════════════
  note("<[e3,g#3,b3,d#4] [a2,c#3,e3,g#3] [b2,d#3,f#3,a3] [e3,g#3,b3,e4]>")
    .s("sawtooth")
    .slow(8)
    .gain(0.045)
    .attack(0.3)
    .release(2)
    .lpf(sine.range(400, 2200).slow(16))
    .detune(8)
    .room(0.75)
    .size(0.85),

  // ═══════════════════════════════════════════════════════════════════════
  // CHOIR PAD: Mellotron strings/choir — classic Genesis texture
  // Haunting, ethereal, dramatic
  // ═══════════════════════════════════════════════════════════════════════
  note("<[e4,b4] [c#4,a4] [d#4,b4] [e4,g#4]>")
    .s("sawtooth")
    .slow(16)
    .gain(sine.range(0.02, 0.05).slow(24))
    .attack(1)
    .release(3)
    .lpf(1800)
    .hpf(400)
    .detune(12)
    .room(0.9)
    .size(0.95),

  // ═══════════════════════════════════════════════════════════════════════
  // LEAD SYNTH: Minimoog-style solo — soaring, dramatic
  // Holiday melody fragments with prog embellishments
  // ═══════════════════════════════════════════════════════════════════════
  note("e5 ~ ~ g#5 ~ b5 ~ a5 g#5 ~ e5 ~ ~ d#5 ~ e5")
    .s("sawtooth")
    .slow(4)
    .gain(perlin.range(0.03, 0.06).slow(8))
    .attack(0.02)
    .release(0.5)
    .lpf(sine.range(1500, 4000).slow(6))
    .room(0.6)
    .size(0.7)
    .delay(0.35)
    .delaytime(0.25)
    .delayfeedback(0.45),

  // ═══════════════════════════════════════════════════════════════════════
  // GATED SNARE: Phil Collins gated reverb — iconic 80s sound
  // Driving the drama forward
  // ═══════════════════════════════════════════════════════════════════════
  s("~ sd ~ sd")
    .slow(2)
    .gain(0.08)
    .room(0.9)
    .size(0.3)
    .lpf(3000)
    .hpf(200),

  // ═══════════════════════════════════════════════════════════════════════
  // KICK DRUM: Punchy electronic kick — driving pulse
  // ═══════════════════════════════════════════════════════════════════════
  s("bd ~ ~ bd ~ ~ bd ~")
    .slow(2)
    .gain(0.1)
    .lpf(150)
    .room(0.2)
    .size(0.3),

  // ═══════════════════════════════════════════════════════════════════════
  // HI-HATS: Crisp electronic hats — 80s drum machine feel
  // ═══════════════════════════════════════════════════════════════════════
  s("hh hh hh hh hh hh hh [hh hh]")
    .slow(2)
    .gain(0.045)
    .lpf(8000)
    .hpf(6000)
    .room(0.3)
    .size(0.4),

  // ═══════════════════════════════════════════════════════════════════════
  // TOMS FILL: Dramatic tom fills — prog transitions
  // Sparse but impactful
  // ═══════════════════════════════════════════════════════════════════════
  s("~ ~ ~ ~ ~ ~ ~ [tom:0 tom:1 tom:2]")
    .slow(8)
    .gain(0.07)
    .room(0.6)
    .size(0.5),

  // ═══════════════════════════════════════════════════════════════════════
  // SHIMMER: High synth sparkle — digital fairy dust
  // Adds 80s sheen
  // ═══════════════════════════════════════════════════════════════════════
  note("b6 ~ ~ e6 ~ ~ g#6 ~ ~ ~ b6 ~ ~ ~ ~ ~")
    .s("sine")
    .fm(3)
    .fmh(2)
    .slow(8)
    .gain(perlin.range(0.01, 0.025).slow(12))
    .attack(0.01)
    .release(1.5)
    .lpf(6000)
    .room(0.85)
    .size(0.9)
    .delay(0.5)
    .delaytime(0.375)
    .delayfeedback(0.5)
)
