import React from 'react'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import home_screen from './pages/home_screen';
import play_screen from './pages/play_screen';



const App = () => {
  return (
    <>
    <home_screen />
    </>
  )
}

export default App