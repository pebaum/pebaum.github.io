# Pattern Test Harness (Conceptual)

If you have access to the pattern engine objects in JavaScript, you can simulate a few cycles to inspect events. Below is a conceptual harness; adapt to actual Strudel APIs.

```js
function collect(pattern, cycles = 2, resolution = 64) {
  const events = [];
  for (let c = 0; c < cycles; c++) {
    for (let step = 0; step < resolution; step++) {
      const t = c + step / resolution; // fractional cycle time
      const evs = pattern.eventsAt ? pattern.eventsAt(t) : [];
      evs.forEach(ev => {
        events.push({
          cycle: c,
            local: step / resolution,
            absTime: t,
            value: ev.note || ev.sample || ev.value,
            gain: ev.gain,
            dur: ev.duration
        });
      });
    }
  }
  return events;
}

// Example usage
// const out = collect(note`0 2 4 7`.fast(2), 4);
// console.table(out.slice(0,20));
```

## Notes
- Replace `eventsAt` with the actual method Strudel exposes for event queries (if any). Some implementations compute events on-the-fly by cycle boundaries instead of arbitrary sample times.
- Adjust `resolution` upward (128/256) for finer temporal granularity.
- Extend to export CSV for analysis.

## CSV Export Snippet
```js
function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
  return lines.join('\n');
}

// console.log(toCSV(out));
```

## Automated Comparison
You can snapshot before/after applying a transform to verify structure changes.

```js
function diff(before, after) {
  // naive: compare lengths & first mismatching event
  if (before.length !== after.length) console.log('Event count changed', before.length, '->', after.length);
  for (let i=0;i<Math.min(before.length, after.length);i++) {
    if (before[i].value !== after[i].value) {
      console.log('Value diverges at index', i, before[i], after[i]);
      break;
    }
  }
}
```

---
Enhance this harness once real runtime introspection is available.
