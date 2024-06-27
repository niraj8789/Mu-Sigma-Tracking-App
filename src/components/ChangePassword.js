// src/components/ChangePassword.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './ChangePassword.css';

function ChangePassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = location.state || {};
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (!user) {
            console.error('User information is missing');
            navigate('/'); // Redirect to home or appropriate page
        }
    }, [user, navigate]);

    const handleSendOtp = async () => {
        try {
            await axios.post('http://localhost:5000/api/send-otp', { email: user.email });
            setOtpSent(true);
        } catch (error) {
            console.error('Error sending OTP:', error);
        }
    };

    const handleChangePassword = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/change-password', {
                email: user.email,
                otp,
                newPassword
            });
            console.log('Password change response:', response.data);
            alert('Password changed successfully!');
        } catch (error) {
            console.error('Error changing password:', error.response ? error.response.data : error);
        }
    };

    return (
        <div className="change-password">
            <h1>Change Password</h1>
            {!otpSent ? (
                <button onClick={handleSendOtp}>Send OTP</button>
            ) : (
                <div>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Enter New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button onClick={handleChangePassword}>Change Password</button>
                </div>
            )}
        </div>
    );
}

export default ChangePassword;
