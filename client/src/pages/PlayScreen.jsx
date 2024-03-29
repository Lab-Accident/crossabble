import React, { useState, createContext, useContext } from 'react';
import ClueList from '../components/ClueList'
import GameBoard from '../components/GameBoard'

import PlayWordMenu from '../components/menus/PlayWordMenu'
import GuessWordMenu from '../components/menus/GuessWordMenu'
import BuyLetterMenu from '../components/menus/BuyLetterMenu'
import InactiveMenu from '../components/menus/InactiveMenu'
import BuyWordMenu from '../components/menus/BuyWordMenu'
import { CurrentMenuContext } from '../App'
import { UsersContext } from '../App'

const PlayScreen = () => {

  const { currentMenu } = useContext(CurrentMenuContext);
  const { usersTeam, usersPlayer } = useContext(UsersContext);

  const renderMenu = () => {
    switch (currentMenu) {
      case 'play word':
        return <PlayWordMenu />;
      case 'guess word':
        return <GuessWordMenu />;
      case 'inactive':
        return <InactiveMenu />;
      case 'buy letter':
        return <BuyLetterMenu />;
      case 'buy word':
        return <BuyWordMenu />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="screen-container">
        <h1 className='game-title'>
          <span className="team1">CROSS</span>
          <span className="team2">ABBLE</span>
        </h1>
        <h2 className={`player-name ${usersTeam}`}>
          player {usersTeam === 'T1' ? 'blue' : 'green'} {usersPlayer === 'P1' ? '1' : '2'}
        </h2>
        
        <GameBoard />
    
        {renderMenu()}

        <ClueList />
      </div>
    </>
  )
}

export default PlayScreen