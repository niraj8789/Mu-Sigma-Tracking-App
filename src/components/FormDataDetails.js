import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './FormDataDetails.css'; // Make sure this file path is correct

function FormDataDetails() {
    const { state } = useLocation();
    const navigate = useNavigate(); // Hook to handle navigation
    const { formData } = state || {};
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (formData && formData.tasks) {
            const initializedTasks = formData.tasks.map(task => ({
                ...task,
                completed: false // Initialize all tasks as not completed
            }));
            setTasks(initializedTasks);
        }
    }, [formData]);

    // Update progress when tasks change
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

    if (!formData) {
        return <div className="form-data-details">No data available.</div>;
    }

    return (
        <div className="form-data-details">
            <h2 className="details-heading">{formData.name}</h2>
            <button className="back-button" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            <p><strong>Date:</strong> {formData.date}</p>
            <p><strong>Cluster:</strong> {formData.cluster}</p>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="task-grid">
                {tasks.map((task, index) => (
                    <div className={`task-card ${task.completed ? 'completed' : ''}`} key={task.incCr || index} onClick={() => toggleTaskCompletion(index)}>
                        <p><strong>INC/CR:</strong> {task.incCr}</p>
                        <p><strong>Product:</strong> {task.product}</p>
                        <p><strong>Task Type:</strong> {task.taskType}</p>
                        <p><strong>Description:</strong> {task.taskDescription}</p>
                        <p><strong>Actual Hours (AH):</strong> {task.actualHour}</p>
                        <p><strong>Planned Hours (PH):</strong> {task.plannerHour}</p>
                        <p><strong>Resource Type:</strong> {task.resourceType}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FormDataDetails;