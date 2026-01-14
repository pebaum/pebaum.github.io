/**
 * Nova3 Web - Core Type Definitions
 * Cellular automata-based generative sequencer
 */

// ============================================================================
// DIRECTION & MOVEMENT
// ============================================================================

/**
 * 8 cardinal and diagonal directions
 */
export enum Direction {
  NORTH = 'N',
  SOUTH = 'S',
  EAST = 'E',
  WEST = 'W',
  NORTHEAST = 'NE',
  NORTHWEST = 'NW',
  SOUTHEAST = 'SE',
  SOUTHWEST = 'SW',
}

/**
 * Wall boundaries
 */
export enum Wall {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST',
}

/**
 * Speed modes for rovers
 */
export enum SpeedMode {
  NORMAL = 'NORMAL',
  SLOW = 'SLOW', // Half speed
}

// ============================================================================
// OBSTACLES
// ============================================================================

/**
 * All 20 obstacle types from Nova3
 */
export enum ObstacleType {
  // Mirrors (4 types) - reflect direction
  MIRROR_HORIZONTAL = '|',    // Reflects E/W
  MIRROR_VERTICAL = '-',      // Reflects N/S
  MIRROR_UP = '/',            // Diagonal reflection up
  MIRROR_DOWN = '\\',         // Diagonal reflection down

  // Wedges (4 types) - redirect to specific direction
  WEDGE_NORTH = '^',
  WEDGE_EAST = '>',
  WEDGE_SOUTH = 'v',
  WEDGE_WEST = '<',

  // Randomizers (3 types)
  BOUNCE = 'X',               // Random neighbor cell + random direction
  WORMHOLE = '::',            // Teleport to random cell + random direction
  SPIN = '<>',                // Random direction change only

  // Timing (1 type)
  PAUSE = 'O',                // Every other rover pauses 1 step

  // Mirror + Flip (4 types) - same as mirrors but also flip rover direction
  MIRROR_HORIZONTAL_FLIP = '|.',
  MIRROR_VERTICAL_FLIP = '-.',
  MIRROR_UP_FLIP = '/.',
  MIRROR_DOWN_FLIP = '\\.',

  // Speed modifiers (3 types)
  SLOW_DOWN = '~',            // Change to slow pace
  SPEED_UP = '!',             // Change to normal pace
  TOGGLE_PACE = '%',          // Flip between slow/normal
}

// ============================================================================
// GRID & POSITION
// ============================================================================

/**
 * 2D position in the grid
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * Rover entity - autonomous agent that moves through the grid
 */
export interface Rover {
  id: string;
  position: Position;
  direction: Direction;
  speed: SpeedMode;
  collisionGroup: string | null; // Collision group ID (for rover-to-rover collisions)
  collisionCycles: number;        // How many cycles in collision group
}

/**
 * Cell in the grid - can contain rovers and/or an obstacle
 */
export interface Cell {
  position: Position;
  rovers: Rover[];
  obstacle: ObstacleType | null;
}

/**
 * Matrix/Grid state
 */
export interface Matrix {
  rows: number;
  cols: number;
  cells: Cell[][];
}

// ============================================================================
// SCALES & MUSICAL PARAMETERS
// ============================================================================

/**
 * Scale variation - one of 4 independent scale configurations
 */
export interface ScaleVariation {
  scaleId: string;            // Which scale from library
  rootPitch: number;          // MIDI note transposition
  rotation: number;           // Scale degree rotation (0-16)
  direction: 'forward' | 'reverse';
}

/**
 * Wall to scale mapping
 */
export interface WallScaleMapping {
  wall: Wall;
  variationIndex: 0 | 1 | 2 | 3; // Which of the 4 scale variations
  muted: boolean;
}

/**
 * Scale definition (loaded from file)
 */
export interface Scale {
  id: string;
  name: string;
  notes: number[];  // Up to 17 MIDI note offsets from root
}

// ============================================================================
// PROBABILITY & GENERATIVE PARAMETERS
// ============================================================================

