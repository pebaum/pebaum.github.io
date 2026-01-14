/**
 * Nova3 Web - State Management
 * Zustand store for managing application state
 */

import { create } from 'zustand';
import {
  EngineState,
  Direction,
  SpeedMode,
  ObstacleType,
  Position,
  Rover,
  NoteEvent,
} from '../engine/types';
import {
  createEngineState,
  runCycle,
  capturePattern,
  restorePattern,
  clearPattern,
  play,
  stop,
  togglePlayback,
  resetCycle,
} from '../engine/engine';
import {
  createRover,
  addRover,
  removeRover,
  setObstacle,
  clearRovers,
  clearObstacles,
  clearMatrix,
  flipHorizontal,
  flipVertical,
  shiftMatrix,
  rotateClockwise as rotateMatrixClockwise,
  rotateCounterClockwise as rotateMatrixCounterClockwise,
  removeNewestRover,
  removeOldestRover,
  resizeMatrix,
} from '../engine/matrix';
import { getScaleLibraryAsMap } from '../scales/scaleLibrary';
import { getGlobalSynth } from '../audio/synth';
import { getGlobalScheduler } from '../audio/scheduler';

// ============================================================================
// STORE STATE
// ============================================================================

interface Nova3Store {
  // Engine state
  engineState: EngineState;

  // UI state
  selectedRoverDirection: Direction;
  selectedRoverSpeed: SpeedMode;
  selectedObstacle: ObstacleType | null;
  selectedTool: 'rover' | 'obstacle' | null;
  isInitialized: boolean;

  // Actions - Engine control
  initializeAudio: () => Promise<void>;
  startPlayback: () => void;
  stopPlayback: () => void;
  togglePlay: () => void;
  stepOnce: () => void;

  // Actions - Grid manipulation
  addRoverAt: (position: Position) => void;
  removeRoverAt: (position: Position) => void;
  setObstacleAt: (position: Position, obstacle: ObstacleType | null) => void;
  clearAllRovers: () => void;
  clearAllObstacles: () => void;
  clearAll: () => void;
  removeNewest: () => void;
  removeOldest: () => void;

  // Actions - Matrix transformations
  flipHorizontalMatrix: () => void;
  flipVerticalMatrix: () => void;
  shiftUp: () => void;
  shiftDown: () => void;
  shiftLeft: () => void;
  shiftRight: () => void;
  rotateClockwise: () => void;
  rotateCounterClockwise: () => void;
  resizeGrid: (rows: number, cols: number) => void;

  // Actions - Patterns
  captureToPattern: (slot: number) => void;
  restoreFromPattern: (slot: number) => void;
  clearPatternSlot: (slot: number) => void;

  // Actions - Parameters
  setProbability: (key: string, value: number) => void;
  setTiming: (key: string, value: number) => void;
  setDynamics: (key: string, value: number) => void;
  setWallClimb: (wall: string, value: number) => void;
  setScaleVariation: (index: number, updates: any) => void;
  setWallMapping: (wallIndex: number, variationIndex: number) => void;
  setWallMute: (wallIndex: number, muted: boolean) => void;
  setVelocityStep: (step: number, height: number) => void;
  setVelocityStepMute: (step: number, muted: boolean) => void;

  // Actions - UI
  selectRoverDirection: (direction: Direction) => void;
  selectRoverSpeed: (speed: SpeedMode) => void;
  selectObstacle: (obstacle: ObstacleType | null) => void;
  selectTool: (tool: 'rover' | 'obstacle' | null) => void;
}

// ============================================================================
// CREATE STORE
// ============================================================================

