import { useEffect } from 'react'

import ClueList from '../components/ClueList.tsx'
import GameBoard from '../components/GameBoard.tsx'

import PlayWordMenu from '../components/menus/PlayWordMenu.tsx'
import GuessWordMenu from '../components/menus/GuessWordMenu.tsx'
import BuyLetterMenu from '../components/menus/BuyLetterMenu.tsx'
import InactiveMenu from '../components/menus/InactiveMenu.tsx'
import BuyWordMenu from '../components/menus/BuyWordMenu.tsx'

import { getCurrentTeam, getCurrentPlayer } from '../hooks/useSocket'


import useGameStore from '../stores/GamePlayStore.ts'
import useUserGridStore from '../stores/UserGridStore.ts'

import * as types from '../../../server/src/types/gameTypes';

const PlayScreen = () => {
  const currentMenu = useGameStore((state) => state.currentMenu);
  const usersPlayer = getCurrentPlayer();
  const usersTeam = getCurrentTeam();

  useEffect(() => {
    useUserGridStore.getState().initializeGrid();
}, []);

  const renderMenu = () => {
    switch (currentMenu) {
      case 'play-word':
        return <PlayWordMenu />;
      case 'guess-word':
        return <GuessWordMenu />;
      case 'inactive':
        return <InactiveMenu />;
      case 'buy-letter':
        return <BuyLetterMenu />;
      case 'buy-word':
        return <BuyWordMenu />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="screen-container">
        
        <h1 className='game-title'>
          <span className="team1">
            CROSS
          </span>
          <span className="team2">
            ABBLE
          </span>
        </h1>

        <h2 className={`player-name ${usersTeam}`}>
          player {usersTeam === 'T1' ? 'blue' : 'green'} {usersPlayer === types.Player.Team1_Player1 || usersPlayer === types.Player.Team2_Player1 ? '1' : '2'}
        </h2>
        
        <GameBoard />
    
        {renderMenu()}

        <ClueList />
      </div>
    </>
  )
}

export default PlayScreen