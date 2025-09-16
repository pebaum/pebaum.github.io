# Strudel Comprehensive Reference (Paraphrased)

> Purpose: A broad, example-rich catalog of Strudel live-coding techniques. All wording and examples are original, not copied from official docs. Verify exact function names/arguments in the running environment; slight naming differences may exist between versions.

## Table of Contents
1. Core Concepts
2. Pattern Literals & Tokens
3. Grouping, Alternation & Nesting
4. Time, Tempo & Cycles
5. Duration & Density Control
6. Structural Combinators
7. Ordering & Reordering
8. Slicing, Windowing, Segmentation
9. Probability & Randomness
10. Conditional & Periodic Transforms
11. Euclidean & Algorithmic Rhythms
12. Pitch, Scales & Harmony
13. Chords & Arpeggiation
14. Samples, Synths & Voices
15. Event Attributes & Parameter Mapping
16. Modulation Sources (LFO / Noise / Functions)
17. Higher-Order Pattern Functions
18. Numeric Pattern Math & Value Utilities
19. Masking & Gating Techniques
20. Fills, Variations & Arrangement Macros
21. Ghost Notes, Accents & Humanization
22. Dynamic Layering & Build/Drop Strategies
23. Custom Transforms / Extensibility
24. Interfacing (MIDI, External Params) [Conceptual]
25. Debugging & Inspection
26. Performance Best Practices
27. Architectural Patterns & Recipes
28. Idea Starters

---
## 1. Core Concepts
A Pattern is a pure function of time producing zero or more events per cycle. Transformations wrap patterns, yielding new ones without side-effects. Live coding reassigns variables; engine schedules seamlessly at cycle boundaries.

```js
// Minimal loop (symbolic drums)
drums = sample`bd sd bd sd`
```

## 2. Pattern Literals & Tokens
- Space-separated tokens repeat each cycle.
- Rests: `~` (or `_`).
- Nested pattern: parentheses `( ... )`.
- Bracket groups used for subdivisions/expansions: `[bd hh sd]` (interpretation context-dependent).
- Backtick tagged templates: `` note`c4 e4 g4` ``.

```js
rhythm = sample`bd ~ bd sd`
mel    = note`c4 e4 g4 e4`
```

## 3. Grouping, Alternation & Nesting
Group to change local subdivision or apply transforms locally.
```js
combo = sample`bd (sd sd) bd (hh [hh hh])`
alt   = sample`[bd sd] hh [bd hh sd] hh`
```

## 4. Time, Tempo & Cycles
Key transforms (names may vary):
- `fast(n)`, `slow(n)` – density scaling.
- `stretch(n)` – span multiple cycles.
- `shift(f)` – phase offset (fraction of cycle).
- `delay(f)` – add temporal offset (post-phase).
- `rev`, `palindrome` – reversal strategies.
- `rot(n)` – rotate event order.

```js
busy = sample`bd sd hh hh`.fast(2)
sludgy = note`0 3 5 7`.slow(4)
```

## 5. Duration & Density Control
Implicit duration = 1/(events per cycle). Extend via transforms or explicit attribute patterns.
```js
legato = note`c4 e4 g4`.linger(0.25)  // extend sustain
burst  = sample`bd sd`.fast(4).degradeBy(0.4)
```

## 6. Structural Combinators
- `stack(a,b,...)` – parallel merge.
- `then` / concatenation – sequence across cycles.
- `with` – overlay preserving base reference.
- `interlace(a,b)` – alternate events.
- `weave(a,b,n)` – (if available) ratio-based interleaving.

```js
beat  = sample`bd ~ bd sd`
hats  = sample`hh hh hh hh`
layer = stack(beat, hats)
phrase = beat.then(beat.fast(2))
```

## 7. Ordering & Reordering
- `rev`, `palindrome`, `rot(n)`, `scramble`, `shuffle`, `mirror`.
```js
fill = sample`bd sd hh hh`.scramble.every(4, p=>p.rev)
```

