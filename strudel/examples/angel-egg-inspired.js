// Angel's Egg inspired ethereal unison motif with probabilistic drop-outs.
// NOTE: This uses only commonly supported constructs (sample/note/chord/fast/slow/stack/every/degradeBy/pan/up/down)
// Verify note spelling (bb vs a#) in your Strudel runtime; replace 'bb' with 'a#' if needed.
// Run in https://strudel.cc/ by pasting the whole block.

// Mood: sad, sweet, dreamy, lonely, mysterious, solemn
// Scale choice: D natural minor (aeolian) for plaintive color.
scale('aeolian') // Root assumed to be current tonic; adjust if needed with tonic('d') if supported.

// 9‑note motif then a pause (rests). Each token shares equal fraction of a cycle.
// Motif (relative explicit pitches around mid range):
// d4 f4 a4 g4 e4 c4 bb3 a3 d4  then 4 rests (~) for breathing space
let motif = note`d4 f4 a4 g4 e4 c4 bb3 a3 d4 ~ ~ ~ ~`;

// --- Humanization Fallback (no .map support) ---
// Original attempt used p.map which is not available in your runtime (Error: p.map is not a function).
// Replacement strategy: use probabilistic gentle gain variation + occasional tiny rotation.
// These rely only on commonly available helpers: sometimesBy, every, rot, gain.
const humanizeLite = p => {
  // Slight dynamic shimmer: sometimes nudge gain up or down a bit.
  if (p.sometimesBy) {
    p = p.sometimesBy(0.15, x => x.gain(1.05));
    p = p.sometimesBy(0.15, x => x.gain(0.95));
  }
  // Removed rotation (rot unsupported). Keep periodic hook as a no-op for timing alignment.
  if (p.every) p = p.every(32, x => x); // no-op variation placeholder
  return p;
};

motif = humanizeLite(motif);

// Helper to apply probabilistic silence per instrument
// Using degradeBy(prob) which drops events with probability prob.
const dropout = (p, prob) => p.degradeBy(prob);

// Wide stereo layout plan (L<- - - center - - ->R):
// cello(-0.85), choirLow(-0.6), piano(-0.25), violin(+0.1), choirHigh(+0.35), bells(+0.55), vibraphone(+0.7), glock(+0.8), celeste(+0.9)
// (You may adjust if runtime's pan range differs.)

// Instrument octave placements (natural-ish ranges)
// Slight per-instrument gain balanced after humanization.
const piano      = dropout(motif.gain(0.62).pan(-0.25), 0.10);           // anchor
const cello      = dropout(motif.down(24).gain(0.68).pan(-0.85), 0.15);  // deep support (D2 region)
const choirLow   = dropout(motif.down(12).gain(0.52).pan(-0.60), 0.20);  // low choir (D3 region)
const choirHigh  = dropout(motif.up(12).gain(0.42).pan(0.35), 0.25);     // high choir (D5 region)
const violin     = dropout(motif.up(12).gain(0.47).pan(0.10), 0.18);     // violin singing in upper mid
const bells      = dropout(motif.up(12).gain(0.38).pan(0.55), 0.35);     // occasional shimmer
const vibraphone = dropout(motif.up(12).gain(0.40).pan(0.70), 0.30);     // resonant sustain
const glock      = dropout(motif.up(24).gain(0.31).pan(0.80), 0.45);     // very high sparkle
const celeste    = dropout(motif.up(24).gain(0.28).pan(0.90), 0.50);     // airy twinkle, most sparse

// Removed rotateUpper (rot unsupported). Use originals directly.
const bellsVar      = bells;
const vibraphoneVar = vibraphone;
const glockVar      = glock;
const celesteVar    = celeste;

// Stack all voices. Order matters only for reading. All share the same timing; silent gaps from degradeBy create the texture.
let ensemble = stack(
  cello,
  choirLow,
  piano,
  violin,
  choirHigh,
  bellsVar,
  vibraphoneVar,
  glockVar,
  celesteVar
);

// --- Reverb / Wash Simulation ---
// If native .reverb(mix) exists you can simply: ensemble = ensemble.reverb(0.85)
// To stay safe, we add a soft "wash" layer: a very slow, quiet, blurred octave pad built from the motif.
// Simplified wash: removed noise().scale() to avoid unsupported APIs.
const wash = motif.up(12).slow(8).gain(0.12).degradeBy(0.7).pan(0);

// Optionally add an even lower drone for depth (commented to keep minimal):
// const drone = note`d2 ~ d2 ~`.slow(4).gain(0.18).degradeBy(0.4).pan(-0.4)

ensemble = stack(ensemble, wash);

// OPTIONAL (uncomment if runtime supports):
// ensemble = ensemble.reverb ? ensemble.reverb(0.9) : ensemble; // high wet mix

// Export / return final pattern
ensemble

// Tweaking Guidance:
// - Increase/decrease individual degradeBy() to control density.
// - Add subtle micro-shift ONLY if delay() exists: motif.every(2, x => x) // placeholder (omit if unsupported).
// - Removed advanced humanize (.map) due to runtime limitations; current approach uses sometimesBy for dynamics.
// - To lengthen pause: add more '~' rests in motif.
// - Adjust humanize timing by changing timing param in humanize() call.
// - Remove humanization: revert motif to original literal definition.
// - Real reverb: if environment exposes global fx bus, route ensemble there instead of simulated wash.
// - To change mood toward Dorian brightness: scale('dorian').
// - To ensure strict unison (no rotation), revert bellsVar/vibraphoneVar/glockVar/celesteVar to originals.
