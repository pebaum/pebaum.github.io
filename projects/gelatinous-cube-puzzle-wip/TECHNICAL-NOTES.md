# Technical Implementation Notes

Research findings and recommendations based on existing portfolio projects.

---

## Existing Game Projects Analysis

### Relevant Prior Work

#### 1. **roguelike-engine.js** (Firelink Shrine homepage)
- Sophisticated ASCII roguelike engine
- Grid-based movement with smooth interpolation
- Class-based OOP architecture (Player, NPC, World classes)
- 2D array grid system (50x35)
- Inventory and puzzle mechanics (keys/doors)
- Particle effects system
- Audio with Web Audio API

**Takeaway**: You have strong experience with grid-based game systems and clean architecture.

#### 2. **dungeongame.html** (ASCII Dungeon Adventure)
- 30x13 grid dungeon crawler
- Fog of war / visibility system
- Item pickup mechanics
- Canvas-based particle effects
- Simple, focused gameplay

**Takeaway**: You can build clean, self-contained dungeon games.

#### 3. **colorexplore.html** (Resource Management Explorer)
- 50x50 grid-based terrain
- Complex resource management (stamina, food, water)
- Pathfinding AI
- Strategic planning mechanics

**Takeaway**: You've already implemented resource-based puzzle mechanics.

#### 4. **waterlillies.html** (Cellular Automaton)
- 100x40 grid simulation
- Complex state management
- Lifecycle systems
- Procedural generation

**Takeaway**: You can handle complex grid state and generation algorithms.

---

## Coding Style & Preferences

### Confirmed Patterns:
- ✅ **Pure vanilla JavaScript** (no React, Vue, etc.)
- ✅ **Class-based OOP** with clear separation of concerns
- ✅ **Self-contained HTML files** (inline CSS + JS)
- ✅ **ASCII/monospace aesthetic**
- ✅ **Grid-based data structures** (2D arrays)
- ✅ **Canvas or HTML/CSS rendering**
- ✅ **Well-commented code**
- ✅ **No build tools** - just open HTML in browser

### Complexity Level:
You're comfortable with:
- State machines
- Pathfinding algorithms
- Collision detection
- Game loops (requestAnimationFrame)
- Complex data structures
- Event-driven architecture

---

## Recommended Tech Stack

### For Gelatinous Cube Puzzle:

```javascript
// Single HTML file structure
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Gelatinous Cube Puzzle</title>
    <style>
        /* Inline CSS - match your existing style */
    </style>
</head>
<body>
    <div id="game-container"></div>

    <script>
        // Inline JavaScript - entire game here
    </script>
</body>
</html>
```

**No external dependencies** - pure vanilla JS.

---

## Architecture Recommendation

### Class Structure (based on your existing patterns):

```javascript
// Similar to your roguelike-engine structure

class PuzzleCell {
    constructor(x, y, type, occupant) {
        this.x = x;
        this.y = y;
        this.type = type; // 'floor', 'wall', etc.
        this.occupant = occupant; // null, 'cube', 'wizard', etc.
        this.detectionZone = false;
        this.notes = []; // For player penciling
    }
}

class Adventurer {
    constructor(type, x, y, abilities) {
        this.type = type; // 'wizard', 'fighter', 'cleric', 'rogue'
        this.x = x;
        this.y = y;
        this.abilities = abilities;
        this.alive = true;
        this.facing = 'north'; // For detection zones
    }

    getDetectionZone() {
        // Return array of cells this adventurer can see
    }
}

class GelatinousCube {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.moves = [];
        this.abilities = [];
    }

    canMoveTo(x, y) {
        // Check if move is legal
    }
}

class PuzzleGrid {
    constructor(size, scenario) {
        this.size = size; // 9 or 10
        this.cells = [];
        this.scenario = scenario;
        this.cube = null;
        this.adventurers = [];

        this.initGrid();
    }

    initGrid() {
        // Create 2D array of PuzzleCell objects
        for (let y = 0; y < this.size; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.cells[y][x] = new PuzzleCell(x, y, 'floor', null);
            }
        }
    }

    render() {
        // Draw the grid (ASCII or Canvas)
    }

    checkSolution() {
        // Validate if puzzle is solved
    }
}

class Scenario {
    constructor(data) {
        this.title = data.title;
        this.description = data.description;
        this.gridLayout = data.gridLayout;
        this.adventurers = data.adventurers;
        this.cubeStart = data.cubeStart;
        this.winConditions = data.winConditions;
    }
}

class Game {
    constructor() {
        this.currentScenario = null;
        this.grid = null;
        this.mode = 'planning'; // 'planning', 'executing', 'won', 'lost'
    }

    loadScenario(scenario) {
        this.currentScenario = new Scenario(scenario);
        this.grid = new PuzzleGrid(9, this.currentScenario);
    }

    render() {
        this.grid.render();
    }
}

// Start game
const game = new Game();
```

