# Codebase Structure

**Analysis Date:** 2026-01-18

## Directory Layout

```
pebaum.github.io/
├── index.html              # Portfolio landing page
├── package.json            # Build script metadata
├── README.md               # Repo description
├── Stone.mp3               # Background audio asset
├── .github/                # GitHub Actions workflows
├── .planning/              # GSD codebase analysis docs
│   └── codebase/           # Architecture and structure docs
├── assets/                 # Shared portfolio assets
│   ├── audio/              # Background music files
│   ├── fonts/              # Typography
│   ├── images/             # Graphics, icons
│   └── js/                 # Shared JavaScript (BGM player, text interface)
├── projects/               # Independent creative projects
│   ├── 4-track/            # Audio multitrack recorder
│   ├── benji-site/         # Personal site project
│   ├── dnd-dm-screen/      # D&D 5e reference tool
│   ├── drift/              # Generative ambient music (v1-v7)
│   ├── granular-ambient/   # Granular synthesis experiment
│   ├── interactive-art/    # Collection of art pieces
│   ├── ps4-synth/          # Gamepad-controlled synthesizer
│   ├── textscape/          # Text-to-music generator
│   └── the-duel/           # Game project
└── archive/                # Deprecated/old projects
    ├── ffix-site/          # Archived Final Fantasy site
    ├── old-index.html      # Previous portfolio version
    └── build-index.js      # Old build script
```

## Directory Purposes

**`/` (Root):**
- Purpose: Portfolio entry point and repo metadata
- Contains: Main landing page, configuration files
- Key files: `index.html`, `package.json`, `README.md`

**`/assets/`:**
- Purpose: Shared resources used by portfolio page
- Contains: Audio files, fonts, images, global JavaScript utilities
- Key files: `assets/js/bgm-player.js`, `assets/js/text-interface.js`

**`/projects/`:**
- Purpose: Houses all standalone creative applications
- Contains: Independent project directories
- Key files: Each project has its own `index.html` entry point

**`/projects/4-track/`:**
- Purpose: 4-track tape recorder application
- Contains: Audio recording/playback engine, mixer UI
- Key files: `index.html`, `styles.css`, `js/recorder.js`, `js/track.js`, `js/ui.js`, `js/tape-effects.js`, `js/visualizer.js`

**`/projects/dnd-dm-screen/`:**
- Purpose: D&D 5e Dungeon Master reference tool
- Contains: Search engine, initiative tracker, dice roller, reference viewer
- Key files: `index.html`, `styles.css`, `js/main.js`, `js/search-engine.js`, `js/initiative-tracker.js`, `js/dice-roller.js`, `js/data-loader.js`, `js/reference-viewer.js`, `js/session-maker.js`
- Special: Contains embedded `5etools-v2.23.0/` third-party library

**`/projects/drift/`:**
- Purpose: Evolution of generative ambient music system
- Contains: Versions 1-7, each iteration improving on previous
- Key files:
  - v7 (current): `Drift v7/drift7.js`, `Drift v7/index.html`
  - v4 (modular): `Drift v4/js/conductor.js`, `Drift v4/js/agents/*.js`, `Drift v4/js/audio/*.js`

**`/projects/textscape/`:**
- Purpose: Text-to-music generation using NLP and music theory
- Contains: Text analyzers, parameter mappers, composition engine
- Key files: `index.html`, `js/main.js`, `js/analysis/*.js`, `js/mapping/*.js`, `js/generation/*.js`, `js/audio/*.js`

**`/projects/granular-ambient/`:**
- Purpose: Real-time granular synthesis
- Contains: Granular engine, conductor, audio IO
- Key files: `index.html`, `main.js`, `conductor.js`, `granular-engine.js`, `voice.js`, `audio-io.js`

**`/projects/ps4-synth/`:**
- Purpose: Gamepad-controlled synthesizer
- Contains: Gamepad manager, synth engine, sequencer
- Key files: `index.html`, `js/main.js`, `js/gamepad-manager.js`, `js/synth-engine.js`, `js/generative-sequencer.js`

**`/projects/interactive-art/`:**
- Purpose: Collection of interactive HTML5 art pieces
- Contains: Self-contained single-file experiments
- Key files: `dungeongame.html`, `mazesend.html`, `waterlillies.html`, `viewofaburningcity.html`, `wordprocessor.html`

**`/archive/`:**
- Purpose: Deprecated projects and old code
- Contains: Historical versions no longer linked from main portfolio
- Key files: `old-index.html`, `build-index.js`, `ffix-site/`

**`/.planning/`:**
- Purpose: GSD codebase documentation
- Contains: Architecture, structure, conventions, testing docs
- Key files: `codebase/ARCHITECTURE.md`, `codebase/STRUCTURE.md`

