import React from 'react'

function OptionsMenu({ currentScreenLabel }) {

  let usersTeam = 'T2';
  const allOptions = [
    { label: 'guess word', function: guessWordFunction },
    { label: 'skip', function: skipFunction },
    { label: 'buy new word', function: buyNewWordFunction },
    { label: 'buy letter', function: buyLetterFunction },
    { label: 'play word', function: playWordFunction }
  ];

  function guessWordFunction() {
    console.log("Guessing word...");
  }
  
  function skipFunction() {
    console.log("Skipping...");
  }
  
  function buyNewWordFunction() {
    console.log("Buying new word...");
  }
  
  function buyLetterFunction() {
    console.log("Buying letter...");
  }
  
  function playWordFunction() {
    console.log("Playing word...");
  }

  return (
    <div className='menu-container'>
      <div className="options-menu">
      {allOptions
            .filter(option => option.label !== currentScreenLabel)
            .map((option, index) => (
              <button 
                key={index} 
                className={`half-button ${usersTeam}`}
                onClick={option.function}>
                  {option.label}
              </button>
          ))}
        <button className={`full-width-button ${usersTeam}`}>back</button>
      </div>
    </div>
  )
}

export default OptionsMenu