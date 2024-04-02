import React, { useContext, useEffect, useState } from 'react'
import { UsersContext } from '../App';
import { WordData, PublicWord } from './Word';
import { GridData } from './GridData';
import { publicGridContext } from '../App';
import { CurrentMenuContext } from '../App';

function Cell({ row, col }) {

  //////////////////////////////////////////////////////////////
  /* Styling */
  //////////////////////////////////////////////////////////////

  const { currentMenu } = useContext(CurrentMenuContext);

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');
  const MIN_GRID_SIZE = getComputedStyle(document.documentElement).getPropertyValue('--min-grid-size').replace('px', '').replace('#', '');

  const { usersTeam } = useContext(UsersContext);
  const selectedByTeam = usersTeam; // alias to distinguish between owning and selecting team

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
  },);

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

  const { publicGrid } = useContext(publicGridContext);

  const [letter, setLetter] = useState(''); // string of length 1 or ''
  const [num, setNum] = useState(0); // 0 for no number
  const [owningTeam, setOwningTeam] = useState(''); // 'team1', 'team2', or ''
  const [state, setState] = useState('empty'); // empty, guessed, unguessed, temp-block, block

  useEffect(() => {
    const handleUpdate = () => {
      setLetter(publicGrid.getLetter(row, col));
      setNum(publicGrid.getNum(row, col));
      setOwningTeam(publicGrid.getOwningTeam(row, col));
      setState(publicGrid.getState(row, col));
    };

    handleUpdate();

    return () => {
    };
  }, [publicGrid[row]?.[col]]);


  //////////////////////////////////////////////////////////////
  /* HTML */
  //////////////////////////////////////////////////////////////

  return (
    <div>
      {publicGrid.logGridStatePretty()}
      <button className={`cell ${currentMenu} ${owningTeam} ${state} ${selectedByTeam}`} style={getCellSize(cellSize)}> 
        {num !== 0 && <span className="num" style={{ ...getNumTextStyle(cellSize)}}>{num}</span>}
        <span className="letter" style={{ ...getLetterTextStyle(cellSize)}}>{letter}</span>
      </button>
    </div>
  )
}

export default Cell
