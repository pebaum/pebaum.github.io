/**
 * Nova3 Web - Main Engine
 * Orchestrates the cellular automata simulation
 */

import {
  EngineState,
  Matrix,
  Rover,
  NoteEvent,
  Wall,
  Position,
  ScaleVariation,
  WallScaleMapping,
  ProbabilityParams,
  TimingParams,
  DynamicsParams,
  CollisionParams,
  WallClimb,
  VelocitySequencer,
  Pattern,
  ObstacleType,
} from './types';
import {
  createMatrix,
  getAllRovers,
  getCell,
  cloneMatrix,
  updateRover as updateRoverInMatrix,
} from './matrix';
import { moveRoverStep, shouldRoverMove, areRoversColliding, handleRoverCollision, checkCollisionGroupLimit } from './rover';
import { applyObstacleEffect } from './obstacles';
import { generateId } from './utils';

// ============================================================================
// ENGINE INITIALIZATION
// ============================================================================

/**
 * Create default engine state
 */
export function createEngineState(rows: number = 8, cols: number = 8): EngineState {
  return {
    matrix: createMatrix(rows, cols),

    scaleVariations: [
      createDefaultScaleVariation(),
      createDefaultScaleVariation(),
      createDefaultScaleVariation(),
      createDefaultScaleVariation(),
    ],

    wallScaleMappings: [
      { wall: Wall.NORTH, variationIndex: 0, muted: false },
      { wall: Wall.EAST, variationIndex: 1, muted: false },
      { wall: Wall.SOUTH, variationIndex: 2, muted: false },
      { wall: Wall.WEST, variationIndex: 3, muted: false },
    ],

    probability: {
      note: 1.0,
      tilt: 0.5,
      obstacle: 1.0,
      wrap: 0.0,
      nearby: 0.0,
      wobble: 0.0,
      repeat: 0.0,
    },

    timing: {
      bpm: 120,
      timeUnits: 16, // 16th notes
      slow: 2, // 2x slower for slow mode
      swing: 0,
      humanize: 0,
      simplify: 1, // Every cycle
      repeatLength: 1,
    },

    dynamics: {
      velocity: 100,
      velocityJitter: 0,
      length: 100, // ms
      lengthJitter: 0,
    },

    collision: {
      groupLimit: 4, // Max 4 cycles in collision group
    },

    wallClimb: {
      north: 0,
      south: 0,
      east: 0,
      west: 0,
    },

    velocitySequencer: createDefaultVelocitySequencer(),

    patterns: Array(8).fill(null).map((_, i) => ({
      id: i,
      name: `Pattern ${i + 1}`,
      matrix: null,
    })),

    isPlaying: false,
    currentCycle: 0,
  };
}

function createDefaultScaleVariation(): ScaleVariation {
  return {
    scaleId: 'major',
    rootPitch: 60, // Middle C
    rotation: 0,
    direction: 'forward',
  };
}

function createDefaultVelocitySequencer(): VelocitySequencer {
  return {
    steps: Array(32).fill(null).map(() => ({
      height: 1.0,
      muted: false,
      locked: false,
    })),
    currentStep: 0,
  };
}

// ============================================================================
// SIMULATION CYCLE
// ============================================================================

/**
 * Result of a simulation cycle
 */
export interface CycleResult {
  state: EngineState;
  noteEvents: NoteEvent[];
  collisions: number;
}

/**
 * Run one simulation cycle
 */
export function runCycle(state: EngineState, scaleLibrary: Map<string, number[]>): CycleResult {
  if (!state.isPlaying) {
    return {
      state,
      noteEvents: [],
      collisions: 0,
    };
  }

  let currentState = { ...state };
  const allNoteEvents: NoteEvent[] = [];
  let collisionCount = 0;

  // Increment cycle counter
  currentState.currentCycle++;

  // Advance velocity sequencer
  currentState.velocitySequencer = {
    ...currentState.velocitySequencer,
    currentStep: (currentState.velocitySequencer.currentStep + 1) % 32,
  };

  // Get all rovers
  const rovers = getAllRovers(currentState.matrix);

  // Phase 1: Handle obstacle collisions for all rovers
  for (const rover of rovers) {
    const cell = getCell(currentState.matrix, rover.position);
    if (cell?.obstacle) {
      const effect = applyObstacleEffect(
        rover,
        cell.obstacle,
        currentState.matrix,
        currentState.probability,
        currentState.currentCycle % 2 === 0 // Alternating state for wedges/pause
      );

      // Apply effect
      currentState.matrix = updateRoverInMatrix(currentState.matrix, rover.id, (r) => ({
        ...r,
        direction: effect.direction,
        position: effect.position,
        speed: effect.speed,
      }));
    }
  }

  // Phase 2: Move rovers and detect wall collisions
  const updatedRovers = getAllRovers(currentState.matrix);
  for (const rover of updatedRovers) {
    // Check if rover should move this cycle (based on speed mode)
    if (!shouldRoverMove(rover, currentState.currentCycle, currentState.timing.slow)) {
      continue;
    }

    // Move rover
    const scaleMapper = createScaleMapper(
      currentState.scaleVariations,
      currentState.wallScaleMappings,
      scaleLibrary
    );

    const moveResult = moveRoverStep(
      currentState.matrix,
      rover.id,
      currentState.probability,
      currentState.wallClimb,
      currentState.dynamics,
      scaleMapper
    );

    currentState.matrix = moveResult.matrix;

    // Apply velocity sequencer scaling to note events
    const scaledNotes = moveResult.noteEvents.map((note) => {
      const step = currentState.velocitySequencer.steps[currentState.velocitySequencer.currentStep];
      if (step.muted) {
        return null; // Filter out muted steps
      }

      return {
        ...note,
        velocity: Math.round(note.velocity * step.height),
      };
    }).filter((n): n is NoteEvent => n !== null);

    allNoteEvents.push(...scaledNotes);
  }

  // Phase 3: Detect rover-to-rover collisions
  const finalRovers = getAllRovers(currentState.matrix);
  const processedPairs = new Set<string>();

  for (let i = 0; i < finalRovers.length; i++) {
    for (let j = i + 1; j < finalRovers.length; j++) {
      const rover1 = finalRovers[i];
      const rover2 = finalRovers[j];

      if (areRoversColliding(rover1, rover2)) {
        const pairKey = [rover1.id, rover2.id].sort().join('-');
        if (!processedPairs.has(pairKey)) {
          const collisionGroupId = generateId();
          currentState.matrix = handleRoverCollision(
            currentState.matrix,
            rover1.id,
            rover2.id,
            collisionGroupId
          );
          processedPairs.add(pairKey);
          collisionCount++;
        }
      }
    }
  }

  // Phase 4: Check collision group limits
  for (const rover of getAllRovers(currentState.matrix)) {
    currentState.matrix = checkCollisionGroupLimit(
      currentState.matrix,
      rover.id,
      currentState.collision.groupLimit
    );
  }

  return {
    state: currentState,
    noteEvents: allNoteEvents,
    collisions: collisionCount,
  };
}

