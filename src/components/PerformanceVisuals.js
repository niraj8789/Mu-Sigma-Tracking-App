import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './PerformanceVisuals.css';

function PerformanceVisuals({ onClose }) {
    const [performanceData, setPerformanceData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [nameFilter, setNameFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [taskTypeFilter, setTaskTypeFilter] = useState('');
    const [nameSuggestions, setNameSuggestions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/tasks');
                setPerformanceData(response.data);
                setFilteredData(response.data);
            } catch (error) {
                console.error('Error fetching performance data:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const filtered = performanceData.filter(data => {
            const matchesName = nameFilter ? data.name.toLowerCase().includes(nameFilter.toLowerCase()) : true;
            const matchesDate = dateFilter ? data.date === dateFilter : true;
            const matchesTaskType = taskTypeFilter
                ? data.tasks.some(task => task.taskType === taskTypeFilter)
                : true;
            return matchesName && matchesDate && matchesTaskType;
        });
        setFilteredData(filtered);
    }, [nameFilter, dateFilter, taskTypeFilter, performanceData]);

    useEffect(() => {
        const suggestions = performanceData.map(data => data.name).filter(name => 
            name.toLowerCase().includes(nameFilter.toLowerCase())
        );
        setNameSuggestions(suggestions);
    }, [nameFilter, performanceData]);

    const chartData = {
        labels: filteredData.map(data => data.name),
        datasets: [
            {
                label: 'Planner Hours',
                data: filteredData.map(data => data.tasks.reduce((sum, task) => sum + task.plannerHour, 0)),
                backgroundColor: 'rgba(75,192,192,0.6)',
                borderWidth: 1
            },
            {
                label: 'Actual Hours',
                data: filteredData.map(data => data.tasks.reduce((sum, task) => sum + task.actualHour, 0)),
                backgroundColor: 'rgba(153,102,255,0.6)',
                borderWidth: 1
            }
        ]
    };

    const taskTypeData = filteredData.reduce((acc, data) => {
        data.tasks.forEach(task => {
            if (!acc[task.taskType]) {
                acc[task.taskType] = 0;
            }
            acc[task.taskType] += task.plannerHour;
        });
        return acc;
    }, {});

    const taskTypeChartData = {
        labels: Object.keys(taskTypeData),
        datasets: [
            {
                label: 'Hours per Task Type',
                data: Object.values(taskTypeData),
                backgroundColor: 'rgba(255,159,64,0.6)',
                borderWidth: 1
            }
        ]
    };

    const performanceFeedback = filteredData.map(data => {
        const totalPlannerHours = data.tasks.reduce((sum, task) => sum + task.plannerHour, 0);
        const totalActualHours = data.tasks.reduce((sum, task) => sum + task.actualHour, 0);
        return (
            <div key={data.id} className="performance-feedback-item">
                <h3>{data.name}'s Performance</h3>
                <p>{data.name} has completed {data.tasks.length} tasks.</p>
                <p>Planned Hours: {totalPlannerHours}</p>
                <p>Actual Hours: {totalActualHours}</p>
                <p>{totalActualHours > totalPlannerHours ? 'Overworked' : 'On track'}</p>
            </div>
        );
    });

    return (
        <div className="performance-visuals">
            <button onClick={onClose} className="close-button">Close</button>
            <h1>Team Performance</h1>
            <div className="filters">
                <div className="filter-item">
                    <input
                        type="text"
                        placeholder="Filter by Name"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        list="name-suggestions"
                    />
                    <datalist id="name-suggestions">
                        {nameSuggestions.map((name, index) => (
                            <option key={index} value={name} />
                        ))}
                    </datalist>
                </div>
                <div className="filter-item">
                    <input
                        type="date"
                        placeholder="Filter by Date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>
                <div className="filter-item">
                    <select
                        value={taskTypeFilter}
                        onChange={(e) => setTaskTypeFilter(e.target.value)}
                    >
                        <option value="">Filter by Task Type</option>
                        <option value="Internal Communication">Internal Communication</option>
                        <option value="Incident Resolution">Incident Resolution</option>
                        <option value="Pipeline Monitor/Fix">Pipeline Monitor/Fix</option>
                        <option value="Service Governance">Service Governance</option>
                        <option value="Internal Dev Connect">Internal Dev Connect</option>
                        <option value="KT & Onboarding">KT & Onboarding</option>
                    </select>
                </div>
            </div>
            <div className="charts">
                <div className="chart">
                    <h2>Bar Chart</h2>
                    <Bar data={chartData} />
                </div>
                <div className="chart">
                    <h2>Line Chart</h2>
                    <Line data={chartData} />
                </div>
                <div className="chart">
                    <h2>Pie Chart</h2>
                    <Pie data={chartData} />
                </div>
                <div className="chart">
                    <h2>Task Type Hours</h2>
                    <Bar data={taskTypeChartData} />
                </div>
            </div>
            <div className="performance-feedback">
                {performanceFeedback}
            </div>
        </div>
    );
}

export default PerformanceVisuals;
