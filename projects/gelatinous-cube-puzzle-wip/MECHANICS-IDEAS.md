# Puzzle Mechanics Ideas

This document explores different approaches to making the gelatinous cube game a logic puzzle similar to Sudoku.

## Core Challenge: What Makes It a "Pencil-Out" Puzzle?

The key is creating a system where players must **deduce the solution through logic** rather than trial-and-error. Like Sudoku, there should be:

- Clear rules/constraints
- Visible information to reason about
- One (or few) valid solutions
- Deduction required to find the solution

---

## Concept A: Movement Timing Puzzle

### Mechanics
- **Adventurers have patrol patterns** displayed on the grid (arrows showing their route)
- **Turn-based movement** - each turn, adventurers move one step in their pattern
- **Detection zones** - each adventurer can see certain cells (shown visually)
- **Gelatinous cube has limited moves** (e.g., 1 square per turn)
- **Goal**: Intercept each adventurer from their blind spot

### "Penciling Out" Process
Players would calculate:
- "On turn 3, the wizard will be at cell E5 facing north"
- "If I move to D5 on turn 2, I can attack from behind on turn 3"
- "But the cleric's patrol crosses D6 on turn 2, so I'd be seen..."
- "Therefore, I must take the longer route through C4-C5-D5"

### Puzzle Elements
- **Given**: Starting positions, patrol routes, detection ranges
- **Deduce**: Exact sequence and timing of cube movements
- **Constraints**: Limited turns, must avoid detection, must eliminate all targets

### Difficulty Scaling
- Beginner: 2-3 adventurers, simple straight-line patrols
- Advanced: 5-6 adventurers, complex patrol patterns, overlapping detection
- Expert: Limited moves, must eliminate in specific order

### Pros
- Very "chess puzzle" like - clear perfect information
- Easy to understand rules
- Strong spatial/temporal reasoning challenge

### Cons
- Might become tedious to track many moving parts
- Could feel more like a scheduling problem than a spatial puzzle

---

## Concept B: Order-of-Elimination Puzzle

