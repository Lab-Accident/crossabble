import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeScreen from './pages/HomeScreen';
import PlayScreen from './pages/PlayScreen';
import GameListScreen from './pages/GameListScreen';



const App = () => {
  return (
    <>
    <h1>App</h1>

    <BrowserRouter>
    <Routes>
      <Route path="/" element={HomeScreen} />
      <Route path="/play" element={PlayScreen} />
      <Route path="/games" element={GameListScreen} />
    </Routes>
    </BrowserRouter>    
    </>
  )
}

export default App