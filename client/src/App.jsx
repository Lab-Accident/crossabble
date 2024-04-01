import React, { useState, createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './styles/main.scss';

import { PublicWord, WordData } from './components/Word';

import HomeScreen from './pages/HomeScreen';
import PlayScreen from './pages/PlayScreen';
import GameListScreen from './pages/GameListScreen';

export const CurrentMenuContext = React.createContext();
export const UsersContext = React.createContext();
export const clueContext = React.createContext();

const App = () => {

  const clues = [
    new WordData({ clue: 'Find the key to unlock the secret door', team: 'T1', row: 0, col: 0, num: 1, down: false, length: 4 }),
    new WordData({ clue: 'Unlock the door with the golden key', team: 'T1', row: 0, col: 0, num: 2, down: true, length: 3 }),
    new WordData({ clue: 'Open the chest and discover the hidden treasure', team: 'T2', num: 4, row: 0, col: 0, down: false, length: 7 }),
    new WordData({ clue: 'Solve the puzzle to reveal the ancient artifact', team: 'T1', num: 6, row: 0, col: 0, down: true, length: 5 }),
    new WordData({ clue: 'Discover the secret chamber deep within the dungeon', team: 'T2', num: 9, row: 0, col: 0, down: false, length: 4 }),
];


  const [currentMenu, setCurrentMenu] = useState('play word');
  const [usersTeam, setUsersTeam] = useState('T1');
  const [usersPlayer, setUsersPlayer] = useState('P2');

  return (
    <>
    <CurrentMenuContext.Provider value={{ currentMenu, setCurrentMenu }}>
      <UsersContext.Provider value={{ usersTeam, setUsersTeam, usersPlayer, setUsersPlayer }}>
        <PlayScreen />

        {/* <BrowserRouter>
        <Routes>
          <Route path="/" element={HomeScreen} />
          <Route path="/play" element={PlayScreen} />
          <Route path="/games" element={GameListScreen} />
        </Routes>
        </BrowserRouter>     */}

      </UsersContext.Provider>
    </CurrentMenuContext.Provider>
    </>
  )
}

export default App