import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';

const PerformanceVisuals = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weeklyRes, monthlyRes] = await Promise.all([
          axios.get('http://localhost:5000/api/stats/weekly'),
          axios.get('http://localhost:5000/api/stats/monthly')
        ]);
        setWeeklyData(weeklyRes.data);
        setMonthlyData(monthlyRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const processChartData = (data) => {
    const labels = data.map(item => item.name);
    const plannerHours = data.map(item => item.totalPlannerHour);
    const actualHours = data.map(item => item.totalActualHour);

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

  return (
    <div>
      <h2>Weekly Performance</h2>
      {weeklyData && <Bar data={processChartData(weeklyData)} />}
      <h2>Monthly Performance</h2>
      {monthlyData && <Line data={processChartData(monthlyData)} />}
    </div>
  );
};

export default PerformanceVisuals;
