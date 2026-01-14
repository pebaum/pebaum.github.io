/**
 * Nova3 Web - Rover System
 * Handles rover movement, wall collisions, and behaviors
 */

import {
  Rover,
  Matrix,
  Direction,
  Wall,
  Position,
  NoteEvent,
  ProbabilityParams,
  WallClimb,
} from './types';
import {
  movePosition,
  getWallAt,
  reflectDirection,
  testProbability,
  randomDirection,
  wrapPosition,
  shiftAlongWall,
  getDirectionDelta,
} from './utils';
import { updateRover, moveRover as moveRoverInMatrix } from './matrix';

// ============================================================================
// ROVER MOVEMENT
// ============================================================================

/**
 * Result of a rover movement step
 */
export interface RoverMovementResult {
  matrix: Matrix;
  rover: Rover;
  noteEvents: NoteEvent[];
  wallStruck: Wall | null;
}

/**
 * Move a single rover one step
 */
export function moveRoverStep(
  matrix: Matrix,
  roverId: string,
  probability: ProbabilityParams,
  wallClimb: WallClimb,
  dynamics: { velocity: number; velocityJitter: number; length: number; lengthJitter: number },
  scaleMapper: (pos: Position, wall: Wall) => number // Function to map position+wall to MIDI note
): RoverMovementResult {
  let currentMatrix = matrix;
  const rover = getRover(currentMatrix, roverId);
  if (!rover) {
    return {
      matrix,
      rover: rover!,
      noteEvents: [],
      wallStruck: null,
    };
  }

  let currentDirection = rover.direction;
  const noteEvents: NoteEvent[] = [];

  // Apply wobble (random deviation from path)
  if (testProbability(probability.wobble)) {
    currentDirection = applyWobble(currentDirection);
  }

  // Calculate next position
  let nextPosition = movePosition(rover.position, currentDirection);

  // Check if we're moving into a wall
  const wall = getWallAtNextPosition(rover.position, nextPosition, matrix.rows, matrix.cols);

  if (wall) {
    // We're hitting a wall!

    // Check if we should wrap through wall instead of bouncing
    if (testProbability(probability.wrap)) {
      // Wrap to opposite wall
      nextPosition = wrapPosition(nextPosition, matrix.rows, matrix.cols);
    } else {
      // Normal wall collision - reflect and emit note

      // Apply wall climb (shift position along wall)
      const climbAmount = getWallClimbAmount(wall, wallClimb);
      if (climbAmount !== 0) {
        nextPosition = shiftAlongWall(rover.position, wall, climbAmount, matrix.rows, matrix.cols);
      }

      // Reflect direction
      currentDirection = reflectDirection(currentDirection, wall);

      // Emit note event (if probability allows)
      if (testProbability(probability.note)) {
        const midiNote = scaleMapper(rover.position, wall);
        const velocity = calculateVelocity(dynamics.velocity, dynamics.velocityJitter);
        const duration = calculateDuration(dynamics.length, dynamics.lengthJitter);

        noteEvents.push({
          midiNote,
          velocity,
          duration,
          wall,
          position: rover.position,
          timestamp: Date.now(),
        });
      }

      // Don't actually move into the wall - stay at current position
      nextPosition = rover.position;
    }
  }

  // Update rover direction
  currentMatrix = updateRover(currentMatrix, roverId, (r) => ({
    ...r,
    direction: currentDirection,
  }));

  // Move rover to new position (if it changed)
  if (nextPosition.row !== rover.position.row || nextPosition.col !== rover.position.col) {
    currentMatrix = moveRoverInMatrix(currentMatrix, roverId, nextPosition);
  }

  const updatedRover = getRover(currentMatrix, roverId)!;

  return {
    matrix: currentMatrix,
    rover: updatedRover,
    noteEvents,
    wallStruck: wall,
  };
}

/**
 * Get rover from matrix
 */
function getRover(matrix: Matrix, roverId: string): Rover | null {
  for (const row of matrix.cells) {
    for (const cell of row) {
      const rover = cell.rovers.find((r) => r.id === roverId);
      if (rover) return rover;
    }
  }
  return null;
}

/**
 * Check if moving from current to next position hits a wall
 */
function getWallAtNextPosition(
  current: Position,
  next: Position,
  rows: number,
  cols: number
): Wall | null {
  // Check if next position is out of bounds
  if (next.row < 0) return Wall.NORTH;
  if (next.row >= rows) return Wall.SOUTH;
  if (next.col < 0) return Wall.WEST;
  if (next.col >= cols) return Wall.EAST;

  return null;
}

/**
 * Apply wobble - random deviation from direction
 */
