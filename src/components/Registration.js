import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Registration.css';

const Registration = ({ handleRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cluster, setCluster] = useState('');
  const [clusterLead, setClusterLead] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, cluster, clusterLead }),
      });
      if (response.ok) {
        navigate('/login'); 
      } else {
       
        const data = await response.json();
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed');
      console.error('Error registering user:', error.message);
    }
  };
  

  return (
    <div className="registration-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control"
          />
        </div>
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
        <div className="form-group">
          <label>Cluster:</label>
          <input
            type="text"
            value={cluster}
            onChange={(e) => setCluster(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label>Cluster Lead:</label>
          <input
            type="text"
            value={clusterLead}
            onChange={(e) => setClusterLead(e.target.value)}
            className="form-control"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn-submit">
          Register
        </button>
      </form>
    </div>
  );
};

export default Registration;
