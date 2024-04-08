import React, { useContext } from 'react'; 
import { CurrentMenuContext } from '../../App';
import {UsersContext } from '../../App';

function OptionsMenu({ currentScreenLabel }) {

  const { usersTeam } = useContext(UsersContext);
  const { setCurrentMenu } = useContext(CurrentMenuContext);
  
  const guessWordFunction = () => {
    setCurrentMenu('guess-word');
  }
  
  const skipFunction = () => {
    setCurrentMenu('inactive');
  }
  
  const buyNewWordFunction = () => {
    setCurrentMenu('buy-word');
  }
  
  const buyLetterFunction = () => {
    setCurrentMenu('buy-letter');
  }
  
  const playWordFunction = () => {
    setCurrentMenu('play-word');
  }

  const allOptions = [
    {label: 'play-word', operation: playWordFunction},
    {label: 'guess-word', operation: guessWordFunction},
    {label: 'skip', operation: skipFunction},
    {label: 'buy-word', operation: buyNewWordFunction},
    {label: 'buy-letter', operation: buyLetterFunction},
  ];
  
  return (
    <div className='menu-container'>
      <div className="options-menu">
      {allOptions
            .filter(option => option.label !== currentScreenLabel)
            .map((option, index) => (
              <button 
                key={index} 
                className={`half-button ${usersTeam}`}
                onClick={option.operation}>
                  {option.label}
              </button>
          ))}
        <button 
          className={`full-width-button ${usersTeam}`}>
            back
        </button>
      </div>
    </div>
  )
}

export default OptionsMenu