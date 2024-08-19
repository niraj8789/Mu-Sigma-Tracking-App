import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { motion } from 'framer-motion';
import './FormDataDetails.css';

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
        return (
            <div className="loading">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    Loading...
                </motion.div>
            </div>
        );
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
        <motion.div
            className="form-data-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }} // Reduced duration
        >
            <motion.h1
                className="details-heading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }} // Reduced duration
            >
                Task Details for {task.name}
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }} // Reduced duration and delay
            >
                Date: {moment(task.date).format('Do MMMM YYYY')}
            </motion.p>
            <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }} // Reduced duration and delay
            >
                Cluster: {task.cluster}
            </motion.p>
            <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }} // Reduced duration and delay
            >
                Resource Type: {task.resourceType}
            </motion.p>

            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }} // Reduced duration and delay
            >
                <motion.table
                    className="task-table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
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
                            <motion.tr
                                key={entry.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }} // Reduced duration and delay
                                whileHover={{ scale: 1.02, backgroundColor: '#f1f1f1' }}
                            >
                                <td>{entry.incCr}</td>
                                <td>{entry.product}</td>
                                <td>{entry.taskType}</td>
                                <td>{entry.taskDescription}</td>
                                <td>{entry.plannerHour}</td>
                                <td>
                                    <motion.input
                                        type="number"
                                        name="actualHour"
                                        value={actualHours[index] || ''}
                                        onChange={(event) => handleInputChange(index, event)}
                                        className="input-actual-hour"
                                        min="0"
                                        step="0.1"
                                        disabled={!isToday(task.date)}
                                        whileFocus={{ scale: 1.05 }}
                                    />
                                </td>
                                <td>
                                    <motion.input
                                        type="checkbox"
                                        checked={completedTasks[index] || false}
                                        onChange={(event) => handleInputChange(index, event)}
                                        disabled={!isToday(task.date)}
                                        whileFocus={{ scale: 1.2 }}
                                    />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </motion.table>
                <motion.button
                    type="submit"
                    className="submit-button"
                    whileHover={{ scale: 1.05, backgroundColor: '#4a0707' }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }} // Reduced duration and delay
                >
                    Update Actual Hours
                </motion.button>
            </motion.form>
            <motion.div
                className="progress"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                transition={{ duration: 1.0, ease: 'easeInOut' }} // Reduced duration
            >
                <motion.div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${completionPercentage}%` }}
                    aria-valuenow={completionPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1.0, ease: 'easeInOut' }} // Reduced duration
                >
                    {completionPercentage.toFixed(2)}%
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

export default FormDataDetails;
