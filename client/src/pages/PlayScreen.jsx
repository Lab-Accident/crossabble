import React from 'react'
import ClueList from '../components/ClueList'
import GameBoard from '../components/GameBoard'
import PlayWordMenu from '../components/menus/PlayWordMenu'
import GuessWordMenu from '../components/menus/GuessWordMenu'
import BuyLetterMenu from '../components/menus/BuyLetterMenu'

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
        <PlayWordMenu />
        <ClueList />
      </div>
    </>
  )
}

export default PlayScreen