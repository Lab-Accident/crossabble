import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TestMongo from './components/TestMongo';

import './styles/main.scss';

import PlayScreen from './pages/PlayScreen.tsx';

export const UsersContext = React.createContext();

const App = () => {

  const [usersTeam, setUsersTeam] = useState('T2');
  const [usersPlayer, setUsersPlayer] = useState('P2');

  return (
    <>
      <UsersContext.Provider value={{ usersTeam, setUsersTeam, usersPlayer, setUsersPlayer }}>
        <TestMongo />
        <PlayScreen />

            {/* <BrowserRouter>
            <Routes>
              <Route path="/" element={HomeScreen} />
              <Route path="/play" element={PlayScreen} />
              <Route path="/games" element={GameListScreen} />
            </Routes>
            </BrowserRouter>     */}
      </UsersContext.Provider>
    </>
  )
}

export default App