import React, { useContext } from 'react'; 
import {UsersContext } from '../App';
import { WordData, PublicWord } from './Word';
import { PublicGridContext } from '../App';

function ClueList() {
  const { usersTeam } = useContext(UsersContext);
  const { unguessedWords } = useContext(PublicGridContext);

  return (
    <>
    <h1 className={`clue-title ${usersTeam}`}>
      Clues:
    </h1>
    <ol className='cluelist'>
      {unguessedWords.map((clue, index) => (
        <li 
          num={clue.num} 
          key={clue.num} 
          className={clue.team}>
            {clue.clue}
        </li>
      ))}
    </ol>
    </>
  )
}

export default ClueList