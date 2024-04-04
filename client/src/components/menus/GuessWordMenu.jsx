import React, { useEffect,useState, useContext } from 'react';
import OptionsMenu from './OptionsMenu'
import { UsersContext } from '../../App';
import { PublicGridContext } from '../../App';
import { CurrentSelectionContext } from '../../App';

function GuessWordMenu() {

  const [wordGuessed, setWordGuessed] = useState(false);
  const [word, setWord] = useState('');
  const [wordLocText, setWordLocText] = useState('');
  const [selectedWord, setSelectedWord] = useState(0);

  const { currentSelection, setCurrentSelection } = useContext(CurrentSelectionContext);
  const { usersTeam } = useContext(UsersContext);
  const { publicGrid, unguessedWords } = useContext(PublicGridContext);

  const handleWordChange = (event) => {
    let input = event.target.value;
    input = input.replace(/[^A-Za-z]/ig, '');
    input = input.toUpperCase();
    setWord(input);
  };

  const handleWordEnter = () => {
    setWordGuessed(true);
  };

  const getCellsFromWord = (word) => {
    let cells = [];
        let length = word.length;
        let down = word.down;

        for (let i = 0; i < length; i++) {
          if (down) {
            cells.push({row: word.row + i, col: word.col});
          } else {
            cells.push({row: word.row, col: word.col + i});
          }
        }
        return cells;
  }


  function findWordByClueNum(num) {
    const word = unguessedWords.find(word => word.num === num);
    if (!word) {
      console.warn(`WordData with clue number ${num} not found.`);
      return 0;
    }
    return word;
  }

  useEffect(() => {
    if (currentSelection.length === 0) {
      setSelectedWord(0);
      return;
    }
    const { row, col } = currentSelection[0];
    let wordNum = publicGrid.getNum(row, col);
    let word = findWordByClueNum(wordNum);
    setSelectedWord(word);
  }, [currentSelection]);


  const handleSelectionChangeLeft = () => {
    if (selectedWord === 0) {
      setSelectedWord(unguessedWords[0])
      setCurrentSelection(getCellsFromWord(unguessedWords[0]));
      return;
    }
    const index = unguessedWords.findIndex(word => word.num === selectedWord.num);
    if (index === -1) {
      setSelectedWord(unguessedWords[0]);
      setCurrentSelection(getCellsFromWord(unguessedWords[0]));
      return;
    }
    const next = (index - 1 + unguessedWords.length) % unguessedWords.length;
    setSelectedWord(unguessedWords[next]);
    setCurrentSelection(getCellsFromWord(unguessedWords[next]));
  }

  const handleSelectionChangeRight = () => {
    if (selectedWord === 0) {
      setSelectedWord(unguessedWords[0]);
      setCurrentSelection(unguessedWords[0]);
      return;
    }
    const index = unguessedWords.findIndex(word => word.num === selectedWord.num);
    if (index === -1) {
      setSelectedWord(unguessedWords[0]);
      setCurrentSelection(getCellsFromWord(unguessedWords[0]));
      return;
    }
    const next = (index + 1) % unguessedWords.length;
    setSelectedWord(unguessedWords[next]);
    setCurrentSelection(getCellsFromWord(unguessedWords[next]));
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
        <div className= {`side-button ${usersTeam}`} onClick={handleSelectionChangeLeft} >{'<'}</div>
        <div className={`curr-nav-display ${usersTeam}`}>
          {selectedWord !== 0 && `${selectedWord.num} ${selectedWord.down ? 'Down' : 'Across'}`}
        </div>
        <div className= {`side-button ${usersTeam}`} onClick={handleSelectionChangeRight} >{'>'}</div>
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
