import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';
import Logo1 from './Mu_sigma_logo.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

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
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed');
      console.error('Error logging in:', error.message);
    }
  };

  const handleRegistration = () => {
    navigate('/register');
  };

  const handlePasswordReset = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        toast.info('OTP sent to your email');
        navigate('/reset-password', { state: { email } });
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('Failed to send OTP');
      console.error('Error sending OTP:', error.message);
    }
  };
  

  return (
    <div className="login-container">
      <ToastContainer />
      <div className="logo-container">
        <img src={Logo1} alt="logo" className="logo" />
      </div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
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
        <button type="submit" className="btn-submit">Login</button>
      </form>
      <div className="register-link">
        <span>Don't have an account? </span>
        <button onClick={handleRegistration}>Register</button>
      </div>
      <div className="forgot-password-link">
        <button onClick={handlePasswordReset}>Forgot Password?</button>
      </div>
    </div>
  );
};

export default Login;
