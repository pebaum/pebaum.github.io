/**
 * Nova Grid - Main Application
 * Cellular automata-based generative sequencer
 */

import React from 'react';
import { GridRenderer } from './renderer/GridRenderer';
import { Controls } from './components/Controls';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="app-layout">
        <div className="controls-panel">
          <Controls />
        </div>
        <div className="grid-panel">
          <GridRenderer width={600} height={600} />
        </div>
      </div>
    </div>
  );
}

export default App;
