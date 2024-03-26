import React, { useState, useEffect } from 'react';
import Grid from './Grid'

function GameBoard() {

  const [blueScore, setBlueScore] = useState(0);
  const [greenScore, setGreenScore] = useState(0);
  const [colHeight, setColHeight] = useState(0);
  const [teamLabelTextWidth, setTeamLabelTextWidth] = useState(0);

  useEffect(() => {
    updateColHeights();
    updateTeamLabelTextWidth();

    window.addEventListener('resize', updateColHeights);
    window.addEventListener('resize', updateTeamLabelTextWidth);

    return () => {
      window.removeEventListener('resize', updateColHeights);
      window.removeEventListener('resize', updateTeamLabelTextWidth);
    };
  }, [blueScore, greenScore]);


  const updateColHeights = () => {
    const col = document.querySelector('.left-col');
    if (col) {
      setColHeight(col.offsetHeight);
    }
  };

  const updateTeamLabelTextWidth = () => {
    const text = document.querySelector('.blue-team-label');
    if (text) {
      setTeamLabelTextWidth(text.offsetWidth);
    }
  };


  const getTeamLabelStyle = (height, width, left) => {
    const scaleY = Math.min(2, (230 / width));
    const fontSize = height / 4;
    const direction = left ? 90 : -90;
    return {
      transform: `translateX(-50%) translateY(-50%) rotate(${direction}deg) scaleY(${scaleY})`,
      fontSize: `${fontSize}px`,
    };
  };
  

  return ( 

  <div class="gameboard">
    <div class="grid-cont">  
      <Grid />
    </div>

    <div class="player-card T1-P1"> B1 </div>
    <div class="player-card T1-P2"> B2 </div>
    <div class="player-card T2-P1"> G1 </div>
    <div class="player-card T2-P2"> G2 </div>

    <div className="left-col">
      <span className="team-label green-team-label" style={getTeamLabelStyle(colHeight, teamLabelTextWidth, true)}>BLUE: {blueScore}</span>
    </div>
    <div className="right-col">
      <span className="team-label blue-team-label" style={getTeamLabelStyle(colHeight, teamLabelTextWidth, false)}>GREEN: {greenScore}</span>
    </div>

    <div class="left-margin"></div>
    <div class="right-margin"></div>
  </div>
  )
}

export default GameBoard