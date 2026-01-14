/**
 * Nova3 Web - Engine Utilities
 * Helper functions for direction, position, and movement calculations
 */

import { Direction, Position, Wall } from './types';

// ============================================================================
// DIRECTION UTILITIES
// ============================================================================

/**
 * Get the delta (row, col) for moving in a direction
 */
export function getDirectionDelta(direction: Direction): { dRow: number; dCol: number } {
  switch (direction) {
    case Direction.NORTH:
      return { dRow: -1, dCol: 0 };
    case Direction.SOUTH:
      return { dRow: 1, dCol: 0 };
    case Direction.EAST:
      return { dRow: 0, dCol: 1 };
    case Direction.WEST:
      return { dRow: 0, dCol: -1 };
    case Direction.NORTHEAST:
      return { dRow: -1, dCol: 1 };
    case Direction.NORTHWEST:
      return { dRow: -1, dCol: -1 };
    case Direction.SOUTHEAST:
      return { dRow: 1, dCol: 1 };
    case Direction.SOUTHWEST:
      return { dRow: 1, dCol: -1 };
  }
}

/**
 * Get the opposite direction (for reflection)
 */
export function reverseDirection(direction: Direction): Direction {
  switch (direction) {
    case Direction.NORTH:
      return Direction.SOUTH;
    case Direction.SOUTH:
      return Direction.NORTH;
    case Direction.EAST:
      return Direction.WEST;
    case Direction.WEST:
      return Direction.EAST;
    case Direction.NORTHEAST:
      return Direction.SOUTHWEST;
    case Direction.NORTHWEST:
      return Direction.SOUTHEAST;
    case Direction.SOUTHEAST:
      return Direction.NORTHWEST;
    case Direction.SOUTHWEST:
      return Direction.NORTHEAST;
  }
}

/**
 * Rotate direction clockwise
 */
export function rotateClockwise(direction: Direction): Direction {
  const order: Direction[] = [
    Direction.NORTH,
    Direction.NORTHEAST,
    Direction.EAST,
    Direction.SOUTHEAST,
    Direction.SOUTH,
    Direction.SOUTHWEST,
    Direction.WEST,
    Direction.NORTHWEST,
  ];

  const index = order.indexOf(direction);
  return order[(index + 1) % 8];
}

/**
 * Rotate direction counter-clockwise
 */
export function rotateCounterClockwise(direction: Direction): Direction {
  const order: Direction[] = [
    Direction.NORTH,
    Direction.NORTHEAST,
    Direction.EAST,
    Direction.SOUTHEAST,
    Direction.SOUTH,
    Direction.SOUTHWEST,
    Direction.WEST,
    Direction.NORTHWEST,
  ];

  const index = order.indexOf(direction);
  return order[(index - 1 + 8) % 8];
}

/**
 * Get random direction
 */
export function randomDirection(): Direction {
  const directions = Object.values(Direction);
  return directions[Math.floor(Math.random() * directions.length)];
}

/**
 * Reflect direction based on wall
 */
export function reflectDirection(direction: Direction, wall: Wall): Direction {
  switch (wall) {
    case Wall.NORTH:
    case Wall.SOUTH:
      // Vertical walls - flip vertical component
      switch (direction) {
        case Direction.NORTH:
          return Direction.SOUTH;
        case Direction.SOUTH:
          return Direction.NORTH;
        case Direction.NORTHEAST:
          return Direction.SOUTHEAST;
        case Direction.NORTHWEST:
          return Direction.SOUTHWEST;
        case Direction.SOUTHEAST:
          return Direction.NORTHEAST;
        case Direction.SOUTHWEST:
          return Direction.NORTHWEST;
        default:
          return direction; // East/West unchanged
      }

    case Wall.EAST:
    case Wall.WEST:
      // Horizontal walls - flip horizontal component
      switch (direction) {
        case Direction.EAST:
          return Direction.WEST;
        case Direction.WEST:
          return Direction.EAST;
        case Direction.NORTHEAST:
          return Direction.NORTHWEST;
        case Direction.NORTHWEST:
          return Direction.NORTHEAST;
        case Direction.SOUTHEAST:
          return Direction.SOUTHWEST;
        case Direction.SOUTHWEST:
          return Direction.SOUTHEAST;
        default:
          return direction; // North/South unchanged
      }
  }
}

