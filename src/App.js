import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DailyForm from './components/DailyForm';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import FormDataDetails from './components/FormDataDetails';
import Login from './components/Login';
import Registration from './components/Registration';
import PerformanceVisuals from './components/PerformanceVisuals';
import UserControl from './components/userControl'; 
import UserDetails from './components/UserDetails'; 
import ChangePassword from './components/ChangePassword'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const ProtectedRoute = ({ element }) => {
  const { user } = useAuth();
  if (user === undefined) return null; // Avoid destructuring if user is undefined
  return user ? element : <Navigate to="/login" />;
};

const WrapperComponent = ({ element }) => {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      {element}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<ProtectedRoute element={<WrapperComponent element={<DailyForm />} />} />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<WrapperComponent element={<Dashboard />} />} />} />
            <Route path="/task/:id" element={<ProtectedRoute element={<WrapperComponent element={<FormDataDetails />} />} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/performance" element={<ProtectedRoute element={<WrapperComponent element={<PerformanceVisuals />} />} />} />
            <Route path="/user-control" element={<ProtectedRoute element={<WrapperComponent element={<UserControl />} />} />} />
            <Route path="/view-details" element={<ProtectedRoute element={<WrapperComponent element={<UserDetails />} />} />} />
            <Route path="/change-password" element={<ProtectedRoute element={<WrapperComponent element={<ChangePassword />} />} />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