function applyWobble(direction: Direction): Direction {
  // 50% chance to deviate, otherwise keep current direction
  if (Math.random() < 0.5) {
    return direction;
  }

  // Get adjacent directions (clockwise and counter-clockwise)
  const allDirections = [
    Direction.NORTH,
    Direction.NORTHEAST,
    Direction.EAST,
    Direction.SOUTHEAST,
    Direction.SOUTH,
    Direction.SOUTHWEST,
    Direction.WEST,
    Direction.NORTHWEST,
  ];

  const currentIndex = allDirections.indexOf(direction);
  const deviation = Math.random() < 0.5 ? -1 : 1; // Clockwise or counter-clockwise
  const newIndex = (currentIndex + deviation + 8) % 8;

  return allDirections[newIndex];
}

/**
 * Get wall climb amount for a specific wall
 */
function getWallClimbAmount(wall: Wall, wallClimb: WallClimb): number {
  switch (wall) {
    case Wall.NORTH:
      return Math.round(wallClimb.north);
    case Wall.SOUTH:
      return Math.round(wallClimb.south);
    case Wall.EAST:
      return Math.round(wallClimb.east);
    case Wall.WEST:
      return Math.round(wallClimb.west);
  }
}

/**
 * Calculate velocity with jitter
 */
function calculateVelocity(base: number, jitter: number): number {
  const variation = (Math.random() - 0.5) * 2 * jitter;
  return Math.max(1, Math.min(127, Math.round(base + variation)));
}

/**
 * Calculate duration with jitter
 */
function calculateDuration(base: number, jitter: number): number {
  const variation = (Math.random() - 0.5) * 2 * jitter;
  return Math.max(10, base + variation); // Minimum 10ms duration
}

// ============================================================================
// ROVER SPEED
// ============================================================================

/**
 * Check if rover should move this cycle based on speed mode
 */
export function shouldRoverMove(rover: Rover, cycle: number, slowFactor: number): boolean {
  if (rover.speed === 'NORMAL') {
    return true;
  }

  // SLOW mode - move every Nth cycle based on slowFactor
  // slowFactor of 2 = move every other cycle
  const interval = Math.max(1, Math.round(slowFactor));
  return cycle % interval === 0;
}

// ============================================================================
// ROVER COLLISION WITH ROVER
// ============================================================================

/**
 * Check if two rovers are at the same position
 */
export function areRoversColliding(rover1: Rover, rover2: Rover): boolean {
  return (
    rover1.position.row === rover2.position.row &&
    rover1.position.col === rover2.position.col &&
    rover1.id !== rover2.id
  );
}

/**
 * Handle rover-to-rover collision (both rotate clockwise)
 */
export function handleRoverCollision(
  matrix: Matrix,
  rover1Id: string,
  rover2Id: string,
  collisionGroupId: string
): Matrix {
  let newMatrix = matrix;

  // Rotate both rovers clockwise
  newMatrix = updateRover(newMatrix, rover1Id, (r) => ({
    ...r,
    direction: rotateDirectionClockwise(r.direction),
    collisionGroup: collisionGroupId,
    collisionCycles: r.collisionGroup === collisionGroupId ? r.collisionCycles + 1 : 1,
  }));

  newMatrix = updateRover(newMatrix, rover2Id, (r) => ({
    ...r,
    direction: rotateDirectionClockwise(r.direction),
    collisionGroup: collisionGroupId,
    collisionCycles: r.collisionGroup === collisionGroupId ? r.collisionCycles + 1 : 1,
  }));

  return newMatrix;
}

/**
 * Rotate direction clockwise
 */
function rotateDirectionClockwise(direction: Direction): Direction {
  const order = [
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
 * Release rover from collision group if cycle limit exceeded
 */
export function checkCollisionGroupLimit(
  matrix: Matrix,
  roverId: string,
  groupLimit: number
): Matrix {
  if (groupLimit === 0) return matrix; // No limit

  const rover = getRover(matrix, roverId);
  if (!rover || !rover.collisionGroup) return matrix;

  if (rover.collisionCycles >= groupLimit) {
    // Release from collision group
    return updateRover(matrix, roverId, (r) => ({
      ...r,
      collisionGroup: null,
      collisionCycles: 0,
    }));
  }

  return matrix;
}

// ============================================================================
// OBSTACLE COLLISION (will be implemented in obstacles.ts)
// ============================================================================

/**
 * This will be implemented in obstacles.ts to handle all 20 obstacle types
 */
export interface ObstacleCollisionResult {
  direction: Direction;
  position: Position;
  speed: string;
  teleported: boolean;
}
