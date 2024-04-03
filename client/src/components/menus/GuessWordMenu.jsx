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

  const { setCurrentSelection } = useContext(CurrentSelectionContext);
  const { usersTeam } = useContext(UsersContext);
  const { unguessedWords } = useContext(PublicGridContext);

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

  useEffect(() => {
    if (selectedWord === 0) {
        setWordLocText('');
        setCurrentSelection([]);
    } else {
        const direction = selectedWord.down ? 'Down' : 'Across';
        setWordLocText(`${selectedWord.num} ${direction} `);
        setCurrentSelection(getCellsFromWord(selectedWord));
    }
  }, [selectedWord]);

  const handleSelectionChangeLeft = () => {
    console.log('test', selectedWord)
    if (selectedWord === 0) {
      setSelectedWord(unguessedWords[0])
      return;
    }
    const index = unguessedWords.findIndex(word => word === selectedWord);
    console.log(unguessedWords)
    console.log(index)
    if (index === -1) {
      setSelectedWord(unguessedWords[0]);
      return;
    }
    const next = (index - 1 + unguessedWords.length) % unguessedWords.length;
    setSelectedWord(unguessedWords[next]);
  }

  const handleSelectionChangeRight = () => {
    if (selectedWord === 0) {
      setSelectedWord(unguessedWords[0])
      return;
    }
    const index = unguessedWords.findIndex(word => word === selectedWord);
    if (index === -1) {
      setSelectedWord(unguessedWords[0]);
      return;
    }
    const next = index + 1 % unguessedWords.length;
    setSelectedWord(unguessedWords[next]);
  }


  return (
    <div className='menu-container'>

    <div className={`clue-display  ${usersTeam}`}> 
      {selectedWord !== 0 ? selectedWord.clue : 'No word selected, please select a word!'}
    </div>

      <div className='word-nav-bar'>
        <div className= {`side-button ${usersTeam}`} onClick={handleSelectionChangeLeft} >{'<'}</div>
        <div className= {`curr-nav-display ${usersTeam}`} >{wordLocText}</div>
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
