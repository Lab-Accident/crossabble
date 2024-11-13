import { useRef, useEffect, useState, useContext } from 'react';
import OptionsMenu from './OptionsMenu.tsx'
import { UsersContext } from '../../App.tsx';
import { CurrentSelectionContext } from '../../App.tsx';
import { PublicGridContext } from '../../App.tsx';

function PlayWordMenu() {
  const { currentSelection, setCurrentSelection } = useContext(CurrentSelectionContext);
  const { usersTeam } = useContext(UsersContext);
  const { publicGrid } = useContext(PublicGridContext);

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

  const [wordPlayed, setWordPlayed] = useState(false);
  const [cluePlayed, setCluePlayed] = useState(false);
  const [currentlyDown, setCurrentlyDown] = useState(true);
  const [emptySlotLength, setEmptySlotLength] = useState(0);
  const [word, setWord] = useState('');
  const [clue, setClue] = useState('');

  const playWordRef = useRef(null);

  function getCellElement(row, col) {
    const accessKey = `row${row}-col${col}`; 
    const cellComponent = document.querySelector(`.cell[accessKey="${accessKey}"]`);
    if (!cellComponent) {
        console.warn('Cell component not found for access key', accessKey);
        return null;
    }
    return cellComponent;
}

  function getCellLetter(cellElement) {
    if (!cellElement) {
      console.warn('Cell element not found');
      return null;
    }
    return cellElement.querySelector('.letter');
  }

  const updateEmptySlotLength = () => {
    let { row, col } = currentSelection[0];
    let emptySlotLength = currentlyDown
      ? NUM_GRID_CELLS - row
      : NUM_GRID_CELLS - col;
    for (let i = 0; i < emptySlotLength - 1; i++) {
      let curr = currentlyDown 
        ? { row: row + i, col: col} 
        : { row: row, col: col + i};
      if (publicGrid.getState(curr.row, curr.col) !== 'empty') { 
        emptySlotLength = i;
        break; 
      }
    }
    setEmptySlotLength(emptySlotLength);
  }

  useEffect(() => {
    if (currentSelection.length === 0) {
      return;
    }
    updateEmptySlotLength();
  }, [currentSelection, currentlyDown]);


  const handleWordChange = (event) => {
    let input = event.target.value;
    input = input.replace(/[^A-Za-z]/ig, '');
    input = input.toUpperCase();

    input = input.slice(0, emptySlotLength);
    setWord(input);
    let { row, col } = currentSelection[0];

    for (let i = 0; i < input.length; i++) {
      let curr = currentlyDown 
        ? { row: row + i, col: col} 
        : { row: row, col: col + i};

      const cellElement = getCellElement(curr.row, curr.col);
      const letterElement = getCellLetter(cellElement);
      cellElement.classList.add('selected');
      letterElement.textContent = input[i];
    }

    for (let i = input.length; i < emptySlotLength; i++) {
      let curr = currentlyDown
        ? { row: row + i, col: col}
        : { row: row, col: col + i};

      const cellElement = getCellElement(curr.row, curr.col);
      const letterElement = getCellLetter(cellElement);
      cellElement.classList.remove('selected');
      letterElement.textContent = '';
    }

  };

  function removeOldSelection(oldSelection, oldCurrentlyDown) {
    if (wordPlayed) {
      return;
    }
    const oldStart = oldSelection[0];
    setWord('');

    for (let i = 0; i < emptySlotLength; i++) {
      let curr = oldCurrentlyDown
        ? { row: oldStart.row + i, col: oldStart.col }
        : { row: oldStart.row, col: oldStart.col + i };

        const cellElement = getCellElement(curr.row, curr.col);
        cellElement.classList.remove('selected');
        const letterElement = getCellLetter(cellElement);
        letterElement.textContent = '';
    }
    
    //setCurrentSelection([ { row: newWord.row, col: newWord.col } ]);
  }


  const handleClueChange = (event) => {
    setClue(event.target.value);
  };

  const handleWordEnter = () => {
    setWordPlayed(true);
  };

  const handleClueEnter = () => {
    setCluePlayed(true);
  };

  const wrapRow = (row) => {
    const numGridCells = parseInt(NUM_GRID_CELLS);
    let wrappedRow = row;

    if (row < 0) {
      wrappedRow = numGridCells - 1;
    } else if (row >= numGridCells) {
      wrappedRow = 0;
    }
    return wrappedRow;
  };

  const wrapCol = (col) => {
    const numGridCells = parseInt(NUM_GRID_CELLS);
    let wrappedCol = col;
    if (col < 0) {
      wrappedCol = numGridCells - 1;
    } else if (col >= numGridCells) {
      wrappedCol = 0;
    }
    return wrappedCol;
  }

  const handleSelectionChangeLeft = () => {
    let { row, col } = currentSelection[0];    
    do {
        col--;
        col = wrapCol(col);
    } while (publicGrid.getState(row, col) !== 'empty');
    
    removeOldSelection(currentSelection, currentlyDown);
    setCurrentSelection(currentSelection.map(() => ({ row, col })));
  }

  const handleSelectionChangeRight = () => {
    let { row, col } = currentSelection[0];    
    do {
        col++;
        col = wrapCol(col);
    } while (publicGrid.getState(row, col) !== 'empty');
    
    removeOldSelection(currentSelection, currentlyDown);
    setCurrentSelection(currentSelection.map(() => ({ row, col })));
  }
  
  const handleSelectionChangeUp = () => {
    let { row, col } = currentSelection[0];    
    do {
        row--;
        row = wrapRow(row);
    } while (publicGrid.getState(row, col) !== 'empty');
    
    removeOldSelection(currentSelection, currentlyDown);
    setCurrentSelection(currentSelection.map(() => ({ row, col })));
  }

  const handleSelectionChangeDown = () => {
    let { row, col } = currentSelection[0];    
    do {
        row++;
        row = wrapRow(row);
    } while (publicGrid.getState(row, col) !== 'empty');
    
    removeOldSelection(currentSelection, currentlyDown);
    setCurrentSelection(currentSelection.map(() => ({ row, col })));
  }

  useEffect(() => {
    if (currentSelection.length === 0) {
      return;
    }
    if (!wordPlayed) {
      playWordRef.current.focus();
    }
  }, [currentSelection]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (wordPlayed) {
        return;
      }

      const ARROW_UP = 38;
      const ARROW_DOWN = 40;
      const ARROW_LEFT = 37;
      const ARROW_RIGHT = 39;

      let { row, col } = currentSelection[0];

      switch (event.keyCode) {

        case ARROW_UP:
          do {
            row--;
            row = wrapRow(row);
          } while (publicGrid.getState(row, col) !== 'empty');
          event.preventDefault();
          break;
        case ARROW_DOWN:
          do {
            row++;
            row = wrapRow(row);
          } while (publicGrid.getState(row, col) !== 'empty');
          event.preventDefault();
          break;
        case ARROW_LEFT:
          do {
            col--;
            col = wrapCol(col);
          } while (publicGrid.getState(row, col) !== 'empty');
          event.preventDefault();
          break;
        case ARROW_RIGHT:
          do {
            col++;
            col = wrapCol(col);
          } while (publicGrid.getState(row, col) !== 'empty');
          event.preventDefault();
          break;
        default:
          return; 
      }

      removeOldSelection(currentSelection, currentlyDown);
      setCurrentSelection([ { row: row, col: col }]);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSelection]);

  // TODO add handling for when selection is empty

  return (
    <>
    <div className='menu-container'>


      <div className='cell-nav-bar'>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={!wordPlayed && handleSelectionChangeLeft} >
            {'<'}
        </div>
        <div 
          className=  {`qtr-button ${usersTeam}`}  
          onClick={!wordPlayed && handleSelectionChangeUp} >
            <span style={{ transform: 'rotate(90deg)' }}>
              {'<'}
            </span>
        </div>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={!wordPlayed && handleSelectionChangeDown} >
            <span style={{ transform: 'rotate(-90deg)' }}>
              {'<'}
            </span>
        </div>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={!wordPlayed && handleSelectionChangeRight} >
            {'>'}
        </div>
      </div>


      <div className="input-container">
        <label 
          className= {`menu-input ${usersTeam}`} 
          htmlFor="playWordInputField">
            play word:
        </label>
        <input 
          className= {`menu-input ${usersTeam} ${wordPlayed ? 'inactive' : ''}`} 
          type="text" 
          id="playWordInputField" 
          ref={playWordRef}
          autoComplete='off'
          autoFocus
          onChange={!wordPlayed && handleWordChange}
          value={word} 
        />
        <button 
          className= {`enter-button ${usersTeam} ${wordPlayed ? 'hide' : ''}`} 
          onClick={handleWordEnter} >
            {'>'}
        </button>
      </div>


      <div className="input-container">
        <label 
          className= {`menu-input ${usersTeam}`} 
          htmlFor="playClueInputField">
            play clue:
        </label>
        <input 
          className= {`menu-input ${usersTeam} ${cluePlayed ? 'inactive' : ''}`} 
          type="text" 
          id="playClueInputField" 
          autoComplete='off'
          onChange={handleClueChange}
          value={clue} 
        />
        <button 
          className= {`enter-button ${usersTeam} ${cluePlayed ? 'hide' : ''}`} 
          onClick={handleClueEnter} >
            {'>'}
        </button>
      </div>

      <button 
        className={`default-button ${usersTeam}`} 
        style={{margin: '0.1rem'}} 
        onClick={() => !wordPlayed && setCurrentlyDown(!currentlyDown)} >
          {currentlyDown ? 'Down' : 'Across'}
      </button>

      {/* 
      add clue inputs for all intersecting words created

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="playWordInputField">bonus word:</label>
        <input className= {`menu-input ${usersTeam} inactive`} type="text" id="secondWord" value={word} onChange={handleWordChange}/>
        <button className= {`enter-button ${usersTeam} hide`} onClick={handleWordEnter} >{'>'}</button>
      </div>

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="playClueInputField">play clue:</label>
        <input className= {`menu-input ${usersTeam} ${cluePlayed ? 'inactive' : ''}`} type="text" id="playClueInputField" value={clue} onChange={handleClueChange}/>
        <button className= {`enter-button ${usersTeam} ${cluePlayed ? 'hide' : ''}`} onClick={handleClueEnter} >{'>'}</button>
      </div> */}


      <OptionsMenu currentScreenLabel={"play-word"}/>

    </div>
    </>
  )
}

export default PlayWordMenu