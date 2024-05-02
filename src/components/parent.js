import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';

const ParentComponent = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      setLoggedInUser(data); 
      navigate('/dashboard'); 
    } catch (error) {
      setError('Invalid email or password');
      console.error('Error logging in:', error.message);
    }
  };

  const handleRegister = () => {
    navigate('/register'); 
  };

  return (
    <div>
      <Login handleLogin={handleLogin} handleRegister={handleRegister} />
      {error && <div>{error}</div>}
    </div>
  );
};

export default ParentComponent;
