import React, { useEffect, useContext } from 'react'; 
import OptionsMenu from './OptionsMenu'
import { UsersContext } from '../../App';
import { CurrentSelectionContext } from '../../App';
import { PublicGridContext } from '../../App';

function BuyLetterMenu() {
  const { currentSelection, setCurrentSelection } = useContext(CurrentSelectionContext);
  const { publicGrid } = useContext(PublicGridContext);
  const { usersTeam } = useContext(UsersContext);

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

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
    } while (publicGrid.getState(row, col) !== 'unguessed');
    
    setCurrentSelection(currentSelection.map(() => ({ row, col })));
  }

  const handleSelectionChangeRight = () => {
    let { row, col } = currentSelection[0];    
    do {
        col++;
        col = wrapCol(col);
    } while (publicGrid.getState(row, col) !== 'unguessed');
    
    setCurrentSelection(currentSelection.map(() => ({ row, col })));
  }
  
  const handleSelectionChangeUp = () => {
    let { row, col } = currentSelection[0];    
    do {
        row--;
        row = wrapRow(row);
    } while (publicGrid.getState(row, col) !== 'unguessed');
    
    setCurrentSelection(currentSelection.map(() => ({ row, col })));
  }

  const handleSelectionChangeDown = () => {
    let { row, col } = currentSelection[0];    
    do {
        row++;
        row = wrapRow(row);
    } while (publicGrid.getState(row, col) !== 'unguessed');
    
    setCurrentSelection(currentSelection.map(() => ({ row, col })));
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
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
          } while (publicGrid.getState(row, col) !== 'unguessed');
          event.preventDefault();
          break;
        case ARROW_DOWN:
          do {
            row++;
            row = wrapRow(row);
          } while (publicGrid.getState(row, col) !== 'unguessed');
          event.preventDefault();
          break;
        case ARROW_LEFT:
          do {
            col--;
            col = wrapCol(col);
          } while (publicGrid.getState(row, col) !== 'unguessed');
          event.preventDefault();
          break;
        case ARROW_RIGHT:
          do {
            col++;
            col = wrapCol(col);
          } while (publicGrid.getState(row, col) !== 'unguessed');
          event.preventDefault();
          break;
        default:
          return; 
      }

      setCurrentSelection([ { row: row, col: col }]);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSelection]);

  return (
    <div className='menu-container'>

      <div className='cell-nav-bar'>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={handleSelectionChangeLeft} >
            {'<'}
        </div>
        <div 
          className=  {`qtr-button ${usersTeam}`} 
          onClick={handleSelectionChangeUp} >
            <span style={{ transform: 'rotate(90deg)' }}>
                {'<'}
            </span>
        </div>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={handleSelectionChangeDown}>
            <span style={{ transform: 'rotate(-90deg)' }} >
                {'<'}
            </span>
        </div>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={handleSelectionChangeRight} >
            {'>'}
        </div>
      </div>
      
      <button 
        className={`default-button ${usersTeam}`} 
        style={{margin: '0.1rem'}} >
          buy letter for two points
      </button>

      <OptionsMenu currentScreenLabel={"buy-letter"}/>
    </div>
  )
}

export default BuyLetterMenu