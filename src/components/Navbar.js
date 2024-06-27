import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook
import './Navbar.css';
import logo from './Mu_sigma_logo.jpg';

function Navbar() {
    const [showMenu, setShowMenu] = useState(false);
    const { user, setUser } = useAuth(); // Get user and setUser from AuthContext
    const navigate = useNavigate();

    const getInitials = (name) => {
        if (!name) return ''; // Check if name is defined
        const initials = name.split(' ').map(word => word[0]).join('');
        return initials.slice(0, 2).toUpperCase();
    };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
    };

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
                    <Link to="/user-control" className="nav-link">USER CONTROL</Link>
                </div>
                <div className="logout-container">
                    {user && user.name && (
                        <div className="user-icon" onMouseEnter={toggleMenu} onMouseLeave={toggleMenu}>
                            {getInitials(user.name)}
                            {showMenu && (
                                <div className="dropdown-menu">
                                    <button onClick={handleLogout}>Logout</button>
                                    <Link to="/view-details">View Details</Link>
                                    <Link to="/change-password" state={{ user }}>Change Password</Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
