import React from 'react'
import Cell from './Cell'

function Grid() {
  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

  return (
    <div className="grid">
      {Array.from({ length: NUM_GRID_CELLS * NUM_GRID_CELLS }).map((_, index) => {
        const row = Math.floor(index / NUM_GRID_CELLS);
        const col = index % NUM_GRID_CELLS;
        return (
          <div className="cell-container" key={index}>
            <Cell row={row} col={col} />
          </div>
        );
      })}
    </div>
  );
}

export default Grid;