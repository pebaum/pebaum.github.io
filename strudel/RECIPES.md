# Strudel Recipes (Genre Archetypes)

All examples paraphrased/original. Adjust instrument/sample naming to your environment.

## 1. Ambient Pad + Sparse Bells
```js
scale('lydian')
pad = chord`c4maj7 d4add9 e4sus2`.arp('up').slow(16).gain(0.5)
  .pan(noise().scale(-0.4,0.4))
  .every(32, p=>p.rev)

bells = note`c5 g5 e5`.sometimesBy(0.3, x=>x.up(12))
  .slow(4).degradeBy(0.6).gain(0.4)

space = stack(pad, bells)
```

## 2. Minimal Techno Pulse
```js
kick = sample`bd ~ bd ~`.gain(0.9)
hat  = sample`hh hh hh hh`.degradeBy(0.3).every(8, x=>x.fast(2))
perc = sample`~ cp ~ cp`.sometimes(x=>x.rev)
loop = stack(kick, hat, perc)
```

## 3. Breakbeat Skeleton
```js
amen = sample`bd sd hh bd bd sd hh sd`.fast(2)
vari = amen.every(4, x=>x.rev.fast(2))
sub  = note`0 ~ 0 0 ~ 0 3 5`.octave(1).slow(2)
break = stack(vari, sub)
```

## 4. Lo-Fi Hip Hop
```js
kick = sample`bd ~ bd ~`.slow(2)
snare= sample`~ sd ~ sd`.slow(2).gain(0.8)
hats = sample`hh ~ hh ~`.degradeBy(0.4)
chrd = chord`c4m7 f4m7 d4m7 g4m7`.arp('up').slow(8).gain(0.5)
vinyl= noise().scale(-0.1,0.1) // conceptual background layer
beat = stack(kick, snare, hats, chrd)
```

## 5. Cinematic Ostinato + Swell
```js
ost = note`0 5 3 2`.fast(2).every(8, p=>p.rot(1))
low = note`0 ~ 0 -2`.octave(1).slow(4).gain(0.7)
swell = chord`c4m9`.arp('up').slow(32).gain(0.4).every(64,p=>p.rev)
score = stack(ost, low, swell)
```

## 6. Dungeon Synth Drone
```js
bass = note`0 -2 -5 -7`.octave(1).slow(16)
choir= chord`c4m g3m f3m`.slow(24).arp('up').gain(0.4)
mel  = note`0 2 3 5`.slow(8).sometimesBy(0.2,x=>x.up(12))
dungeon = stack(bass, choir, mel)
```

## 7. Polyrhythmic Percussion (5 over 4)
```js
p5 = sample`bd ~ bd ~ bd`.stretch(5)
p4 = sample`~ sd sd ~`.stretch(4)
poly = stack(p5, p4)
```

## 8. Evolving Filtered Groove
```js
core = sample`bd ~ bd sd`.fast(2)
hats = sample`hh hh hh hh`.gain(0.5).degradeBy(0.3)
lfSweep = sine(0.005).scale(200, 3000)
core = core.filter(lfSweep)
combo = stack(core, hats)
```

## 9. Random Bell Garden
```js
bells = note`0 4 7 11`.sometimes(x=>x.up(12))
  .degradeBy(0.7).slow(4)
  .pan(noise().scale(-0.6,0.6))
```

## 10. High-Energy Fill Injection
```js
base = sample`bd ~ bd sd`
fill = base.fast(4).rev
base = base.every(8, _=>fill)
```

Add more requests and they can be slotted here.
