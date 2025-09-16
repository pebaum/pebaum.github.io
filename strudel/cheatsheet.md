# Strudel Quick Cheatsheet

Concise paraphrased reference. Adjust as needed.

## Core Patterns
```
sample`bd sd bd sd`
note`c4 e4 g4 e4`
note`0 2 4 7`
"bd ~ bd sd"          # rest with ~
stack(a,b,c)
interlace(a,b)
```

## Time & Flow
```
p.fast(2)        # denser
p.slow(2)        # sparser
p.stretch(4)     # span 4 cycles
p.shift(0.25)    # phase shift
p.rev            # reverse
p.palindrome     # forward + backward
```

## Variation
```
p.every(4, x=>x.rev)
p.sometimes(x=>x.degrade)
p.sometimesBy(0.3, x=>x.rot(1))
p.degradeBy(0.2)
```

## Rhythmic Helpers
```
mask = euclid(3,8)
drums.mask(mask)
```

## Combining
```
a.then(b)    # sequential
a.with(b)    # overlay
stack(a,b)
```

## Pitch & Harmony
```
scale('dorian')
note`0 2 3 5`.octave(2)
chord`c4m7 g4sus f4maj7`
pad.arp('up')
pad.up(12)
```

## Samples & Params
```
dr = sample`bd sd hh`.gain(0.9).pan(-0.2)
dr.rate(0.5)
dr.cut(1)
```

## Modulation
```
lead.pan(noise().scale(-0.5,0.5))
pad.filter( lp(800) )  # conceptual low-pass helper
```

## Random Helpers
```
choose('bd','sd','hh')
pick([["bd",3],["sd",1]])
rand
irand(8)
```

## Utility
```
p.rot(1)
p.slice(0.25,0.5)
p.linger(0.2)
p.filter(ev => ev.index % 2 === 0)
```

## Template
```
drums = sample`bd ~ bd sd`.fast(2).every(4,x=>x.rev)
bass  = note`0 0 3 5`.octave(2).slow(2)
stack(drums, bass)
```

## Live Moves
```
drums = drums.every(8, x=>x.fast(2).rev)
ghost = sample`sd`.gain(0.3).degradeBy(0.7)
stack(drums, ghost)
```

Refine as needed.
