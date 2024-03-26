import React, { useContext, useEffect, useState } from 'react'
//import { GameContext } from '../game_context'

function Cell() {

  const [cellSize, setCellSize] = useState(0);

  let index = 0;
  let letter = 'A';

  useEffect(() => {
    const updateCellSize = () => {
      const cell = document.querySelector('.cell');
      if (cell) {
        setCellSize(cell.offsetHeight);
      }
    };
    updateCellSize();

    window.addEventListener('resize', updateCellSize);

    return () => {
      window.removeEventListener('resize', updateCellSize);
    };
  }, []);

  const getIndexTextStyle = (size) => {
    const fontSize = size / 3;
    return {
      fontSize: `${fontSize}px`,
    };
  };
  
  const getLetterTextStyle = (size) => {
    const fontSize = size / 1.1;
    return {
      fontSize: `${fontSize}px`,
    };
  };

  return (
    <div>
      <button className='cell team2 empty'> 
        <span className="index" style={getIndexTextStyle(cellSize)} >{index}</span>
        <span className="letter" style={getLetterTextStyle(cellSize)}>{letter}</span>
      </button>
    </div>
  )
}

export default Cell



  // const [letter, setLetter] = useState('')
  // const [index, setIndex] = useState('')
  // const [owner, setOwner] = useState('')
  // const [block, setBlock] = useState(False)
  // const [selected, setSelected] = useState(False)

  // let game_state = useContext(GameContext)

  // function handleSelect(player) {
  //   setSelected(!selected)
  //   // change outline color of cell to players color and increase width
  // }

  // function handleletterChange(event) {
  //   setLetter(event.target.value)
  //   // this will be more complicated cause we will just get one letter from the input box
  // }

  // function handleAddIndex() {

  // }

  // function handleRemoveIndex() {

  // }

  // function handleAddTemporaryBlock() {

  // }

  // function handleRemoveTemporaryBlock() {

  // }

  // function handleAddPermanantBlock() {

  // }
