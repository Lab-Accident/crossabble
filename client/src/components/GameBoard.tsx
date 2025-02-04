import { useState, useEffect } from 'react';
import Grid from './Grid.tsx'
import useGameStore from '../stores/GamePlayStore.ts';


function GameBoard() {

  const gameStore = useGameStore();

  const MIN_GRID_SIZE = Number(getComputedStyle(document.documentElement).getPropertyValue('--min-grid-size').replace('px', '').replace('#', ''));

  const [teamLabelTextWidth, setTeamLabelTextWidth] = useState(70);

  const [gridContainerSize, setGridContainerSize] = useState(() => {
    const initialContainerSize = document.documentElement.clientHeight * 0.4;
    return initialContainerSize;
  });

  const [colHeight, setColHeight] = useState(() => {
    return gridContainerSize - 140;
  });
  
  useEffect(() => {
    const handleResize = () => {
      updateColHeights();
      updateTeamLabelTextWidth();
      updateGridContainerSize();
    };
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  },);

  const updateColHeights = () => {
    const col = document.querySelector('.-left') as HTMLElement;
    if (col) {
      setColHeight(col.offsetHeight);
    }
  };

  const updateTeamLabelTextWidth = () => {
    const text = document.querySelector('.team-label-blue') as HTMLElement;
    if (text) {
      setTeamLabelTextWidth(text.offsetWidth);
    }
  };

  const updateGridContainerSize = () => {
    const viewportHeight = document.documentElement.clientHeight;
    setGridContainerSize(Math.max(MIN_GRID_SIZE, viewportHeight*0.4));
  }

  const getTeamLabelStyle = (height: number, width: number, left: boolean) => {
    const scaleY = Math.min(2.5, (230 / width));
    const fontSize = height / 4;
    const direction = left ? -90 : 90;
    return {
      transform: `translateX(-50%) translateY(-50%) rotate(${direction}deg) scaleY(${scaleY})`,
      fontSize: `${fontSize}px`,
    };
  };

  const [blueScore, setBlueScore] = useState(0);
  const [greenScore, setGreenScore] = useState(0);

  return ( 
  <>

  <div className="gameboard">
    <div 
      className="grid-container" 
      style={{
          height: gridContainerSize, 
          width: gridContainerSize
        }}>  
          <Grid />
    </div>

    <div className="player-card T1 T1-P1"> B1 </div>
    <div className="player-card T1 T1-P2"> B2 </div>
    <div className="player-card T2 T2-P1"> G1 </div>
    <div className="player-card T2 T2-P2"> G2 </div>

    <div className="col -left">
      <span 
        className="team-label team-label-green" 
        style={{...getTeamLabelStyle(colHeight, teamLabelTextWidth, true)}}>
            BLUE: {gameStore.team1Score}
      </span>
    </div>
    <div className="col -right">
      <span 
        className="team-label team-label-blue" 
        style={{...getTeamLabelStyle(colHeight, teamLabelTextWidth, false)}}>
          GREEN: {gameStore.team2Score}
      </span>
    </div>

  </div>

  </>
  )
}

export default GameBoard