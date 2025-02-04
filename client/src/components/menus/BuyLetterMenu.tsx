import { useEffect } from 'react'; 
import OptionsMenu from './OptionsMenu.tsx'
import useUserGridStore from '../../stores/UserGridStore';
import useSessionStore from '../../stores/SessionStore';

function BuyLetterMenu() {
  const userGrid = useUserGridStore();
  const usersTeam = useSessionStore((state) => state.currentSession?.playerPosition?.slice(0, 2));

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

  const wrapRow = (row: number): number => {
    const numGridCells = parseInt(NUM_GRID_CELLS);
    if (row < 0) return numGridCells - 1;
    if (row >= numGridCells) return 0;
    return row;
  };

  const wrapCol = (col: number): number => {
    const numGridCells = parseInt(NUM_GRID_CELLS);
    if (col < 0) return numGridCells - 1;
    if (col >= numGridCells) return 0;
    return col;
  };

  const findNextUnguessedPosition = (
    startRow: number, 
    startCol: number, 
    direction: 'up' | 'down' | 'left' | 'right'
  ): { row: number; col: number } => {
    let row = startRow;
    let col = startCol;

    do {
      switch (direction) {
        case 'up':
          row = wrapRow(row - 1);
          break;
        case 'down':
          row = wrapRow(row + 1);
          break;
        case 'left':
          col = wrapCol(col - 1);
          break;
        case 'right':
          col = wrapCol(col + 1);
          break;
      }
    } while (userGrid.grid[row][col].state !== 'unguessed');

    return { row, col };
  };

  const handleSelectionChange = (direction: 'up' | 'down' | 'left' | 'right') => {
    userGrid.clearSelection();
    
    const currentCell = userGrid.grid.flat().find(cell => cell.isSelected);
    if (!currentCell) return;
    
    const currentRow = userGrid.grid.findIndex(row => row.includes(currentCell));
    const currentCol = userGrid.grid[currentRow].indexOf(currentCell);
    
    const { row, col } = findNextUnguessedPosition(currentRow, currentCol, direction);
    
    userGrid.setSelected(row, col, true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          handleSelectionChange('up');
          event.preventDefault();
          break;
        case 'ArrowDown':
          handleSelectionChange('down');
          event.preventDefault();
          break;
        case 'ArrowLeft':
          handleSelectionChange('left');
          event.preventDefault();
          break;
        case 'ArrowRight':
          handleSelectionChange('right');
          event.preventDefault();
          break;
        default:
          return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className='menu-container'>

      <div className='cell-nav-bar'>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={() => handleSelectionChange('left')}>
            {'<'}
        </div>
        <div 
          className=  {`qtr-button ${usersTeam}`} 
          onClick={() => handleSelectionChange('up')}>
            <span style={{ transform: 'rotate(90deg)' }}>
                {'<'}
            </span>
        </div>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={() => handleSelectionChange('down')}>
            <span style={{ transform: 'rotate(-90deg)' }} >
                {'<'}
            </span>
        </div>
        <div 
          className= {`qtr-button ${usersTeam}`} 
          onClick={() => handleSelectionChange('right')}>
            {'>'}
        </div>
      </div>
      
      <button 
        className={`default-button ${usersTeam}`} 
        style={{margin: '0.1rem'}} >
          buy letter for two points
      </button>

      <OptionsMenu currentMenu={"buy-letter"}/>
    </div>
  )
}

export default BuyLetterMenu