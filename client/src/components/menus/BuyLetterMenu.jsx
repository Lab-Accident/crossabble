import React from 'react'

function BuyLetterMenu() {

  let usersTeam = 'T2';

  return (
    <div className='menu-container'>
      <div className='nav-bar'>
        <div className= {`qtr-button ${usersTeam}`} >{'<'}</div>
        <div className=  {`qtr-button ${usersTeam}`} >
          <span style={{ transform: 'rotate(90deg)' }}>{'<'}</span>
        </div>
        <div className= {`qtr-button ${usersTeam}`} >
          <span style={{ transform: 'rotate(-90deg)' }}>{'<'}</span>
        </div>
        <div className= {`qtr-button ${usersTeam}`} >{'>'}</div>
      </div>
      
      <button className={`full-width-button ${usersTeam}`}>buy letter for two points</button>

      <OptionsMenu currentScreenLabel={"buy letter"}/>
    </div>
  )
}

export default BuyLetterMenu