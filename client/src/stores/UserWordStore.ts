import { create } from 'zustand';
import { produce } from 'immer';
import * as types from '../../../server/src/types/gameTypes';

import useUserGridStore from './UserGridStore';

interface WordStoreState {
  words: types.Word[];
  currSelectedWord: types.Word | null;
  revealWord: (wordNum: number, down:boolean, text: string) => void;
  addWord: (word: types.Word) => void;
  setSelectedWord: (word: types.Word) => void;
  selectNextUnguessedWord: () => void;
  selectPrevUnguessedWord: () => void;
}

const selectWordInGrid = (word: types.Word, setSelected: (row: number, col: number, selected: boolean) => void) => {
  for (let i = 0; i < word.length; i++) {
    const curr = word.down
      ? { row: word.position.row + i, col: word.position.col }
      : { row: word.position.row, col: word.position.col + i };
    
    setSelected(curr.row, curr.col, true);
  }
};

const deselectWordInGrid = (word: types.Word, setSelected: (row: number, col: number, selected: boolean) => void) => {
  for (let i = 0; i < word.length; i++) {
    const curr = word.down
      ? { row: word.position.row + i, col: word.position.col }
      : { row: word.position.row, col: word.position.col + i };
    
    setSelected(curr.row, curr.col, false);
  }
};

const useUserWordsStore = create<WordStoreState>((set) => ({
  words: [],
  currSelectedWord: null,

  revealWord: (wordNum, down, text) => set(
    produce((state) => {
      const word = state.words.find((w: types.Word) => w.number === wordNum && w.down === down);
      if (word) {
        word.revealed = true;
        word.word = text;
      }
    })
  ),

  addWord: (word) => set(
    produce((state) => {
      state.words.push(word);
    })
  ),

  setSelectedWord: (word) => {
    const userGridStore = useUserGridStore.getState();
    
    set(produce((state) => {
      if (state.currSelectedWord === word) return;
      
      if (state.currSelectedWord) {
        deselectWordInGrid(state.currSelectedWord, userGridStore.setSelected);
      }
      
      if (word) {
        selectWordInGrid(word, userGridStore.setSelected);
      }
      
      state.currSelectedWord = word;
    }));
  },

  selectNextUnguessedWord: () => set(
    produce((state) => {
      const unguessedWords = state.words.filter((w: types.Word) => !w.revealed);
      if (unguessedWords.length === 0) return;

      const currentIndex = state.currSelectedWord
        ? unguessedWords.findIndex((w: types.Word) => w === state.currSelectedWord)
        : -1;

      const nextIndex = currentIndex === -1 
        ? 0 
        : (currentIndex + 1) % unguessedWords.length;

      state.setSelectedWord(unguessedWords[nextIndex]);
    })
  ),

  selectPrevUnguessedWord: () => set(
    produce((state) => {
      const unguessedWords = state.words.filter((w: types.Word) => !w.revealed);
      if (unguessedWords.length === 0) return;

      const currentIndex = state.currSelectedWord
        ? unguessedWords.findIndex((w: types.Word) => w === state.currSelectedWord)
        : -1;

      const prevIndex = currentIndex === -1 
        ? unguessedWords.length - 1 
        : (currentIndex - 1 + unguessedWords.length) % unguessedWords.length;

      state.setSelectedWord(unguessedWords[prevIndex]);
    })
  ),
}));

export default useUserWordsStore;