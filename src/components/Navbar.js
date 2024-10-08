import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();

    const menuRef = useRef(null);
    const notificationsRef = useRef(null);

    useEffect(() => {
        fetchNotifications();

        // WebSocket setup
        const token = localStorage.getItem('authToken');
        if (token) {
            const ws = new WebSocket(`ws://localhost:5000?token=${token}`);
            ws.onmessage = (event) => {
                const notification = JSON.parse(event.data);
                setNotifications((prevNotifications) => [notification, ...prevNotifications]);
            };
            return () => {
                ws.close();
            };
        }
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
            // Check if click is outside the notifications dropdown
            if (
                showNotifications &&
                notificationsRef.current &&
                !notificationsRef.current.contains(event.target) &&
                !event.target.closest('.notification-icon')
            ) {
                setShowNotifications(false);
            }

            // Check if click is outside the user menu dropdown
            if (
                showMenu &&
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                !event.target.closest('.user-icon')
            ) {
                setShowMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside); // Use 'click' instead of 'mousedown'

        return () => {
            document.removeEventListener('click', handleClickOutside); // Cleanup event listener
        };
    }, [showNotifications, showMenu]);

    const markNotificationAsRead = async (index) => {
        try {
            await axios.put(`http://localhost:5000/api/notifications/${index}/read`);
            const updatedNotifications = notifications.map((notification, i) =>
                i === index ? { ...notification, read: true } : notification
            );
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
        setShowMenu(prev => !prev);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        navigate('/login');
    };

    const toggleNotifications = () => {
        setShowNotifications(prev => !prev);
    };

    const unreadCount = notifications.filter(notification => !notification.read).length;

    const isDashboard = location.pathname === '/dashboard';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="logo" />
                    <div className="nav-links">
                        <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
                        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Daily Form</Link>
                        <Link to="/performance" className={`nav-link ${location.pathname === '/performance' ? 'active' : ''}`}>Performance</Link>
                        <Link to="/user-control" className={`nav-link ${location.pathname === '/user-control' ? 'active' : ''}`}>User Control</Link>
                    </div>
                </div>
                {isDashboard && (
                    <div className="user-actions">
                        <div className="notification-icon" onClick={toggleNotifications}>
                            🔔
                            {unreadCount > 0 && (
                                <span className="notification-count">{unreadCount}</span>
                            )}
                        </div>
                        <div ref={notificationsRef} className={`notification-dropdown ${showNotifications ? 'show' : ''}`}>
                            {notifications.length > 0 ? (
                                notifications.map((notification, index) => (
                                    <div
                                        key={index}
                                        className={`notification-item ${notification.read ? 'read' : ''}`}
                                        onClick={() => markNotificationAsRead(index)}
                                    >
                                        <div className="message">{notification.message}</div>
                                        <div className="timestamp">{moment(notification.timestamp).tz('Asia/Kolkata').format('HH:mm')}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="notification-item">No notifications</div>
                            )}
                        </div>
                        {user && user.name && (
                            <div className="user-icon" onClick={toggleMenu}>
                                {getInitials(user.name)}
                                {showMenu && (
                                    <div ref={menuRef} className="dropdown-menu">
                                        <button onClick={handleLogout}>Logout</button>
                                        <Link to="/view-details">View Details</Link>
                                        {/* <Link to="/change-password" state={{ user }}>Change Password</Link> */}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
