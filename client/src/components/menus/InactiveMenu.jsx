import React, { useState, useContext } from 'react';

function InactiveMenu() {
  let usersTeam = 'T2';
  const [message, setMessage] = useState('Default Message For Inactive Menu');

  return (
    <div className='menu-container'>
      <button className={`menu-message ${usersTeam}`} > {message} </button>
    </div>
  )
}

export default InactiveMenu