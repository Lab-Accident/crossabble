import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DebugSocketTest from './components/TestMongo';
import useSessionStore from './stores/SessionStore';

import './styles/main.scss';

import PlayScreen from './pages/PlayScreen.tsx';


const App = () => {
  const { initializeSocket, reconnectToGame } = useSessionStore();

  useEffect(() => {
      initializeSocket();
      reconnectToGame();
  }, []);

  return (
    <>
        <DebugSocketTest />
        <PlayScreen />

            {/* <BrowserRouter>
            <Routes>
              <Route path="/" element={HomeScreen} />
              <Route path="/play" element={PlayScreen} />
              <Route path="/games" element={GameListScreen} />
            </Routes>
            </BrowserRouter>     */}
    </>
  )
}

export default App