import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from './Mu_sigma_logo.jpg'; // Import your logo image file

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/login" className="login-link">Login</Link>
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="logo" />
                </div>
                <div className="nav-links">
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/" className="nav-link">Daily Form</Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
