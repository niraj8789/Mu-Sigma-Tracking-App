import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import logo from './Mu_sigma_logo.jpg';
import axios from 'axios';
import moment from 'moment-timezone';

function Navbar() {
    const [showMenu, setShowMenu] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/notifications');
            const sortedNotifications = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setNotifications(sortedNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotifications && !event.target.closest('.notification-dropdown') && !event.target.closest('.notification-icon')) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    const markNotificationAsRead = async (index) => {
        try {
            await axios.put(`http://localhost:5000/api/notifications/${index}/read`);
            const updatedNotifications = notifications.filter((_, i) => i !== index);
            setNotifications(updatedNotifications);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getInitials = (name) => {
        if (!name) return '';
        const initials = name.split(' ').map(word => word[0]).join('');
        return initials.slice(0, 2).toUpperCase();
    };

    const toggleMenu = () => {
        setShowMenu(!showMenu);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        navigate('/login');
    };

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    const unreadCount = notifications.length;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="logo" />
                </div>
                <div className="nav-links">
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/" className="nav-link">Daily Form</Link>
                    <Link to="/performance" className="nav-link">Performance</Link>
                    <Link to="/user-control" className="nav-link">User Control</Link>
                </div>
                <div className="user-actions">
                    <div className="notification-icon" onClick={toggleNotifications}>
                        🔔
                        {unreadCount > 0 && (
                            <span className="notification-count">{unreadCount}</span>
                        )}
                    </div>
                    <div className={`notification-dropdown ${showNotifications ? 'show' : ''}`}>
                        {notifications.length > 0 ? (
                            notifications.map((notification, index) => (
                                <div key={index} className="notification-item" onClick={() => markNotificationAsRead(index)}>
                                    <div className="message">{notification.message}</div>
                                    <div className="timestamp">{moment(notification.timestamp).tz('Asia/Kolkata').format('HH:mm')}</div>
                                </div>
                            ))
                        ) : (
                            <div className="notification-item">No notifications</div>
                        )}
                    </div>
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
