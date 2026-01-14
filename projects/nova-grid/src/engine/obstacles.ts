/**
 * Nova3 Web - Obstacle System
 * Handles all 20 obstacle types and their behaviors
 */

import {
  ObstacleType,
  Direction,
  Position,
  SpeedMode,
  Matrix,
  Rover,
  ProbabilityParams,
} from './types';
import {
  randomDirection,
  randomPosition,
  getNeighbors,
  randomElement,
  testProbability,
} from './utils';

// ============================================================================
// OBSTACLE BEHAVIOR
// ============================================================================

/**
 * Result of obstacle collision
 */
export interface ObstacleEffect {
  direction: Direction;      // New direction after obstacle
  position: Position;         // New position (for teleport)
  speed: SpeedMode;          // New speed mode
  paused: boolean;           // Whether rover should pause this cycle
}

/**
 * Apply obstacle effect to rover
 */
export function applyObstacleEffect(
  rover: Rover,
  obstacle: ObstacleType,
  matrix: Matrix,
  probability: ProbabilityParams,
  alternatingState: boolean // For wedge alternation
): ObstacleEffect {
  // Check obstacle probability
  if (!testProbability(probability.obstacle)) {
    // Obstacle doesn't affect rover this time
    return {
      direction: rover.direction,
      position: rover.position,
      speed: rover.speed,
      paused: false,
    };
  }

  switch (obstacle) {
    // MIRRORS (4 types) - reflect direction
    case ObstacleType.MIRROR_HORIZONTAL:
      return mirrorHorizontal(rover);

    case ObstacleType.MIRROR_VERTICAL:
      return mirrorVertical(rover);

    case ObstacleType.MIRROR_UP:
      return mirrorUp(rover);

    case ObstacleType.MIRROR_DOWN:
      return mirrorDown(rover);

    // WEDGES (4 types) - redirect to specific direction
    case ObstacleType.WEDGE_NORTH:
      return wedge(rover, Direction.NORTH, alternatingState);

    case ObstacleType.WEDGE_EAST:
      return wedge(rover, Direction.EAST, alternatingState);

    case ObstacleType.WEDGE_SOUTH:
      return wedge(rover, Direction.SOUTH, alternatingState);

    case ObstacleType.WEDGE_WEST:
      return wedge(rover, Direction.WEST, alternatingState);

    // RANDOMIZERS (3 types)
    case ObstacleType.BOUNCE:
      return bounce(rover, matrix);

    case ObstacleType.WORMHOLE:
      return wormhole(rover, matrix);

    case ObstacleType.SPIN:
      return spin(rover);

    // TIMING (1 type)
    case ObstacleType.PAUSE:
      return pause(rover, alternatingState);

    // MIRROR + FLIP (4 types)
    case ObstacleType.MIRROR_HORIZONTAL_FLIP:
      return mirrorHorizontalFlip(rover);

    case ObstacleType.MIRROR_VERTICAL_FLIP:
      return mirrorVerticalFlip(rover);

    case ObstacleType.MIRROR_UP_FLIP:
      return mirrorUpFlip(rover);

    case ObstacleType.MIRROR_DOWN_FLIP:
      return mirrorDownFlip(rover);

    // SPEED MODIFIERS (3 types)
    case ObstacleType.SLOW_DOWN:
      return slowDown(rover);

    case ObstacleType.SPEED_UP:
      return speedUp(rover);

    case ObstacleType.TOGGLE_PACE:
      return togglePace(rover);

    default:
      return {
        direction: rover.direction,
        position: rover.position,
        speed: rover.speed,
        paused: false,
      };
  }
}

// ============================================================================
// MIRROR OBSTACLES
// ============================================================================

/**
 * Horizontal mirror | - reflects E/W
 */
function mirrorHorizontal(rover: Rover): ObstacleEffect {
  const mapping: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.NORTH,
    [Direction.SOUTH]: Direction.SOUTH,
    [Direction.EAST]: Direction.WEST,
    [Direction.WEST]: Direction.EAST,
    [Direction.NORTHEAST]: Direction.NORTHWEST,
    [Direction.NORTHWEST]: Direction.NORTHEAST,
    [Direction.SOUTHEAST]: Direction.SOUTHWEST,
    [Direction.SOUTHWEST]: Direction.SOUTHEAST,
  };

  return {
    direction: mapping[rover.direction],
    position: rover.position,
    speed: rover.speed,
    paused: false,
  };
}

/**
 * Vertical mirror - reflects N/S
 */
function mirrorVertical(rover: Rover): ObstacleEffect {
  const mapping: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.SOUTH,
    [Direction.SOUTH]: Direction.NORTH,
    [Direction.EAST]: Direction.EAST,
    [Direction.WEST]: Direction.WEST,
    [Direction.NORTHEAST]: Direction.SOUTHEAST,
    [Direction.NORTHWEST]: Direction.SOUTHWEST,
    [Direction.SOUTHEAST]: Direction.NORTHEAST,
    [Direction.SOUTHWEST]: Direction.NORTHWEST,
  };

  return {
    direction: mapping[rover.direction],
    position: rover.position,
    speed: rover.speed,
    paused: false,
  };
}

