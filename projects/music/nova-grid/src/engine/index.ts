/**
 * Nova3 Web - Engine Module
 * Exports all engine functionality
 */

// Types
export * from './types';

// Matrix operations
export * from './matrix';

// Rover system
export * from './rover';

// Obstacle system
export * from './obstacles';

// Main engine
export * from './engine';

// Utils (selective exports to avoid conflicts)
export {
  getDirectionDelta,
  reverseDirection,
  positionsEqual,
  movePosition,
  isInBounds,
  getWallAt,
  isAtWall,
  wrapPosition,
  getNeighbors,
  randomPosition,
  shiftAlongWall,
  testProbability,
  applyTilt,
  addJitter,
  randomElement,
  shuffle,
  generateId,
} from './utils';
