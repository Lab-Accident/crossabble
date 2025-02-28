import { useEffect } from 'react';
import DebugSocketTest from './components/TestMongo';
import GameSelection from './components/GameSelection';
import { useSocket } from './hooks/useSocket';
import PlayScreen from './pages/PlayScreen';
import './styles/main.scss';

const App = () => {
  const [state, actions] = useSocket();

  useEffect(() => {
    actions.fetchGames();
  }, [actions]);


  return (
    <>
      <DebugSocketTest socketState={state} socketActions={actions} />
      {/* <GameSelection socketState={state} socketActions={actions} /> */}
      <PlayScreen />
    </>
  );
};

export default App;