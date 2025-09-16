# Modulation Cookbook (Paraphrased)

Goal: Provide reusable modulation idioms for movement, evolution, and dynamics.

## 1. Slow Filter Sweep
```js
filtLFO = sine(0.01).scale(300, 4000)
lead = lead.filter(filtLFO)
```

## 2. Dual LFO Crossfade
```js
lfoA = sine(0.03).scale(0,1)
lfoB = perlin(0.005).scale(0,1)
blend = lfoA.map((v,i)=> v*0.7 + lfoB.at(i)*0.3) // conceptual combination
pad = pad.gain(blend.scale(0.4,0.8))
```

## 3. Random Stutter Probability Curve
```js
curve = perlin(0.002).scale(0,1)
beat = beat.map(ev => (curve.sampleAt(ev.cycle) > 0.7) ? ev.fast(2) : ev)
```

## 4. Evolving Stereo Orbit
```js
orbit = sine(0.02).scale(-0.8,0.8)
layer = layer.pan(orbit)
```

## 5. Density Over Time (Macro Build)
```js
build = perlin(0.001).scale(1,4)
drums = drums.map(ev => ev.repeat(build.sampleAt(ev.cycle))) // conceptual repeat
```

## 6. Probabilistic Accent LFO Gate
```js
gate = sine(0.05).scale(0,1)
accented = hats.map(ev => gate.sampleAt(ev.cycle) > 0.6 ? ev.gain(ev.gain*1.3): ev)
```

## 7. Dynamic Chord Inversion Rotation
```js
invLFO = sine(0.005).scale(0,3)
pad = pad.map((ev,i) => ev.up(12 * Math.floor(invLFO.sampleAt(ev.cycle))))
```

## 8. Timbre Shift via Rate & Filter Pairing
```js
mod = sine(0.015).scale(0.5,1.5)
voice = voice.rate(mod).filter(mod.scale(500,5000))
```

## 9. Rhythmic Gate (Tremolo)
```js
trem = square(0.25).scale(0.2,1) // if square available; else threshold sine
pad = pad.gain(trem)
```

## 10. Multi-Layer Pan Field
```js
l = lead.pan(sine(0.03).scale(-0.6,0.6))
p = pad.pan(perlin(0.002).scale(-0.4,0.4))
dr = drums.pan(noise().scale(-0.1,0.1))
```

## Notes
- Actual invocation of `.sampleAt`, `.at(i)`, `repeat`, or waveform constructors depends on runtime; treat as conceptual placeholders.
- Combine modulation sources by arithmetic mapping functions before applying.

Extend as runtime confirms naming specifics.
