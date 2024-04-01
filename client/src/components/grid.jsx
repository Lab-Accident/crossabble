import React from 'react'
import Cell from './Cell'

function Grid() {

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

  return (
    <div className="grid">
        {Array.from({ length: NUM_GRID_CELLS * NUM_GRID_CELLS }).map((_, index) => (
            <div className="cell-container" key={index}>
              <Cell />
            </div>
        ))}
    </div>
  )
}

export default Grid