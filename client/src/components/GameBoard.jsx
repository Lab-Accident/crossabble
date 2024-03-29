import React, { useState, useEffect, createContext } from 'react';
import Grid from './Grid'

export const gridCellSizeContext = React.createContext();
const GRID_SIZE = getComputedStyle(document.documentElement).getPropertyValue('--grid-size');

function GameBoard() {

  const [blueScore, setBlueScore] = useState(0);
  const [greenScore, setGreenScore] = useState(0);
  const [colHeight, setColHeight] = useState(200);
  const [cellSize, setCellSize] = useState(25);
  const [teamLabelTextWidth, setTeamLabelTextWidth] = useState(70);

  useEffect(() => {
    const handleResize = () => {
      updateColHeights();
      updateTeamLabelTextWidth();
      updateCellSize();
    };
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [blueScore, greenScore]);


  const updateColHeights = () => {
    const col = document.querySelector('.-left');
    if (col) {
      setColHeight(col.offsetHeight);
    }
  };

  const updateTeamLabelTextWidth = () => {
    const text = document.querySelector('.team-label-blue');
    if (text) {
      setTeamLabelTextWidth(text.offsetWidth);
    }
  };

  const updateCellSize = () => {
    const cell = document.querySelector('.grid-container');
    if (cell) {
      setCellSize(Math.round(cell.offsetWidth / GRID_SIZE));
    }
  };

  const getTeamLabelStyle = (height, width, left) => {
    const scaleY = Math.min(2.5, (230 / width));
    const fontSize = height / 4;
    const direction = left ? -90 : 90;
    return {
      transform: `translateX(-50%) translateY(-50%) rotate(${direction}deg) scaleY(${scaleY})`,
      fontSize: `${fontSize}px`,
    };
  };
  

  return ( 

  <div className="gameboard">
    <div className="grid-container">  
      <gridCellSizeContext.Provider value={{ cellSize }}>
        <Grid />
      </gridCellSizeContext.Provider>
    </div>

    <div className="player-card T1 T1-P1"> B1 </div>
    <div className="player-card T1 T1-P2"> B2 </div>
    <div className="player-card T2 T2-P1"> G1 </div>
    <div className="player-card T2 T2-P2"> G2 </div>

    <div className="col -left">
      <span className="team-label team-label-green" style={getTeamLabelStyle(colHeight, teamLabelTextWidth, true)}>BLUE: {blueScore}</span>
    </div>
    <div className="col -right">
      <span className="team-label team-label-blue" style={getTeamLabelStyle(colHeight, teamLabelTextWidth, false)}>GREEN: {greenScore}</span>
    </div>

  </div>
  )
}

export default GameBoard