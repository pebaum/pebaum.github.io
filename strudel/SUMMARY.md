# Strudel Paraphrased Summary

Paraphrased overview of Strudel concepts (no verbatim copying). Working reference for composing algorithmic music patterns. Strudel is a JavaScript/WebAudio live coding environment (inspired by pattern systems like TidalCycles) where musical structure = pure, transformable time functions.

## 1. Mental Model
Pattern = pure mapping from continuous cyclical time to a set of discrete events. Events carry attributes (note, duration, velocity, sample name, parameters). Transforms return new patterns (immutability). Layering merges event streams chronologically. Express music through functional composition rather than imperative sequencing.

## 2. Core Syntax Blocks
- Tokens separated by spaces = sequential events in one cycle: `"bd sd bd sd"`.
- Parentheses group subpatterns: `"bd (sd sd) bd"`.
- Brackets often indicate sequential subdivision or alternatives: `[bd sd hh]` (semantics environment-specific but used for subdivision/choice patterns).

## 3. Time & Cycles
- Cycle = base looping unit (conceptually a bar). Tempo defines seconds per cycle.
- If N events in a simple sequence, each event spans 1/N of the cycle by default.

## 4. Pattern Combination
- Sequential concatenation: `a.then(b)` or by constructing higher-level grouped sequences.
- Parallel layering: `stack(a,b,c)` merges event lists maintaining timing.
- Overlay: `a.with(b)` merges while leaving base unaffected for further chaining.
- Interleave: `interlace(a,b)` alternate events.

## 5. Probability & Randomness
- `sometimes(fn)` ~50% application in periodic slots.
- `sometimesBy(p, fn)` probability p.
- `often`, `rarely` convenience probability presets.
- `choose(a,b,c)` pick one per event slot.
- Weighted choose: `pick([[a,3],[b,1]])` style to bias.
- `rand` float 0..1, `irand(n)` int 0..n-1.
- `degrade` randomly mute events; `degradeBy(p)` mute with probability p.

## 6. Conditional / Periodic Transforms
- `every(n, fn)` apply transform every nth cycle.
- `within(start, end, fn)` apply only in fractional subrange of cycle.
- `when(predicate, fn)` evaluate predicate per event.

## 7. Euclidean / Rhythmic Helpers
- `euclid(pulses, steps, offset)` generate distributed hits pattern.
- Use as mask: `pattern.mask(euclid(3,8))` to thin events.
- Silence tokens: `~` or `_` rest placeholder.
- Polyrhythms via differing group subdivision counts overlapped.

## 8. Harmony & Pitch
- Global scale selection: `scale('minor')`, etc.
- Numeric degrees map into scale; octave shifts: `.octave(n)` or transposition methods.
- Chords: `` chord`c4m7 f4maj7 g4sus` `` produce note sets per event.
- Arpeggiation: `.arp('up')`, `'down'`, `'random'`.
- Transpose: `.up(n)`, `.down(n)`, or `.transpose(semitones)`.

## 9. Samples & Synths
- Sample referencing: `` sample`bd sd hh` `` typical drum kit shorthand.
- Parameter chaining: `.gain(0.8).pan(-0.2).rate(0.5)`.
- Choke groups: `.cut(n)` to stop overlapping previous voices with same cut group id.
- Rate modifies playback pitch/time for sample.

## 10. Effects & Param Modulation
- Typical param names: `gain`, `pan`, `attack`, `decay`, `release`, `filter`, `res`, etc.
- Parameters accept either constants or patterns: `lead.pan(noise().scale(-0.5,0.5))`.
- Periodic automation: `paramPattern.every(8, p=>p.rev)` trick for modulation reversal.

## 11. Random / Noise Signals
- `noise()` fast-changing random; consider smoothing or smoothed noise for gentle modulation.
- Scale mapping helper: `.scale(min,max)` on numeric patterns.

## 12. Higher-Order Functions
- `map(fn)` transform each event.
- `filter(fn)` drop events failing predicate.
- `flatMap(fn)` expand single events into subpatterns.

## 13. State & Variables
- Assign: `let drums = sample`bd sd hh`;` reassign evolves live output next cycle.
- Functional composition: `const accent = p => p.gain(1.2)` then `drums = accent(drums.every(4, x=>x.fast(2)))`.

## 14. Live Coding Strategy
- Begin sparse; add layers gradually.
- Use `every` for structural periodicity, `sometimes` for micro-variation.
- Keep a stable motif; vary supporting textures.
- Introduce chords with long `slow` factors for evolving pads.

## 15. Debugging / Auditing
- Temporarily `slow(4)` complex layers to examine rhythm.
- Isolate suspicious transform by commenting others (or assigning intermediate variables).

## 16. Example Snippet
```
drums = sample`bd ~ bd sd` .fast(2)
	.every(4, p => p.rev)
	.sometimes(p => p.degradeBy(0.25))

bass = note`0 0 3 5` .octave(2).slow(2)
	.every(8, p => p.rot(1))

pad = chord`c4m7 f4maj7 g4sus` .arp('up').slow(4)
	.gain(0.4).pan(noise().scale(-0.3,0.3))

stack(drums, bass, pad)
```

## 17. Design Patterns
- Base + Variation: anchor pattern plus an `every` fill overlay.
- Masking: rhythmic mask via `euclid` applied late in chain.
- Density bursts: inside `every(n, p=>p.fast(k))` for fill injection.
- Ornament layer: quiet probabilistic pitch or percussive ticks.

## 18. Performance / Cautions
- Extreme `fast()` factors risk scheduler overload.
- Too many stacked random sources complicate reproducibility.
- Keep gain staging moderate to avoid clipping when stacking.

## 19. Extensibility
- Custom transform = function returning pattern.
- External assets loaded separately and referenced by name tokens.

## 20. Idea Checklist
1. Choose tempo & cycle scope.
2. Establish core rhythm.
3. Pick scale & register.
4. Define motif pattern.
5. Add periodic transform hooks (`every`).
6. Layer harmony / texture.
7. Insert probabilistic spice.
8. Adjust dynamics & spatialization.

---
Request deeper dive or examples for any section.

---
Request deeper dive or examples for any section.