# Harmony Appendix (Paraphrased)

Common chord qualifiers (root assumed; adapt to engine):
- maj, M, (none) : major triad (0 4 7)
- m, min : minor (0 3 7)
- dim : diminished (0 3 6)
- aug, + : augmented (0 4 8)
- sus2 : suspended 2 (0 2 7)
- sus4 : suspended 4 (0 5 7)
- 6 : major 6 (0 4 7 9)
- 7 : dominant 7 (0 4 7 10)
- maj7, Δ7 : major 7 (0 4 7 11)
- m7 : minor 7 (0 3 7 10)
- mMaj7 : minor-major 7 (0 3 7 11)
- m6 : minor 6 (0 3 7 9)
- dim7 : diminished 7 (0 3 6 9)
- halfdim, m7b5 : half-diminished (0 3 6 10)
- 9 : dominant 9 (0 4 7 10 14)
- m9 : minor 9 (0 3 7 10 14)
- maj9 : major 9 (0 4 7 11 14)
- add9 : add 9 (0 4 7 14)
- 11 / 13 variants: extend by stacking scale thirds (validate engine support)

Example usage:
```js
prog = chord`c4maj7 a3m7 d4m7 g3dom7`
arp  = prog.arp('up').slow(8)
```

Scale archetypes (interval semitones from tonic):
- Major (Ionian): 0 2 4 5 7 9 11
- Natural Minor (Aeolian): 0 2 3 5 7 8 10
- Dorian: 0 2 3 5 7 9 10
- Phrygian: 0 1 3 5 7 8 10
- Lydian: 0 2 4 6 7 9 11
- Mixolydian: 0 2 4 5 7 9 10
- Locrian: 0 1 3 5 6 8 10
- Harmonic Minor: 0 2 3 5 7 8 11
- Melodic Minor (asc): 0 2 3 5 7 9 11
- Whole Tone: 0 2 4 6 8 10
- Pentatonic Major: 0 2 4 7 9
- Pentatonic Minor: 0 3 5 7 10
- Blues Hex: 0 3 5 6 7 10

Mapping degrees:
```js
scale('dorian')
mel = note`0 1 2 3 4 5 6` // covers the scale ascending
```

Modal interchange idea:
```js
base = note`0 2 4 5` // from major
borrow = base.every(8, p=>p.map((ev,i)=> i===2 ? ev.down(1) : ev)) // flatten 3rd occasionally
```

Voice leading tip:
```js
chords = chord`c4maj7 e3m7 a3m7 d3dom7`
rolled = chords.arp('up').every(4, p=>p.arp('down'))
```

Add more if runtime reveals additional chord symbols.
