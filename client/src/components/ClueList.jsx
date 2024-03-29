import React, { useContext } from 'react'; 
import {UsersContext } from '../App';

function ClueList() {
  const { usersTeam } = useContext(UsersContext);

  const clues = [
    { text: 'Find the key to unlock the secret door', team: 'T1', xloc: 0, yloc: 0, num: 1, down: false, length: 4},
    { text: 'Unlock the door with the golden key', team: 'T1', xloc: 0, yloc: 0, num: 2, down: true, length: 3},
    { text: 'Open the chest and discover the hidden treasure', team: 'T2', num: 4, xloc: 0, yloc: 0, down: false, length: 7},
    { text: 'Solve the puzzle to reveal the ancient artifact', team: 'T1', num: 6, xloc: 0, yloc: 0, down: true, length: 5},
    { text: 'Discover the secret chamber deep within the dungeon', team: 'T2', num: 9, xloc: 0, yloc: 0, down: false, length: 4},
  ];

  return (
    <>
    <h1 className={`clue-title ${usersTeam}`}>Clues:</h1>
    <ol className='cluelist'>
      {clues.map((clue, index) => (
        <li num={clue.num} key={clue.num} className={clue.team}>
          {clue.text}
        </li>
      ))}
    </ol>
    </>
  )
}

export default ClueList