## 8. Slicing, Windowing, Segmentation
- `slice(a,b)` – fractional subsection.
- `take(n)` / `drop(n)` – event count based (if implemented).
- `zoom(a,b, fn)` – apply transform inside a window.
```js
midHalf = mel.slice(0.25,0.75)
```

## 9. Probability & Randomness
- `sometimes(fn)`, `sometimesBy(p, fn)`.
- `degrade`, `degradeBy(p)` – mute events.
- `choose(a,b,c)`, `pick([[val,weight], ...])`.
- `rand`, `irand(n)` – numeric random sources.
```js
snareVar = sample`sd`.sometimes(x=>x.rate(0.5)).degradeBy(0.7)
```

## 10. Conditional & Periodic Transforms
- `every(n, fn)` – periodic.
- `when(pred, fn)` – event predicate.
- `within(a,b, fn)` – windowed transform.
```js
beat = sample`bd ~ bd sd`
beat = beat.every(4, p=>p.fast(2).rev)
```

## 11. Euclidean & Algorithmic Rhythms
- `euclid(pulses, steps, offset)` returns rhythmic mask.
- Apply via `.mask(maskPattern)` or multiply semantics.
```js
mask  = euclid(3,8)
claps = sample`cp`.mask(mask)
```

## 12. Pitch, Scales & Harmony
- Global scale: `scale('dorian')`.
- Degree patterns: numeric tokens map into scale.
- Transposition: `up(n)`, `down(n)`, `transpose(semi)`.
- Octaves: `.octave(n)` or add 12 semitone offset.
```js
scale('aeolian')
lead = note`0 2 3 5 7 5 3 2`
lead = lead.every(8, p=>p.up(12))
```

## 13. Chords & Arpeggiation
- Chord literals: `` chord`c4m7 f4maj7 g4sus` ``.
- Arp: `.arp('up'|'down'|'random'|'pingpong')`.
- Spread over time: slow factor or `arp` feeding a note pattern.
```js
pad = chord`c4m7 f4maj7 g4sus`.arp('up').slow(4).gain(0.4)
```

## 14. Samples, Synths & Voices
- Drum tokens: `bd sd hh cp` etc. (implementation dependent).
- Voice variables: `let d1 = sample`bd sd``.
- Choke groups: `.cut(n)`.
- Playback rate: `.rate(f)`.
```js
drums = sample`bd sd hh hh`.cut(1)
```

## 15. Event Attributes & Parameter Mapping
Common (engine-specific) attribute setters:
- `gain(v)`, `pan(v)`
- `attack(v)`, `decay(v)`, `sustain(v)`, `release(v)`
- `filter(freq)`, `res(q)`
- `shape(fn)` generic remap
```js
lead = note`c4 e4 g4`.gain(0.7).pan(-0.2)
lead = lead.every(8, p=>p.pan(0.2))
```

## 16. Modulation Sources
- `noise()` – rapid random.
- `perlin()` – smoothed noise.
- `sine(freq)` (if provided) – LFO-like.
- Map range: `.scale(min,max)`.
```js
pad = pad.pan(noise().scale(-0.5,0.5))
```

## 17. Higher-Order Pattern Functions
- `map(fn)` modify each event.
- `filter(fn)` keep subset.
- `flatMap(fn)` expand one event into many.
- `zip(a,b)` combine event-wise.
```js
accented = drums.map(ev => ev.index % 4 === 0 ? ev.gain(1.2) : ev)
```

## 18. Numeric Pattern Math & Utilities
- Arithmetic: `pattern.add(n)`, `pattern.mul(n)` (or overloaded operators depending on environment).
- Clamp: `.clamp(min,max)`.
- Scale: `.scale(min,max)`.
```js
lfo = sine(0.1).scale(200,1200) // filter sweep
```

## 19. Masking & Gating
Apply mask pattern to silence positions.
```js
mask = euclid(5,13)
voice = note`0 2 4 5 7`.mask(mask)
```

## 20. Fills, Variations & Arrangement Macros
Technique: Keep a core; overlay periodic fill.
```js
core = sample`bd ~ bd sd`
fill = core.fast(2).rev
core = core.every(8, _=>fill)
```

