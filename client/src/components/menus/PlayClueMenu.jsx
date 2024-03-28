import React from 'react'
import OptionsMenu from './OptionsMenu'

function PlayClueMenu() {
  return (
    <div className='menu-container'>
        <div className="input-container">
          <label className="menu-input T1" for="playWordInputField">play word:</label>
          <input className="menu-input T1" type="text" id="playWordInputField" />
          <button className="enter-button T1">{'>'}</button>
        </div>
        <div className="input-container">
          <label className="menu-input T1" for="playClueInputField">play clue:</label>
          <input className="menu-input T1" type="text" id="playClueInputField" />
          <button className="enter-button T1">{'>'}</button>
        </div>
      <OptionsMenu />
    </div>
  )
}

export default PlayClueMenu