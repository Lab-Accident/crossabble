import React, { useContext } from 'react'; 
import OptionsMenu from './OptionsMenu'
import {UsersContext } from '../../App';

function BuyLetterMenu() {

  const { usersTeam } = useContext(UsersContext);

  return (
    <div className='menu-container'>
      <div className='cell-nav-bar'>
        <div className= {`qtr-button ${usersTeam}`} >{'<'}</div>
        <div className=  {`qtr-button ${usersTeam}`} >
          <span style={{ transform: 'rotate(90deg)' }}>{'<'}</span>
        </div>
        <div className= {`qtr-button ${usersTeam}`} >
          <span style={{ transform: 'rotate(-90deg)' }}>{'<'}</span>
        </div>
        <div className= {`qtr-button ${usersTeam}`} >{'>'}</div>
      </div>
      
      <button className={`default-button ${usersTeam}`} style={{margin: '0.1rem'}} >buy letter for two points</button>

      <OptionsMenu currentScreenLabel={"buy letter"}/>
    </div>
  )
}

export default BuyLetterMenu