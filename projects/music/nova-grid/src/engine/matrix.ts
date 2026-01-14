/**
 * Nova3 Web - Matrix System
 * Grid management and cell operations
 */

import {
  Matrix,
  Cell,
  Position,
  Rover,
  ObstacleType,
  Direction,
  SpeedMode,
} from './types';
import { generateId, isInBounds, positionsEqual } from './utils';

// ============================================================================
// MATRIX CREATION & INITIALIZATION
// ============================================================================

/**
 * Create an empty matrix
 */
export function createMatrix(rows: number, cols: number): Matrix {
  const cells: Cell[][] = [];

  for (let row = 0; row < rows; row++) {
    cells[row] = [];
    for (let col = 0; col < cols; col++) {
      cells[row][col] = createCell({ row, col });
    }
  }

  return { rows, cols, cells };
}

/**
 * Create an empty cell
 */
export function createCell(position: Position): Cell {
  return {
    position,
    rovers: [],
    obstacle: null,
  };
}

/**
 * Resize matrix (preserves existing rovers/obstacles where possible)
 */
export function resizeMatrix(matrix: Matrix, newRows: number, newCols: number): Matrix {
  const newMatrix = createMatrix(newRows, newCols);

  // Copy over existing cells that fit in new size
  for (let row = 0; row < Math.min(matrix.rows, newRows); row++) {
    for (let col = 0; col < Math.min(matrix.cols, newCols); col++) {
      const oldCell = matrix.cells[row][col];
      newMatrix.cells[row][col] = {
        ...oldCell,
        position: { row, col },
      };
    }
  }

  return newMatrix;
}

/**
 * Clear entire matrix
 */
export function clearMatrix(matrix: Matrix): Matrix {
  return createMatrix(matrix.rows, matrix.cols);
}

// ============================================================================
// CELL ACCESS & MODIFICATION
// ============================================================================

/**
 * Get cell at position (returns null if out of bounds)
 */
export function getCell(matrix: Matrix, pos: Position): Cell | null {
  if (!isInBounds(pos, matrix.rows, matrix.cols)) {
    return null;
  }
  return matrix.cells[pos.row][pos.col];
}

/**
 * Set cell at position
 */
export function setCell(matrix: Matrix, pos: Position, cell: Cell): Matrix {
  if (!isInBounds(pos, matrix.rows, matrix.cols)) {
    return matrix;
  }

  const newCells = matrix.cells.map((row) => [...row]);
  newCells[pos.row][pos.col] = cell;

  return {
    ...matrix,
    cells: newCells,
  };
}

/**
 * Update cell at position
 */
export function updateCell(
  matrix: Matrix,
  pos: Position,
  updater: (cell: Cell) => Cell
): Matrix {
  const cell = getCell(matrix, pos);
  if (!cell) return matrix;

  return setCell(matrix, pos, updater(cell));
}

// ============================================================================
// ROVER MANAGEMENT
// ============================================================================

/**
 * Create a new rover
 */
export function createRover(
  position: Position,
  direction: Direction,
  speed: SpeedMode = SpeedMode.NORMAL
): Rover {
  return {
    id: generateId(),
    position,
    direction,
    speed,
    collisionGroup: null,
    collisionCycles: 0,
  };
}

/**
 * Add rover to matrix at position
 */
export function addRover(matrix: Matrix, rover: Rover): Matrix {
  return updateCell(matrix, rover.position, (cell) => ({
    ...cell,
    rovers: [...cell.rovers, rover],
  }));
}

/**
 * Remove rover from matrix by ID
 */
export function removeRover(matrix: Matrix, roverId: string): Matrix {
  const newCells = matrix.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      rovers: cell.rovers.filter((r) => r.id !== roverId),
    }))
  );

  return {
    ...matrix,
    cells: newCells,
  };
}

/**
 * Move rover from one position to another
 */
export function moveRover(
  matrix: Matrix,
  roverId: string,
  newPosition: Position
): Matrix {
  // Find and remove rover from old position
  let rover: Rover | null = null;
  let newMatrix = { ...matrix };

  for (const row of matrix.cells) {
    for (const cell of row) {
      const foundRover = cell.rovers.find((r) => r.id === roverId);
      if (foundRover) {
        rover = foundRover;
        newMatrix = updateCell(newMatrix, cell.position, (c) => ({
          ...c,
          rovers: c.rovers.filter((r) => r.id !== roverId),
        }));
        break;
      }
    }
    if (rover) break;
  }

  if (!rover) return matrix;

  // Add rover at new position
  const updatedRover = { ...rover, position: newPosition };
  return updateCell(newMatrix, newPosition, (cell) => ({
    ...cell,
    rovers: [...cell.rovers, updatedRover],
  }));
}

/**
 * Update rover properties
 */
