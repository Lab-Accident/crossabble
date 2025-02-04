import { useEffect, useState, useRef } from 'react';
import OptionsMenu from './OptionsMenu'

import useUserGridStore from '../../stores/UserGridStore';
import useUserWordsStore from '../../stores/UserWordStore';
import useSessionStore from '../../stores/SessionStore';

function GuessWordMenu() {

  const [wordGuessed, setWordGuessed] = useState(false);
  const [guess, setGuess] = useState('');

  const usersTeam = useSessionStore((state) => state.currentSession?.playerPosition?.slice(0, 2));

  const userGrid = useUserGridStore();
  const userWords = useUserWordsStore();

  const selectedWord = userWords.currSelectedWord;
  const inputRef = useRef(null);


  const handleGuessChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedWord) {
      return;
    }
    let input = event.target.value;
    input = input.replace(/[^A-Za-z]/ig, '');
    input = input.toUpperCase();
    input = input.slice(0, selectedWord.length);

    for (let i = 0; i < input.length; i++) {
      let curr = selectedWord.down 
      ? { row: selectedWord.position.row + i, col: selectedWord.position.col} 
      : { row: selectedWord.position.row, col: selectedWord.position.col + i};

      userGrid.setLetter(curr.row, curr.col, input[i]);
    }
    
    for (let i = input.length; i < selectedWord.length; i++) {
      let curr = selectedWord.down 
      ? { row: selectedWord.position.row + i, col: selectedWord.position.col} 
      : { row: selectedWord.position.row, col: selectedWord.position.col + i};

      userGrid.setLetter(curr.row, curr.col, '');
  }
  setGuess(input);
  };

  const handleWordEnter = () => {
    setWordGuessed(true);
  };


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          userWords.selectPrevUnguessedWord();
          event.preventDefault();
          break;
        case 'ArrowRight':
          userWords.selectNextUnguessedWord();
          event.preventDefault();
          break;
        default:
          return; 
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedWord]);



  return (
    <div className='menu-container'>

    <div className={`clue-display  ${usersTeam}`}> 
      {selectedWord ? selectedWord.clue : 'No word selected, please select a word!'}
    </div>

      <div className='word-nav-bar'>
        <div 
          className= {`side-button ${usersTeam}`} 
          onClick={userWords.selectNextUnguessedWord} >
            {'<'}
        </div>
        <div 
          className={`curr-nav-display ${usersTeam}`}>
            {selectedWord && `${selectedWord.number} ${selectedWord.down ? 'Down' : 'Across'}`}
        </div>
        <div 
          className= {`side-button ${usersTeam}`} 
          onClick={userWords.selectPrevUnguessedWord} >
            {'>'}
        </div>
      </div>

      <div className="input-container">
        <label className= {`menu-input ${usersTeam}`} htmlFor="guessWordInputField">
          {wordGuessed ? 'Guessed:' : 'Guess Word:'}
        </label>
        <input 
          className= {`menu-input ${usersTeam} ${wordGuessed ? 'inactive' : ''}`} 
          type="text" 
          id="guessWordInputField"
          ref={inputRef}
          autoFocus
          autoComplete="off"
          value={guess} 
          onChange={handleGuessChange}
        />
        <button 
          className= {`enter-button ${usersTeam} ${wordGuessed ? 'hide' : ''}`} 
          onClick={handleWordEnter} >
            {'>'}
        </button>
      </div>


      <OptionsMenu currentMenu={"guess-word"}/>
    </div>
  )
}

export default GuessWordMenu



  // useEffect(() => {
  //   const mapUnguessedWordsToCells = () => {
  //     return unguessedWords.map(word => {
  //       let cells = [];
  //       let length = word.length;
  //       let down = word.down;
  //       for (let i = 0; i < length; i++) {
  //         if (down) {
  //           cells.push({row: word.row + i, col: word.col});
  //         } else {
  //           cells.push({row: word.row, col: word.col + i});
  //         }
  //       }
  //       return {num: word.num, down: word.down, cells: cells};
  //     });
  //   }

  //   let unguessedWordsMappedToCells = mapUnguessedWordsToCells();
  //   unguessedWordsMappedToCells.sort((a, b) => a.num - b.num);

  //   // TODO: Change to update the map with out remaking it when word added or removed
  // }, [unguessedWords]);
