import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './FormDataDetails.css';
import moment from 'moment';

function FormDataDetails() {
    const { id } = useParams();
    const [task, setTask] = useState(null);
    const [entries, setEntries] = useState([]);
    const [actualHours, setActualHours] = useState({});
    const [completedTasks, setCompletedTasks] = useState({});

    useEffect(() => {
        const fetchTaskDetails = async () => {
            try {
                const taskResponse = await axios.get(`http://localhost:5000/api/tasks/${id}`);
                setTask(taskResponse.data);
                setEntries(taskResponse.data.entries);
                const initialActualHours = {};
                const initialCompletedTasks = {};
                taskResponse.data.entries.forEach((entry, index) => {
                    initialActualHours[index] = entry.actualHour || 0;
                    initialCompletedTasks[index] = entry.completed || false;
                });
                setActualHours(initialActualHours);
                setCompletedTasks(initialCompletedTasks);
            } catch (error) {
                console.error('Error fetching task details:', error);
            }
        };

        fetchTaskDetails();
    }, [id]);

    const handleInputChange = (index, event) => {
        const { value, type, checked } = event.target;
        if (type === 'checkbox') {
            setCompletedTasks((prev) => ({
                ...prev,
                [index]: checked,
            }));
        } else {
            const numericValue = Math.max(0, parseFloat(value));
            setActualHours((prev) => ({
                ...prev,
                [index]: numericValue,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const actualHour = actualHours[i];
                const completed = completedTasks[i];
                if (actualHour !== undefined) {
                    await axios.put(`http://localhost:5000/api/tasks/${entry.id}`, { actualHour, completed });
                }
            }
            alert('Actual hours and completion status updated successfully');
        } catch (error) {
            console.error('Error updating actual hours:', error);
            alert('Error updating actual hours');
        }
    };

    const isToday = (date) => {
        const today = moment().startOf('day');
        return moment(date).isSame(today, 'day');
    };

    if (!task) {
        return <div className="loading">Loading...</div>;
    }

    const totalPlannedHours = entries.reduce((total, entry) => total + entry.plannerHour, 0);
    const totalCompletedHours = entries.reduce((total, entry, index) => {
        if (completedTasks[index]) {
            return total + entry.plannerHour;
        }
        return total;
    }, 0);
    const completionPercentage = (totalCompletedHours / totalPlannedHours) * 100;

    return (
        <div className="form-data-details">
            <h1 className="details-heading">Task Details for {task.name}</h1>
            <p>Date: {moment(task.date).format('Do MMMM YYYY')}</p>
            <p>Cluster: {task.cluster}</p>
            <p>Resource Type: {task.resourceType}</p>

            <form onSubmit={handleSubmit}>
                <table>
                    <thead>
                        <tr>
                            <th>INC/CR</th>
                            <th>Product</th>
                            <th>Task Type</th>
                            <th>Task Description</th>
                            <th>Planned Hour</th>
                            <th>Actual Hour</th>
                            <th>Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, index) => (
                            <tr key={entry.id}>
                                <td>{entry.incCr}</td>
                                <td>{entry.product}</td>
                                <td>{entry.taskType}</td>
                                <td>{entry.taskDescription}</td>
                                <td>{entry.plannerHour}</td>
                                <td>
                                    <input
                                        type="number"
                                        name="actualHour"
                                        value={actualHours[index] || ''}
                                        onChange={(event) => handleInputChange(index, event)}
                                        className="input-actual-hour"
                                        min="0"
                                        step="0.1"
                                        disabled={!isToday(task.date)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={completedTasks[index] || false}
                                        onChange={(event) => handleInputChange(index, event)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="submit" className="submit-button">Update Actual Hours</button>
            </form>
            <div className="progress">
                <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${completionPercentage}%` }}
                    aria-valuenow={completionPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                >
                    {completionPercentage.toFixed(2)}%
                </div>
            </div>
        </div>
    );
}

export default FormDataDetails;
