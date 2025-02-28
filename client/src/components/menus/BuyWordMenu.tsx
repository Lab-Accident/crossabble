import OptionsMenu from './OptionsMenu.tsx'

import { getCurrentTeam } from '../../hooks/useSocket';

function BuyWordMenu() {

  const usersTeam = getCurrentTeam();

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