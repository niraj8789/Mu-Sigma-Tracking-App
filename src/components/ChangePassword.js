// src/components/ChangePassword.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
            navigate('/');
        }
    }, [user, navigate]);

    const handleSendOtp = async () => {
        try {
            await axios.post('http://localhost:5000/api/send-otp', { email: user.email });
            setOtpSent(true);
            showNotification('OTP sent successfully!', 'success');
        } catch (error) {
            console.error('Error sending OTP:', error);
            showNotification('Failed to send OTP. Please try again.', 'error');
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
            showNotification('Password changed successfully!', 'success');
            setTimeout(() => {
                navigate('/'); // Redirect to login or home page after delay
            }, 3000); // Delay navigation by 3 seconds to allow notification to be seen
        } catch (error) {
            console.error('Error changing password:', error.response ? error.response.data : error);
            showNotification(error.response?.data?.message || 'Failed to change password. Invalid OTP.', 'error');
        }
    };

    const showNotification = (message, type) => {
        const toastOptions = {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        };

        if (type === 'success') {
            toast.success(message, toastOptions);
        } else {
            toast.error(message, toastOptions);
        }
    };

    return (
        <div className="change-password">
            <ToastContainer />
            <h1>Change Password</h1>
            {!otpSent ? (
                <div className="otp-section">
                    <button className="btn-send-otp" onClick={handleSendOtp}>Send OTP</button>
                </div>
            ) : (
                <div className="otp-input-section">
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
                    <button className="btn-change-password" onClick={handleChangePassword}>Change Password</button>
                </div>
            )}
        </div>
    );
}

export default ChangePassword;
