import useSessionStore from '../stores/SessionStore';
import useUserWordsStore from '../stores/UserWordStore';

function ClueList() {
  const words = useUserWordsStore((state) => state.words);
  const usersTeam = useSessionStore((state) => state.currentSession?.playerPosition?.slice(0, 2));

  const unguessedWords = words.filter(word => !word.revealed);

  if (!usersTeam) {
    return null;
  }


  return (
    <>
    <h1 className={`clue-title ${usersTeam}`}>
      Clues:
    </h1>
    <ol className='cluelist'>
      {unguessedWords.map((clue) => (
        <li 
          data-num={clue.number}
          key={clue.number} 
          className={clue.playedBy.startsWith('T1') ? 'team1' : 'team2'}>
            {clue.clue}
        </li>
      ))}
    </ol>
    </>
  )
}

export default ClueList