## 21. Ghost Notes, Accents & Humanization
- Ghost layer with low gain & heavy `degradeBy`.
- Micro timing shift (if `nudge` or `shiftEvents` available).
```js
ghost = sample`sd`.gain(0.25).degradeBy(0.8)
stack(core, ghost)
```

## 22. Dynamic Layering & Build/Drop
Introduce layers with conditional transforms or manual reassign.
```js
layers = stack(core, hats)
layers = layers.every(16, p=>stack(p, claps))
```

## 23. Custom Transforms / Extensibility
Write a function taking a pattern returning transformed pattern.
```js
const stutter = (p, n=3) => p.flatMap(ev => Array(n).fill(ev).map((e,i)=>e.delay(i/n/8)))
lead = stutter(lead.every(8, x=>x.up(12)), 4)
```

## 24. Interfacing (Conceptual)
- MIDI out: map pattern events to external device (depends on host integration).
- Parameter export: route numeric pattern to a synth parameter.

## 25. Debugging & Inspection
- `show(pattern)` style helpers (name may vary) to print upcoming events.
- Temporarily slow patterns to audit ordering.

## 26. Performance Best Practices
- Avoid uncontrolled recursion or explosive `flatMap` branching.
- Limit extreme `fast()` layering to preserve scheduler stability.
- Keep gain headroom; apply gentle master limiting externally.

## 27. Architectural Patterns & Recipes
- Base + Variation layering
- Mask gating for tension release
- Probabilistic spice on separate low-level tracks
- Chord pad + sparse melodic counterpoint

## 28. Idea Starters
```js
// Converging polyrhythm
poly = stack(sample`bd ~ bd ~`, sample`~ sd ~ sd`.shift(0.125))

// Gradually evolving pad
pad = chord`c4m7 am7 fm7 gm7`.arp('up').slow(8)
pad = pad.every(16, p=>p.rev)

// Random bell accents
bells = note`c5 e5 g5 b5`.sometimesBy(0.3, p=>p.up(12)).degradeBy(0.6)
```

---
Add or request any missing API areas and we can expand further.
 
## 29. API Enumeration Strategy (Meta)
Because names/features can evolve, the truly exhaustive approach is runtime introspection in a live Strudel session:
```js
// List top-level functions that look pattern related
Object.keys(window)
	.filter(k => /pattern|euclid|scale|noise|rand|chord/i.test(k))
	.sort();

// Inspect prototype of an existing pattern instance `p`
const p = note`0 1`; Object.getOwnPropertyNames(Object.getPrototypeOf(p)).sort();

// Dump method signatures heuristically
for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(p))) {
	const v = p[name];
	if (typeof v === 'function') console.log(name, v.length);
}
```
Use that list to cross-check gaps in this document.

## 30. Advanced Timing & Microtiming
- Swing: If no built-in swing helper, emulate by delaying every second subdivision: `pattern.map((ev,i)=> i%2? ev.delay(swingAmt): ev)`.
- Human timing: small random jitter: `.map(ev => ev.delay((rand-0.5)*0.01))` (assuming `rand` sampled per event; else define jitter function).
- Per-event `nudge` (if available) to apply millisecond offsets without shifting pattern phase.
- Multi-rate overlay: different cycle lengths (e.g., slow pad `.stretch(8)` vs. fast hats `.fast(2)`).

## 31. Polymeter & Polyrhythm Techniques
- Different pattern lengths stacked: `stack(a.stretch(5), b.stretch(4))` to force evolving alignment.
- Euclidean mix: overlay `euclid(5,13)` with `euclid(3,8)` for rotating composite accent grid.
- Phase shifting: `sequence.shift(f)` vs. base unshifted reference to mimic Steve Reich style drift.

## 32. Cross-Rhythm & Metric Modulation
- Temporarily reinterpret a pattern's internal subdivision: inside `every(16, p=>p.fast(3).slow(2))` to simulate metric modulation segment.
- Use `slice` paired with `stretch` to reframe a small fragment as a longer structural gesture.

