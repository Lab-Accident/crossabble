import React, { useContext, useState } from 'react'
import { GameContext } from '../game_context'

function cell() {

  const [letter, setLetter] = useState('')
  const [index, setIndex] = useState('')
  const [owner, setOwner] = useState('')
  const [block, setBlock] = useState(False)
  const [selected, setSelected] = useState(False)

  let game_state = useContext(GameContext)

  function handleSelect(player) {
    setSelected(!selected)
    // change outline color of cell to players color and increase width
  }

  function handleletterChange(event) {
    setLetter(event.target.value)
    // this will be more complicated cause we will just get one letter from the input box
  }

  function handleAddIndex() {

  }

  function handleRemoveIndex() {

  }

  function handleAddTemporaryBlock() {

  }

  function handleRemoveTemporaryBlock() {

  }

  function handleAddPermanantBlock() {

  }

  return (
    <div>
      <button
          className='Cell'
          onClick={() => handleSelect(game_state.current_player)}>
          {letter}
      </button>
    </div>
  )
}

export default cell