/**
 * Mirror up / - diagonal reflection
 */
function mirrorUp(rover: Rover): ObstacleEffect {
  const mapping: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.EAST,
    [Direction.SOUTH]: Direction.WEST,
    [Direction.EAST]: Direction.NORTH,
    [Direction.WEST]: Direction.SOUTH,
    [Direction.NORTHEAST]: Direction.NORTHEAST,
    [Direction.NORTHWEST]: Direction.SOUTHEAST,
    [Direction.SOUTHEAST]: Direction.NORTHWEST,
    [Direction.SOUTHWEST]: Direction.SOUTHWEST,
  };

  return {
    direction: mapping[rover.direction],
    position: rover.position,
    speed: rover.speed,
    paused: false,
  };
}

/**
 * Mirror down \ - diagonal reflection
 */
function mirrorDown(rover: Rover): ObstacleEffect {
  const mapping: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.WEST,
    [Direction.SOUTH]: Direction.EAST,
    [Direction.EAST]: Direction.SOUTH,
    [Direction.WEST]: Direction.NORTH,
    [Direction.NORTHEAST]: Direction.SOUTHWEST,
    [Direction.NORTHWEST]: Direction.NORTHWEST,
    [Direction.SOUTHEAST]: Direction.SOUTHEAST,
    [Direction.SOUTHWEST]: Direction.NORTHEAST,
  };

  return {
    direction: mapping[rover.direction],
    position: rover.position,
    speed: rover.speed,
    paused: false,
  };
}

// ============================================================================
// WEDGE OBSTACLES
// ============================================================================

/**
 * Wedge - redirects to specific direction
 * Alternates between clockwise and counter-clockwise when hitting tip
 */
function wedge(rover: Rover, wedgeDirection: Direction, alternating: boolean): ObstacleEffect {
  // If rover is coming from the wedge's direction (hitting the tip),
  // rotate it alternately
  if (isOppositeDirection(rover.direction, wedgeDirection)) {
    const newDirection = alternating
      ? rotateClockwise(rover.direction)
      : rotateCounterClockwise(rover.direction);

    return {
      direction: newDirection,
      position: rover.position,
      speed: rover.speed,
      paused: false,
    };
  }

  // Otherwise, redirect to wedge direction
  return {
    direction: wedgeDirection,
    position: rover.position,
    speed: rover.speed,
    paused: false,
  };
}

function isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
  const opposites: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.SOUTH,
    [Direction.SOUTH]: Direction.NORTH,
    [Direction.EAST]: Direction.WEST,
    [Direction.WEST]: Direction.EAST,
    [Direction.NORTHEAST]: Direction.SOUTHWEST,
    [Direction.NORTHWEST]: Direction.SOUTHEAST,
    [Direction.SOUTHEAST]: Direction.NORTHWEST,
    [Direction.SOUTHWEST]: Direction.NORTHEAST,
  };

  return opposites[dir1] === dir2;
}

function rotateClockwise(direction: Direction): Direction {
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

function rotateCounterClockwise(direction: Direction): Direction {
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
  return order[(index - 1 + 8) % 8];
}

// ============================================================================
// RANDOMIZER OBSTACLES
// ============================================================================

/**
 * Bounce X - random neighbor cell + random direction
 */
function bounce(rover: Rover, matrix: Matrix): ObstacleEffect {
  const neighbors = getNeighbors(rover.position, matrix.rows, matrix.cols);
  const newPosition = neighbors.length > 0 ? randomElement(neighbors) : rover.position;

  return {
    direction: randomDirection(),
    position: newPosition,
    speed: rover.speed,
    paused: false,
  };
}

/**
 * Wormhole :: - teleport to random cell + random direction
 */
function wormhole(rover: Rover, matrix: Matrix): ObstacleEffect {
  return {
    direction: randomDirection(),
    position: randomPosition(matrix.rows, matrix.cols),
    speed: rover.speed,
    paused: false,
  };
}

/**
 * Spin <> - random direction change only
 */
function spin(rover: Rover): ObstacleEffect {
  return {
    direction: randomDirection(),
    position: rover.position,
    speed: rover.speed,
    paused: false,
  };
}

// ============================================================================
// TIMING OBSTACLES
// ============================================================================

/**
 * Pause O - every other rover pauses 1 step
 */
function pause(rover: Rover, shouldPause: boolean): ObstacleEffect {
  return {
    direction: rover.direction,
    position: rover.position,
    speed: rover.speed,
    paused: shouldPause,
  };
}

// ============================================================================
// MIRROR + FLIP OBSTACLES
// ============================================================================

/**
 * Mirror horizontal flip |. - same as mirror but also reverses direction
 */
function mirrorHorizontalFlip(rover: Rover): ObstacleEffect {
  const mirrored = mirrorHorizontal(rover);
  return {
    ...mirrored,
    direction: reverseDirection(mirrored.direction),
  };
}

/**
 * Mirror vertical flip -. - same as mirror but also reverses direction
 */
function mirrorVerticalFlip(rover: Rover): ObstacleEffect {
  const mirrored = mirrorVertical(rover);
  return {
    ...mirrored,
    direction: reverseDirection(mirrored.direction),
  };
}

/**
 * Mirror up flip /. - same as mirror but also reverses direction
 */
function mirrorUpFlip(rover: Rover): ObstacleEffect {
  const mirrored = mirrorUp(rover);
  return {
    ...mirrored,
    direction: reverseDirection(mirrored.direction),
  };
}

/**
 * Mirror down flip \. - same as mirror but also reverses direction
 */
function mirrorDownFlip(rover: Rover): ObstacleEffect {
  const mirrored = mirrorDown(rover);
  return {
    ...mirrored,
    direction: reverseDirection(mirrored.direction),
  };
}

function reverseDirection(direction: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.SOUTH,
    [Direction.SOUTH]: Direction.NORTH,
    [Direction.EAST]: Direction.WEST,
    [Direction.WEST]: Direction.EAST,
    [Direction.NORTHEAST]: Direction.SOUTHWEST,
    [Direction.NORTHWEST]: Direction.SOUTHEAST,
    [Direction.SOUTHEAST]: Direction.NORTHWEST,
    [Direction.SOUTHWEST]: Direction.NORTHEAST,
  };

  return opposites[direction];
}

