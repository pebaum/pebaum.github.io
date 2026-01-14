# Gelatinous Cube Puzzle Game

## Core Concept

A grid-based logic puzzle game that combines the deductive reasoning of Sudoku with D&D-themed scenarios. Players must "pencil out" the solution using logic and planning before executing their moves.

## The Twist: Playing as the Gelatinous Cube

Instead of playing as adventurers exploring a dungeon, you play as a **gelatinous cube** - a classic D&D monster that hunts adventurers. This role reversal creates unique puzzle opportunities:

- Sneaking up behind adventurers
- Using your unique ooze abilities
- Navigating dungeon terrain as a cube of slime
- Dealing with different adventurer types (wizards, fighters, rogues, clerics)

## Grid Format

- **Size**: 9x9 or 10x10 grid
- Grid-based puzzle layout (like Sudoku)
- Each cell can contain:
  - Adventurers (different classes)
  - Terrain (walls, corridors, rooms)
  - Items/objects
  - The gelatinous cube (player)

## Scenario-Based Quests

Each puzzle represents a different D&D encounter or scenario, such as:

- **"Escape the Prison"** - Navigate past guards to freedom
- **"Steal the Gems"** - Collect treasures while avoiding detection
- **"Fight the Boss"** - Take down a powerful enemy
- **"Ambush the Party"** - Eliminate a group of adventurers in the right order
- **"Clean the Dungeon"** - Consume all the trash/enemies
- **"Protect the Treasure"** - Guard valuable items from thieves

Each scenario has different:
- Victory conditions
- Constraints
- Adventurer types and behaviors
- Terrain layouts

## The "Sudoku-Like" Puzzle Element

Like Sudoku, the puzzle should require:

- **Logical deduction** - figuring out the only valid solution
- **Penciling/note-taking** - working out possibilities before committing
- **Constraint satisfaction** - meeting all the rules/requirements
- **Incremental solving** - solving one part unlocks the next

The key difference from real-time roguelikes: this is a **pure logic puzzle** where you plan everything out before executing.

## Difficulty Levels

Puzzles can scale in difficulty:

- **Beginner**: Simple, direct path to victory
- **Intermediate**: Multiple adventurer types, order matters
- **Advanced**: Complex ability interactions, tight constraints
- **Expert**: Minimal information given, maximum deduction required

## Procedural Generation

- **Seed-based generation** - same seed = same puzzle
- Ensures puzzles are always solvable
- Can share interesting seeds with friends
- Potential for both hand-crafted and procedurally generated puzzles

## Visual Style

Following the aesthetic of existing projects:
- ASCII/Unicode character-based graphics
- Monospace font
- Dark background
- Colored text for different elements
- Retro dungeon-crawler look
- Clean, minimalist interface

## Open Questions (To Be Decided)

1. What exactly makes the puzzle "solvable through logic"?
2. Turn-based movement or spatial planning?
3. Do adventurers patrol or stay still?
4. What abilities does the cube have?
5. How do we show constraints/rules to the player?
6. Is there one solution or multiple optimal solutions?

## Inspiration

- **Sudoku** - Logic-based constraint satisfaction
- **Sokoban** - Spatial planning puzzles
- **Into the Breach** - Perfect information tactical puzzles
- **D&D Gelatinous Cubes** - Classic dungeon hazard
- **Chess Puzzles** - "Mate in N moves" planning

---

*Concept created: 2026-01-14*
