import React from 'react'
import Grid from '../components/Grid'
import Cell from '../components/Cell'
import ClueList from '../components/ClueList'

const PlayScreen = () => {
  return (
    <div className="screen-container">
      <h1 className='game-title'>
          <span className="team1">CROSS</span>
          <span className="team2">ABBLE</span>
      </h1>
      <h2 className = 'player-name team2' >PLAYER GREEN 2</h2>
      <Grid />
    </div>
  )
}

export default PlayScreen