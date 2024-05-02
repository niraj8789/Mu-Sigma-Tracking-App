import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DailyForm from './components/DailyForm';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import FormDataDetails from './components/FormDataDetails';
import Login from './components/Login';
import Registration from './components/Registration'; // Import Registration component
import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    console.log(userData);
    setUser(userData);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setUser(null);
    setLoggedIn(false);
  };

  return (
    <Router>
      <div className="App">
        {/* Render Navbar only if logged in */}
        {loggedIn && <Navbar loggedIn={loggedIn} handleLogout={handleLogout} />}
        <Routes>
          <Route
            path="/"
            element={loggedIn ? <DailyForm /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={loggedIn ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/details/:name"
            element={loggedIn ? <FormDataDetails /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={<Login handleLogin={handleLogin} />}
          />
          <Route
            path="/register"
            element={<Registration />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
