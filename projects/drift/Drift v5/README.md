# Drift v5

A generative ambient music system built from the ground up with a focus on organic, tape-saturated textures.

## Philosophy

Drift v5 is a bottom-up rethinking of generative ambient music. Rather than starting with complex orchestration, we focus on four essential voices that create a rich, evolving soundscape:

1. **BASS** - Bowed bass, dark pads, deep foundation
2. **PIANO** - Soft Rhodes-style keys, reverb-drenched arpeggios
3. **WIND** - Flute, Mellotron, breathy textures with vibrato
4. **BELLS** - Glockenspiel, dulcimer, glass-like tones

## Sound Design Goals

- **Tape Character**: Hiss, saturation, wow/flutter, spectrum rolloff
- **Wide Stereo**: Decorrelated reverb tails, panning movement
- **Organic Textures**: Breath noise, subtle crackles, room tone
- **Dulled Tones**: Low-pass filtering for warmth
- **Deep Reverb**: Long, wide reverb for background depth
- **Soft Attack**: Gentle note onsets, swells
- **Repetition with Evolution**: Motifs that shift and breathe

## Per-Channel Controls

Each channel has independent control over:

### Modulation
- **Vibrato** - Depth & Speed (pitch modulation)
- **Tremolo** - Depth & Speed (amplitude modulation)

### Time-Based Effects
- **Delay** - Time, Mix, Feedback
- **Reverb** - Mix, Size (room simulation)

### Tape Effects
- **Hiss** - Background noise level
- **Saturation** - Soft clipping warmth
- **Wow** - Pitch drift/flutter

### Positioning
- **Pan** - Stereo position (with slow drift)

## Master Tape Section

Global tape processing applied to the mix:
- **Hiss** - Overall tape noise
- **Saturation** - Master compression/warmth
- **Rolloff** - High frequency attenuation
- **Wow** - Global pitch instability

## Usage

1. Click **START** to begin playback
2. Adjust channel parameters by clicking on the slider bars
3. Use **RANDOMIZE** to shuffle the key/mode
4. Select ROOT and MODE from the dropdowns

## Technical Notes

- Built with Web Audio API
- Convolution reverb with wide stereo impulse responses
- Waveshaper-based saturation
- Multi-oscillator synthesis with detune layers
- Envelope-based swells and dynamics

---

*Drift v5 - Generative Ambient*
*December 2025*
