// STRICT COMPAT VERSION (attempts to use only very common Strudel-style constructs)
// If any identifier here still errors, report which one and we will simplify further.
// Removed: .map, .rot, .sometimesBy, noise(), fancy humanization.
// Kept: note literals, degradeBy, gain, pan, up/down (IF they exist). If up/down unsupported, use explicit octave notes.

// If scale() errors, comment it out and rely on absolute note names.
scale('aeolian')

// Core 9-note motif + 4 rests (breathing space)
const base = note`d4 f4 a4 g4 e4 c4 bb3 a3 d4 ~ ~ ~ ~`

// Fallback: if up/down cause errors, replace the transposed variants with explicit rewritten note sequences.
// Natural-ish ranges & dropout probabilities (adjust degradeBy values for more/less presence).
const cello      = base.down ? base.down(24).gain(0.70).pan(-0.8).degradeBy(0.15) : note`d2 f2 a2 g2 e2 c2 bb1 a1 d2 ~ ~ ~ ~`.gain(0.70).pan(-0.8).degradeBy(0.15)
const choirLow   = base.down ? base.down(12).gain(0.55).pan(-0.55).degradeBy(0.20) : note`d3 f3 a3 g3 e3 c3 bb2 a2 d3 ~ ~ ~ ~`.gain(0.55).pan(-0.55).degradeBy(0.20)
const piano      = base.gain(0.62).pan(-0.25).degradeBy(0.10)
const violin     = base.up ? base.up(12).gain(0.48).pan(0.10).degradeBy(0.18) : note`d5 f5 a5 g5 e5 c5 bb4 a4 d5 ~ ~ ~ ~`.gain(0.48).pan(0.10).degradeBy(0.18)
const choirHigh  = base.up ? base.up(12).gain(0.44).pan(0.32).degradeBy(0.25) : note`d5 f5 a5 g5 e5 c5 bb4 a4 d5 ~ ~ ~ ~`.gain(0.44).pan(0.32).degradeBy(0.25)
const bells      = base.up ? base.up(12).gain(0.38).pan(0.55).degradeBy(0.35) : note`d5 f5 a5 g5 e5 c5 bb4 a4 d5 ~ ~ ~ ~`.gain(0.38).pan(0.55).degradeBy(0.35)
const vibraphone = base.up ? base.up(12).gain(0.40).pan(0.70).degradeBy(0.30) : note`d5 f5 a5 g5 e5 c5 bb4 a4 d5 ~ ~ ~ ~`.gain(0.40).pan(0.70).degradeBy(0.30)
const glock      = base.up ? base.up(24).gain(0.32).pan(0.80).degradeBy(0.45) : note`d6 f6 a6 g6 e6 c6 bb5 a5 d6 ~ ~ ~ ~`.gain(0.32).pan(0.80).degradeBy(0.45)
const celeste    = base.up ? base.up(24).gain(0.28).pan(0.90).degradeBy(0.50) : note`d6 f6 a6 g6 e6 c6 bb5 a5 d6 ~ ~ ~ ~`.gain(0.28).pan(0.90).degradeBy(0.50)

// Simple wash layer: very soft upper copy (comment out if unwanted or if slow() unsupported)
let wash = base.up ? base.up(12).slow(8).gain(0.12).degradeBy(0.7).pan(0) : base.slow ? base.slow(8).gain(0.12).degradeBy(0.7).pan(0) : base.gain(0.12).degradeBy(0.7).pan(0)

// If stack() errors, you may have to remove layers and just return one pattern or manually combine depending on runtime.
const ensemble = stack(
  cello,
  choirLow,
  piano,
  violin,
  choirHigh,
  bells,
  vibraphone,
  glock,
  celeste,
  wash
)

// If reverb() exists you can try: ensemble.reverb(0.85)
ensemble

// TROUBLESHOOTING GUIDE:
// 1. If you see "X is not a function" note which of: down, up, slow, degradeBy, gain, pan, stack.
// 2. If stack fails, try commenting out stack block and just leave one instrument variable name at end.
// 3. If degradeBy missing, replace e.g. .degradeBy(0.3) with .sometimes? or remove entirely for always-on notes.
// 4. If pan not working, remove .pan() calls.
// 5. Report the failing identifiers so we can tailor a smaller subset.
