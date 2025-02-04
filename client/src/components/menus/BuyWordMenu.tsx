import OptionsMenu from './OptionsMenu.tsx'

import useSessionStore from '../../stores/SessionStore';

function BuyWordMenu() {

  const usersTeam = useSessionStore((state) => state.currentSession?.playerPosition?.slice(0, 2));

  return (
    <div className='menu-container'>
      <button 
        className={`default-button ${usersTeam}`} >
          Auto play new word for six points
      </button>
      <OptionsMenu currentMenu={"buy-word"}/>
    </div>
  )

}

export default BuyWordMenu