/**
 * All probability controls (0-1 range)
 */
export interface ProbabilityParams {
  note: number;           // Likelihood of emitting note on wall strike
  tilt: number;           // Bias toward higher (>0.5) or lower (<0.5) notes
  obstacle: number;       // Likelihood obstacles affect rovers
  wrap: number;           // Chance rovers pass through walls vs reflecting
  nearby: number;         // Chance of playing neighbor note instead
  wobble: number;         // Probability rovers deviate from path
  repeat: number;         // Probability of note repeating
}

// ============================================================================
// TIMING PARAMETERS
// ============================================================================

/**
 * Timing and rhythm control
 */
export interface TimingParams {
  bpm: number;
  timeUnits: number;      // Note division (e.g., 16 = 16th notes)
  slow: number;           // Slow speed variation factor
  swing: number;          // 0 = straight, 1 = 2:1 ratio
  humanize: number;       // Timing/duration variation (0-1)
  simplify: number;       // Only emit notes every N cycles
  repeatLength: number;   // Delay for repeat probability
}

// ============================================================================
// DYNAMICS PARAMETERS
// ============================================================================

/**
 * Note dynamics and expression
 */
export interface DynamicsParams {
  velocity: number;       // Base MIDI velocity (0-127)
  velocityJitter: number; // Velocity variation amount
  length: number;         // Note duration (in time units)
  lengthJitter: number;   // Duration variation amount
}

// ============================================================================
// VELOCITY SEQUENCER
// ============================================================================

/**
 * Single step in the 32-step velocity sequencer
 */
export interface VelocityStep {
  height: number;         // Velocity scaling (0-1)
  muted: boolean;
  locked: boolean;        // Prevents editing
}

/**
 * 32-step velocity sequencer state
 */
export interface VelocitySequencer {
  steps: VelocityStep[];  // Always 32 steps
  currentStep: number;    // Which step is currently active
}

// ============================================================================
// PATTERN STORAGE
// ============================================================================

/**
 * Saved pattern (one of 8 slots)
 * Captures: rovers, obstacles, matrix size
 * Does NOT capture: scales, timing, probabilities
 */
export interface Pattern {
  id: number;             // 0-7
  name: string;
  matrix: Matrix | null;  // Saved matrix state, null if empty
}

// ============================================================================
// WALL CONTROLS
// ============================================================================

/**
 * Per-wall climb sliders (shift rover along wall when striking)
 */
export interface WallClimb {
  north: number;          // -1 to 1
  south: number;
  east: number;
  west: number;
}

// ============================================================================
// COLLISION MANAGEMENT
// ============================================================================

/**
 * Collision group limits
 */
export interface CollisionParams {
  groupLimit: number;     // Max cycles a rover can stay in collision group (0 = unlimited)
}

// ============================================================================
// MAIN ENGINE STATE
// ============================================================================

/**
 * Complete engine state
 */
export interface EngineState {
  // Core grid
  matrix: Matrix;

  // Musical parameters
  scaleVariations: [ScaleVariation, ScaleVariation, ScaleVariation, ScaleVariation];
  wallScaleMappings: WallScaleMapping[];

  // Generative parameters
  probability: ProbabilityParams;
  timing: TimingParams;
  dynamics: DynamicsParams;
  collision: CollisionParams;
  wallClimb: WallClimb;

  // Sequencers & patterns
  velocitySequencer: VelocitySequencer;
  patterns: Pattern[];    // 8 pattern slots

  // Playback state
  isPlaying: boolean;
  currentCycle: number;   // Global cycle counter
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Note event - emitted when a rover hits a wall
 */
export interface NoteEvent {
  midiNote: number;
  velocity: number;
  duration: number;       // In milliseconds
  wall: Wall;
  position: Position;     // Where the rover struck
  timestamp: number;      // When the note was triggered
}

/**
 * Rover collision event
 */
export interface CollisionEvent {
  rover1: Rover;
  rover2: Rover;
  position: Position;
  timestamp: number;
}
