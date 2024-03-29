import React from 'react'
import OptionsMenu from './OptionsMenu'

function BuyWordMenu() {

  let usersTeam = 'T2';

  return (
    <div className='menu-container'>
      <button className={`default-button ${usersTeam}`} >Auto play new word for six points</button>
      <OptionsMenu currentScreenLabel={"buy word"}/>
    </div>
  )

}

export default BuyWordMenu