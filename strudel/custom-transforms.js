// Custom Strudel Transform Utilities (conceptual / paraphrased)
// These assume availability of pattern objects with map / flatMap / etc.
// Verify actual API names in a live Strudel runtime before use.

export const swing = (amount = 0.1) => pattern =>
  pattern.map((ev, i) => i % 2 === 1 ? ev.delay(amount * ev.duration) : ev);

export const ratchet = (repeats = 3, scale = 1) => pattern =>
  pattern.flatMap(ev => Array.from({length: repeats}, (_, i) =>
    ev.delay(i * ev.duration * scale / repeats).withDuration(ev.duration / repeats)));

export const densityRamp = (start = 1, end = 4, cycles = 16) => pattern => {
  return pattern.map(ev => {
    const phase = (ev.cycle % cycles) / cycles; // 0..1
    const factor = start + (end - start) * phase;
    return ev.with("densityFactor", factor); // conceptual metadata
  });
};

export const gatedMask = (maskPattern) => pattern =>
  pattern.flatMap((ev, i) => maskPattern.atIndex ? (maskPattern.atIndex(i) ? [ev] : []) : [ev]);

export const probabilisticAccent = (p = 0.2, gainBoost = 0.3) => pattern =>
  pattern.map(ev => (Math.random() < p) ? ev.gain(ev.gain * (1 + gainBoost)) : ev);

export const chordSpread = (semitones = [0,7,12]) => pattern =>
  pattern.flatMap(ev => semitones.map(st => ev.up(st)));

export const jitter = (maxMs = 0.01) => pattern =>
  pattern.map(ev => ev.delay((Math.random() - 0.5) * maxMs));

export const fadeInOut = (totalCycles = 64, inCycles = 8, outCycles = 8) => pattern =>
  pattern.map(ev => {
    const pos = ev.cycle % totalCycles;
    let scale = 1;
    if (pos < inCycles) scale = pos / inCycles; else if (pos > totalCycles - outCycles) scale = (totalCycles - pos) / outCycles;
    return ev.gain(ev.gain * Math.max(0, Math.min(1, scale)));
  });

export const stutterEvery = (n = 8, reps = 4) => pattern =>
  pattern.every ? pattern.every(n, p => ratchet(reps)(p)) : pattern; // if every exists

// Register or compose these in your live environment as needed.
