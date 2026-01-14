/**
 * Nova Grid - Controls Component
 * Playback and parameter controls
 */

import React from 'react';
import { useNova3Store } from '../state/store';
import { Direction, SpeedMode, ObstacleType } from '../engine/types';
import { getAllObstacleTypes } from '../engine/obstacles';

export const Controls: React.FC = () => {
  const {
    engineState,
    isInitialized,
    initializeAudio,
    togglePlay,
    clearAll,
    clearAllRovers,
    clearAllObstacles,
    setTiming,
    selectRoverDirection,
    selectRoverSpeed,
    selectObstacle,
    selectedRoverDirection,
    selectedRoverSpeed,
    selectedObstacle,
  } = useNova3Store();

  const handleInitialize = async () => {
    await initializeAudio();
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#fff' }}>
      <h1 style={{ margin: '0 0 20px 0' }}>Nova Grid</h1>

      {/* Playback Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Playback</h3>
        {!isInitialized ? (
          <button onClick={handleInitialize} style={buttonStyle}>
            Initialize Audio
          </button>
        ) : (
          <button onClick={togglePlay} style={buttonStyle}>
            {engineState.isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        )}
      </div>

      {/* Timing Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Timing</h3>
        <label>
          BPM: {engineState.timing.bpm}
          <input
            type="range"
            min="40"
            max="240"
            value={engineState.timing.bpm}
            onChange={(e) => setTiming('bpm', parseInt(e.target.value))}
            style={rangeStyle}
          />
        </label>
      </div>

      {/* Rover Palette */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Rover</h3>
        <div>
          <label>Direction:</label>
          <select
            value={selectedRoverDirection}
            onChange={(e) => selectRoverDirection(e.target.value as Direction)}
            style={selectStyle}
          >
            {Object.values(Direction).map((dir) => (
              <option key={dir} value={dir}>
                {dir}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: '10px' }}>
          <label>Speed:</label>
          <select
            value={selectedRoverSpeed}
            onChange={(e) => selectRoverSpeed(e.target.value as SpeedMode)}
            style={selectStyle}
          >
            <option value={SpeedMode.NORMAL}>Normal</option>
            <option value={SpeedMode.SLOW}>Slow</option>
          </select>
        </div>
      </div>

      {/* Obstacle Palette */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Obstacle</h3>
        <select
          value={selectedObstacle || ''}
          onChange={(e) =>
            selectObstacle(e.target.value ? (e.target.value as ObstacleType) : null)
          }
          style={selectStyle}
        >
          <option value="">None</option>
          {getAllObstacleTypes().map((obs) => (
            <option key={obs} value={obs}>
              {obs}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Clear</h3>
        <button onClick={clearAllRovers} style={buttonStyle}>
          Clear Rovers
        </button>
        <button onClick={clearAllObstacles} style={{ ...buttonStyle, marginLeft: '10px' }}>
          Clear Obstacles
        </button>
        <button onClick={clearAll} style={{ ...buttonStyle, marginLeft: '10px' }}>
          Clear All
        </button>
      </div>

      {/* Stats */}
      <div>
        <h3>Stats</h3>
        <p>Cycle: {engineState.currentCycle}</p>
        <p>Grid: {engineState.matrix.rows} × {engineState.matrix.cols}</p>
      </div>
    </div>
  );
};

// Styles
const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#8b5cf6',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
};

const rangeStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '5px',
};

const selectStyle: React.CSSProperties = {
  marginLeft: '10px',
  padding: '5px',
  backgroundColor: '#2a2a2a',
  color: '#fff',
  border: '1px solid #444',
  borderRadius: '4px',
};
