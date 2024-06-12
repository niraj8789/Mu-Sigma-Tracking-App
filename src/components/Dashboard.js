import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import moment from 'moment';

function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [tasksPerPage, setTasksPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/tasks');
                const sortedTasks = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setTasks(sortedTasks);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        };

        fetchTasks();
    }, []);

    const handleCardClick = (id) => {
        navigate(`/task/${id}`);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleTasksPerPageChange = (event) => {
        setTasksPerPage(Number(event.target.value));
        setCurrentPage(1); // Reset to first page when changing tasks per page
    };

    const indexOfLastTask = currentPage * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
    const totalPages = Math.ceil(tasks.length / tasksPerPage);

    return (
        <div className="dashboard">
            <h1 className="dashboard-heading">Task Dashboard</h1>
            <div className="controls">
                <label>
                    Tasks per page:
                    <select value={tasksPerPage} onChange={handleTasksPerPageChange}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                </label>
            </div>
            <div className="card-container">
                {currentTasks.map((task) => (
                    <div key={task.id} className="card" onClick={() => handleCardClick(task.id)}>
                        <h2>{task.name}</h2>
                        <p>Date: {moment(task.date).format('Do MMMM YYYY')}</p>
                        <p><strong>Cluster:</strong> {task.cluster}</p>
                        <p><strong>Resource Type:</strong> {task.resourceType}</p>
                    </div>
                ))}
            </div>
            <div className="pagination">
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={currentPage === index + 1 ? 'active' : ''}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
