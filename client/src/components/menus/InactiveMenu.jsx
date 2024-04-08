import React, { useState, useContext } from 'react';
import {UsersContext } from '../../App';

function InactiveMenu() {
  const { usersTeam } = useContext(UsersContext);
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