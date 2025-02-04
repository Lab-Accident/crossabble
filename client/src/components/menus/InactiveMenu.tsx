import { useState } from 'react';
import useSessionStore from '../../stores/SessionStore';

function InactiveMenu() {
  const usersTeam = useSessionStore((state) => state.currentSession?.playerPosition?.slice(0, 2));
  const [message, setMessage] = useState('Default Message For Inactive Menu');

  return (
    <div className='menu-container'>
      <button 
        className={`menu-message ${usersTeam}`} > 
          {message}
      </button>
    </div>
  )
}

export default InactiveMenu