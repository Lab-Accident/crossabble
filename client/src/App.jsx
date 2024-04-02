import React, { useState, createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './styles/main.scss';

import { PublicWord, WordData } from './components/Word';
import { GridData } from './components/GridData';

import HomeScreen from './pages/HomeScreen';
import PlayScreen from './pages/PlayScreen';
import GameListScreen from './pages/GameListScreen';

export const CurrentMenuContext = React.createContext();
export const UsersContext = React.createContext();
export const clueContext = React.createContext();
export const publicGridContext = React.createContext();

const App = () => {

  const unguessedWords = [
    new WordData({ clue: 'Find the key to unlock the secret door', team: 'T2', row: 0, col: 0, num: 3, down: false, length: 3 }),
    new WordData({ clue: 'Unlock the door with the golden key', team: 'T1', row: 0, col: 4, num: 4, down: true, length: 6 }),
    new WordData({ clue: 'Open the chest and discover the hidden treasure', team: 'T1', num: 5, row: 0, col: 6, down: false, length: 4 }),
    new WordData({ clue: 'Solve the puzzle to reveal the ancient artifact', team: 'T2', num: 1, row: 2, col: 0, down: false, length: 3 }),
    new WordData({ clue: 'Discover the secret chamber deep within the dungeon', team: 'T1', num: 9, row: 2, col: 6, down: true, length: 7 }),
  ];

  const publicWords = [
    new PublicWord({ word: 'KEY', clue: 'Find the key to unlock the secret door', team: 'T2', row: 0, col: 0, num: 3, down: false, length: 3 }),
  ];

  const publicGrid = new GridData();
  for (let i = 0; i < unguessedWords.length; i++) {
    publicGrid.setUnguessedCellsFromWord(unguessedWords[i]);
  }
  for (let i = 0; i < publicWords.length; i++) {
    publicGrid.setGuessedCellsFromWord(publicWords[i]);
  }
  // publicGrid.logGridStatePretty();
  // publicGrid.logGridNumsPretty();
  // publicGrid.logGridLettersPretty();



  const [currentMenu, setCurrentMenu] = useState('play-word');
  const [usersTeam, setUsersTeam] = useState('T2');
  const [usersPlayer, setUsersPlayer] = useState('P2');

  return (
    <>
    <CurrentMenuContext.Provider value={{ currentMenu, setCurrentMenu }}>
      <UsersContext.Provider value={{ usersTeam, setUsersTeam, usersPlayer, setUsersPlayer }}>
        <publicGridContext.Provider value={{ publicGrid, unguessedWords, publicWords }}>
          <PlayScreen />

          {/* <BrowserRouter>
          <Routes>
            <Route path="/" element={HomeScreen} />
            <Route path="/play" element={PlayScreen} />
            <Route path="/games" element={GameListScreen} />
          </Routes>
          </BrowserRouter>     */}

        </publicGridContext.Provider>
      </UsersContext.Provider>
    </CurrentMenuContext.Provider>
    </>
  )
}

export default App