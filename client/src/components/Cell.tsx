import { useEffect, useState } from 'react'
import { UsersContext } from '../App.tsx';
import useUserGridStore from '../stores/UserGridStore'
import useGameStore from '../stores/GamePlayStore.ts';
import { useContext } from 'react';

interface CellProps {
  row: number;
  col: number;
  accessKey: string;
}

function Cell({ row, col, accessKey }: CellProps) {

  const NUM_GRID_CELLS =  Number(getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells'));
  const MIN_GRID_SIZE =  Number(getComputedStyle(document.documentElement).getPropertyValue('--min-grid-size').replace('px', '').replace('#', ''));

  const { usersTeam } = useContext(UsersContext);
  const gameStore = useGameStore();
  const userGrid = useUserGridStore();
  const cell = userGrid.grid[row]?.[col];

  const [cellSize, setCellSize] = useState(() => {
    const gridContainerSize = Number(Math.max(MIN_GRID_SIZE, document.documentElement.clientHeight * 0.4));
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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNumTextStyle = (size: number) => ({
    fontSize: `${size / 2}px`,
  });
  
  const getLetterTextStyle = (size: number) => ({
    fontSize: `${size / 1.2}px`,
  });

  const getCellSize = (size: number) => ({
    height: `${size}px`,
    width: `${size}px`,
  });

  const findAdjacentUnguessedCells = (
    startRow: number, 
    startCol: number, 
    direction: 'up' | 'down' | 'left' | 'right'
  ): Array<{row: number; col: number}> => {
    const cells: Array<{row: number; col: number}> = [];
    let currentRow = startRow;
    let currentCol = startCol;

    while (true) {
      let nextRow = currentRow;
      let nextCol = currentCol;

      switch (direction) {
        case 'up':
          nextRow--;
          break;
        case 'down':
          nextRow++;
          break;
        case 'left':
          nextCol--;
          break;
        case 'right':
          nextCol++;
          break;
      }

      if (nextRow < 0 || nextRow >= NUM_GRID_CELLS || 
          nextCol < 0 || nextCol >= NUM_GRID_CELLS) {
        break;
      }

      if (userGrid.grid[nextRow][nextCol].state !== 'unguessed') {
        break;
      }

      cells.push({ row: nextRow, col: nextCol });
      currentRow = nextRow;
      currentCol = nextCol;
    }

    return direction === 'up' || direction === 'left' ? cells.reverse() : cells;
  };

  const selectFullUnguessedWord = (row: number, col: number) => {
    const prefixUp = findAdjacentUnguessedCells(row, col, 'up');
    const suffixDown = findAdjacentUnguessedCells(row, col, 'down');
    const prefixLeft = findAdjacentUnguessedCells(row, col, 'left');
    const suffixRight = findAdjacentUnguessedCells(row, col, 'right');

    if (prefixUp.length === 0 && suffixDown.length === 0 && 
        prefixLeft.length === 0 && suffixRight.length === 0) {
      userGrid.clearSelection();
      return;
    }

    const vertical = prefixUp.length + suffixDown.length;
    const horizontal = prefixLeft.length + suffixRight.length;

    // Clear any existing selection
    userGrid.clearSelection();

    // Select the longer direction
    if (vertical > horizontal) {
      [...prefixUp, { row, col }, ...suffixDown].forEach(pos => {
        userGrid.setSelected(pos.row, pos.col, true);
      });
    } else {
      [...prefixLeft, { row, col }, ...suffixRight].forEach(pos => {
        userGrid.setSelected(pos.row, pos.col, true);
      });
    }
  };

  const handleCellClick = () => {
    if (gameStore.currentMenu === 'guess-word') {
      selectFullUnguessedWord(row, col);
      return;
    }

    // For other menus, toggle single cell selection
    userGrid.clearSelection();
    userGrid.setSelected(row, col, !cell.isSelected);
  };

  if (!cell) return null;

  return (
    <div>
      <button 
        className={`cell 
          ${cell.isSelected ? 'selected' : ''} 
          ${gameStore.currentMenu} 
          ${cell.owningTeam} 
          ${cell.state} 
          ${gameStore.currentTeam}`}
        accessKey={accessKey} 
        style={getCellSize(cellSize)} 
        onClick={handleCellClick}
      > 
        {cell.number !== 0 && (
          <span 
            className="num" 
            style={getNumTextStyle(cellSize)}
          >
            {cell.number}
          </span>
        )}
        <span 
          className="letter" 
          style={getLetterTextStyle(cellSize)}
        >
          {cell.letter}
        </span>
      </button>
    </div>
  );
}

export default Cell;