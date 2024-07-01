import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(
    Number(localStorage.getItem('tasksPerPage')) || 10
  );
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/tasks', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const sortedTasks = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log('Fetched tasks:', sortedTasks); // Debug log
        setTasks(sortedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        }
      }
    };

    fetchTasks();
  }, [navigate]);

  const handleCardClick = (id) => {
    navigate(`/task/${id}`);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleTasksPerPageChange = (event) => {
    const newTasksPerPage = Number(event.target.value);
    setTasksPerPage(newTasksPerPage);
    localStorage.setItem('tasksPerPage', newTasksPerPage);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      console.log('Sending request to export tasks with token:', token);
      const response = await axios.get('http://localhost:5000/api/export-tasks', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob', // Important for downloading files
      });

      // Create a link to download the CSV file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasks.csv'); // or any other extension
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error exporting tasks:', error);
    }
  };

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  const renderTasks = () => {
    if (!user) {
      return <p>Loading...</p>;
    }

    if (user.role === 'Manager') {
      return currentTasks.map((task) => (
        <div key={task.id} className="card" onClick={() => handleCardClick(task.id)}>
          <h2>{task.name}</h2>
          <p>Date: {moment(task.date).format('Do MMMM YYYY')}</p>
          <p><strong>Cluster:</strong> {task.cluster}</p>
          <p><strong>Resource Type:</strong> {task.resourceType}</p>
        </div>
      ));
    }

    if (user.role === 'Cluster Lead') {
      return currentTasks.filter(task => task.cluster === user.cluster).map((task) => (
        <div key={task.id} className="card" onClick={() => handleCardClick(task.id)}>
          <h2>{task.name}</h2>
          <p>Date: {moment(task.date).format('Do MMMM YYYY')}</p>
          <p><strong>Cluster:</strong> {task.cluster}</p>
          <p><strong>Resource Type:</strong> {task.resourceType}</p>
        </div>
      ));
    }

    if (user.role === 'Team Member') {
      const filteredTasks = currentTasks.filter(task => task.assignedTo === user.email);
      console.log('Filtered tasks for Team Member:', filteredTasks); // Debug log
      return filteredTasks.map((task) => (
        <div key={task.id} className="card" onClick={() => handleCardClick(task.id)}>
          <h2>{task.name}</h2>
          <p>Date: {moment(task.date).format('Do MMMM YYYY')}</p>
          <p><strong>Cluster:</strong> {task.cluster}</p>
          <p><strong>Resource Type:</strong> {task.resourceType}</p>
        </div>
      ));
    }

    return <p>You do not have access to view these tasks.</p>;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-heading">Task Dashboard</h1>
        <button onClick={handleExport} className="export-button">Export Tasks as CSV</button>
      </div>
      <div className="controls">
        <label>
          Tasks per page:
          <select value={tasksPerPage} onChange={handleTasksPerPageChange}>
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>
      <div className="card-container">
        {renderTasks()}
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
