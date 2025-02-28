import { create } from 'zustand';
import { produce } from 'immer';
import * as types from '../../../server/src/types/gameTypes';
import useGameStore from './GamePlayStore';

interface FrontendCell extends types.Cell {
  isSelected: boolean;
}

interface UserGridStore {
    grid: FrontendCell[][];
    setLetter: (row: number, col: number, letter: string) => void;

    setSelected: (row: number, col: number, isSelected: boolean) => void;
    clearSelection: () => void;
    initializeGrid: () => void;
}

const createEmptyGrid = (numGridCells: number): FrontendCell[][] => {
  return Array.from({ length: numGridCells }, (_, row) =>
    Array.from({ length: numGridCells }, (_, col) => ({
      position: { row, col },
      state: types.CellState.Empty,
      letter: 'A',
      owningTeam: null,
      isSelected: false,
      number: 1,
      playedBy: null
    }))
  );
};
const useUserGridStore = create<UserGridStore>()((set) => ({
  grid: createEmptyGrid(useGameStore.getState().numGridCells),

  initializeGrid: () => set(() => ({
      grid: createEmptyGrid(useGameStore.getState().numGridCells)
  })),

  setLetter: (row, col, letter) => set(produce(store => {
      store.grid[row][col].letter = letter;
  })),

  setSelected: (row, col, isSelected) => set(produce(store => {
      store.grid[row][col].isSelected = isSelected;
  })),

  clearSelection: () => set(produce(store => {
      store.grid.forEach((row: FrontendCell[]) => 
          row.forEach((cell: FrontendCell) => {
              cell.isSelected = false;
          })
      );
  })),
}));

useGameStore.subscribe((state) => {
  if (state.numGridCells) {
    useUserGridStore.getState().initializeGrid();
  }
});

export default useUserGridStore;