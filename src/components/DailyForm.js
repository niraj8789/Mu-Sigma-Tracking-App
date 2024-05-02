import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; 
import './DailyForm.css';
import logo from './Musigma.png';


function DailyForm() {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [cluster, setCluster] = useState('');
    const [resourceType, setResourceType] = useState('');
    const [tasks, setTasks] = useState([{
        incCr: '',
        product: '',
        taskType: '',
        taskDescription: '',
        actualHour: '',
        plannerHour: ''
    }]);
    // const [formDataList, setFormDataList] = selectedList

    //
    const navigate = useNavigate();

    const handleInputChange = (index, event) => {
        const values = [...tasks];
        values[index][event.target.name] = event.target.value;
        setTasks(values);
    };

    const handleAddTask = () => {
        setTasks([...tasks, {
            incCr: '',
            product: '',
            taskType: '',
            taskDescription: '',
            actualHour: '',
            plannerHour: ''
        }]);
    };

    const handleDeleteTask = (index) => {
        const values = [...tasks];
        values.splice(index, 1);
        setTasks(values);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = { name, date, cluster, resourceType, tasks };
        const existingData = JSON.parse(localStorage.getItem('formDataList')) || [];
        existingData.push(formData);
        localStorage.setItem('formDataList', JSON.stringify(existingData));
        navigate('/dashboard', { state: { formDataList: existingData } });
    };
    
    

    return (
        <div className="daily-form">
            <div className="header">
                <h1>{name || "Daily Task Tracker"}</h1>
            </div>
            <form onSubmit={handleSubmit}>
                <div className='front-form'>
                <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <select value={cluster} onChange={(e) => setCluster(e.target.value)}>
                    <option value="">Select Cluster</option>
                    {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                    ))}
                </select>
                <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                    <option value="">Select Resource Type</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Training">Training</option>
                </select>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th className='inc'>INC/CR</th>
                            <th className='inc'>Product</th>
                            <th className='inc'>Task</th>
                            <th className='desc'>Task Description</th>
                            <th className='ah'>AH</th>
                            <th className='ph'>PH</th>
                            <th className='but'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task, index) => (
                            <tr key={index}>
                                <td><input type="text" name="incCr" value={task.incCr} onChange={(event) => handleInputChange(index, event)} /></td>
                                <td><input type="text" name="product" value={task.product} onChange={(event) => handleInputChange(index, event)} /></td>
                                <td>
                                    <select name="taskType" value={task.taskType} onChange={(event) => handleInputChange(index, event)}>
                                        <option value="">Select Task</option>
                                        <option value="Internal Communication">Internal Communication</option>
                                        <option value="Incident Resolution">Incident Resolution</option>
                                        <option value="Pipeline Monitor/Fix">Pipeline Monitor/Fix</option>
                                        <option value="Service Governance">Service Governance</option>
                                        <option value="Internal Dev Connect">Internal Dev Connect</option>
                                        <option value="KT & Onboarding">KT & Onboarding</option>
                                    </select>
                                </td>
                                <td><input type="text" name="taskDescription" value={task.taskDescription} onChange={(event) => handleInputChange(index, event)} style={{ width: '100%' }} /></td>
                                <td><input type="number" name="actualHour" value={task.actualHour} step="0.1" onChange={(event) => handleInputChange(index, event)} /></td>
                                <td><input type="number" name="plannerHour" value={task.plannerHour} step="0.1" onChange={(event) => handleInputChange(index, event)} /></td>
                                <td className='Allbutton'>
                                    {index === tasks.length - 1 && (
                                        <button type="button" onClick={handleAddTask}><FontAwesomeIcon icon={faPlus} /></button>
                                    )}
                                    {index !== tasks.length - 1 && (
                                        <button type="button" onClick={() => handleDeleteTask(index)}><FontAwesomeIcon icon={faTrash} /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
}

export default DailyForm;
