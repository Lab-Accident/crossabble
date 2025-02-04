import { create } from 'zustand';
import { produce } from 'immer';
import * as types from '../../../server/src/types/gameTypes';

const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

interface FrontendCell extends types.Cell {
  isSelected: boolean;
}

interface UserGridStore {
    grid: FrontendCell[][];
    setLetter: (row: number, col: number, letter: string) => void;

    setSelected: (row: number, col: number, isSelected: boolean) => void;
    clearSelection: () => void;
}

const createEmptyGrid = (): FrontendCell[][] => {
  return Array.from({ length: parseInt(NUM_GRID_CELLS) }, (_, row) =>
    Array.from({ length: parseInt(NUM_GRID_CELLS) }, (_, col) => ({
      position: { row, col },
      state: types.CellState.Empty,
      letter: '',
      owningTeam: null,
      isSelected: false,
      number: 0,
      playedBy: null
    }))
  );
}

const useUserGridStore = create<UserGridStore>()((set) => ({
    grid: createEmptyGrid(),

    setLetter: (row, col, letter) => set(produce(store => {
      store.grid[row][col].letter = letter;
    })),

    setSelected: (row, col, isSelected) => set(produce(store => {
      store.grid[row][col].isSelected = isSelected
    })),

    clearSelection: () => set(produce(store => {
      store.grid.forEach((row : FrontendCell[]) => 
        row.forEach((cell : FrontendCell) => {
          cell.isSelected = false;
        })
      );
    })),
    
}));

export default useUserGridStore;


