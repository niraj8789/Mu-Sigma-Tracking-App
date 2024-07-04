import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CSVLink } from 'react-csv';
import { FaChartBar, FaFilter, FaChartPie, FaTimes, FaChartLine, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './PerformanceVisuals.css';

const PerformanceVisuals = () => {
  const [view, setView] = useState('GDO');
  const [weeklyData, setWeeklyData] = useState(null);
  const [task, setTask] = useState(['All']);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [clusterData, setClusterData] = useState(null);
  const [deepFilterData, setDeepFilterData] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState('All');
  const [metrics, setMetrics] = useState({ max: '', min: '', avg: '', stddev: '', median: '' });
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [chartType, setChartType] = useState('Bar');
  const [showCumulative, setShowCumulative] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [weeklyRes, clusterRes] = await Promise.all([
          axios.get('http://localhost:5000/api/stats/weekly'),
          axios.get('http://localhost:5000/api/stats/clusters')
        ]);
        setWeeklyData(weeklyRes.data);
        setFilteredData(weeklyRes.data);
        setClusterData(clusterRes.data);
      } catch (error) {
        setError('Error fetching data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processChartData = (data) => {
    const labels = data.map(item => item.name);
    const plannerHours = data.map(item => item.totalPlannerHour);
    const actualHours = data.map(item => item.totalActualHour);

    if (showCumulative) {
      for (let i = 1; i < plannerHours.length; i++) {
        plannerHours[i] += plannerHours[i - 1];
        actualHours[i] += actualHours[i - 1];
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Planned Hours',
          data: plannerHours,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Actual Hours',
          data: actualHours,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const processClusterChartData = (data) => {
    const labels = data.map(item => item.taskType);
    const plannerHours = data.map(item => item.totalPlannerHour);

    return {
      labels,
      datasets: [
        {
          label: 'Planned Hours',
          data: plannerHours,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const filterData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        task: task.length && task[0] !== 'All' ? task.join(',') : undefined,
        sortBy
      };

      const { data } = await axios.get('http://localhost:5000/api/stats/weekly', { params });
      setFilteredData(data);
    } catch (error) {
      setError('Error filtering data');
      console.error('Error filtering data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setTask(['All']);
    setSortBy('name');
    filterData(); // Optionally, trigger filter after clearing
  };

  const handleTaskChange = (e) => {
    const value = Array.from(
      e.target.selectedOptions,
      option => option.value
    );
    setTask(value);
  };

  const handleChartClick = (elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const taskName = filteredData[index].name;
      alert(`Drill down into more details for task: ${taskName}`);
    }
  };

  const handleClusterChange = async (e) => {
    const cluster = e.target.value;
    setSelectedCluster(cluster);
    if (cluster !== 'All') {
      try {
        const { data } = await axios.get('http://localhost:5000/api/stats/tasks', { params: { cluster } });
        setDeepFilterData(data);
        calculateMetrics(data);
      } catch (error) {
        setError('Error fetching cluster data');
        console.error('Error fetching cluster data:', error);
      }
    } else {
      setDeepFilterData(null);
      setMetrics({ max: '', min: '', avg: '', stddev: '', median: '' });
    }
  };

  const calculateMetrics = (data) => {
    if (data.length === 0) return;

    let total = 0;
    let max = 0;
    let min = Number.MAX_VALUE;
    let maxTask = '';
    let minTask = '';
    let allHours = [];

    data.forEach(item => {
      total += item.totalPlannerHour;
      allHours.push(item.totalPlannerHour);
      if (item.totalPlannerHour > max) {
        max = item.totalPlannerHour;
        maxTask = item.taskType;
      }
      if (item.totalPlannerHour < min) {
        min = item.totalPlannerHour;
        minTask = item.taskType;
      }
    });

    const avg = total / data.length;
    const stddev = Math.sqrt(allHours.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / data.length);
    allHours.sort((a, b) => a - b);
    const median = (allHours.length % 2 === 0) ? (allHours[allHours.length / 2 - 1] + allHours[allHours.length / 2]) / 2 : allHours[Math.floor(allHours.length / 2)];

    setMetrics({
      max: `${maxTask}: ${max}`,
      min: `${minTask}: ${min}`,
      avg: avg.toFixed(2),
      stddev: stddev.toFixed(2),
      median: median.toFixed(2)
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Name', 'Total Planner Hour', 'Total Actual Hour']],
      body: filteredData.map((item) => [
        item.name,
        item.totalPlannerHour,
        item.totalActualHour,
      ]),
    });
    doc.save('performance_data.pdf');
  };

  const renderMetrics = () => {
    return (
      <div className="metrics">
        <div className="metric-item">
          <h3>Max Planned Hours</h3>
          <p>{metrics.max}</p>
        </div>
        <div className="metric-item">
          <h3>Min Planned Hours</h3>
          <p>{metrics.min}</p>
        </div>
        <div className="metric-item">
          <h3>Avg Planned Hours</h3>
          <p>{metrics.avg}</p>
        </div>
        {showDetailedMetrics && (
          <>
            <div className="metric-item">
              <h3>Std Dev</h3>
              <p>{metrics.stddev}</p>
            </div>
            <div className="metric-item">
              <h3>Median Planned Hours</h3>
              <p>{metrics.median}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderChart = () => {
    const chartData = processChartData(filteredData);
    switch (chartType) {
      case 'Bar':
        return <Bar data={chartData} options={{ onClick: handleChartClick }} />;
      case 'Line':
        return <Line data={chartData} options={{ onClick: handleChartClick }} />;
      case 'Pie':
        return <Pie data={chartData} options={{ onClick: handleChartClick }} />;
      default:
        return <Bar data={chartData} options={{ onClick: handleChartClick }} />;
    }
  };

  return (
    <div className="performance-visuals">
      <h2>Performance Visuals</h2>
      <div className="view-toggle">
        <button
          className={`toggle-button ${view === 'GDO' ? 'active' : ''}`}
          onClick={() => setView('GDO')}
        >
          <FaChartBar /> <span>GDO</span>
        </button>
        <button
          className={`toggle-button ${view === 'ClusterUtilization' ? 'active' : ''}`}
          onClick={() => setView('ClusterUtilization')}
        >
          <FaChartPie /> <span>Cluster Utilization</span>
        </button>
      </div>
      <div className="top-buttons">
        <CSVLink data={filteredData || []} className="export-button">
          Export Data as CSV
        </CSVLink>
        <button className="export-button" onClick={exportPDF}>
          <FaDownload /> Export Data as PDF
        </button>
        <button className="export-button">
          <FaDownload /> Export Data as Excel
        </button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : view === 'GDO' ? (
        <>
          <div className="filter-section">
            <div className="date-picker">
              <label>Start Date: </label>
              <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} />
            </div>
            <div className="date-picker">
              <label>End Date: </label>
              <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} />
            </div>
            <div className="sort-by">
              <label>Sort By: </label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="none">None</option>
                <option value="planned">Planned Hours</option>
                <option value="actual">Actual Hours</option>
              </select>
            </div>
            <div className="filter-buttons">
              <button className="filter-button" onClick={filterData}>Filter</button>
              <button className="clear-filters-button" onClick={clearFilters}>
                <FaTimes /> Clear Filters
              </button>
            </div>
          </div>

          <div className="chart-options">
            <div className="chart-type-toggle">
              <label>Chart Type: </label>
              <button className={`chart-toggle-button ${chartType === 'Bar' ? 'active' : ''}`} onClick={() => setChartType('Bar')}>
                <FaChartBar /> Bar
              </button>
              <button className={`chart-toggle-button ${chartType === 'Line' ? 'active' : ''}`} onClick={() => setChartType('Line')}>
                <FaChartLine /> Line
              </button>
              <button className={`chart-toggle-button ${chartType === 'Pie' ? 'active' : ''}`} onClick={() => setChartType('Pie')}>
                <FaChartPie /> Pie
              </button>
            </div>
            <div className="toggle-cumulative">
              <label>
                <input
                  type="checkbox"
                  checked={showCumulative}
                  onChange={() => setShowCumulative(!showCumulative)}
                />
                Show Cumulative Data
              </label>
            </div>
            <div className="toggle-detailed-metrics">
              <label>
                <input
                  type="checkbox"
                  checked={showDetailedMetrics}
                  onChange={() => setShowDetailedMetrics(!showDetailedMetrics)}
                />
                Show Detailed Metrics
              </label>
            </div>
          </div>

          {filteredData && (
            <div className="chart-container">
              {renderChart()}
            </div>
          )}
        </>
      ) : (
        <div className="cluster-utilization">
          <div className="deep-filter-section">
            <div className="cluster-filter">
              <label>Select Cluster: </label>
              <select value={selectedCluster} onChange={handleClusterChange}>
                <option value="All">All</option>
                {clusterData && clusterData.map((cluster, index) => (
                  <option key={index} value={cluster.cluster}>{cluster.cluster}</option>
                ))}
              </select>
            </div>
          </div>
          {renderMetrics()}
          {deepFilterData && (
            <div className="chart-container">
              <Bar data={processClusterChartData(deepFilterData)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceVisuals;