## 33. Generative Algorithms (Userland Patterns)
Markov chains:
```js
const markov = (transitions, start) => {
	let cur = start;
	return () => {
		const opts = transitions[cur] || [start];
		cur = opts[Math.floor(Math.random()*opts.length)];
		return cur;
	};
};
// Use generator each event
const gen = markov({c:['e','g'], e:['g','c'], g:['c','e']}, 'c');
mel = note`${Array.from({length:8}, _=> gen()+ '4').join(' ')}`
```
L-systems / grammar expansions: create a rewrite loop to produce token strings then feed pattern literal.

## 34. State Machines & Adaptive Patterns
- Maintain external state object; map events altering future decisions.
- Adaptive intensity: accumulate energy score, swap in denser variant when threshold reached.
```js
let energy = 0;
drums = drums.map(ev => { energy += 0.1; return energy>8 ? ev.gain(1.1) : ev; });
```
Reset energy periodically with `every(n, ...)`.

## 35. Context-Aware Arrangement (Energy Curves)
Define macro envelope for the set: numeric pattern controlling layering.
```js
energyCurve = [0,1,2,3,4,5,6,7,8,7,5,3,1].map(x=>x/8);
// Pseudo: use curve index per cycle to decide which layers to include.
```
Switch stacks conditionally based on cycle index or modulo math.

## 36. Multi-Scale Modulation (Macro / Meso / Micro)
- Macro: `slow(32)` evolving filter sweep.
- Meso: `every(8, p=>p.rev)` phrase-level shift.
- Micro: per-event jitter or small pan noise.
Combine by chaining: `pad.filter( macroFilter ).every(8, ... ).map(microJitter)`.

## 37. Recording / Export Strategies (Conceptual)
- Browser capture: route master to MediaRecorder (if environment exposes audio context) for offline WAV.
- Reproducibility: seed random (if seeding supported) or log chosen random numbers.
- Event log: accumulate events with timestamps for later DAW import (MIDI export conceptually).

## 38. Memory & CPU Optimization
- Avoid deep `flatMap` multipliers; precompute repeating expansions.
- Reuse noise/LFO patterns across layers instead of instantiating duplicates.
- Limit high-frequency parameter modulation (e.g., per-event filter sweeps on dense hats).
- Collapse chains: combine related transforms into single `map` to minimize overhead.

## 39. Troubleshooting & Common Pitfalls
| Symptom | Likely Cause | Mitigation |
|---------|--------------|-----------|
| Audio crackle | Too many simultaneous events | Reduce density, consolidate layers |
| Pattern drifts unexpectedly | Phase shift or stretch mismatch | Reset transformations; compare against metronome pattern |
| Random results not reproducible | No random seeding | Implement or simulate seed by own RNG |
| Overly loud mix | Gain stacking | Normalize each layer to <0.7 gain |
| CPU spikes on fills | `fast()` inside nested `every` | Pre-render fill variant pattern |

## 40. Gap Analysis & Potential Missing Areas
Below are areas that may exist in the actual Strudel implementation but need runtime confirmation:
- Additional pattern math helpers (e.g., `integrate`, `differentiate`).
- Built-in scale/chord catalogs (list not enumerated here).
- Advanced scheduling hooks (latency compensation, lookahead configuration).
- MIDI/OSC bridging utilities.
- UI-specific functions (if using a playground interface) for focusing, resetting audio context.
- Pattern serialization / deserialization helpers.

## 41. Next Expansion Options
1. Create `RECIPES.md` for genre archetypes.
2. Provide `custom-transforms.js` with reusable higher-order utilities (stutter, ratchet, swing, densityRamp, gateSeq, euclidFill).
3. Add `API_ENUMERATION.md` instructions + copy/paste snippet for user to generate a concrete function list in current Strudel build.
4. Add pattern testing harness (simulate a few cycles and print event timeline) if environment accessible.

Let me know which of these you want implemented next and I will scaffold them.
