import React, { useContext, useEffect, useState } from 'react'
import {UsersContext } from '../App';

function Cell({ row, col }) {

  //////////////////////////////////////////////////////////////
  /* Styling */
  //////////////////////////////////////////////////////////////

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');
  const MIN_GRID_SIZE = getComputedStyle(document.documentElement).getPropertyValue('--min-grid-size').replace('px', '').replace('#', '');

  const { usersTeam } = useContext(UsersContext);
  // alias to distinguish between owning and selecting team
  const selectedByTeam = usersTeam; 

  const [letter, setLetter] = useState('');
  const [num, setNum] = useState('');
  const [owningTeam, setOwningTeam] = useState(''); // team1, team2 (relevant for guessed/unguesed state)
  const [state, setState] = useState('empty'); // empty, guessed, unguessed, temp-block, block

  const [cellSize, setCellSize] = useState(() => {
    const gridContainerSize = Math.max(MIN_GRID_SIZE, document.documentElement.clientHeight * 0.4);
    return (gridContainerSize / NUM_GRID_CELLS);
  });

  useEffect(() => {  
    const handleResize = () => {
        const gridContainerSize = Math.max(MIN_GRID_SIZE, document.documentElement.clientHeight * 0.4);
        let size = Math.floor(gridContainerSize / NUM_GRID_CELLS);
        setCellSize(size);
    };
  
    handleResize();
  
    window.addEventListener('resize', handleResize);
  
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [letter, num, owningTeam, state]);

  const getNumTextStyle = (size) => {
    const fontSize = size / 2;
    return {
      fontSize: `${fontSize}px`,
    };
  };
  
  const getLetterTextStyle = (size) => {
    const fontSize = size / 1.2;
    return {
      fontSize: `${fontSize}px`,
    };
  };

  const getCellSize = (size) => {
    return {
      height: `${size}px`,
      width: `${size}px`,
    };
  };


  //////////////////////////////////////////////////////////////
  /* Game Logic */
  //////////////////////////////////////////////////////////////



  //////////////////////////////////////////////////////////////
  /* HTML */
  //////////////////////////////////////////////////////////////

  return (
    <div>
      <button className={`cell ${owningTeam} ${state} ${selectedByTeam}`} style={getCellSize(cellSize)}> 
        <span className="num" style={{ ...getNumTextStyle(cellSize)}}>{num}</span>
        <span className="letter" style={{ ...getLetterTextStyle(cellSize)}}>{letter}</span>
      </button>
    </div>
  )
}

export default Cell
