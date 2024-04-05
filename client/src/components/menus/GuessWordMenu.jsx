import React, { useEffect,useState, useContext } from 'react';
import OptionsMenu from './OptionsMenu'
import { UsersContext } from '../../App';
import { PublicGridContext } from '../../App';
import { CurrentSelectionContext } from '../../App';

function GuessWordMenu() {

  const [wordGuessed, setWordGuessed] = useState(false);
  const [word, setWord] = useState('');
  const [selectedWord, setSelectedWord] = useState(0);

  const { currentSelection, setCurrentSelection } = useContext(CurrentSelectionContext);
  const { usersTeam } = useContext(UsersContext);
  const { publicGrid, setPublicGrid, unguessedWords } = useContext(PublicGridContext);

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

  const cellToIndex = (row, col) => {
    return row * NUM_GRID_CELLS + col;
  }

  function getCellElement(row, col) {
    const n = cellToIndex(row, col);
    const cellContainer = document.documentElement.querySelector(`.cell-container:nth-child(${n + 1})`);
    if (!cellContainer) {
      console.error('Cell container not found at index', n);
      return null;
    }

    const cellComponent = cellContainer.querySelector('.cell');
    if (!cellComponent) {
      console.error('Cell component not found inside the cell container.');
      return null;
    }
    return cellComponent;
  }

  function getCellLetter(row, col) {
    const cellElement = getCellElement(row, col);
    if (!cellElement) {
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
    if (input.length > selectedWord.length) {
      input = input.slice(0, selectedWord.length);
    }
  
    for (let i = 0; i < input.length; i++) {
      console.log('selectedWord', selectedWord);
      console.log('selectedWord.row', selectedWord.row, 'selectedWord.col', selectedWord.col);
      console.log('selectedWord.down', selectedWord.down);
      console.log('test', cellToIndex(2,0));
      console.log('index', cellToIndex(selectedWord.row, selectedWord.col));
      if (selectedWord.down) {
        const letterElement = getCellLetter(selectedWord.row + i, selectedWord.col);
        console.log('down', selectedWord.row + i, selectedWord.col);
        console.log('index', cellToIndex(selectedWord.row + i, selectedWord.col));
        letterElement.textContent = input[i];
      } else {
        const letterElement = getCellLetter(selectedWord.col + i, selectedWord.col);
        console.log('across', selectedWord.row, selectedWord.col + i);
        console.log('index', cellToIndex(selectedWord.row, selectedWord.col + 1));
        letterElement.textContent = input[i];
      }
    }
    for (let i = input.length; i < selectedWord.length; i++) {
      if (selectedWord.down) {
        const letterElement = getCellLetter(selectedWord.row + i, selectedWord.col);
        letterElement.textContent = '';
      } else {
        const letterElement = getCellLetter(selectedWord.col + i, selectedWord.col);
        letterElement.textContent = '';
      }
    }
    setWord(input);
  };
  //clear cells, when  selection is changed


  useEffect(() => {
    console.log('selectedWord', selectedWord);
  }, [selectedWord]);

  const handleWordEnter = () => {
    setWordGuessed(true);
  };

  useEffect(() => {
    if (currentSelection.length === 0) {
      setSelectedWord(0);
      return;
    }
    const { row, col } = currentSelection[0];
    let num = publicGrid.getNum(row, col);
    let word = findWord(num, unguessedWords);
    setSelectedWord(word);
    // if different selection rather than added remove cell from previous selection
    // setWord('');
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
      setSelectedWord(unguessedWords[0])
      setCurrentSelection(unguessedWords[0].getCellsFromWord());
      setWord('');
      return;
    }
    const index = findWordIndex(selectedWord.num, unguessedWords);
    if (index === -1) {
      setSelectedWord(unguessedWords[0]);
      setCurrentSelection(unguessedWords[0].getCellsFromWord());
      setWord('');
      return;
    }
    const next = (index - 1 + unguessedWords.length) % unguessedWords.length;
    setSelectedWord(unguessedWords[next]);
    setCurrentSelection(unguessedWords[next].getCellsFromWord());
    setWord('');
  }

  const handleSelectionChangeRight = () => {
    if (selectedWord === 0) {
      setSelectedWord(unguessedWords[0]);
      setCurrentSelection(unguessedWords[0]);
      setWord('');
      return;
    }
    const index = findWordIndex(selectedWord.num, unguessedWords);
    if (index === -1) {
      setSelectedWord(unguessedWords[0]);
      setCurrentSelection(unguessedWords[0].getCellsFromWord());
      setWord('');
      return;
    }
    const next = (index + 1) % unguessedWords.length;
    setSelectedWord(unguessedWords[next]);
    setCurrentSelection(unguessedWords[next].getCellsFromWord());
    setWord('');
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
