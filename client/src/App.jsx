import React, { useState, createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './styles/main.scss';

import HomeScreen from './pages/HomeScreen';
import PlayScreen from './pages/PlayScreen';
import GameListScreen from './pages/GameListScreen';

export const CurrentMenuContext = React.createContext();
export const UsersContext = createContext();

const App = () => {

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