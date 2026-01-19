# Architecture

**Analysis Date:** 2026-01-18

## Pattern Overview

**Overall:** Project Portfolio - Static HTML with Independent Interactive Projects

**Key Characteristics:**
- Portfolio site hosting standalone creative projects (music tools, games, utilities)
- Each project is self-contained with minimal cross-dependencies
- Web Audio API heavy (generative music, audio processing)
- Client-side only - no backend services
- Component-based architecture within individual projects

## Layers

**Portfolio Layer:**
- Purpose: Top-level navigation and presentation
- Location: `/index.html`, `/assets/`
- Contains: Landing page, global assets, navigation
- Depends on: Individual projects
- Used by: End users as entry point

**Project Layer:**
- Purpose: Independent creative applications
- Location: `/projects/*/`
- Contains: Self-contained HTML/CSS/JS apps
- Depends on: External libraries (Tone.js, Web Audio API), shared assets
- Used by: Portfolio layer via links

**Module Layer:**
- Purpose: Organized functionality within complex projects
- Location: `/projects/*/js/`
- Contains: ES6 modules with specific responsibilities
- Depends on: External libraries, sister modules
- Used by: Project entry points

**Utility Layer:**
- Purpose: Shared utilities and helpers within projects
- Location: `/projects/*/js/utils/`, `/projects/*/js/audio/`
- Contains: Random number generators, scale libraries, audio effects
- Depends on: Core JavaScript, Web Audio API
- Used by: Module layer

## Data Flow

**Music Generation Projects (Drift, Textscape, PS4-Synth):**

1. User interaction triggers initialization
2. Main controller initializes audio context and modules
3. Conductor/orchestrator coordinates multiple agents/voices
4. Agents generate musical events based on algorithms
5. Events route through effect chains (reverb, delay, EQ)
6. Audio outputs to master gain and browser audio
7. Visualization updates via canvas and requestAnimationFrame

**State Management:**
- Global state objects (e.g., `Conductor.state`, `DriftApp.state`)
- No state persistence across sessions (ephemeral)
- Event-driven updates via callbacks

**Audio Recording Projects (4-track):**

1. User selects audio input source (mic, tab audio, file)
2. MediaRecorder captures input to buffer
3. Buffer converts to AudioBuffer for playback
4. Signal routes through effect chain (trim, gain, compression, EQ, reverb)
5. Multiple tracks mix to master bus
6. Master bus applies final effects (EQ, compression, limiting)
7. Export uses MediaRecorder on master output

**Reference Projects (DND DM Screen):**

1. Data loader fetches JSON files from 5etools data
2. Search engine indexes loaded data
3. User input triggers search across multiple data types
4. Results display in modal with formatted content
5. Initiative tracker maintains session state in memory
6. Notepad persists to localStorage

## Key Abstractions

**Agent/Voice Pattern:**
- Purpose: Encapsulates independent musical behavior
- Examples: `projects/drift/Drift v4/js/agents/drone-agent.js`, `projects/drift/Drift v4/js/agents/melody-agent.js`
- Pattern: Class-based agents with lifecycle methods (init, trigger, stop), connected to shared audio graph

**Audio Node Chain:**
- Purpose: Signal processing pipeline
- Examples: `projects/4-track/js/track.js` (trim → gain → compressor → EQ → reverb send → fader)
- Pattern: Web Audio API nodes connected in series, controlled by UI parameters

**Conductor/Orchestrator:**
- Purpose: Coordinate multiple independent agents
- Examples: `projects/drift/Drift v4/js/conductor.js`, `projects/granular-ambient/conductor.js`
- Pattern: Central state manager that triggers agents based on time and probabilistic rules

**Module Controller:**
- Purpose: Encapsulate feature behavior
- Examples: `projects/dnd-dm-screen/js/initiative-tracker.js`, `projects/dnd-dm-screen/js/dice-roller.js`
- Pattern: ES6 modules exporting singleton objects with init() and event handlers

## Entry Points

**Portfolio Entry:**
- Location: `/index.html`
- Triggers: Direct URL load
- Responsibilities: Display landing page, load background generative music (Drift v7), navigation to projects

**Project Entry Points:**
- Location: `/projects/*/index.html`
- Triggers: User navigation from portfolio
- Responsibilities: Initialize project-specific audio context, set up UI, load dependencies

**Module Entry (Complex Projects):**
- Location: `/projects/*/js/main.js`
- Triggers: Script tag in HTML
- Responsibilities: Coordinate module initialization, wire up callbacks

## Error Handling

**Strategy:** Defensive programming with fallbacks

**Patterns:**
- Try-catch blocks around audio context initialization (browser compatibility)
- Promise rejection handling for async audio operations
- User-facing error messages for failed data loads (DND DM Screen shows file:// protocol warning)
- Console logging for debugging, not user feedback
- Graceful degradation when features unavailable (e.g., tab audio capture)

## Cross-Cutting Concerns

**Logging:** Console.log statements, primarily for development debugging

**Validation:** Input validation in forms (initiative tracker HP fields, dice notation parser), minimal backend-style validation

**Authentication:** None - all client-side, publicly accessible

**Persistence:**
- LocalStorage for user preferences (DND DM Screen notepad, session data)
- No database or server-side storage
- MediaRecorder for exporting audio to files

**Canvas Visualization:**
- requestAnimationFrame loops for real-time graphics
- Particle systems for ambient visuals
- VU meters for audio level monitoring

---

*Architecture analysis: 2026-01-18*