---

## Visual Style Recommendations

### Colors (from your existing projects):

```css
/* Dark theme matching your aesthetic */
:root {
    --bg-dark: #0a0a0a;
    --text-main: #ffffff;
    --cube-color: #00ff41;      /* Gelatinous green */
    --wizard-color: #9966ff;    /* Arcane purple */
    --fighter-color: #ff6600;   /* Battle orange */
    --cleric-color: #ffcc00;    /* Holy gold */
    --rogue-color: #808080;     /* Shadow gray */
    --wall-color: #333333;      /* Stone gray */
    --floor-color: #1a1a1a;     /* Dark floor */
    --detection-color: #ff000033; /* Red overlay */
}

body {
    background: var(--bg-dark);
    color: var(--text-main);
    font-family: 'Courier New', 'Space Mono', monospace;
    margin: 0;
    padding: 20px;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(9, 50px);
    gap: 2px;
    margin: 20px auto;
    width: fit-content;
}

.cell {
    width: 50px;
    height: 50px;
    background: var(--floor-color);
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    position: relative;
}

.cell:hover {
    border-color: #666;
}

.cell.wall {
    background: var(--wall-color);
}

.cell.detection-zone {
    background: var(--detection-color);
}

/* ASCII characters for entities */
.cube::before { content: '■'; color: var(--cube-color); }
.wizard::before { content: '♦'; color: var(--wizard-color); }
.fighter::before { content: '♠'; color: var(--fighter-color); }
.cleric::before { content: '♥'; color: var(--cleric-color); }
.rogue::before { content: '♣'; color: var(--rogue-color); }
```

### Alternative: Pure ASCII Rendering

```javascript
// Like your dungeongame.html approach
function renderGridASCII(grid) {
    let output = '';
    for (let y = 0; y < grid.size; y++) {
        for (let x = 0; x < grid.size; x++) {
            const cell = grid.cells[y][x];
            if (cell.occupant === 'cube') output += '■';
            else if (cell.occupant === 'wizard') output += '♦';
            else if (cell.occupant === 'fighter') output += '♠';
            else if (cell.type === 'wall') output += '█';
            else output += '·';
        }
        output += '\n';
    }
    return output;
}
```

---

## Data Structure for Scenarios

### Scenario Format (like your level-data.js):

```javascript
const SCENARIOS = {
    tutorial_1: {
        title: "Ambush the Wizard",
        description: "A lone wizard stands in the corridor. Approach from behind to avoid their detection.",
        gridSize: 9,
        layout: [
            "█████████",
            "█···█···█",
            "█···█···█",
            "█·······█",
            "█·······█",
            "█···W···█",
            "█·······█",
            "█···C···█",
            "█████████"
        ],
        // W = Wizard facing north
        // C = Cube starting position

        adventurers: [
            {
                type: 'wizard',
                x: 4,
                y: 5,
                facing: 'north',
                abilities: ['arcane_vision'],
                detectionRange: 3
            }
        ],

        cubeStart: { x: 4, y: 7 },

        winConditions: {
            eliminateAll: true,
            maxMoves: null,
            noDetection: true
        },

        hints: [
            "Wizards can see 3 cells in the direction they face.",
            "Attacking from behind avoids detection.",
            "You can move through open cells (·)."
        ]
    },

    ambush_1: {
        title: "The Healing Circle",
        description: "A cleric protects a wizard. Find the right order to strike.",
        // ... similar structure
    }
};
```

