import React, { useState, useContext } from 'react';
import OptionsMenu from './OptionsMenu'

function GuessWordMenu() {

  const [wordGuessed, setWordGuessed] = useState(false);
  const [word, setWord] = useState('');

  let usersTeam = 'T2';

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
      <div className='options-menu'>
        <div className= {`half-button ${usersTeam}`} >{'<'}</div>
        <div className= {`half-button ${usersTeam}`} >{'>'}</div>
      </div>

      {/* add displaying number + up/down */}
      {/* add displaying current clue? */}

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="guessWordInputField">guess word:</label>
        <input className= {`menu-input ${usersTeam} ${wordGuessed ? 'inactive' : ''}`} type="text" id="guessWordInputField" value={word} onChange={handleWordChange}/>
        <button className= {`enter-button ${usersTeam} ${wordGuessed ? 'hide' : ''}`} onClick={handleWordEnter} >{'>'}</button>
      </div>

      <OptionsMenu currentScreenLabel={"guess word"}/>
    </div>
  )
}

export default GuessWordMenu