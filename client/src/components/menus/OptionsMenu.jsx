import React, { useContext } from 'react'; 
import { CurrentMenuContext } from '../../App';

// class Options {
//   constructor(label, operation) {
//     this.label = label;
//     this.operation = operation;
//   }

//   static guessWordFunction(setCurrentMenu) {
//     setCurrentMenu('guess word');
//   }
  
//   static skipFunction(setCurrentMenu) {
//     setCurrentMenu('inactive');
//   }
  
//   static buyNewWordFunction(setCurrentMenu) {
//     setCurrentMenu('buy word');
//   }
  
//   static buyLetterFunction(setCurrentMenu) {
//     setCurrentMenu('buy letter');
//   }
  
//   static playWordFunction(setCurrentMenu) {
//     setCurrentMenu('play word');
//   }

//   static guessWord = new Options('guess word', Options.guessWordFunction);
//   static skip = new Options('skip', Options.skipFunction);
//   static buyNewWord = new Options('buy new word', Options.buyNewWordFunction);
//   static buyLetter = new Options('buy letter', Options.buyLetterFunction);
//   static playWord = new Options('play word', Options.playWordFunction);
// }


function OptionsMenu({ currentScreenLabel }) {

  let usersTeam = 'T2';
  const { setCurrentMenu } = useContext(CurrentMenuContext);
  
  const guessWordFunction = () => {
    console.log('button1-clicked');
    setCurrentMenu('guess word');
  }
  
  const skipFunction = () => {
    console.log('button2-clicked');
    setCurrentMenu('inactive');
  }
  
  const buyNewWordFunction = () => {
    console.log('button3-clicked');
    setCurrentMenu('buy word');
  }
  
  const buyLetterFunction = () => {
    console.log('button4-clicked');
    setCurrentMenu('buy letter');
  }
  
  const playWordFunction = () => {
    console.log('button5-clicked');
    setCurrentMenu('play word');
  }

  const allOptions = [
    {label: 'play word', operation: playWordFunction},
    {label: 'guess word', operation: guessWordFunction},
    {label: 'skip', operation: skipFunction},
    {label: 'buy word', operation: buyNewWordFunction},
    {label: 'buy letter', operation: buyLetterFunction},
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
        <button className={`full-width-button ${usersTeam}`}>back</button>
      </div>
    </div>
  )
}

export default OptionsMenu