// ============================================================================
// POSITION UTILITIES
// ============================================================================

/**
 * Check if two positions are equal
 */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Create a new position by moving in a direction
 */
export function movePosition(pos: Position, direction: Direction): Position {
  const { dRow, dCol } = getDirectionDelta(direction);
  return {
    row: pos.row + dRow,
    col: pos.col + dCol,
  };
}

/**
 * Check if position is within matrix bounds
 */
export function isInBounds(pos: Position, rows: number, cols: number): boolean {
  return pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols;
}

/**
 * Determine which wall (if any) the position is at
 */
export function getWallAt(pos: Position, rows: number, cols: number): Wall | null {
  if (pos.row === 0) return Wall.NORTH;
  if (pos.row === rows - 1) return Wall.SOUTH;
  if (pos.col === 0) return Wall.WEST;
  if (pos.col === cols - 1) return Wall.EAST;
  return null;
}

/**
 * Check if position is at any wall
 */
export function isAtWall(pos: Position, rows: number, cols: number): boolean {
  return getWallAt(pos, rows, cols) !== null;
}

/**
 * Get position wrapped to opposite wall
 */
export function wrapPosition(pos: Position, rows: number, cols: number): Position {
  return {
    row: (pos.row + rows) % rows,
    col: (pos.col + cols) % cols,
  };
}

/**
 * Get all neighboring positions (8-way)
 */
export function getNeighbors(pos: Position, rows: number, cols: number): Position[] {
  const neighbors: Position[] = [];

  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      if (dRow === 0 && dCol === 0) continue; // Skip center

      const neighbor = {
        row: pos.row + dRow,
        col: pos.col + dCol,
      };

      if (isInBounds(neighbor, rows, cols)) {
        neighbors.push(neighbor);
      }
    }
  }

  return neighbors;
}

/**
 * Get random position in matrix
 */
export function randomPosition(rows: number, cols: number): Position {
  return {
    row: Math.floor(Math.random() * rows),
    col: Math.floor(Math.random() * cols),
  };
}

/**
 * Shift position along wall (for wall climb)
 */
export function shiftAlongWall(
  pos: Position,
  wall: Wall,
  amount: number,
  rows: number,
  cols: number
): Position {
  const newPos = { ...pos };

  switch (wall) {
    case Wall.NORTH:
    case Wall.SOUTH:
      // Shift horizontally along top/bottom wall
      newPos.col = Math.max(0, Math.min(cols - 1, newPos.col + amount));
      break;

    case Wall.EAST:
    case Wall.WEST:
      // Shift vertically along left/right wall
      newPos.row = Math.max(0, Math.min(rows - 1, newPos.row + amount));
      break;
  }

  return newPos;
}

// ============================================================================
// PROBABILITY UTILITIES
// ============================================================================

/**
 * Test probability (0-1) - returns true if random value is below threshold
 */
export function testProbability(probability: number): boolean {
  return Math.random() < probability;
}

/**
 * Apply tilt to a value (0-1) based on tilt parameter
 * Tilt > 0.5 biases toward higher values
 * Tilt < 0.5 biases toward lower values
 */
export function applyTilt(value: number, tilt: number): number {
  if (tilt === 0.5) return value;

  // Power curve for tilt
  const power = tilt > 0.5 ? 1 / (2 * (1 - tilt)) : 2 * tilt;
  return Math.pow(value, power);
}

/**
 * Add jitter to a value
 */
export function addJitter(value: number, jitterAmount: number): number {
  const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
  return value + jitter;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Get random element from array
 */
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate unique ID for rovers, collision groups, etc.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
