import React, { useState, useContext } from 'react';
import OptionsMenu from './OptionsMenu'
import {UsersContext } from '../../App';

function GuessWordMenu() {

  const [wordGuessed, setWordGuessed] = useState(false);
  const [word, setWord] = useState('');
  const [currWordLoc, setWordLoc] = useState('4 Down');
  const [clue, setClue] = useState('This is an example clue. The clue is a hint to the currently selected word.');

  const { usersTeam } = useContext(UsersContext);

  const handleWordChange = (event) => {
    let input = event.target.value;
    input = input.replace(/[^A-Za-z]/ig, '');
    input = input.toUpperCase();
    setWord(input);
  };

  const handleWordEnter = () => {
    setWordGuessed(true);
  };

  return (
    <div className='menu-container'>

    <div className={`clue-display  ${usersTeam}`}> {clue} </div>

      <div className='word-nav-bar'>
        <div className= {`side-button ${usersTeam}`} >{'<'}</div>
        <div className= {`curr-nav-display ${usersTeam}`} >{currWordLoc}</div>
        <div className= {`side-button ${usersTeam}`} >{'>'}</div>
      </div>

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="guessWordInputField">guess word:</label>
        <input className= {`menu-input ${usersTeam} ${wordGuessed ? 'inactive' : ''}`} type="text" id="guessWordInputField" value={word} onChange={handleWordChange}/>
        <button className= {`enter-button ${usersTeam} ${wordGuessed ? 'hide' : ''}`} onClick={handleWordEnter} >{'>'}</button>
      </div>


      <OptionsMenu currentScreenLabel={"guess-word"}/>
    </div>
  )
}

export default GuessWordMenu