export const useNova3Store = create<Nova3Store>((set, get) => ({
  // Initial state
  engineState: createEngineState(8, 8),
  selectedRoverDirection: Direction.NORTH,
  selectedRoverSpeed: SpeedMode.NORMAL,
  selectedObstacle: null,
  selectedTool: 'rover',
  isInitialized: false,

  // ====================
  // Engine control
  // ====================

  initializeAudio: async () => {
    const synth = getGlobalSynth();
    await synth.initialize();

    const scheduler = getGlobalScheduler();
    scheduler.setCallback(() => {
      get().stepOnce();
    });

    set({ isInitialized: true });
  },

  startPlayback: () => {
    const { engineState, isInitialized } = get();

    if (!isInitialized) {
      console.warn('Audio not initialized. Call initializeAudio() first.');
      return;
    }

    const scheduler = getGlobalScheduler();
    scheduler.setTiming(engineState.timing);
    scheduler.start();

    set({ engineState: play(engineState) });
  },

  stopPlayback: () => {
    const scheduler = getGlobalScheduler();
    scheduler.stop();

    const synth = getGlobalSynth();
    synth.stopAll();

    set({ engineState: stop(get().engineState) });
  },

  togglePlay: () => {
    const { engineState } = get();

    if (engineState.isPlaying) {
      get().stopPlayback();
    } else {
      get().startPlayback();
    }
  },

  stepOnce: () => {
    const { engineState } = get();
    const scaleLibrary = getScaleLibraryAsMap();

    const result = runCycle(engineState, scaleLibrary);

    // Play notes
    if (result.noteEvents.length > 0) {
      const synth = getGlobalSynth();
      synth.playNotes(result.noteEvents);
    }

    set({ engineState: result.state });
  },

  // ====================
  // Grid manipulation
  // ====================

  addRoverAt: (position: Position) => {
    const { engineState, selectedRoverDirection, selectedRoverSpeed } = get();
    const rover = createRover(position, selectedRoverDirection, selectedRoverSpeed);
    const newMatrix = addRover(engineState.matrix, rover);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  removeRoverAt: (position: Position) => {
    const { engineState } = get();
    const cell = engineState.matrix.cells[position.row][position.col];

    if (cell.rovers.length > 0) {
      const roverToRemove = cell.rovers[0]; // Remove first rover at position
      const newMatrix = removeRover(engineState.matrix, roverToRemove.id);

      set({
        engineState: {
          ...engineState,
          matrix: newMatrix,
        },
      });
    }
  },

  setObstacleAt: (position: Position, obstacle: ObstacleType | null) => {
    const { engineState } = get();
    const newMatrix = setObstacle(engineState.matrix, position, obstacle);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  clearAllRovers: () => {
    const { engineState } = get();
    const newMatrix = clearRovers(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  clearAllObstacles: () => {
    const { engineState } = get();
    const newMatrix = clearObstacles(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  clearAll: () => {
    const { engineState } = get();
    const newMatrix = clearMatrix(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  removeNewest: () => {
    const { engineState } = get();
    const newMatrix = removeNewestRover(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  removeOldest: () => {
    const { engineState } = get();
    const newMatrix = removeOldestRover(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  // ====================
  // Matrix transformations
  // ====================

  flipHorizontalMatrix: () => {
    const { engineState } = get();
    const newMatrix = flipHorizontal(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  flipVerticalMatrix: () => {
    const { engineState } = get();
    const newMatrix = flipVertical(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  shiftUp: () => {
    const { engineState } = get();
    const newMatrix = shiftMatrix(engineState.matrix, 'up');

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  shiftDown: () => {
    const { engineState } = get();
    const newMatrix = shiftMatrix(engineState.matrix, 'down');

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  shiftLeft: () => {
    const { engineState } = get();
    const newMatrix = shiftMatrix(engineState.matrix, 'left');

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  shiftRight: () => {
    const { engineState } = get();
    const newMatrix = shiftMatrix(engineState.matrix, 'right');

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  rotateClockwise: () => {
    const { engineState } = get();
    const newMatrix = rotateMatrixClockwise(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  rotateCounterClockwise: () => {
    const { engineState } = get();
    const newMatrix = rotateMatrixCounterClockwise(engineState.matrix);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  resizeGrid: (rows: number, cols: number) => {
    const { engineState } = get();
    const newMatrix = resizeMatrix(engineState.matrix, rows, cols);

    set({
      engineState: {
        ...engineState,
        matrix: newMatrix,
      },
    });
  },

  // ====================
  // Patterns
  // ====================

  captureToPattern: (slot: number) => {
    const { engineState } = get();
    const newState = capturePattern(engineState, slot);
    set({ engineState: newState });
  },

  restoreFromPattern: (slot: number) => {
    const { engineState } = get();
    const newState = restorePattern(engineState, slot);
    set({ engineState: newState });
  },

  clearPatternSlot: (slot: number) => {
    const { engineState } = get();
    const newState = clearPattern(engineState, slot);
    set({ engineState: newState });
  },

  // ====================
  // Parameters
  // ====================

  setProbability: (key: string, value: number) => {
    const { engineState } = get();
    set({
      engineState: {
        ...engineState,
        probability: {
          ...engineState.probability,
          [key]: value,
        },
      },
    });
  },

  setTiming: (key: string, value: number) => {
    const { engineState } = get();
    const newTiming = {
      ...engineState.timing,
      [key]: value,
    };

    set({
      engineState: {
        ...engineState,
        timing: newTiming,
      },
    });

    // Update scheduler if playing
    if (engineState.isPlaying) {
      const scheduler = getGlobalScheduler();
      scheduler.setTiming(newTiming);
    }
  },

  setDynamics: (key: string, value: number) => {
    const { engineState } = get();
    set({
      engineState: {
        ...engineState,
        dynamics: {
          ...engineState.dynamics,
          [key]: value,
        },
      },
    });
  },

  setWallClimb: (wall: string, value: number) => {
    const { engineState } = get();
    set({
      engineState: {
        ...engineState,
        wallClimb: {
          ...engineState.wallClimb,
          [wall]: value,
        },
      },
    });
  },

  setScaleVariation: (index: number, updates: any) => {
    const { engineState } = get();
    const newVariations = [...engineState.scaleVariations];
    newVariations[index] = { ...newVariations[index], ...updates };

    set({
      engineState: {
        ...engineState,
        scaleVariations: newVariations as any,
      },
    });
  },

  setWallMapping: (wallIndex: number, variationIndex: number) => {
    const { engineState } = get();
    const newMappings = [...engineState.wallScaleMappings];
    newMappings[wallIndex] = {
      ...newMappings[wallIndex],
      variationIndex: variationIndex as any,
    };

    set({
      engineState: {
        ...engineState,
        wallScaleMappings: newMappings,
      },
    });
  },

  setWallMute: (wallIndex: number, muted: boolean) => {
    const { engineState } = get();
    const newMappings = [...engineState.wallScaleMappings];
    newMappings[wallIndex] = {
      ...newMappings[wallIndex],
      muted,
    };

    set({
      engineState: {
        ...engineState,
        wallScaleMappings: newMappings,
      },
    });
  },

  setVelocityStep: (step: number, height: number) => {
    const { engineState } = get();
    const newSteps = [...engineState.velocitySequencer.steps];
    newSteps[step] = { ...newSteps[step], height };

    set({
      engineState: {
        ...engineState,
        velocitySequencer: {
          ...engineState.velocitySequencer,
          steps: newSteps,
        },
      },
    });
  },

  setVelocityStepMute: (step: number, muted: boolean) => {
    const { engineState } = get();
    const newSteps = [...engineState.velocitySequencer.steps];
    newSteps[step] = { ...newSteps[step], muted };

    set({
      engineState: {
        ...engineState,
        velocitySequencer: {
          ...engineState.velocitySequencer,
          steps: newSteps,
        },
      },
    });
  },

  // ====================
  // UI
  // ====================

  selectRoverDirection: (direction: Direction) => {
    set({ selectedRoverDirection: direction, selectedTool: 'rover' });
  },

  selectRoverSpeed: (speed: SpeedMode) => {
    set({ selectedRoverSpeed: speed });
  },

  selectObstacle: (obstacle: ObstacleType | null) => {
    set({ selectedObstacle: obstacle, selectedTool: obstacle ? 'obstacle' : null });
  },

  selectTool: (tool: 'rover' | 'obstacle' | null) => {
    set({ selectedTool: tool });
  },
}));
