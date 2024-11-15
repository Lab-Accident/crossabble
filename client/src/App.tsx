import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './styles/main.scss';

import { PublicWord, WordData } from './components/Word.ts';
import { GridData } from './components/GridData.ts';

import HomeScreen from './pages/HomeScreen.tsx';
import PlayScreen from './pages/PlayScreen.tsx';
import GameListScreen from './pages/GameListScreen.tsx';

export const CurrentMenuContext = React.createContext();
export const UsersContext = React.createContext();
export const PublicGridContext = React.createContext();
export const CurrentSelectionContext = React.createContext();


const App = () => {

  let unguessedWords = [
    new WordData({ clue: 'Find the key to unlock the secret door', team: 'T2', row: 0, col: 0, num: 3, down: false, length: 3 }),
    new WordData({ clue: 'Unlock the door with the golden key', team: 'T1', row: 0, col: 4, num: 4, down: true, length: 6 }),
    new WordData({ clue: 'Open the chest and discover the hidden treasure', team: 'T1', num: 5, row: 0, col: 6, down: false, length: 4 }),
    new WordData({ clue: 'Solve the puzzle to reveal the ancient artifact', team: 'T2', num: 1, row: 2, col: 0, down: false, length: 3 }),
    new WordData({ clue: 'Discover the secret chamber deep within the dungeon', team: 'T1', num: 9, row: 2, col: 6, down: true, length: 7 }),
  ];
  // sort words by clue number
  unguessedWords.sort((a, b) => a.num - b.num);

  let publicWords = [
    // getPublicWordByClueNum(9, 'QUALITY'),
    // getPublicWordByClueNum(3, 'KEY'),
    getPublicWordByClueNum(4, 'CASKET'),
    // getPublicWordByClueNum(5, 'CART'),
    // getPublicWordByClueNum(1, 'BEE'),
    // getPublicWordByClueNum(5, 'PATH'),
  ];
  // makeWordPublic(5, 'PATH');
  // makeWordPublic(9, 'QUALITY');
  unguessedWords = unguessedWords.filter(word => !publicWords.some(publicWord => publicWord.num === word.num));

  function findWordByClueNum(num) {
    const word = unguessedWords.find(word => word.num === num);
    if (!word) {
      console.warn(`WordData with clue number ${num} not found.`);
      return null;
    }
    return word;
  }
  function getPublicWordByClueNum(num, word) {
    const foundWord = findWordByClueNum(num);
    if (!foundWord) {
      console.warn(`WordData with clue number ${num} not found.`);
      return null;
    }
    return foundWord.getPublicWord(word);
  }
  function makeWordPublic(num, word) {
    const publicWord = getPublicWordByClueNum(num, word);
    if (publicWord) {
      publicWords.push(publicWord);
      unguessedWords = unguessedWords.filter(word => word.num !== num);
    } else {
      console.warn(`Failed to make word public. Word with clue number ${num} not found.`);
    }
    // console.log(publicWords);
    // console.log(unguessedWords);
  }

  const grid = new GridData();
  for (let i = 0; i < unguessedWords.length; i++) {
    grid.setUnguessedCellsFromWord(unguessedWords[i]);
  }
  for (let i = 0; i < publicWords.length; i++) {
    grid.setGuessedCellsFromWord(publicWords[i]);
  }

  // publicGrid.logGridStatePretty();
  // publicGrid.logGridNumsPretty();
  // publicGrid.logGridLettersPretty();

  const [currentMenu, setCurrentMenu] = useState('play-word');
  const [usersTeam, setUsersTeam] = useState('T2');
  const [usersPlayer, setUsersPlayer] = useState('P2');
  const [currentSelection, setCurrentSelection] = useState([{ row: 0, col: 0}]);
  const [publicGrid, setPublicGrid] = useState(grid);

  const setLetter = (row, col, letter) => {
    publicGrid.setLetter(row, col, letter);
  }

  return (
    <>
    <CurrentMenuContext.Provider value={{ currentMenu, setCurrentMenu }}>
      <UsersContext.Provider value={{ usersTeam, setUsersTeam, usersPlayer, setUsersPlayer }}>
        <PublicGridContext.Provider value={{ publicGrid, setPublicGrid, unguessedWords, publicWords }}>
          <CurrentSelectionContext.Provider value={{ currentSelection, setCurrentSelection }}>
            <PlayScreen />

            {/* <BrowserRouter>
            <Routes>
              <Route path="/" element={HomeScreen} />
              <Route path="/play" element={PlayScreen} />
              <Route path="/games" element={GameListScreen} />
            </Routes>
            </BrowserRouter>     */}
          </CurrentSelectionContext.Provider>
        </PublicGridContext.Provider>
      </UsersContext.Provider>
    </CurrentMenuContext.Provider>
    </>
  )
}

export default App