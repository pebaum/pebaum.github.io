/**
 * Nova3 Web - Grid Renderer
 * Canvas-based grid visualization with high-DPI support
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { Matrix, Rover, ObstacleType, Direction, SpeedMode } from '../engine/types';
import { useNova3Store } from '../state/store';

interface GridRendererProps {
  width: number;
  height: number;
}

export const GridRenderer: React.FC<GridRendererProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engineState, addRoverAt, setObstacleAt, removeRoverAt, selectedTool, selectedObstacle } =
    useNova3Store();

  const { matrix } = engineState;

  // Calculate cell size based on canvas dimensions and matrix size
  const cellSize = Math.min(
    Math.floor(width / matrix.cols),
    Math.floor(height / matrix.rows)
  );

  // Draw the grid
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { matrix } = engineState;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw cells
    for (let row = 0; row < matrix.rows; row++) {
      for (let col = 0; col < matrix.cols; col++) {
        const cell = matrix.cells[row][col];
        const x = col * cellSize;
        const y = row * cellSize;

        // Cell background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x, y, cellSize, cellSize);

        // Cell border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        // Draw obstacle if present
        if (cell.obstacle) {
          drawObstacle(ctx, x, y, cellSize, cell.obstacle);
        }

        // Draw rovers if present
        for (const rover of cell.rovers) {
          drawRover(ctx, x, y, cellSize, rover);
        }
      }
    }

    // Draw wall indicators
    drawWalls(ctx, matrix.rows, matrix.cols);
  }, [engineState, width, height, cellSize]);

  // Draw a rover
  const drawRover = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rover: Rover
  ) => {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size * 0.3;

    // Rover body (circle)
    ctx.fillStyle = rover.speed === SpeedMode.SLOW ? '#6366f1' : '#8b5cf6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator (arrow)
    const arrowLength = radius * 0.8;
    const arrowAngle = getDirectionAngle(rover.direction);

    const arrowX = centerX + Math.cos(arrowAngle) * arrowLength;
    const arrowY = centerY + Math.sin(arrowAngle) * arrowLength;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(arrowX, arrowY);
    ctx.stroke();

    // Collision group indicator
    if (rover.collisionGroup) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  // Draw an obstacle
  const drawObstacle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    obstacle: ObstacleType
  ) => {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const symbolSize = size * 0.6;

    ctx.fillStyle = '#10b981';
    ctx.font = `${symbolSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obstacle, centerX, centerY);
  };

  // Draw wall indicators
  const drawWalls = (ctx: CanvasRenderingContext2D, rows: number, cols: number) => {
    const wallWidth = cellSize * cols;
    const wallHeight = cellSize * rows;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;

    // North wall
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(wallWidth, 0);
    ctx.stroke();

    // South wall
    ctx.beginPath();
    ctx.moveTo(0, wallHeight);
    ctx.lineTo(wallWidth, wallHeight);
    ctx.stroke();

    // West wall
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, wallHeight);
    ctx.stroke();

    // East wall
    ctx.beginPath();
    ctx.moveTo(wallWidth, 0);
    ctx.lineTo(wallWidth, wallHeight);
    ctx.stroke();
  };

  // Convert direction to angle (in radians)
  const getDirectionAngle = (direction: Direction): number => {
    const angles: Record<Direction, number> = {
      [Direction.NORTH]: -Math.PI / 2,
      [Direction.NORTHEAST]: -Math.PI / 4,
      [Direction.EAST]: 0,
      [Direction.SOUTHEAST]: Math.PI / 4,
      [Direction.SOUTH]: Math.PI / 2,
      [Direction.SOUTHWEST]: (3 * Math.PI) / 4,
      [Direction.WEST]: Math.PI,
      [Direction.NORTHWEST]: (-3 * Math.PI) / 4,
    };
    return angles[direction];
  };

  // Handle canvas click
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < matrix.rows && col >= 0 && col < matrix.cols) {
        const position = { row, col };

        if (selectedTool === 'rover') {
          addRoverAt(position);
        } else if (selectedTool === 'obstacle' && selectedObstacle) {
          setObstacleAt(position, selectedObstacle);
        }
      }
    },
    [cellSize, matrix.rows, matrix.cols, selectedTool, selectedObstacle, addRoverAt, setObstacleAt]
  );

  // Handle right-click (remove)
  const handleRightClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < matrix.rows && col >= 0 && col < matrix.cols) {
        const position = { row, col };
        const cell = matrix.cells[row][col];

        // Remove rover if present, otherwise remove obstacle
        if (cell.rovers.length > 0) {
          removeRoverAt(position);
        } else if (cell.obstacle) {
          setObstacleAt(position, null);
        }
      }
    },
    [cellSize, matrix.rows, matrix.cols, removeRoverAt, setObstacleAt, matrix.cells]
  );

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high-DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    draw(ctx);
  }, [width, height, draw]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      style={{
        border: '2px solid #333',
        cursor: 'crosshair',
        display: 'block',
      }}
    />
  );
};
