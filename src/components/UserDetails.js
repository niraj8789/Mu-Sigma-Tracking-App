import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { motion } from 'framer-motion'; // Import Framer Motion
import './UserDetails.css';

function UserDetails() {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return <p>Loading...</p>;
    }

    const handleChangePassword = () => {
        navigate('/change-password');
    };

    return (
        <motion.div
            className="user-details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.h1
                initial={{ x: -200 }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 50 }}
            >
                User Details
            </motion.h1>
            <motion.table
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 60 }}
            >
                <tbody>
                    {Object.entries(user).map(([key, value], index) => (
                        <motion.tr
                            key={key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <th>{key.charAt(0).toUpperCase() + key.slice(1)}:</th>
                            <td>{value}</td>
                        </motion.tr>
                    ))}
                </tbody>
            </motion.table>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <Link className="change-password-btn" to="/change-password" state={{ user }}>Change Password</Link>
            </motion.div>
        </motion.div>
    );
}

export default UserDetails;
