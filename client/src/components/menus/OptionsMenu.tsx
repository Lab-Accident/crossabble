import useGameStore from '../../stores/GamePlayStore.ts';
import { getCurrentTeam } from '../../hooks/useSocket';

function OptionsMenu({  currentMenu }: { currentMenu: string }) {

  const usersTeam = getCurrentTeam();
  const setMenu = useGameStore((state) => state.setMenu);

  const allOptions = [
    {label: 'play-word', operation: () => { setMenu('play-word'); }},
    {label: 'guess-word', operation: () => { setMenu('guess-word'); }},
    {label: 'skip', operation: () => { setMenu('inactive'); }},
    {label: 'buy-word', operation: () => { setMenu('buy-word'); }},
    {label: 'buy-letter', operation: () => { setMenu('buy-letter'); }},
  ];
  
  return (
    <div className='menu-container'>
      <div className="options-menu">
      {allOptions
            .filter(option => option.label !== currentMenu)
            .map((option, index) => (
              <button 
                key={index} 
                className={`half-button ${usersTeam}`}
                onClick={option.operation}>
                  {option.label}
              </button>
          ))}
        <button 
          className={`full-width-button ${usersTeam}`}>
            back
        </button>
      </div>
    </div>
  )
}

export default OptionsMenu