---

## Implementation Phases

### Phase 1: Core Engine (MVP)
- [ ] Grid rendering system
- [ ] Cell interaction (click to move)
- [ ] Basic cube movement
- [ ] Adventurer placement
- [ ] Win/lose detection
- [ ] Single hand-crafted scenario

### Phase 2: Puzzle Mechanics
- [ ] Detection zones visualization
- [ ] Ability system (cleric heal, wizard vision, etc.)
- [ ] Order-of-elimination logic
- [ ] Solution validation
- [ ] "Undo" system for planning

### Phase 3: UX & Polish
- [ ] Pencil notes system (right-click cells to add notes)
- [ ] Scenario selection menu
- [ ] Difficulty ratings
- [ ] Visual feedback (animations, particles)
- [ ] Victory/defeat screens
- [ ] Tutorial/help system

### Phase 4: Advanced Features
- [ ] Procedural generation with seeds
- [ ] Multiple scenario types
- [ ] Patrol patterns (Concept A mechanics)
- [ ] Resource costs (Concept C mechanics)
- [ ] Leaderboard/stats

---

## File Structure Recommendation

### Option A: Single File (like your existing projects)
```
gelatinous-cube-puzzle.html  (everything inline)
```

**Pros**: Portable, easy to share, no dependencies
**Cons**: Gets large with many scenarios

### Option B: Modular (for larger project)
```
index.html
css/
    styles.css
js/
    game.js
    grid.js
    adventurer.js
    scenarios.js
```

**Recommendation**: Start with Option A, refactor to B if needed.

---

## Build & Test Approach

### Development
1. Create `gelatinous-cube-puzzle.html` in WIP folder
2. Open directly in browser (no server needed)
3. Test by playing puzzles
4. Iterate on mechanics

### Deployment
1. Move to `projects/games/` when ready
2. Add to main portfolio index
3. No build step required

---

## Key Technical Challenges

### 1. Puzzle Generation
**Challenge**: Ensuring procedurally generated puzzles are solvable and interesting.

**Approach**:
- Start with hand-crafted puzzles
- Build solver algorithm to validate solutions
- Use solver to guide procedural generation

### 2. Detection Zone Calculation
**Challenge**: Efficiently calculating which cells each adventurer can see.

**Approach**:
```javascript
// Simple line-of-sight for MVP
getDetectionZone(adventurer) {
    const zones = [];
    const {x, y, facing, detectionRange} = adventurer;

    for (let i = 1; i <= detectionRange; i++) {
        let checkX = x, checkY = y;

        if (facing === 'north') checkY -= i;
        else if (facing === 'south') checkY += i;
        else if (facing === 'east') checkX += i;
        else if (facing === 'west') checkX -= i;

        if (this.isBlocked(checkX, checkY)) break;
        zones.push({x: checkX, y: checkY});
    }

    return zones;
}
```

### 3. Ability Interaction System
**Challenge**: Handling complex ability chains (cleric heals wizard who sees rogue who detects cube).

**Approach**: Event-driven system with ability priority queue.

---

## Performance Considerations

For a 9x9 grid puzzle game:
- Performance is **not a concern**
- 81 cells × 60fps = trivial for modern browsers
- Focus on code clarity over optimization

---

## Next Steps When Ready to Implement

1. **Choose core mechanics** (recommend Concept B: Order-of-Elimination)
2. **Design 3-5 tutorial scenarios** on paper first
3. **Create basic grid renderer** (ASCII in `<pre>` tag or CSS Grid)
4. **Implement cube movement** (click cells to move)
5. **Add first adventurer type** (wizard with simple detection)
6. **Build win condition** (eliminate all adventurers)
7. **Playtest and iterate**

---

*Technical research completed: 2026-01-14*
*Based on: roguelike-engine.js, dungeongame.html, colorexplore.html, waterlillies.html*
