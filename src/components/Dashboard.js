import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
    const [formDataList, setFormDataList] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Load data from localStorage
        const data = localStorage.getItem('formDataList');
        if (data) {
            setFormDataList(JSON.parse(data));
        }
    }, []);

    const handleCardClick = (formData) => {
        navigate(`/details/${formData.name}`, { state: { formData } });
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div className="card-container">
                {formDataList.map((formData, index) => (
                    <div key={index} className="card" onClick={() => handleCardClick(formData)}>
                        <h2>{formData.name}</h2>
                        <p>Date: {formData.date}</p>
                        <p>Cluster: {formData.cluster}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;