import React, { useState, useContext } from 'react';
import OptionsMenu from './OptionsMenu'
import {UsersContext } from '../../App';

function PlayWordMenu() {

  const [wordPlayed, setWordPlayed] = useState(false);
  const [cluePlayed, setCluePlayed] = useState(false);
  const [word, setWord] = useState('');
  const [clue, setClue] = useState('');

  const { usersTeam } = useContext(UsersContext);

  const handleWordChange = (event) => {
    let input = event.target.value;
    input = input.replace(/[^A-Za-z]/ig, '');
    input = input.toUpperCase();
    setWord(input);
  };

  const handleClueChange = (event) => {
    setClue(event.target.value);
  };

  const handleWordEnter = () => {
    setWordPlayed(true);
  };

  const handleClueEnter = () => {
    setCluePlayed(true);
  };

  return (
    <>
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

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="playWordInputField">play word:</label>
        <input className= {`menu-input ${usersTeam} ${wordPlayed ? 'inactive' : ''}`} type="text" id="playWordInputField" value={word} onChange={handleWordChange}/>
        <button className= {`enter-button ${usersTeam} ${wordPlayed ? 'hide' : ''}`} onClick={handleWordEnter} >{'>'}</button>
      </div>

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="playClueInputField">play clue:</label>
        <input className= {`menu-input ${usersTeam} ${cluePlayed ? 'inactive' : ''}`} type="text" id="playClueInputField" value={clue} onChange={handleClueChange}/>
        <button className= {`enter-button ${usersTeam} ${cluePlayed ? 'hide' : ''}`} onClick={handleClueEnter} >{'>'}</button>
      </div>

      {/* 
      add clue inputs for all intersecting words created

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="playWordInputField">bonus word:</label>
        <input className= {`menu-input ${usersTeam} inactive`} type="text" id="secondWord" value={word} onChange={handleWordChange}/>
        <button className= {`enter-button ${usersTeam} hide`} onClick={handleWordEnter} >{'>'}</button>
      </div>

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="playClueInputField">play clue:</label>
        <input className= {`menu-input ${usersTeam} ${cluePlayed ? 'inactive' : ''}`} type="text" id="playClueInputField" value={clue} onChange={handleClueChange}/>
        <button className= {`enter-button ${usersTeam} ${cluePlayed ? 'hide' : ''}`} onClick={handleClueEnter} >{'>'}</button>
      </div> */}


      <OptionsMenu currentScreenLabel={"play word"}/>

    </div>
    </>
  )
}

export default PlayWordMenu