# Runtime Compatibility Checklist (Strudel Playground)

Goal: Ensure every example in this folder runs in https://strudel.cc/ (current public playground) or your local Strudel build.

Because we cannot execute Strudel code from here, below is a pragmatic self‑test protocol plus a line‑item audit of potential *non‑canonical* or *speculative* constructs used in the docs.

---
## 1. Quick Self‑Test Protocol (Copy/Paste Order)
1. Open https://strudel.cc/ (wait for audio context ready).  
2. Paste a **minimal heartbeat** to verify sound:
```js
sample`bd sd bd sd`
```
3. Test core transforms:
```js
sample`bd ~ bd sd`.fast(2).rev
```
4. Test probability skeleton (should not throw):
```js
sample`bd sd hh`.sometimes(x=>x.rev).every(4, p=>p.fast(2))
```
5. Test Euclidean (if built-in):
```js
euclid(3,8)
```
If `euclid` is not defined, mark it missing below.
6. Proceed through each recipe & reference snippet; when a function name errors (console), log it in a TODO list.

---
## 2. Commonly Supported (Baseline) vs. Needs Verification
| Category | Likely Safe (Baseline) | Needs Verification / Placeholder |
|----------|------------------------|----------------------------------|
| Core pattern literal | backtick forms like `sample`bd sd`` | advanced nested bracket semantics |
| Time transforms | fast, slow, stretch, rev, palindrome, rot | shift, delay, linger (naming may differ) |
| Structure | stack, then/with (if implemented), interlace | weave (mentioned conceptually) |
| Rhythm algos | euclid (if present) | mask, gatedMask custom wrapper |
| Probability | sometimes, sometimesBy, degrade, degradeBy, choose | pick(weighted) (verify signature) |
| Pitch/harmony | note, chord, scale, arp, up/down/octave | chord symbol variants beyond basic triads/7ths |
| Samples | sample tokens bd/sd/hh | cut (choke) group naming may differ |
| Params | gain, pan, rate | filter, res, attack/decay/release (synth-dependent) |
| Modulation | noise, sine | perlin, square, .scale() on noise output (verify) |
| Higher-order | map, filter, flatMap | .withDuration, .delay on event objects (depends) |
| Introspection | Object.getOwnPropertyNames(...) (browser JS) | pattern.eventsAt / .atIndex (speculative) |
| Custom utils | ratchet (via flatMap), swing (map) | densityRamp storing metadata (no engine effect) |

---
## 3. Constructs Flagged for Manual Verification
These appear in docs and may not exist natively (either conceptual or engine-version dependent):
- `linger()` – used conceptually to extend duration. If absent, emulate by repeating/overlap or using a sustain/length param.
- `mask()` – if not available, replace: `pattern * euclid(...)` (depends on engine syntax) or `stack(pattern.filter(...))` approach.
- `gatedMask`, `probabilisticAccent`, `densityRamp` – custom transform utilities; require actual event API (e.g., ev.gain, ev.duration, ev.delay, ev.withDuration). Adjust based on real event property names.
- `withDuration()` – event mutation helper assumed; may need alternative (e.g., constructing a new event object depending on Strudel internals).
- `perlin()` – smoothed noise placeholder; if absent, approximate with chained low-frequency `sine()` and `noise()` mixing.
- `square()` LFO – if not built-in, derive from sine: `square = sine(freq).map(x=> x>0?1:-1)`.
- `.scale(min,max)` on modulation outputs – if not built-in on number patterns, implement manually: `p.map(v => min + (max-min)*v)`.
- `.sampleAt()` / `.at(i)` for numeric modulation patterns – placeholders; adapt to actual API (maybe just treat patterns as functions or approximate using index math inside `map`).
- `.repeat(n)` in modulation examples – conceptual; replicate by `flatMap` or manual duplication.
- `.filter(freq)` as a direct parameter – may need instrument-specific param name or a low-pass wrapper (e.g., `lp(freq)` if provided).
- `cut(n)` – depends on sample engine; if no choke groups, remove.
- `arp('pingpong')` – verify accepted mode strings; fallback to 'up'/'down'.
- Weighted choice `pick([[val,weight],...])` – if missing, write custom: `weighted = (arr) => { const sum=arr.reduce(...); ... }`.

---
## 4. Suggested Fallback Rewrites
If a snippet fails, try these patterns:
```js
// Replace linger
const linger = (p, factor=2) => p.flatMap(ev => [ev, ev.delay(ev.duration/factor)]);

// Replace mask
const applyMask = (base, boolArray) => base.flatMap((ev,i)=> boolArray[i % boolArray.length] ? [ev] : []);

// Replace perlin
const perlin = (freq=0.01) => sine(freq).map((v,i)=> (v + sine(freq*0.5).at(i))/2 );
```

---
## 5. Step-by-Step Verification Log Template
Copy this table and fill as you test:
| File | Snippet / Line Ref | Construct | Status (OK / Missing / Replaced) | Notes |
|------|--------------------|-----------|----------------------------------|-------|
| REFERENCE.md | Section 16 Example Snippet | .sometimes, .degradeBy | OK |  |
| MODULATION_COOKBOOK.md | #2 Dual LFO Crossfade | perlin, .map chaining | Missing perlin – replaced with custom |  |

---
## 6. Minimal Guaranteed-Subset Pattern Set
If you need a 100% safe base before verifying advanced: use only:
- Literals: `sample`, `note`, `chord`, `scale`
- Transforms: `fast`, `slow`, `stretch`, `rev`, `palindrome`, `rot`, `every`, `sometimes`, `sometimesBy`, `degrade`, `degradeBy`, `stack`
- Rhythm: `euclid` (if available) otherwise manual patterns
- Probability: `choose`

Everything else is incremental sugar or needs runtime inspection.

---
## 7. Action Items To Achieve "Runnable"
1. Run `API_ENUMERATION.md` scripts.
2. Populate `API_ENUMERATION_RESULTS.md` with outputs.
3. Mark each uncertain construct above as confirmed or replaced.
4. Apply edits to files referencing removed constructs.
5. (Optional) Add compatibility badges inside each doc section once confirmed.

---
## 8. Provide Results
After you paste the enumeration + any missing symbol list, I can: 
- Auto-patch all docs replacing or annotating unsupported constructs.
- Generate a "strict mode" version of each code example using only confirmed APIs.

---
Return here after the first enumeration pass.
