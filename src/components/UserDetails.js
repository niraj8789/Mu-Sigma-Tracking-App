import React from 'react';
import { Link,useNavigate } from 'react-router-dom';
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
            <table>
                <tbody>
                    <tr>
                        <th>Name:</th>
                        <td>{user.name}</td>
                    </tr>
                    <tr>
                        <th>Email:</th>
                        <td>{user.email}</td>
                    </tr>
                    <tr>
                        <th>Cluster:</th>
                        <td>{user.cluster}</td>
                    </tr>
                    <tr>
                        <th>Role:</th>
                        <td>{user.role}</td>
                    </tr>
                </tbody>
            </table>
            <Link to="/change-password" state={{ user }}>Change Password</Link>
        </div>
    );
}

export default UserDetails;
