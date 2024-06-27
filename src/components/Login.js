import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './Login.css';
import Logo1 from './Mu_sigma_logo.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth(); // Get setUser function from AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token); // Store the token in localStorage
        setUser(data.user); // Set the user in AuthContext
        navigate('/dashboard'); // Redirect to the dashboard
      } else {
        const data = await response.json();
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Login failed');
      console.error('Error logging in:', error.message);
    }
  };

  const handleRegistration = () => {
    navigate('/register');
  };

  return (
    <div className="login-container">
      <div>
        <img src={Logo1} alt="logo" className="logo" style={{ paddingLeft: '20px' }} />
      </div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn-submit">Login</button>
      </form>
      <div className="register-link">
        <span>Don't have an account? </span>
        <button onClick={handleRegistration}>Register</button>
      </div>
    </div>
  );
};

export default Login;
