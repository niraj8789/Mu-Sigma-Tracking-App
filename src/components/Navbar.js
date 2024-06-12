import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from './Mu_sigma_logo.jpg';

function Navbar({ loggedIn, handleLogout }) {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="logo" />
                </div>
                <div className="nav-links">
                    <Link to="/dashboard" className="nav-link">DASHBOARD</Link>
                    <Link to="/" className="nav-link">DAILY FORM</Link>
                    <Link to="/performance" className="nav-link">PERFORMANCE</Link>
                </div>
                <div className="logout-container">
                    {loggedIn && <button onClick={handleLogout}>Logout</button>}
                </div>
            </div>
        </nav>
    );
}


export default Navbar;
