# Strudel Docs Workspace

This folder will hold summarized, paraphrased references for Strudel (https://strudel.cc) so we can compose algorithmic music patterns locally without copying proprietary site content verbatim.

## Contents
- `SUMMARY.md` – Concise paraphrased core concepts.
- `cheatsheet.md` – Quick-reference transforms & idioms.
- `REFERENCE.md` – Comprehensive multi-section deep dive (patterns, rhythm, harmony, probability, performance, troubleshooting, meta-introspection).
- `RECIPES.md` – Genre/texture archetype starting points.
- `HARMONY_APPENDIX.md` – Scales, chord formulas, voice-leading notes.
- `MODULATION_COOKBOOK.md` – LFO/noise/dynamic modulation patterns.
- `API_ENUMERATION.md` – How to introspect live runtime & produce method inventory.
- `custom-transforms.js` – Reusable higher-order transform utilities (swing, ratchet, etc.).
- `TEST_HARNESS.md` – Conceptual event collection & diff harness.
- `examples/` – Space for bespoke composition snippets.
- (Optional future) `API_ENUMERATION_RESULTS.md` – Paste actual runtime export for gap reconciliation.

## Approach
Because we should avoid bulk copying the official documentation, we'll instead:
1. Visit the Strudel Learn pages manually when needed.
2. Paraphrase key concepts into concise bullet points here.
3. Add our own derived examples.

## Planned Sections for SUMMARY.md
- Core concepts (patterns, time, cycles)
- Basic syntax (literals, sequences, transformations)
- Scheduling & tempo
- Sound sources & samples
- Effects / transformations
- Pattern combinators (stack, concat, interleave)
- Euclidean / rhythmic helpers
- Scale, chord, note helpers
- Randomization & probability
- State & variables
- Live coding tips

This workspace is now structured for near-exhaustive coverage. Remaining unknowns require live runtime enumeration (run scripts in `API_ENUMERATION.md`).

Next ways to extend:
1. Provide enumeration results so we fill any undocumented methods.
2. Request a specific composition brief.
3. Ask for automated comparison scripts once runtime APIs confirmed.

Describe any musical idea (e.g., "evolving 5-over-7 polyrhythmic ambient pad with granular bells every 11 cycles") and we’ll generate Strudel code plus commentary.