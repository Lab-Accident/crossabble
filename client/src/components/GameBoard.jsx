import React from 'react'
import Grid from './Grid'

function GameBoard() {

  let blue_score = 0;
  let green_score = 0;

  return (
    <div className="game-board">
      <div className="team-label blue">Blue Score: {blue_score}</div>
      <Grid />
      <div className="team-label green">Green Score: {green_score}</div>
    </div>
  )
}

export default GameBoard