import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FormDataDetails.css';
import moment from 'moment' // Make sure this file path is correct

function FormDataDetails() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { formData } = state || {};
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState(0);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editedActualHour, setEditedActualHour] = useState('');

    useEffect(() => {
        if (formData && formData.tasks) {
            const initializedTasks = formData.tasks.map(task => ({
                ...task,
                completed: false // Initialize all tasks as not completed
            }));
            console.log('Initialized Tasks:', initializedTasks); // Add this line
            setTasks(initializedTasks);
        }
    }, [formData]);

    useEffect(() => {
        const totalPlannedHours = tasks.reduce((acc, task) => acc + parseFloat(task.plannerHour), 0);
        const completedHours = tasks.reduce((acc, task) => task.completed ? acc + parseFloat(task.plannerHour) : acc, 0);
        const newProgress = (completedHours / totalPlannedHours) * 100;
        setProgress(newProgress);
    }, [tasks]);

    const toggleTaskCompletion = (index) => {
        setTasks(currentTasks =>
            currentTasks.map((task, i) =>
                i === index ? { ...task, completed: !task.completed } : task
            )
        );
    };

    const handleEditActualHour = (taskId, actualHour) => {
        console.log('Editing Task ID:', taskId);
        setEditingTaskId(taskId);
        setEditedActualHour(actualHour.toString());
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setEditedActualHour('');
    };

    const handleSaveActualHour = async (taskId) => {
        try {
          if (!taskId) {
            console.error('Task ID is missing.');
            return;
          }
      
          const response = await axios.put(`http://localhost:5000/api/tasks/${taskId}`, { actualHour: parseFloat(editedActualHour) });
          if (response.status === 200) {
            const updatedTasks = tasks.map(task => {
              if (task.task_id === taskId) {
                return { ...task, actualHour: parseFloat(editedActualHour) };
              }
              return task;
            });
            setTasks(updatedTasks);
            setEditingTaskId(null);
            setEditedActualHour('');
          } else {
            console.error('Failed to update actual hours:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error updating actual hours:', error);
        }
      };
    if (!formData) {
        return <div className="form-data-details">No data available.</div>;
    }

    return (
        <div className="form-data-details">
            <h2 className="details-heading">{formData.name}</h2>
            <button className="back-button" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            <p><strong>Date : </strong>{moment(formData.date).format('YYYY-MM-DD')}</p> 
            <p><strong>Cluster:</strong> {formData.cluster}</p>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="task-grid">
                {tasks.map((task, index) => (
                    <div className={`task-card ${task.completed ? 'completed' : ''}`} key={task.task_id || index} onClick={() => toggleTaskCompletion(index)}>
                        <p><strong>INC/CR:</strong> {task.incCr}</p>
                        <p><strong>Product:</strong> {task.product}</p>
                        <p><strong>Task Type:</strong> {task.taskType}</p>
                        <p><strong>Description:</strong> {task.taskDescription}</p>
                        {editingTaskId === task.task_id ? (
                            <div>
                                <input type="number" value={editedActualHour} onChange={(e) => setEditedActualHour(e.target.value)} />
                                <button onClick={() => handleSaveActualHour(task.task_id)}>Save</button>
                                <button onClick={handleCancelEdit}>Cancel</button>
                            </div>
                        ) : (
                            <p><strong>Actual Hours (AH):</strong> {task.actualHour} <button onClick={() => handleEditActualHour(task.task_id, task.actualHour)}>Edit</button></p>
                        )}
                        <p><strong>Planned Hours (PH):</strong> {task.plannerHour}</p>
                        <p><strong>Resource Type:</strong> {task.resourceType}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FormDataDetails;
