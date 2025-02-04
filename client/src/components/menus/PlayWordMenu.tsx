import { useRef, useEffect, useState } from 'react';
import OptionsMenu from './OptionsMenu.tsx'
import useUserGridStore from '../../stores/UserGridStore';
import useSessionStore from '../../stores/SessionStore';

function PlayWordMenu() {
  const usersTeam = useSessionStore((state) => state.currentSession?.playerPosition?.slice(0, 2));
  const userGrid = useUserGridStore();

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

  const [wordPlayed, setWordPlayed] = useState(false);
  const [cluePlayed, setCluePlayed] = useState(false);
  const [currentlyDown, setCurrentlyDown] = useState(true);
  const [emptySlotLength, setEmptySlotLength] = useState(0);
  const [word, setWord] = useState('');
  const [clue, setClue] = useState('');

  const playWordRef = useRef<HTMLInputElement>(null);

  const updateEmptySlotLength = () => {
    const selection = getCurrentSelection();
    if (!selection) return;

    const { row, col } = selection;
    let maxLength = currentlyDown ? 
      parseInt(NUM_GRID_CELLS) - row : 
      parseInt(NUM_GRID_CELLS) - col;

    for (let i = 0; i < maxLength; i++) {
      const curr = currentlyDown 
        ? { row: row + i, col } 
        : { row, col: col + i };
      
      if (userGrid.grid[curr.row][curr.col].state !== 'empty') {
        maxLength = i;
        break;
      }
    }
    setEmptySlotLength(maxLength);
  };

  const getCurrentSelection = () => {
    const selectedCell = userGrid.grid.flat().find(cell => cell.isSelected);
    if (!selectedCell) return null;

    const row = userGrid.grid.findIndex(r => r.includes(selectedCell));
    const col = userGrid.grid[row].indexOf(selectedCell);
    return { row, col };
  };

  const handleWordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (wordPlayed) return;

    const selection = getCurrentSelection();
    if (!selection) return;

    let input = event.target.value
      .replace(/[^A-Za-z]/ig, '')
      .toUpperCase()
      .slice(0, emptySlotLength);

    setWord(input);

    let { row, col } = selection;

    for (let i = 0; i < input.length; i++) {
      let curr = currentlyDown 
        ? { row: row + i, col} 
        : { row, col: col + i};

      userGrid.setLetter(curr.row, curr.col, input[i]);
    }

    for (let i = input.length; i < emptySlotLength; i++) {
      let curr = currentlyDown
        ? { row: row + i, col}
        : { row, col: col + i};

        userGrid.setLetter(curr.row, curr.col, '');
    }
  };

  const removeCurrentWord = () => {
    if (wordPlayed) return;

    const selection = getCurrentSelection();
    if (!selection) return;

    const { row, col } = selection;
    setWord('');

    for (let i = 0; i < emptySlotLength; i++) {
      const curr = currentlyDown
        ? { row: row + i, col }
        : { row, col: col + i };
      userGrid.setLetter(curr.row, curr.col, '');
    }
  };


  const handleClueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClue(event.target.value);
  };

  const handleWordEnter = () => {
    setWordPlayed(true);
  };

  const handleClueEnter = () => {
    setCluePlayed(true);
  };


  const findNextEmptyPosition = (
    startRow: number, 
    startCol: number, 
    direction: 'up' | 'down' | 'left' | 'right'
  ): { row: number; col: number } => {
    let row = startRow;
    let col = startCol;

    const wrapPosition = (pos: number): number => {
      const size = parseInt(NUM_GRID_CELLS);
      if (pos < 0) return size - 1;
      if (pos >= size) return 0;
      return pos;
    };

    do {
      switch (direction) {
        case 'up':
          row = wrapPosition(row - 1);
          break;
        case 'down':
          row = wrapPosition(row + 1);
          break;
        case 'left':
          col = wrapPosition(col - 1);
          break;
        case 'right':
          col = wrapPosition(col + 1);
          break;
      }
    } while (userGrid.grid[row][col].state !== 'empty');

    return { row, col };
  };

  const handleSelectionChange = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (wordPlayed) return;

    const selection = getCurrentSelection();
    if (!selection) return;

    removeCurrentWord();
    
    const { row, col } = findNextEmptyPosition(selection.row, selection.col, direction);
    
    userGrid.clearSelection();
    userGrid.setSelected(row, col, true);
  };

  useEffect(() => {
    const selection = getCurrentSelection();
    if (!selection) return;
    
    updateEmptySlotLength();
    
    if (!wordPlayed && playWordRef.current) {
      playWordRef.current.focus();
    }
  }, [userGrid.grid]);

  useEffect(() => {
    if (wordPlayed) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      };

      const direction = keyMap[event.key];
      if (!direction) return;

      event.preventDefault();
      handleSelectionChange(direction);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wordPlayed, userGrid.grid]);



  return (
    <>
    <div className='menu-container'>


      <div className='cell-nav-bar'>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={() => !wordPlayed && handleSelectionChange('left')}>
            {'<'}
        </div>
        <div 
          className=  {`qtr-button ${usersTeam}`}  
          onClick={() => !wordPlayed && handleSelectionChange('up')}>
            <span style={{ transform: 'rotate(90deg)' }}>
              {'<'}
            </span>
        </div>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={() => !wordPlayed && handleSelectionChange('down')}>
            <span style={{ transform: 'rotate(-90deg)' }}>
              {'<'}
            </span>
        </div>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={() => !wordPlayed && handleSelectionChange('right')}>
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
          onChange={handleWordChange}
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

      <OptionsMenu currentMenu={"play-word"}/>

    </div>
    </>
  )
}

export default PlayWordMenu