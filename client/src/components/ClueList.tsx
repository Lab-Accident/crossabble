import { useContext } from 'react'; 
import {UsersContext } from '../App';
import { WordData, PublicWord } from './Word.ts';
import { PublicGridContext } from '../App.tsx';

function ClueList() {
  const { usersTeam } = useContext(UsersContext);
  const { unguessedWords } = useContext(PublicGridContext);

  return (
    <>
    <h1 className={`clue-title ${usersTeam}`}>
      Clues:
    </h1>
    <ol className='cluelist'>
      {unguessedWords.map((clue) => (
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