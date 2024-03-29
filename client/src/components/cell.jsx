import React, { useContext, useEffect, useState } from 'react'
//import { GameContext } from '../game_context'
import { gridCellSizeContext } from './GameBoard'

function Cell() {

  const { cellSize } = useContext(gridCellSizeContext);

  let index = 0;
  let letter = 'A';

  const getIndexTextStyle = (size) => {
    const fontSize = size / 2.7;
    return {
      fontSize: `${fontSize}px`,
    };
  };
  
  const getLetterTextStyle = (size) => {
    const fontSize = size / 1.3;
    return {
      fontSize: `${fontSize}px`,
    };
  };

  const getCellSize = (size) => {
    return {
      height: `${size}px`,
      width: `${size}px`,
    };
  };

  return (
    <div>
      <button className='cell team1 guessed' style={getCellSize(cellSize)}> 
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
