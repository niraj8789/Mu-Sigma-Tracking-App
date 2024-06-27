import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import './UserDetails.css';

function UserDetails() {
    const { user } = useAuth(); // Get user from AuthContext
    const navigate = useNavigate();

    if (!user) {
        return <p>Loading...</p>; // Show loading or some fallback UI if user is not defined
    }

    const handleChangePassword = () => {
        navigate('/change-password');
    };

    return (
        <div className="user-details">
            <h1>User Details</h1>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Cluster:</strong> {user.cluster}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {/* <button onClick={handleChangePassword}>Change Password</button> */}
        </div>
    );
}

export default UserDetails;