**`/.github/`:**
- Purpose: GitHub-specific configuration
- Contains: GitHub Actions workflows for CI/CD
- Key files: `workflows/*.yml`

## Key File Locations

**Entry Points:**
- `/index.html`: Portfolio landing page (main entry)
- `/projects/4-track/index.html`: 4-track recorder
- `/projects/dnd-dm-screen/index.html`: DM screen tool
- `/projects/drift/Drift v7/index.html`: Current Drift version
- `/projects/textscape/index.html`: Text-to-music app

**Configuration:**
- `/package.json`: npm build script config
- `/.gitignore`: Git ignore patterns

**Core Logic:**
- `/projects/4-track/js/recorder.js`: Audio recording engine
- `/projects/dnd-dm-screen/js/main.js`: DM screen app controller
- `/projects/drift/Drift v7/drift7.js`: Generative music engine
- `/projects/textscape/js/main.js`: Text analysis coordinator

**Shared Utilities:**
- `/assets/js/bgm-player.js`: Background music player class
- `/projects/drift/Drift v4/js/utils/random.js`: Random number utilities
- `/projects/drift/Drift v4/js/utils/music.js`: Music theory helpers

## Naming Conventions

**Files:**
- HTML: `lowercase.html` or `kebab-case.html` (e.g., `index.html`, `test-search.html`)
- JavaScript: `kebab-case.js` (e.g., `tape-effects.js`, `initiative-tracker.js`, `data-loader.js`)
- CSS: `styles.css` (projects) or feature-specific `kebab-case.css` (5etools)
- Single-file apps: Descriptive names like `drift7.js`, `game.js`

**Directories:**
- Projects: `lowercase` or `kebab-case` (e.g., `4-track`, `dnd-dm-screen`, `ps4-synth`)
- Versioned: `Name vN` pattern (e.g., `Drift v7`, `Drift v4`)
- Feature folders: `lowercase` (e.g., `agents`, `audio`, `analysis`, `generation`)

**Classes:**
- PascalCase (e.g., `Track`, `TapeEffects`, `StoneBGMPlayer`, `DMScreen`)
- Agent classes: `*Agent` pattern (e.g., `DroneAgent`, `MelodyAgent`)

**Variables/Functions:**
- camelCase (e.g., `audioContext`, `masterGain`, `initAudio()`, `midiToFreq()`)

## Where to Add New Code

**New Project:**
- Primary code: `/projects/new-project-name/`
- Structure: Create `index.html`, `styles.css`, `/js/` subdirectory
- Link from: `/index.html` projects menu

**New Feature in Existing Project:**
- Implementation: `/projects/{project}/js/feature-name.js`
- Module pattern: Export singleton or class
- Import in: `/projects/{project}/js/main.js` or `/projects/{project}/index.html`

**New Audio Agent (Drift v4 pattern):**
- Implementation: `/projects/drift/Drift v4/js/agents/new-agent.js`
- Extend: `BaseAgent` class
- Register in: `conductor.js` agents array

**New Utility:**
- Shared helpers: `/projects/{project}/js/utils/helper-name.js`
- Audio effects: `/projects/{project}/js/audio/effect-name.js`
- Music theory: `/projects/{project}/js/utils/music.js` or `/projects/{project}/js/audio/scales.js`

**New Portfolio Asset:**
- Images: `/assets/images/filename.ext`
- Fonts: `/assets/fonts/fontname/`
- Audio: `/assets/audio/filename.mp3`
- JavaScript: `/assets/js/utility-name.js` (only if truly shared across multiple projects)

## Special Directories

**`/projects/dnd-dm-screen/5etools-v2.23.0/`:**
- Purpose: Third-party D&D reference library (embedded dependency)
- Generated: No (vendored external code)
- Committed: Yes
- Notes: Large library with own structure, do not modify

**`/projects/drift/`:**
- Purpose: Historical evolution of Drift system
- Generated: No
- Committed: Yes
- Notes: Multiple versions preserved for reference, v7 is current

**`/archive/`:**
- Purpose: Historical code not actively maintained
- Generated: No
- Committed: Yes
- Notes: Do not link from main portfolio, kept for reference

**`/.git/`:**
- Purpose: Git version control metadata
- Generated: Yes
- Committed: No (automatically managed)

**`/node_modules/`:**
- Purpose: npm dependencies (if installed)
- Generated: Yes (via npm install)
- Committed: No (excluded by .gitignore)

**`/.planning/`:**
- Purpose: GSD codebase documentation
- Generated: By GSD commands
- Committed: Yes (should be version controlled)

---

*Structure analysis: 2026-01-18*
