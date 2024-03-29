import React, { useContext } from 'react'; 
import { CurrentMenuContext } from '../../App';

class Options {
  constructor(label, operation) {
    this.label = label;
    this.operation = operation;
  }

  static guessWordFunction(setCurrentMenu) {
    setCurrentMenu('guess word');
  }
  
  static skipFunction(setCurrentMenu) {
    setCurrentMenu('inactive');
  }
  
  static buyNewWordFunction(setCurrentMenu) {
    setCurrentMenu('buy word');
  }
  
  static buyLetterFunction(setCurrentMenu) {
    setCurrentMenu('buy letter');
  }
  
  static playWordFunction(setCurrentMenu) {
    setCurrentMenu('play word');
  }

  static guessWord = new Options('guess word', Options.guessWordFunction);
  static skip = new Options('skip', Options.skipFunction);
  static buyNewWord = new Options('buy new word', Options.buyNewWordFunction);
  static buyLetter = new Options('buy letter', Options.buyLetterFunction);
  static playWord = new Options('play word', Options.playWordFunction);
}


function OptionsMenu({ currentScreenLabel }) {

  let usersTeam = 'T2';
  const { setCurrentMenu } = useContext(CurrentMenuContext);
  
  const allOptions = [
    Options.guessWord,
    Options.skip,
    Options.buyNewWord,
    Options.buyLetter,
    Options.playWord
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
                onClick={option.operation(setCurrentMenu)}>
                  {option.label}
              </button>
          ))}
        <button className={`full-width-button ${usersTeam}`}>back</button>
      </div>
    </div>
  )
}

export default OptionsMenu