import React, { useContext, useEffect, useState } from 'react'
//import { GameContext } from '../game_context'
import { gridCellSizeContext } from './GameBoard'
import {UsersContext } from '../App';

function Cell() {

  const { cellSize } = useContext(gridCellSizeContext);
  const { usersTeam } = useContext(UsersContext);
  const [letter, setLetter] = useState('');
  const [index, setIndex] = useState('');
  const [owner, setOwner] = useState('');
  const [state, setState] = useState('');


  // let index = 0;
  // let letter = 'A';

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
      <button className={`cell unguessed team2 ${usersTeam}`} style={getCellSize(cellSize)}> 
        <span className="index" style={getIndexTextStyle(cellSize)} >{}</span>
        <span className="letter" style={getLetterTextStyle(cellSize)}>{}</span>
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
