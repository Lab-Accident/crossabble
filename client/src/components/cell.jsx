import React, { useContext, useEffect, useState } from 'react'
import { UsersContext } from '../App';
import { WordData, PublicWord } from './Word';
import { GridData } from './GridData';
import { PublicGridContext } from '../App';
import { CurrentMenuContext } from '../App';
import { CurrentSelectionContext } from '../App';

function Cell({ row, col, accessKey}) {

  //////////////////////////////////////////////////////////////
  /*  Window Resizing Styling */
  //////////////////////////////////////////////////////////////

  const { currentMenu } = useContext(CurrentMenuContext);

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');
  const MIN_GRID_SIZE = getComputedStyle(document.documentElement).getPropertyValue('--min-grid-size').replace('px', '').replace('#', '');

  const { usersTeam } = useContext(UsersContext);
  const teamSelectedBy = usersTeam; // alias to distinguish between owning and selecting team

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

  const { publicGrid } = useContext(PublicGridContext);
  const { currentSelection, setCurrentSelection } = useContext(CurrentSelectionContext);

  const [letter, setLetter] = useState(''); // string of length 1 or ''
  const [num, setNum] = useState(0); // 0 for no number
  const [owningTeam, setOwningTeam] = useState(''); // 'team1', 'team2', or ''
  const [state, setState] = useState('empty'); // empty, guessed, unguessed, temp-block, block
  const [selected, setSelected] = useState(''); // selected or ''

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

  useEffect(() => {
    setCurrentSelection(currentSelection);
    if (currentSelection.length === 0) {
      setSelected('');
    } else {
      const selected = currentSelection.some(cell => cell.row === row && cell.col === col);
      setSelected(selected ? 'selected' : '');
    }
  }, [currentSelection]);

  // const toggleSelection = () => {
  //   setSelected((selected === '' ? 'selected' : ''));
  // };

  const addToSelectedOnClick = () => {
    const selected = currentSelection.some(cell => cell.row === row && cell.col === col);
    if (selected) {
      setCurrentSelection(currentSelection.filter(cell => cell.row !== row || cell.col !== col));
    } else {
      setCurrentSelection([...currentSelection, { row: row, col: col }]);
    }
  }

  const selectFullUnguessedWord = (row, col) => {
    let start = {row: row, col: col};
    let prefixUp = findAdjacentUnguessedCellsUp(row, col);
    let suffixDown = findAdjacentUnguessedCellsDown(row, col);
    let prefixLeft = findAdjacentUnguessedCellsLeft(row, col);
    let suffixRight = findAdjacentUnguessedCellsRight(row, col);

    if (prefixUp.length === 0 && suffixDown.length === 0 && prefixLeft.length === 0 && suffixRight.length === 0) {
      setCurrentSelection([]);
      return;
    }
    if (prefixUp.length === 0 && suffixDown.length === 0) {
      setCurrentSelection([...prefixLeft, start, ...suffixRight]);
      return;
    }
    if (prefixLeft.length === 0 && suffixRight.length === 0) {
      setCurrentSelection([...prefixUp, start, ...suffixDown]);
      return;
    }
  }


  const findAdjacentUnguessedCellsUp = (row, col) => {
    let prefixUp = [];
    while (row > 0 && publicGrid.getState(row - 1, col) === 'unguessed') {
      prefixUp = [{row: row - 1, col: col}, ...prefixUp];
      row--;
    }
    return prefixUp;
  }
  const findAdjacentUnguessedCellsDown = (row, col) => {
    let suffixDown = [];
    while (row + 1 < NUM_GRID_CELLS && publicGrid.getState(row + 1, col) === 'unguessed') {
      suffixDown = [...suffixDown, {row: row + 1, col: col}];
      row++;
    }
    return suffixDown;
  }
  const findAdjacentUnguessedCellsLeft = (row, col) => {
    let prefixLeft = [];
    while (col > 0 && publicGrid.getState(row, col - 1) === 'unguessed') {
      prefixLeft = ([{row: row, col: col - 1}, ...prefixLeft]);
      col--;
    }
    return prefixLeft;
  }
  const findAdjacentUnguessedCellsRight = (row, col) => {
    let suffixRight = [];
    while (col + 1 < NUM_GRID_CELLS && publicGrid.getState(row, col + 1) === 'unguessed') {
      suffixRight = [...suffixRight, {row: row, col: col + 1}];
      col++;
    }
    return suffixRight;
  }


  const changeSelectedOnClick = () => {
    if (currentMenu === 'guess-word') {
      selectFullUnguessedWord(row, col);
      return;
    }
    
    const selected = currentSelection.some(cell => cell.row === row && cell.col === col);
    if (selected) {
      setCurrentSelection([]);
    } else {
      setCurrentSelection([{ row: row, col: col }]);
    }
  }

  //////////////////////////////////////////////////////////////
  /* HTML */
  //////////////////////////////////////////////////////////////

  return (
    <div>
      <button 
        className={`cell ${selected} ${currentMenu} ${owningTeam} ${state} ${teamSelectedBy}`} 
        accessKey={accessKey} 
        style={getCellSize(cellSize)} 
        onClick={changeSelectedOnClick} > 
          {num !== 0 && 
            <span 
              className="num" 
              style={{ ...getNumTextStyle(cellSize)}}>
                {num}
            </span>
          }
          <span 
            className="letter" 
            style={{ ...getLetterTextStyle(cellSize)}}>
              {letter}
          </span>
      </button>
    </div>
  )
}

export default Cell
