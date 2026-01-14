# Nova Grid

A web-based cellular automata generative sequencer, rebuilt from the ground up.

## Overview

Nova Grid is a complete reimplementation of the Nova3 VST plugin as a modern web application. It uses autonomous agents (rovers) that move through a grid to create emergent, evolving musical sequences.

## Features

### Core Engine
- **Grid-based Matrix**: Configurable rows × columns playfield
- **Autonomous Rovers**: Move in 8 directions with collision detection
- **20 Obstacle Types**: Mirrors, wedges, randomizers, timing, and speed modifiers
- **Wall-based Note Triggering**: Notes emit when rovers hit grid boundaries
- **Rover-to-Rover Collisions**: Collision groups with clockwise rotation

### Musical Parameters
- **4 Independent Scale Variations**: Each wall can use different scales/keys
- **40+ Built-in Scales**: Pentatonic, hexatonic, heptatonic, chromatic, world music
- **Probability Controls**: Note, obstacle, wrap, nearby, wobble, repeat
- **32-Step Velocity Sequencer**: Independent rhythm layer
- **Pattern Storage**: 8 pattern slots for saving/restoring grid states

### Audio
- **Web Audio Synthesizers**: Built-in synths powered by Tone.js
- **Synth Types**: Sine, square, sawtooth, triangle, FM, AM
- **ADSR Envelope**: Full envelope control
- **Effects Chain**: Filter, reverb, delay
- **BPM-Synced Timing**: Precise musical timing with swing support

### UI
- **Canvas-based Grid**: High-DPI rendering with visual feedback
- **Click-to-Add**: Left-click adds rovers/obstacles
- **Right-click-to-Remove**: Easy editing
- **Real-time Visualization**: See rovers move and collide
- **Parameter Controls**: Sliders and controls for all parameters

## Technology Stack

- **TypeScript**: Type-safe development
- **React**: Component-based UI
- **Vite**: Fast development server
- **Tone.js**: Web Audio synthesis and scheduling
- **Zustand**: Lightweight state management
- **HTML5 Canvas**: High-performance grid rendering

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## How to Use

1. **Initialize Audio**: Click "Initialize Audio" (required for browser audio policy)
2. **Add Rovers**: Select direction/speed, then left-click on grid to add rovers
3. **Add Obstacles**: Select an obstacle type, then left-click on grid
4. **Remove Items**: Right-click on any cell to remove rovers/obstacles
5. **Press Play**: Start the generative sequencer
6. **Adjust Parameters**: Change BPM, probabilities, scales, etc.

## Obstacle Types

- **Mirrors** (`|`, `-`, `/`, `\`): Reflect rover direction
- **Wedges** (`^`, `>`, `v`, `<`): Redirect to specific direction
- **Randomizers** (`X`, `::`, `<>`): Add controlled chaos
- **Timing** (`O`): Pause rovers alternately
- **Mirror + Flip** (`|.`, `-.`, `/.`, `\.`): Mirror and reverse
- **Speed** (`~`, `!`, `%`): Modify rover speed

## Roadmap

- [ ] Web MIDI Integration (external instruments)
- [ ] MIDI CC mapping (hardware control)
- [ ] Advanced UI (better parameter controls)
- [ ] Preset system (save/load complete states)
- [ ] Pattern sequencing (automate pattern changes)
- [ ] More visualization options
- [ ] VST3 port (future)

## Credits

Inspired by the original Nova3 VST plugin.

Built from scratch with modern web technologies.

## License

MIT (TBD)