// ============================================================================
// SPEED MODIFIER OBSTACLES
// ============================================================================

/**
 * Slow down ~ - change to slow pace
 */
function slowDown(rover: Rover): ObstacleEffect {
  return {
    direction: rover.direction,
    position: rover.position,
    speed: SpeedMode.SLOW,
    paused: false,
  };
}

/**
 * Speed up ! - change to normal pace
 */
function speedUp(rover: Rover): ObstacleEffect {
  return {
    direction: rover.direction,
    position: rover.position,
    speed: SpeedMode.NORMAL,
    paused: false,
  };
}

/**
 * Toggle pace % - flip between slow/normal
 */
function togglePace(rover: Rover): ObstacleEffect {
  return {
    direction: rover.direction,
    position: rover.position,
    speed: rover.speed === SpeedMode.NORMAL ? SpeedMode.SLOW : SpeedMode.NORMAL,
    paused: false,
  };
}

// ============================================================================
// OBSTACLE METADATA
// ============================================================================

/**
 * Get display symbol for obstacle type
 */
export function getObstacleSymbol(obstacle: ObstacleType): string {
  return obstacle;
}

/**
 * Get description for obstacle type
 */
export function getObstacleDescription(obstacle: ObstacleType): string {
  const descriptions: Record<ObstacleType, string> = {
    [ObstacleType.MIRROR_HORIZONTAL]: 'Horizontal Mirror - Reflects E/W',
    [ObstacleType.MIRROR_VERTICAL]: 'Vertical Mirror - Reflects N/S',
    [ObstacleType.MIRROR_UP]: 'Mirror Up - Diagonal reflection /',
    [ObstacleType.MIRROR_DOWN]: 'Mirror Down - Diagonal reflection \\',
    [ObstacleType.WEDGE_NORTH]: 'Wedge North - Redirects to North',
    [ObstacleType.WEDGE_EAST]: 'Wedge East - Redirects to East',
    [ObstacleType.WEDGE_SOUTH]: 'Wedge South - Redirects to South',
    [ObstacleType.WEDGE_WEST]: 'Wedge West - Redirects to West',
    [ObstacleType.BOUNCE]: 'Bounce - Random neighbor + random direction',
    [ObstacleType.WORMHOLE]: 'Wormhole - Teleport to random cell + random direction',
    [ObstacleType.SPIN]: 'Spin - Random direction change',
    [ObstacleType.PAUSE]: 'Pause - Every other rover pauses',
    [ObstacleType.MIRROR_HORIZONTAL_FLIP]: 'Mirror H + Flip - Reflects E/W and reverses',
    [ObstacleType.MIRROR_VERTICAL_FLIP]: 'Mirror V + Flip - Reflects N/S and reverses',
    [ObstacleType.MIRROR_UP_FLIP]: 'Mirror Up + Flip - Diagonal reflection / and reverses',
    [ObstacleType.MIRROR_DOWN_FLIP]: 'Mirror Down + Flip - Diagonal reflection \\ and reverses',
    [ObstacleType.SLOW_DOWN]: 'Slow Down - Change to slow pace',
    [ObstacleType.SPEED_UP]: 'Speed Up - Change to normal pace',
    [ObstacleType.TOGGLE_PACE]: 'Toggle Pace - Flip between slow/normal',
  };

  return descriptions[obstacle];
}

/**
 * Get all obstacle types
 */
export function getAllObstacleTypes(): ObstacleType[] {
  return Object.values(ObstacleType);
}
