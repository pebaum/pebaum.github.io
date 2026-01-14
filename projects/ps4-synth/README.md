# PS4 Controller Synth

An experimental **warm chip-tune** music instrument controlled by a PS4 controller where the control mappings are **randomized every time**. You have to discover which buttons and sticks control which synthesis parameters through experimentation and play.

Inspired by **Disasterpeace's** work on *Fez* and *Hyper Light Drifter* - warm pulse waves, lush reverb, gentle lo-fi texture, and nostalgic melodies.

## Concept

The idea is simple but fun: plug in a PS4 controller and control a synthesizer with it. The twist? The mappings between controls and parameters are randomized each session (or whenever you click "Re-randomize"). You have to figure out what each control does by exploring and listening.

The sound is **warm chip-tune lo-fi**: pulse and triangle waves (like classic game consoles), gentle bitcrushing for texture, tape saturation for warmth, subtle wow/flutter for analog drift, and lush reverb for space. Parameter ranges are constrained to keep everything musical and nostalgic. No matter what you do, it sounds warm and melodic.

## Features

- **Randomized Control Mappings**: Each session, the analog sticks map to different synthesis parameters
- **Warm Chip-Tune Sound**: Pulse and triangle waves with gentle detuning (Disasterpeace style)
- **Scale-Locked Notes**: Buttons trigger notes in musical scales (pentatonic, modal, exotic)
- **Gentle Lo-Fi Texture**: Subtle bitcrushing (8-16 bit) for warmth, not harshness
- **Lush Reverb & Delay**: Spacious, musical effects for nostalgic atmosphere
- **Tape Warmth**: Gentle saturation and wow/flutter for analog character
- **Constrained Parameters**: Ranges locked to ensure everything sounds musical and nostalgic
- **Effects Chain**: Bitcrusher → Tape Saturation → Filter → Reverb → Delay → Compressor
- **Visual Feedback**: Activity indicators show which controls are being used
- **Re-randomize Anytime**: Shuffle the mappings mid-session for a new challenge
- **Optional Cheat Mode**: Reveal the current mappings if you want to see what's mapped where

## How to Play

1. Connect your PS4 controller (USB or Bluetooth)
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge)
3. Click "Start" to initialize the synth
4. Experiment with the sticks and buttons to discover the controls
5. Click "Re-randomize Controls" to shuffle everything and start fresh

## Controls

### Analog Sticks (4 axes)
Each stick axis (Left X, Left Y, Right X, Right Y) is randomly mapped to one of these parameters:
- **Filter Frequency** (800-8000 Hz, bright and open)
- **Filter Resonance** (0.5-6, subtle to musical)
- **Reverb Amount** (15-75%, lush space)
- **Delay Time** (125-750ms, musical rhythms)
- **Delay Feedback** (15-65%, musical repeats)
- **Delay Amount** (10-50%, subtle to present)
- **Attack Time** (1ms-600ms, chip to pad)
- **Release Time** (50ms-1.5s, short chip to sustained)
- **Master Volume** (30-70%)
- **Pitch Bend** (±5 semitones, musical bending)
- **Bitcrush** (5-35% - subtle warmth, 8-16 bit)
- **Tape Saturation** (5-30% - gentle warmth)
- **Wow/Flutter Depth** (2-20% - subtle drift)
- **Wow/Flutter Speed** (0.1-0.6 Hz - slow, gentle)

### Buttons
- **Face buttons (✕○□△)**: Trigger notes
- **Shoulders (L1/R1)**: Trigger notes
- **Triggers (L2/R2)**: Trigger notes
- **D-pad (↑↓←→)**: Trigger notes
- **Share**: Change to random scale
- **Options**: Stop all notes

Note assignments are randomized within the current musical scale.

## Technology

- **Web Audio API**: Multi-oscillator chip-tune synthesis with warm effects chain
  - Pulse (square) and triangle wave oscillators (classic chip sounds)
  - WaveShaper for gentle bitcrushing (8-16 bit) and tape saturation
  - LFO-based wow/flutter for subtle analog drift
  - Musical filter resonance and gentle compression
- **Gamepad API**: PS4 controller input polling at 60fps
- **Plain JavaScript**: No frameworks, no build process
- **Musical Scales**: Pentatonic, modal, and exotic scales for melodic play
- **Constrained Randomization**: Parameter ranges locked to ensure warm, nostalgic aesthetic

## File Structure

```
ps4-synth/
├── index.html              # Entry point
├── styles.css              # Minimal dark UI
├── js/
│   ├── utils/
│   │   └── random.js       # DriftRandom utilities (from Granular Ambient)
│   ├── gamepad-manager.js  # PS4 controller polling
│   ├── synth-engine.js     # Multi-oscillator synth + effects
│   ├── parameter-mapper.js # Randomized control mappings
│   └── main.js             # Application orchestration
└── README.md
```

## Architecture

### GamepadManager
Polls the PS4 controller at 60fps, applies deadzones to analog sticks, and emits events for button presses/releases and axis changes.

### SynthEngine
Multi-oscillator warm chip-tune synthesizer with:
- 4-voice polyphony
- 3 detuned oscillators per voice (2× pulse/square + 1× triangle)
- Quick ADSR envelope (chip-tune style)
- **Gentle bitcrusher** (8-16 bit depth via WaveShaper)
- **Warm tape saturation** (soft clipping for analog warmth)
- **Subtle wow/flutter** (LFO-based pitch modulation for gentle drift)
- Musical lowpass filter (subtle resonance)
- Lush convolution reverb
- Musical delay with rhythmic timing
- Gentle dynamics compressor for glue

### ParameterMapper
The core of the randomization mechanic. On initialization (or when "Re-randomize" is pressed), it shuffles which gamepad inputs control which synthesis parameters. Uses DriftRandom utilities for weighted randomization.

## Design Philosophy

This project follows the same patterns as my other music experiments (Drift series, Granular Ambient, Textscape):
- **No build process**: Plain HTML/CSS/JS for immediate iteration
- **Web Audio API**: Direct control over synthesis
- **Generative/Experimental**: Discovery-based interaction
- **Minimal UI**: Dark theme, clean layout, focus on sound
- **Warm Lo-Fi Aesthetic**: Inspired by Disasterpeace (Fez, Hyper Light Drifter)
- **Constrained for Musicality**: Parameters locked to ensure warm, nostalgic, melodic sounds
- **No Wrong Moves**: The ranges ensure everything sounds intentionally musical and chip-tune inspired

## Browser Compatibility

Requires a modern browser with:
- Web Audio API support
- Gamepad API support (Chrome, Firefox, Edge)

PS4 controller works best via USB. Bluetooth may have latency depending on your system.

## Future Ideas

- Support for other controllers (Xbox, Switch Pro, etc.)
- MIDI output option
- Recording/playback of discovered mappings
- More synthesis engines (FM, granular, etc.)
- Multiplayer mode (multiple controllers)

## Credits

Built by Paul Baum as part of an ongoing series of experimental music web apps.

Uses DriftRandom utilities from [Granular Ambient](../granular-ambient/) project.

## License

MIT - Feel free to fork, modify, and experiment!
