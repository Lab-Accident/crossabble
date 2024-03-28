import React from 'react'
import ClueList from '../components/ClueList'
import GameBoard from '../components/GameBoard'
import PlayClueMenu from '../components/menus/PlayClueMenu'

const PlayScreen = () => {
  return (
    <>
      <div className="screen-container">
        <h1 className='game-title'>
          <span className="team1">CROSS</span>
          <span className="team2">ABBLE</span>
        </h1>
        <h2 className='player-name team2'>PLAYER GREEN 2</h2>
        <GameBoard />
        <PlayClueMenu />
        <ClueList />
      </div>
    </>
  )
}

export default PlayScreen