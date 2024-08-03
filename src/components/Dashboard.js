import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import filterIcon from './Filters.jpg';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(Number(localStorage.getItem('tasksPerPage')) || 10);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    name: '',
    cluster: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
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
            Authorization: `Bearer ${token}`,
          },
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterRef]);

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

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      name: '',
      cluster: '',
    });
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
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasks.csv');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error exporting tasks:', error);
    }
  };

  const applyFilters = (tasks) => {
    return tasks.filter((task) => {
      const taskDate = moment(task.date).format('YYYY-MM-DD');
      const startDateMatch = filters.startDate ? taskDate >= filters.startDate : true;
      const endDateMatch = filters.endDate ? taskDate <= filters.endDate : true;
      const nameMatch = filters.name ? task.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
      const clusterMatch = filters.cluster ? task.cluster.toLowerCase().includes(filters.cluster.toLowerCase()) : true;

      return startDateMatch && endDateMatch && nameMatch && clusterMatch;
    });
  };

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const filteredTasks = applyFilters(tasks);
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

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
          <p><strong>Total Planned Hours:</strong> {task.totalPlannerHour}</p>
        </div>
      ));
    }

    if (user.role === 'Cluster Lead') {
      return currentTasks.filter((task) => task.cluster === user.cluster).map((task) => (
        <div key={task.id} className="card" onClick={() => handleCardClick(task.id)}>
          <h2>{task.name}</h2>
          <p>Date: {moment(task.date).format('Do MMMM YYYY')}</p>
          <p><strong>Cluster:</strong> {task.cluster}</p>
          <p><strong>Total Planned Hours:</strong> {task.totalPlannerHour}</p>
        </div>
      ));
    }

    if (user.role === 'Team Member') {
      const filteredTasks = currentTasks.filter((task) => task.assignedTo === user.email);
      console.log('Filtered tasks for Team Member:', filteredTasks); // Debug log
      return filteredTasks.map((task) => (
        <div key={task.id} className="card" onClick={() => handleCardClick(task.id)}>
          <h2>{task.name}</h2>
          <p>Date: {moment(task.date).format('Do MMMM YYYY')}</p>
          <p><strong>Cluster:</strong> {task.cluster}</p>
          <p><strong>Total Planned Hours:</strong> {task.totalPlannerHour}</p>
        </div>
      ));
    }

    return <p>You do not have access to view these tasks.</p>;
  };

  return (
    <div className="dashboard">
      <div className={`filters-container ${showFilters ? 'show' : ''}`} ref={filterRef}>
        <div className="filters">
          <label>
            Start Date:
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </label>
          <label>
            End Date:
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </label>
          {user && user.role === 'Manager' && (
            <label>
              Cluster:
              <input type="text" name="cluster" value={filters.cluster} onChange={handleFilterChange} placeholder="Cluster" />
            </label>
          )}
          <button className="clear-filters-button" onClick={handleClearFilters}>Clear All Filters</button>
        </div>
      </div>
      <div className={`dashboard-content ${showFilters ? 'shifted' : ''}`}>
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
          <img
            src={filterIcon}
            alt="Filter"
            className="filter-icon"
            onClick={() => setShowFilters(!showFilters)}
          />
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
    </div>
  );
}

export default Dashboard;
