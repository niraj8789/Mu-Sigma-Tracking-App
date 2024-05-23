import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import './Dashboard.css';

function Dashboard() {
    const [formDataList, setFormDataList] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch data from the API
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/tasks'); // Update with your server URL
                setFormDataList(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handleCardClick = (formData) => {
        navigate(`/details/${formData.id}`, { state: { formData } });
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div className="card-container">
                {formDataList.map((formData) => (
                    <div key={formData.id} className="card" onClick={() => handleCardClick(formData)}>
                        <h2>{formData.name}</h2>
                        <p>Date: {moment(formData.date).format('YYYY-MM-DD')}</p>
                        <p>Cluster: {formData.cluster}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
