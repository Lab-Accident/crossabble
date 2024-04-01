import React, { useContext, useEffect, useState } from 'react'
import {UsersContext } from '../App';

function Cell({ row, col }) {

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');
  const MIN_GRID_SIZE = getComputedStyle(document.documentElement).getPropertyValue('--min-grid-size').replace('px', '').replace('#', '');

  const { usersTeam } = useContext(UsersContext);

  const [letter, setLetter] = useState('A');
  const [index, setIndex] = useState(1);
  const [owner, setOwner] = useState('');
  const [state, setState] = useState('');

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
  }, [letter, index, owner, state]);

  const getIndexTextStyle = (size) => {
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

  return (
    <div>
      <button className={`cell empty ${usersTeam}`} style={getCellSize(cellSize)}> 
        <span className="index" style={{ ...getIndexTextStyle(cellSize)}}>{index}</span>
        <span className="letter" style={{ ...getLetterTextStyle(cellSize)}}>{letter}</span>
      </button>
    </div>
  )
}

export default Cell