// ============================================================================
// SCALE MAPPING
// ============================================================================

/**
 * Create scale mapper function that maps position+wall to MIDI note
 */
function createScaleMapper(
  scaleVariations: [ScaleVariation, ScaleVariation, ScaleVariation, ScaleVariation],
  wallMappings: WallScaleMapping[],
  scaleLibrary: Map<string, number[]>
): (pos: Position, wall: Wall) => number {
  return (pos: Position, wall: Wall): number => {
    // Find which scale variation to use based on wall
    const mapping = wallMappings.find((m) => m.wall === wall);
    if (!mapping || mapping.muted) {
      return 60; // Default middle C if muted
    }

    const variation = scaleVariations[mapping.variationIndex];
    const scale = scaleLibrary.get(variation.scaleId);

    if (!scale || scale.length === 0) {
      return variation.rootPitch; // Return root if scale not found
    }

    // Map position to scale degree (use row + col for now)
    const index = (pos.row + pos.col) % scale.length;

    // Apply rotation
    const rotatedIndex = (index + variation.rotation) % scale.length;

    // Apply direction (reverse if needed)
    const finalIndex = variation.direction === 'forward'
      ? rotatedIndex
      : scale.length - 1 - rotatedIndex;

    // Get MIDI note
    return variation.rootPitch + scale[finalIndex];
  };
}

// ============================================================================
// PATTERN MANAGEMENT
// ============================================================================

/**
 * Capture current matrix to pattern slot
 */
export function capturePattern(state: EngineState, slotIndex: number): EngineState {
  if (slotIndex < 0 || slotIndex >= 8) {
    return state;
  }

  const newPatterns = [...state.patterns];
  newPatterns[slotIndex] = {
    ...newPatterns[slotIndex],
    matrix: cloneMatrix(state.matrix),
  };

  return {
    ...state,
    patterns: newPatterns,
  };
}

/**
 * Restore pattern from slot to current matrix
 */
export function restorePattern(state: EngineState, slotIndex: number): EngineState {
  if (slotIndex < 0 || slotIndex >= 8) {
    return state;
  }

  const pattern = state.patterns[slotIndex];
  if (!pattern.matrix) {
    return state;
  }

  return {
    ...state,
    matrix: cloneMatrix(pattern.matrix),
  };
}

/**
 * Clear pattern slot
 */
export function clearPattern(state: EngineState, slotIndex: number): EngineState {
  if (slotIndex < 0 || slotIndex >= 8) {
    return state;
  }

  const newPatterns = [...state.patterns];
  newPatterns[slotIndex] = {
    ...newPatterns[slotIndex],
    matrix: null,
  };

  return {
    ...state,
    patterns: newPatterns,
  };
}

// ============================================================================
// PLAYBACK CONTROL
// ============================================================================

/**
 * Start playback
 */
export function play(state: EngineState): EngineState {
  return {
    ...state,
    isPlaying: true,
  };
}

/**
 * Stop playback
 */
export function stop(state: EngineState): EngineState {
  return {
    ...state,
    isPlaying: false,
  };
}

/**
 * Toggle playback
 */
export function togglePlayback(state: EngineState): EngineState {
  return {
    ...state,
    isPlaying: !state.isPlaying,
  };
}

/**
 * Reset cycle counter
 */
export function resetCycle(state: EngineState): EngineState {
  return {
    ...state,
    currentCycle: 0,
    velocitySequencer: {
      ...state.velocitySequencer,
      currentStep: 0,
    },
  };
}

// ============================================================================
// STATE SERIALIZATION
// ============================================================================

/**
 * Serialize engine state to JSON
 */
export function serializeState(state: EngineState): string {
  return JSON.stringify(state);
}

/**
 * Deserialize engine state from JSON
 */
export function deserializeState(json: string): EngineState {
  return JSON.parse(json);
}

/**
 * Export state as downloadable preset
 */
export function exportPreset(state: EngineState, name: string): Blob {
  const preset = {
    name,
    version: '1.0',
    timestamp: Date.now(),
    state,
  };

  return new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
}

/**
 * Import preset from JSON
 */
export function importPreset(json: string): EngineState {
  const preset = JSON.parse(json);
  return preset.state;
}
