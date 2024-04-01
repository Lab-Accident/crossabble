import React, { useContext } from 'react'; 
import {UsersContext } from '../App';
import { WordData, PublicWord } from './Word';

function ClueList() {
  const { usersTeam } = useContext(UsersContext);

  const clues = [
    new WordData({ clue: 'Find the key to unlock the secret door', team: 'T1', row: 0, col: 0, num: 1, down: false, length: 4 }),
    new WordData({ clue: 'Unlock the door with the golden key', team: 'T1', row: 0, col: 0, num: 2, down: true, length: 3 }),
    new WordData({ clue: 'Open the chest and discover the hidden treasure', team: 'T2', num: 4, row: 0, col: 0, down: false, length: 7 }),
    new WordData({ clue: 'Solve the puzzle to reveal the ancient artifact', team: 'T1', num: 6, row: 0, col: 0, down: true, length: 5 }),
    new WordData({ clue: 'Discover the secret chamber deep within the dungeon', team: 'T2', num: 9, row: 0, col: 0, down: false, length: 4 }),
];

  return (
    <>
    <h1 className={`clue-title ${usersTeam}`}>Clues:</h1>
    <ol className='cluelist'>
      {clues.map((clue, index) => (
        <li num={clue.num} key={clue.num} className={clue.team}>
          {clue.clue}
        </li>
      ))}
    </ol>
    </>
  )
}

export default ClueList