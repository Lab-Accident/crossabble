import React from 'react'
import Cell from './Cell'

function Grid() {

  const GRID_SIZE = getComputedStyle(document.documentElement).getPropertyValue('--grid-size');

  return (
    <div className="grid-container">
      <div className="grid">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => (
          <div className="cell-container"  key={index}>
            <Cell />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Grid