### Mechanics
- **Adventurer abilities affect the puzzle state**
  - **Cleric**: Heals allies within 2 squares (can't kill anyone near living cleric)
  - **Wizard**: Illuminates area, expands detection ranges
  - **Rogue**: Detects slime in adjacent cells
  - **Fighter**: Blocks chokepoints, cube can't move through them
- **Static positions** - adventurers don't move
- **Cube abilities** that unlock when consuming certain adventurers
  - Eating wizard gives you "arcane vision"
  - Eating rogue gives you "stealth"
  - Eating fighter gives you "strength" (break walls?)
- **Goal**: Figure out which order to eliminate adventurers

### "Penciling Out" Process
Players would reason:
- "I can't reach the cleric while fighter blocks the corridor"
- "I can't kill the wizard while cleric can heal them"
- "But if I kill the rogue first, I lose stealth approach to cleric"
- "Wait - if I get the wizard first, I can see the secret passage to reach fighter..."
- "So the order must be: Wizard → Fighter → Rogue → Cleric"

### Puzzle Elements
- **Given**: Adventurer positions, abilities, terrain, cube starting position
- **Deduce**: Optimal elimination order, which abilities to acquire
- **Constraints**: Ability interactions, terrain blocking, detection zones

### Difficulty Scaling
- Beginner: 3-4 adventurers, simple rock-paper-scissors interactions
- Advanced: 6-8 adventurers, chain reactions, multiple ability unlocks
- Expert: Hidden information (deduce adventurer types from context)

### Pros
- More strategic depth than pure movement
- Feels very D&D-like (tactical party combat)
- Each puzzle can feel very different

### Cons
- Rules might be complex for new players
- Could be hard to balance difficulty

---

## Concept C: Resource Management Puzzle

### Mechanics
- **Cube has limited movement points** (e.g., 20 moves total)
- **Different terrain costs**:
  - Open floor: 1 move
  - Rough stone: 2 moves
  - Water/acid: 3 moves (but cube gains health)
  - Grates/vents: 0 moves (slime through)
- **Adventurers at different distances**
- **Consuming adventurers grants resources**
  - Health restoration
  - Extra moves
  - Special abilities
- **Goal**: Calculate most efficient path to eliminate all targets within move budget

### "Penciling Out" Process
Players would calculate:
- "Path A to fighter: 8 moves, but fighter gives 10 moves back = net +2"
- "Path B to wizard: 6 moves, wizard gives 5 moves = net -1"
- "If I go Wizard→Rogue→Fighter, total: 6+4+7=17 moves, gain 15 = 2 left over ✓"
- "If I go Fighter→Wizard→Rogue, total: 8+3+5=16 moves, gain 18 = 6 left over ✓✓"
- "But fighter path crosses rogue's detection zone, so must go wizard first!"

### Puzzle Elements
- **Given**: Movement costs, adventurer locations, resources gained
- **Deduce**: Optimal path that satisfies move budget and constraints
- **Constraints**: Limited moves, detection zones, terrain obstacles

### Difficulty Scaling
- Beginner: Simple grid, 3 adventurers, generous move budget
- Advanced: Complex terrain, tight move budget, detection zones
- Expert: Must gain specific abilities to access certain areas

### Pros
- Math-heavy like Sudoku (calculate exact paths)
- Clear win/lose conditions (enough moves or not)
- Terrain adds spatial variety

### Cons
- Might feel like an optimization problem rather than logic puzzle
- Less narrative/thematic than other options

---

## Hybrid Concepts

### D: Spatial Logic Puzzle (Nonogram-style)
- Grid has **revealed and hidden information**
- Clues tell you "3 adventurers in this row" or "Wizard not in columns 1-4"
- Deduce exact positions before planning approach
- Very Sudoku-like in deduction style

### E: Constraint Satisfaction Puzzle
- Multiple objectives: "Eliminate wizard before turn 5", "Cleric must survive", "Don't cross light zones"
- Find the one path that satisfies all constraints
- Like a logic grid puzzle

---

## Key Questions to Answer

### 1. Information: Perfect or Imperfect?
- **Perfect**: All adventurer positions, abilities visible (like chess)
- **Imperfect**: Some info hidden, must be deduced (like Sudoku)

### 2. Movement: Real-time or Planned?
- **Real-time**: Adventurers move each turn (dynamic puzzle)
- **Planned**: Static positions, plan entire route upfront (spatial puzzle)

### 3. Solution Space: Unique or Multiple?
- **Unique**: Exactly one solution (very Sudoku-like)
- **Multiple**: Several solutions, rate by efficiency (more game-like)

### 4. Victory Condition: What Makes You "Win"?
- Eliminate all adventurers?
- Eliminate specific targets?
- Reach exit alive?
- Collect items?
- Satisfy multiple constraints?

### 5. Failure State: Can You Get Stuck?
- Is there a "you've already lost" state mid-puzzle?
- Or do you only win/lose at the end?
- Should illegal moves be prevented or allowed (for learning)?

---

## Recommendation for MVP

**Start with Concept B (Order-of-Elimination) with static positions:**

**Why:**
1. Most "puzzle-like" - figure out the logic, then execute
2. Clear mental model - positions visible, deduce order
3. Easy to hand-craft interesting scenarios
4. Scales well from easy to hard
5. Most thematically D&D (party composition matters)

**MVP Features:**
- 9x9 grid
- 4-5 adventurer types with simple abilities
- Static positions (no patrols)
- One scenario: "Ambush the Party"
- Hand-crafted puzzle (not procedural yet)
- Simple ASCII rendering
- Click cells to move/attack
- Win condition: All adventurers eliminated

**Future Expansions:**
- Add patrol patterns (layer in Concept A)
- Add resource costs (layer in Concept C)
- Procedural generation
- Multiple scenarios
- Difficulty levels

---

*Mechanics brainstormed: 2026-01-14*
