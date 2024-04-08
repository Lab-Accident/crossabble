import React, { useContext } from 'react'; 
import OptionsMenu from './OptionsMenu'
import {UsersContext } from '../../App';

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