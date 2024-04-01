import React, { useContext, useEffect, useState } from 'react'
import {UsersContext } from '../App';

function Cell() {

  const NUM_GRID_CELLS = getComputedStyle(document.documentElement).getPropertyValue('--num-grid-cells');

  const { usersTeam } = useContext(UsersContext);

  const [letter, setLetter] = useState('A');
  const [index, setIndex] = useState(1);
  const [owner, setOwner] = useState('');
  const [state, setState] = useState('');

  const [cellSize, setCellSize] = useState(() => {
    const gridContainerSize = Math.max(250, document.documentElement.clientHeight * 0.4);
    return (gridContainerSize / NUM_GRID_CELLS);
  });


  useEffect(() => {  
    const handleResize = () => {
        const gridContainerSize = Math.max(250, document.documentElement.clientHeight * 0.4);
        let size = Math.floor(gridContainerSize / NUM_GRID_CELLS);
        setCellSize(size);
    };
  
    handleResize();
  
    window.addEventListener('resize', handleResize);
  
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [letter, index, owner, state]);

  const getIndexTextStyle = (size) => {
    const fontSize = size / 2;
    return {
      fontSize: `${fontSize}px`,
    };
  };
  
  const getLetterTextStyle = (size) => {
    const fontSize = size / 1.2;
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
      <button className={`cell empty ${usersTeam}`} style={getCellSize(cellSize)}> 
        <span className="index" style={{ ...getIndexTextStyle(cellSize)}}>{index}</span>
        <span className="letter" style={{ ...getLetterTextStyle(cellSize)}}>{letter}</span>
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


        // const cellBorderWidth = parseInt(getComputedStyle(document.querySelector('.cell')).getPropertyValue('border-width').replace('px', ''));
        // const cellElement = document.querySelector('.cell');
        // const cellWidth = cellElement.clientWidth;
        // const cellHeight = cellElement.clientHeight;
        // const gridElement = document.querySelector('.grid');
        // const gridWidth = gridElement.clientWidth;
        // const gridHeight = gridElement.clientHeight;
        // const gridContainer = document.querySelector('.grid-container');
        // const gridContainerWidth = gridContainer.clientWidth;
        // const gridContainerHeight = gridContainer.clientHeight;
        // const cellContainer = document.querySelector('.cell-container');
        // // const cellContainerWidth = cellContainer.clientWidth;
        // // const cellContainerHeight = cellContainer.clientHeight;

        // cellElement.style.width = `${size}px`;
        // cellElement.style.height = `${size}px`;
        // if (cellWidth !== cellHeight) {
        //   console.warn(`Cell width (${cellWidth}px) is not equal to cell height (${cellHeight}px).`);
        // }
        // console.log('cellWidth', cellWidth, 'cellHeight', cellHeight);
        // console.log('gridWidth', gridWidth, 'gridHeight', gridHeight);
        // console.log('gridContainerWidth', gridContainerWidth, 'gridContainerHeight', gridContainerHeight);
        // // console.log('cellContainerWidth', cellContainerWidth, 'cellContainerHeight', cellContainerHeight);
        // console.log('cellSize', size);