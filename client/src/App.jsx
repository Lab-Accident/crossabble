import React, { useState, createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './styles/main.scss';

import HomeScreen from './pages/HomeScreen';
import PlayScreen from './pages/PlayScreen';
import GameListScreen from './pages/GameListScreen';

export const CurrentMenuContext = React.createContext();
export const CurrentPlayerContext = createContext();

const App = () => {

  const [currentMenu, setCurrentMenu] = useState('play word');
  const [currentTeam, setCurrentTeam] = useState('T1');
  const [currentPlayer, setCurrentPlayer] = useState('P1');

  return (
    <>
    <CurrentMenuContext.Provider value={{ currentMenu, setCurrentMenu }}>
      <CurrentPlayerContext.Provider value={{ currentTeam, setCurrentTeam, currentPlayer, setCurrentPlayer }}>
        <PlayScreen />

        {/* <BrowserRouter>
        <Routes>
          <Route path="/" element={HomeScreen} />
          <Route path="/play" element={PlayScreen} />
          <Route path="/games" element={GameListScreen} />
        </Routes>
        </BrowserRouter>     */}

      </CurrentPlayerContext.Provider>
    </CurrentMenuContext.Provider>
    </>
  )
}

export default App