import React from 'react'
import Cell from './Cell'

function Grid() {
  return (
    <div className="grid">
      {Array.from({ length: 100 }).map((_, index) => (
        <Cell key={index} />
      ))}
    </div>
  )
}

export default Grid