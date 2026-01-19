# Coding Conventions

**Analysis Date:** 2026-01-18

## Naming Patterns

**Files:**
- Kebab-case for project directories: `dnd-dm-screen/`, `granular-ambient/`, `4-track/`
- Kebab-case for JavaScript files: `dice-roller.js`, `initiative-tracker.js`, `audio-engine.js`
- Version suffixes for iterations: `drift5.js`, `drift6.js`, `drift7.js`

**Functions:**
- camelCase for functions: `startRecording()`, `rollDie()`, `generateMusic()`
- Verb-first naming for actions: `loadFromFile()`, `checkPickups()`, `updateCamera()`

**Variables:**
- camelCase for variables: `audioContext`, `currentText`, `gameState`
- Descriptive names: `mediaRecorder`, `recordedChunks`, `typewriterText`

**Classes:**
- PascalCase for classes: `DiceRoller`, `AudioManager`, `GranularEngine`, `Track`
- Descriptive class names matching purpose: `InputManager`, `ParticleSystem`, `ContinuousEngine`

**Constants:**
- SCREAMING_SNAKE_CASE for global constants: `CONFIG`, `COLORS`, `TYPE_ICONS`

## Code Style

**Formatting:**
- Tool: Prettier (detected in 5etools-v2.23.0 vendored code)
- Configuration: `printWidth: 999` (extremely wide lines allowed in vendor code)
- Portfolio code: No enforced formatting, mixed indentation (2-4 spaces)

**Linting:**
- No linting configuration detected in portfolio projects
- Vendor code (5etools) has Prettier but no ESLint

## Import Organization

**Order:**
1. ES6 module imports (portfolio projects)
   ```javascript
   import dataLoader from './data-loader.js';
   import searchEngine from './search-engine.js';
   import initiativeTracker from './initiative-tracker.js';
   ```

2. No path aliases detected
3. Relative imports with explicit `.js` extensions

**Module Pattern:**
- Modern projects use ES6 modules: `projects/dnd-dm-screen/js/main.js`
- Older projects use class-based globals with singleton pattern: `const diceRoller = new DiceRoller(); export default diceRoller;`
- Browser globals for cross-file communication: `window.app`, `window.dmScreen`

## Error Handling

**Patterns:**
- Try-catch blocks with detailed error messages in critical paths:
  ```javascript
  try {
      await dataLoader.loadAll();
  } catch (error) {
      console.error('Failed to initialize DM Screen:', error);
      this.showInitStatus(errorMessage, 'error');
  }
  ```

- File protocol detection for user guidance:
  ```javascript
  if (error.message.includes('file://')) {
      errorMessage += 'The page must be served from a web server...';
  }
  ```

- Graceful degradation with console warnings:
  ```javascript
  catch (error) {
      console.warn('Audio initialization failed:', error);
  }
  ```

- Silent catch for expected errors:
  ```javascript
  ctx.resume().catch(() => {});
  ```

## Logging

**Framework:** Native `console` methods

**Patterns:**
- Success indicators with checkmark: `console.log('✓ Dice roller initialized');`
- Debug logging for state: `console.log('Audio context state:', this.audioIO.audioContext.state);`
- Error logging with context: `console.error('Failed to initialize DM Screen:', error);`
- Warnings for non-critical issues: `console.warn('Audio play failed:', error);`

## Comments

**When to Comment:**
- File headers with purpose:
  ```javascript
  /**
   * D&D 5e DM Screen
   * Main application controller
   */
  ```

- Section dividers in large files:
  ```javascript
  // ============================================================================
  // AUDIO MANAGER
  // ============================================================================
  ```

- Complex algorithm explanations:
  ```javascript
  // LA-2A style compressor (smooth, musical, program-dependent)
  ```

- Configuration decisions:
  ```javascript
  // Signal chain will be connected in setupTapeEffects()
  ```

**JSDoc/TSDoc:**
- Minimal JSDoc usage for public methods:
  ```javascript
  /**
   * Initialize the application
   */
  async init() {
  ```

- No comprehensive JSDoc coverage
- No type annotations (vanilla JavaScript, not TypeScript)

## Function Design

**Size:**
- Small focused methods: `rollDie()` ~10 lines
- Medium application methods: `init()` ~50-100 lines
- Large UI rendering methods: `displayAssociations()` ~250 lines (acceptable for view logic)

**Parameters:**
- Minimal parameters preferred: `init()`, `start()`, `stop()`
- Default parameters when optional: `play(when = 0)`, `show(text, duration = 180)`
- Object destructuring for complex params:
  ```javascript
  const {mood, tension, density, tempo} = params;
  ```

**Return Values:**
- Explicit returns for calculations: `return total;`
- Implicit undefined for side-effect methods: `init()`, `update()`
- Boolean returns for status checks: `return this.lifetime > 0;`

## Module Design

**Exports:**
- ES6 default exports for singletons:
  ```javascript
  const diceRoller = new DiceRoller();
  export default diceRoller;
  ```

- CommonJS fallback for browser globals:
  ```javascript
  if (typeof module !== 'undefined' && module.exports) {
      module.exports = Track;
  }
  ```

- Window globals for debugging:
  ```javascript
  window.dmScreen = this;
  window.dataLoader = dataLoader;
  ```

**Barrel Files:**
- Not used in this codebase
- Each file imports directly from source files

## CSS/Styling

**Patterns:**
- External CSS files: `styles.css` per project
- Inline styles for dynamic UI:
  ```javascript
  statusContainer.style.cssText = `
      position: fixed;
      top: 10px;
      ...
  `;
  ```

- CSS classes for state: `classList.add('loaded')`, `classList.toggle('expanded')`

## Audio/Media Patterns

**Web Audio API:**
- Create audio context lazily on user interaction
- Use gain nodes for volume control
- Connect nodes in explicit signal chains
- Store node references as instance properties

**State Management:**
- Boolean flags for state: `this.isRecording`, `this.isPlaying`, `this.initialized`
- Cleanup in stop/clear methods: disconnect sources, reset buffers

## Project-Specific Conventions

**D&D DM Screen** (`projects/dnd-dm-screen/`):
- Module singleton pattern with ES6 exports
- Console logging with checkmarks for initialization steps
- Error messages provide user guidance (file protocol detection)

**4-Track Console** (`projects/4-track/`):
- Class-based architecture with signal chain comments
- LA-2A compressor parameters documented inline
- Audio node chains explicitly documented

**Textscape** (`projects/textscape/`):
- Hierarchical tree structure for UI rendering
- Compound metrics with descriptive variable names
- Long methods for complex UI assembly (acceptable pattern)

**Roguelike Engine** (`assets/js/roguelike-engine.js`):
- CONFIG constant at file top
- Section dividers with `=====` bars
- Game loop pattern with delta time normalization

---

*Convention analysis: 2026-01-18*
