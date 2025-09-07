# Generative Tape Loop MIDI Mobile

A browser-based generative ambient music playground that simulates multiple independent tape loops with asymmetric lengths. Each loop spins visually and in ASCII form while triggering a soft Rhodes‑style synthesized tone (pure WebAudio, no samples).

## Features
- Multiple loops; each has length (beats), playback rate multiplier, and note events.
- Independent rate per loop (phase drift & evolving polymeter).
- Add / remove notes: (beat, midi, velocity, duration in beats).
- ASCII ring visualization plus circular "mobile" with rotating playhead.
- Randomize loops for quick inspiration.
- Export / import preset JSON files.
- Simple Rhodes-esque sound built additively with filtering, tremolo and convolution reverb.

## Use
Open `index.html` in a modern desktop or mobile browser (requires WebAudio). Click Start to begin scheduling; add or edit loops on the fly.

## Preset JSON schema
```
{
  "bpm": 80,
  "swing": 0,
  "loops": [
    {
      "lengthBeats": 8,
      "rate": 1,
      "notes": [ {"beat":0, "midi":60, "vel":0.5, "dur":1 } ]
    }
  ]
}
```

## Roadmap Ideas
- Per-loop pan & volume
- Probability per note, humanization
- Saving to localStorage
- MIDI output via WebMIDI (if available)
- Improved generative algorithm (Markov / Euclidean / weighted sets)
- Optional sampled Rhodes / tape hiss layer

## License
MIT
