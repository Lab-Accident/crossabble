import { useContext } from 'react'; 
import OptionsMenu from './OptionsMenu.tsx'
import {UsersContext } from '../../App.tsx';

function BuyWordMenu() {

  const { usersTeam } = useContext(UsersContext);

  return (
    <div className='menu-container'>
      <button 
        className={`default-button ${usersTeam}`} >
          Auto play new word for six points
      </button>
      <OptionsMenu currentScreenLabel={"buy-word"}/>
    </div>
  )

}

export default BuyWordMenu