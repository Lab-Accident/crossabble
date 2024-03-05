import React from 'react'
import Grid from '../components/Grid'
import ClueList from '../components/ClueList'

const PlayScreen = () => {
  return (
    <div className="screen-container">
      <h1 className='game-title'>
          <span className="team1">CROSS</span>
          <span className="team2">ABBLE</span>
      </h1>
      <h2 className = 'team2' >PLAYER GREEN 2</h2>
      <Grid></Grid>
      <ClueList></ClueList>
    </div>
  )
}

export default PlayScreen