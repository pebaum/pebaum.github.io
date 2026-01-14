# Firelink Shrine - Roguelike Portfolio

An immersive, roguelike-style interactive portfolio experience inspired by Dark Souls' Firelink Shrine. Navigate a mysterious shrine, interact with NPCs, and discover hidden secrets.

## Features

### Core Gameplay
- **Top-down roguelike exploration** with smooth tile-based movement
- **Interactive NPCs** representing different portfolio categories
- **Secret key mechanic** with a hidden room to discover
- **Atmospheric audio** with background music and subtle sound effects
- **CRT post-processing effects** for authentic retro aesthetics

### NPCs & Categories
- **Fire Keeper (♀)** - About Me & Contact (by the central bonfire)
- **Bard (♪)** - Music Projects (Drift v1-v7 generative ambient music)
- **Blacksmith (⚒)** - Miscellaneous Coding Projects
- **Painter (✎)** - Interactive Art Pieces
- **Knight (♞)** - Work & Professional Portfolio
- **Librarian (📚)** - Writing & Documentation
- **Archivist (⚱)** - Hidden Archives (secret room)

### Visual Effects
- Scanline overlay with subtle animation
- Bloom/glow on bright elements (NPCs, bonfire, key)
- Vignette and rounded corners (CRT monitor effect)
- Particle systems (bonfire embers, ambient dust)
- Smooth camera following player

### Controls
- **WASD / Arrow Keys** - Move player
- **E** - Interact with NPCs / Use key on doors
- **↑↓ / WS** - Navigate dialogue menus
- **Enter** - Select menu item
- **Escape** - Close dialogue
- **M** - Mute/unmute audio
- **+/-** - Adjust volume

## Project Structure

```
pebaum.github.io/
├── index.html                  # Main roguelike game entry point
├── Stone.mp3                   # Background music
├── about/                      # About & contact info
├── assets/
│   ├── fonts/
│   │   └── Alexandria.ttf     # Monospace font
│   └── js/
│       ├── roguelike-engine.js  # Core game engine
│       ├── level-data.js        # Firelink Shrine map & NPC data
│       └── crt-effects.js       # Post-processing effects
├── projects/
│   ├── music/                  # Bard NPC projects
│   │   └── drift/             # Drift v1-v7
│   ├── art/                    # Painter NPC projects
│   │   └── interactive-art/   # Dungeon game, mazes, etc.
│   ├── miscellaneous/          # Blacksmith NPC projects
│   │   ├── benji-site/
│   │   ├── blade-honor/
│   │   └── forward-playground/
│   ├── work/                   # Knight NPC (resume/portfolio)
│   └── writing/                # Librarian NPC (future content)
└── archive/                    # Archived projects & old homepage
```

## Technical Details

### Game Engine Architecture
- **Vanilla JavaScript** - No frameworks, pure ES6
- **Canvas 2D API** - Tile-based rendering
- **Class-based architecture** with modular systems:
  - `Game` - Main game loop and state management
  - `Player` - Movement, collision, inventory
  - `World` - Tile map rendering and world state
  - `NPC` - Character positioning and idle animations
  - `DialogueSystem` - Menu navigation and typewriter text
  - `AudioManager` - Background music + Web Audio API SFX
  - `ParticleSystem` - Environmental particle effects
  - `CRTEffects` - Post-processing shader effects
  - `InputManager` - Keyboard input handling

### Performance
- 60 FPS target with `requestAnimationFrame`
- Efficient particle pooling
- Optimized render loop
- Pixel-perfect rendering (no antialiasing)

### Browser Compatibility
- Modern browsers with HTML5 Canvas support
- Web Audio API for sound
- ES6 JavaScript features

## Secret Room
A bronze key (◊) is hidden somewhere in the shrine. Find it to unlock a secret door and discover the Archivist, who guards forgotten treasures from the past.

**Hint:** Check small alcoves and hidden corners...

## Development Timeline
Built in a single session using Claude Code (January 2026) with complete file reorganization, game engine implementation, and visual effects system.

## Credits
- **Design & Code:** Generated with Claude Code
- **Music:** Stone.mp3 ambient soundtrack
- **Font:** Alexandria.ttf
- **Inspiration:** Dark Souls' Firelink Shrine

---

*"The bonfire burns eternal in this digital shrine..."*