export function updateRover(
  matrix: Matrix,
  roverId: string,
  updater: (rover: Rover) => Rover
): Matrix {
  const newCells = matrix.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      rovers: cell.rovers.map((r) => (r.id === roverId ? updater(r) : r)),
    }))
  );

  return {
    ...matrix,
    cells: newCells,
  };
}

/**
 * Get all rovers in matrix
 */
export function getAllRovers(matrix: Matrix): Rover[] {
  const rovers: Rover[] = [];

  for (const row of matrix.cells) {
    for (const cell of row) {
      rovers.push(...cell.rovers);
    }
  }

  return rovers;
}

/**
 * Get rover by ID
 */
export function getRoverById(matrix: Matrix, roverId: string): Rover | null {
  for (const row of matrix.cells) {
    for (const cell of row) {
      const rover = cell.rovers.find((r) => r.id === roverId);
      if (rover) return rover;
    }
  }
  return null;
}

/**
 * Get newest rover (most recently added)
 */
export function getNewestRover(matrix: Matrix): Rover | null {
  const rovers = getAllRovers(matrix);
  return rovers.length > 0 ? rovers[rovers.length - 1] : null;
}

/**
 * Get oldest rover (least recently added)
 */
export function getOldestRover(matrix: Matrix): Rover | null {
  const rovers = getAllRovers(matrix);
  return rovers.length > 0 ? rovers[0] : null;
}

/**
 * Remove all rovers
 */
export function clearRovers(matrix: Matrix): Matrix {
  const newCells = matrix.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      rovers: [],
    }))
  );

  return {
    ...matrix,
    cells: newCells,
  };
}

/**
 * Remove newest rover
 */
export function removeNewestRover(matrix: Matrix): Matrix {
  const newest = getNewestRover(matrix);
  return newest ? removeRover(matrix, newest.id) : matrix;
}

/**
 * Remove oldest rover
 */
export function removeOldestRover(matrix: Matrix): Matrix {
  const oldest = getOldestRover(matrix);
  return oldest ? removeRover(matrix, oldest.id) : matrix;
}

// ============================================================================
// OBSTACLE MANAGEMENT
// ============================================================================

/**
 * Set obstacle at position
 */
export function setObstacle(
  matrix: Matrix,
  pos: Position,
  obstacle: ObstacleType | null
): Matrix {
  return updateCell(matrix, pos, (cell) => ({
    ...cell,
    obstacle,
  }));
}

/**
 * Get obstacle at position
 */
export function getObstacle(matrix: Matrix, pos: Position): ObstacleType | null {
  const cell = getCell(matrix, pos);
  return cell ? cell.obstacle : null;
}

/**
 * Remove obstacle at position
 */
export function removeObstacle(matrix: Matrix, pos: Position): Matrix {
  return setObstacle(matrix, pos, null);
}

/**
 * Clear all obstacles
 */
export function clearObstacles(matrix: Matrix): Matrix {
  const newCells = matrix.cells.map((row) =>
    row.map((cell) => ({
      ...cell,
      obstacle: null,
    }))
  );

  return {
    ...matrix,
    cells: newCells,
  };
}

// ============================================================================
// MATRIX TRANSFORMATIONS
// ============================================================================

/**
 * Flip matrix horizontally
 */
export function flipHorizontal(matrix: Matrix): Matrix {
  const newCells = matrix.cells.map((row) => [...row].reverse());

  // Update positions and rover directions
  for (let row = 0; row < matrix.rows; row++) {
    for (let col = 0; col < matrix.cols; col++) {
      newCells[row][col].position = { row, col };
      newCells[row][col].rovers = newCells[row][col].rovers.map((rover) => ({
        ...rover,
        position: { row, col },
        direction: flipDirectionHorizontal(rover.direction),
      }));
    }
  }

  return {
    ...matrix,
    cells: newCells,
  };
}

/**
 * Flip matrix vertically
 */
export function flipVertical(matrix: Matrix): Matrix {
  const newCells = [...matrix.cells].reverse();

  // Update positions and rover directions
  for (let row = 0; row < matrix.rows; row++) {
    for (let col = 0; col < matrix.cols; col++) {
      newCells[row][col].position = { row, col };
      newCells[row][col].rovers = newCells[row][col].rovers.map((rover) => ({
        ...rover,
        position: { row, col },
        direction: flipDirectionVertical(rover.direction),
      }));
    }
  }

  return {
    ...matrix,
    cells: newCells,
  };
}

/**
 * Shift matrix in direction (wraps around)
 */
