import { useState } from 'react';
import { getCurrentTeam } from '../../hooks/useSocket';

function InactiveMenu() {
  const usersTeam = getCurrentTeam();
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