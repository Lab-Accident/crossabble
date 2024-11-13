import { useEffect, useState, useContext, useRef } from 'react';
import OptionsMenu from './OptionsMenu'
import { UsersContext } from '../../App.tsx';
import { PublicGridContext } from '../../App.tsx';
import { CurrentSelectionContext } from '../../App.tsx';

function GuessWordMenu() {

  const [wordGuessed, setWordGuessed] = useState(false);
  const [word, setWord] = useState('');
  const [selectedWord, setSelectedWord] = useState(0);

  const { currentSelection, setCurrentSelection } = useContext(CurrentSelectionContext);
  const { usersTeam } = useContext(UsersContext);
  const { publicGrid, unguessedWords } = useContext(PublicGridContext);

  const inputRef = useRef(null);

  useEffect(() => {
    setCurrentSelection([]);
  }, []);

  function getCellElement(row, col) {
    const accessKey = `row${row}-col${col}`; 
    const cellComponent = document.querySelector(`.cell[accessKey="${accessKey}"]`);
    if (!cellComponent) {
        console.warn('Cell component not found for access key', accessKey);
        return null;
    }
    return cellComponent;
}

  function getCellLetter(cellElement) {
    if (!cellElement) {
      console.warn('Cell element not found');
      return null;
    }
    return cellElement.querySelector('.letter');
  }

  const handleWordChange = (event) => {
    if (selectedWord === 0) {
      return;
    }
    let input = event.target.value;
    input = input.replace(/[^A-Za-z]/ig, '');
    input = input.toUpperCase();
    input = input.slice(0, selectedWord.length);

    for (let i = 0; i < input.length; i++) {
      let curr = selectedWord.down 
      ? { row: selectedWord.row + i, col: selectedWord.col} 
      : { row: selectedWord.row, col: selectedWord.col + i};

      const cellElement = getCellElement(curr.row, curr.col);
      const letterElement = getCellLetter(cellElement);
      letterElement.textContent = input[i];
    }
    
    for (let i = input.length; i < selectedWord.length; i++) {
      let curr = selectedWord.down 
      ? { row: selectedWord.row + i, col: selectedWord.col} 
      : { row: selectedWord.row, col: selectedWord.col + i};

      const cellElement = getCellElement(curr.row, curr.col);
      const letterElement = getCellLetter(cellElement);
      letterElement.textContent = '';
  }
  setWord(input);
  };

  const handleWordEnter = () => {
    setWordGuessed(true);
  };


  function switchSelectedWord(newWord) {
    const oldWord = selectedWord;
    setSelectedWord(newWord);
    if (oldWord === 0 || oldWord.num === newWord.num) {
      return;
    }
    for (let i = 0; i < oldWord.length; i++) {
      let curr = oldWord.down
        ? { row: oldWord.row + i, col: oldWord.col }
        : { row: oldWord.row, col: oldWord.col + i };

      const cellElement = getCellElement(curr.row, curr.col);
      const letterElement = getCellLetter(cellElement);
      letterElement.textContent = '';
    }
    setWord('');
  }


  useEffect(() => {
    if (currentSelection.length === 0) {
      setSelectedWord(0);
      return;
    }
    if (!wordGuessed) {
      inputRef.current.focus();
    }
    const { row, col } = currentSelection[0];
    const num = publicGrid.getNum(row, col);
    const word = findWord(num, unguessedWords);
    switchSelectedWord(word);
  }, [currentSelection]);



  function findWord(num, list) {
    const word = list.find(word => word.num === num);
    if (!word) {
    console.warn(`WordData with clue number ${num} not found.`);
    return 0;
    }
    return word;
  }

  function findWordIndex(num, list) {
      const index = list.findIndex(word => word.num === num);
      if (!index) {
      console.warn(`WordData with clue number ${num} not found.`);
      return 0;
      }
      return index;
  }

  const handleSelectionChangeLeft = () => {
    if (selectedWord === 0) {
      setCurrentSelection(unguessedWords[0].getCellsFromWord());
      switchSelectedWord(unguessedWords[0]);
      return;
    }
    const index = findWordIndex(selectedWord.num, unguessedWords);
    if (index === -1) {
      setCurrentSelection(unguessedWords[0].getCellsFromWord());
      switchSelectedWord(unguessedWords[0]);
      return;
    }
    const next = (index - 1 + unguessedWords.length) % unguessedWords.length;
    setCurrentSelection(unguessedWords[next].getCellsFromWord());
    switchSelectedWord(unguessedWords[next]);
  }

  const handleSelectionChangeRight = () => {
    if (selectedWord === 0) {
      setCurrentSelection(unguessedWords[0]);
      switchSelectedWord(unguessedWords[0]);
      return;
    }
    const index = findWordIndex(selectedWord.num, unguessedWords);
    if (index === -1) {
      setCurrentSelection(unguessedWords[0].getCellsFromWord());
      switchSelectedWord(unguessedWords[0]);
      return;
    }
    const next = (index + 1) % unguessedWords.length;
    setCurrentSelection(unguessedWords[next].getCellsFromWord());
    switchSelectedWord(unguessedWords[next]);
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      const ARROW_LEFT = 37;
      const ARROW_RIGHT = 39;

      switch (event.keyCode) {
        case ARROW_LEFT:
          handleSelectionChangeLeft();
          event.preventDefault();
          break;
        case ARROW_RIGHT:
          handleSelectionChangeRight();
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
      {selectedWord !== 0 ? selectedWord.clue : 'No word selected, please select a word!'}
    </div>

      <div className='word-nav-bar'>
        <div 
          className= {`side-button ${usersTeam}`} 
          onClick={handleSelectionChangeLeft} >
            {'<'}
        </div>
        <div 
          className={`curr-nav-display ${usersTeam}`}>
            {selectedWord !== 0 && `${selectedWord.num} ${selectedWord.down ? 'Down' : 'Across'}`}
        </div>
        <div 
          className= {`side-button ${usersTeam}`} 
          onClick={handleSelectionChangeRight} >
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
          value={word} 
          onChange={handleWordChange}
        />
        <button 
          className= {`enter-button ${usersTeam} ${wordGuessed ? 'hide' : ''}`} 
          onClick={handleWordEnter} >
            {'>'}
        </button>
      </div>


      <OptionsMenu currentScreenLabel={"guess-word"}/>
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