export function shiftMatrix(
  matrix: Matrix,
  direction: 'up' | 'down' | 'left' | 'right'
): Matrix {
  const newCells: Cell[][] = Array(matrix.rows)
    .fill(null)
    .map(() => Array(matrix.cols).fill(null));

  for (let row = 0; row < matrix.rows; row++) {
    for (let col = 0; col < matrix.cols; col++) {
      let newRow = row;
      let newCol = col;

      switch (direction) {
        case 'up':
          newRow = (row - 1 + matrix.rows) % matrix.rows;
          break;
        case 'down':
          newRow = (row + 1) % matrix.rows;
          break;
        case 'left':
          newCol = (col - 1 + matrix.cols) % matrix.cols;
          break;
        case 'right':
          newCol = (col + 1) % matrix.cols;
          break;
      }

      newCells[newRow][newCol] = {
        ...matrix.cells[row][col],
        position: { row: newRow, col: newCol },
        rovers: matrix.cells[row][col].rovers.map((r) => ({
          ...r,
          position: { row: newRow, col: newCol },
        })),
      };
    }
  }

  return {
    ...matrix,
    cells: newCells,
  };
}

/**
 * Rotate matrix 90 degrees clockwise
 */
export function rotateClockwise(matrix: Matrix): Matrix {
  // Note: This only works for square matrices
  // For rectangular matrices, dimensions would need to swap
  const newCells: Cell[][] = Array(matrix.cols)
    .fill(null)
    .map(() => Array(matrix.rows).fill(null));

  for (let row = 0; row < matrix.rows; row++) {
    for (let col = 0; col < matrix.cols; col++) {
      const newRow = col;
      const newCol = matrix.rows - 1 - row;

      newCells[newRow][newCol] = {
        ...matrix.cells[row][col],
        position: { row: newRow, col: newCol },
        rovers: matrix.cells[row][col].rovers.map((r) => ({
          ...r,
          position: { row: newRow, col: newCol },
          direction: rotateDirectionClockwise(r.direction),
        })),
      };
    }
  }

  return {
    rows: matrix.cols,
    cols: matrix.rows,
    cells: newCells,
  };
}

/**
 * Rotate matrix 90 degrees counter-clockwise
 */
export function rotateCounterClockwise(matrix: Matrix): Matrix {
  const newCells: Cell[][] = Array(matrix.cols)
    .fill(null)
    .map(() => Array(matrix.rows).fill(null));

  for (let row = 0; row < matrix.rows; row++) {
    for (let col = 0; col < matrix.cols; col++) {
      const newRow = matrix.cols - 1 - col;
      const newCol = row;

      newCells[newRow][newCol] = {
        ...matrix.cells[row][col],
        position: { row: newRow, col: newCol },
        rovers: matrix.cells[row][col].rovers.map((r) => ({
          ...r,
          position: { row: newRow, col: newCol },
          direction: rotateDirectionCounterClockwise(r.direction),
        })),
      };
    }
  }

  return {
    rows: matrix.cols,
    cols: matrix.rows,
    cells: newCells,
  };
}

// ============================================================================
// DIRECTION HELPERS (for transformations)
// ============================================================================

function flipDirectionHorizontal(direction: Direction): Direction {
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
  return mapping[direction];
}

function flipDirectionVertical(direction: Direction): Direction {
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
  return mapping[direction];
}

function rotateDirectionClockwise(direction: Direction): Direction {
  const mapping: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.EAST,
    [Direction.EAST]: Direction.SOUTH,
    [Direction.SOUTH]: Direction.WEST,
    [Direction.WEST]: Direction.NORTH,
    [Direction.NORTHEAST]: Direction.SOUTHEAST,
    [Direction.SOUTHEAST]: Direction.SOUTHWEST,
    [Direction.SOUTHWEST]: Direction.NORTHWEST,
    [Direction.NORTHWEST]: Direction.NORTHEAST,
  };
  return mapping[direction];
}

function rotateDirectionCounterClockwise(direction: Direction): Direction {
  const mapping: Record<Direction, Direction> = {
    [Direction.NORTH]: Direction.WEST,
    [Direction.WEST]: Direction.SOUTH,
    [Direction.SOUTH]: Direction.EAST,
    [Direction.EAST]: Direction.NORTH,
    [Direction.NORTHEAST]: Direction.NORTHWEST,
    [Direction.NORTHWEST]: Direction.SOUTHWEST,
    [Direction.SOUTHWEST]: Direction.SOUTHEAST,
    [Direction.SOUTHEAST]: Direction.NORTHEAST,
  };
  return mapping[direction];
}

// ============================================================================
// MATRIX SERIALIZATION
// ============================================================================

/**
 * Clone matrix (deep copy)
 */
export function cloneMatrix(matrix: Matrix): Matrix {
  return {
    rows: matrix.rows,
    cols: matrix.cols,
    cells: matrix.cells.map((row) =>
      row.map((cell) => ({
        ...cell,
        position: { ...cell.position },
        rovers: cell.rovers.map((r) => ({
          ...r,
          position: { ...r.position },
        })),
      }))
    ),
  };
}

/**
 * Serialize matrix to JSON
 */
export function serializeMatrix(matrix: Matrix): string {
  return JSON.stringify(matrix);
}

/**
 * Deserialize matrix from JSON
 */
export function deserializeMatrix(json: string): Matrix {
  return JSON.parse(json);
}
