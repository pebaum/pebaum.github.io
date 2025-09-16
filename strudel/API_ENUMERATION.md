# Strudel API Enumeration Guide

Goal: Produce a concrete list of functions/methods available in your current Strudel runtime to reconcile with the paraphrased docs.

## 1. Open Strudel Environment
Open the Strudel web playground or your local integration where `note`, `sample`, etc. are defined.

## 2. Capture Global Candidates
Paste and run:
```js
const globalPatternish = Object.keys(window)
  .filter(k => /note|sample|scale|euclid|noise|rand|chord|pattern|arp|fast|slow|stack/i.test(k))
  .sort();
console.log('Global candidates:', globalPatternish);
```

## 3. Inspect a Pattern Instance
```js
const test = note`0 1 2`;
const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(test))
  .filter(n => typeof test[n] === 'function')
  .sort();
console.log('Pattern prototype methods:', protoMethods);
```

## 4. Dump Signatures (Arity Heuristic)
```js
for (const name of protoMethods) {
  const fn = test[name];
  console.log(name, 'arity=', fn.length);
}
```

## 5. Capture Parameter Patterns
If attributes produce dynamic pattern wrappers:
```js
['gain','pan','rate','filter','res','attack','decay','release']
  .forEach(a => { if (typeof test[a] === 'function') console.log(a,'setter length', test[a].length); });
```

## 6. Export Results
Select console output, copy, and paste into `API_ENUMERATION_RESULTS.md` (create it). Then we can diff our docs vs discovered list.

## 7. Optional: Serialize For Offline
```js
const api = { globals: globalPatternish, methods: protoMethods };
console.log(JSON.stringify(api, null, 2));
```

## 8. Next Step
After you provide the results, we will: 
1. Align missing items.
2. Add any undocumented transforms.
3. Mark unknown or deprecated functions.

---
Use this anytime after Strudel updates.
