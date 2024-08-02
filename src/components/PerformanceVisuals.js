import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CSVLink } from 'react-csv';
import {
  FaChartBar,
  FaChartLine,
  FaDownload,
  FaChevronDown,
  FaFilter,
  FaUndo,
  FaTimes,
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion } from 'framer-motion';
import {
  ChakraProvider,
  Box,
  Button,
  Select,
  Text,
  Flex,
  Grid,
} from '@chakra-ui/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import { AnimatePresence, motion as m } from 'framer-motion';
import './PerformanceVisuals.css';

// Styled components
const ChartContainer = styled(motion.div)`
  margin: 20px 0;
  padding: 20px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 400px;
  max-width: 1200px;
  @media (max-width: 768px) {
    height: 300px;
  }
`;

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      type: 'spring',
      damping: 15,
    },
  },
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.15)',
    transition: {
      yoyo: Infinity,
      duration: 0.3,
    },
  },
};

const chartVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.3,
    },
  },
};

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
  const [metrics, setMetrics] = useState({
    max: '',
    min: '',
    avg: '',
  });
  const [chartType, setChartType] = useState('Bar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filterRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [weeklyRes, clusterRes] = await Promise.all([
          axios.get('http://localhost:5000/api/stats/weekly'),
          axios.get('http://localhost:5000/api/stats/clusters'),
        ]);
        setWeeklyData(weeklyRes.data);
        setFilteredData(weeklyRes.data);
        setClusterData(clusterRes.data);
      } catch (error) {
        setError('Error fetching data');
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data. Please try again.', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterRef]);

  const processChartData = (data) => {
    const labels = data.map((item) => item.name);
    const plannerHours = data.map((item) => item.totalPlannerHour);
    const actualHours = data.map((item) => item.totalActualHour);

    return {
      labels,
      datasets: [
        {
          label: 'Planned Hours',
          data: plannerHours,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Actual Hours',
          data: actualHours,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const processClusterChartData = (data) => {
    const labels = data.map((item) => item.taskType);
    const plannerHours = data.map((item) => item.totalPlannerHour);

    return {
      labels,
      datasets: [
        {
          label: 'Planned Hours',
          data: plannerHours,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
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
        sortBy,
      };

      const { data } = await axios.get('http://localhost:5000/api/stats/weekly', {
        params,
      });
      setFilteredData(data);
    } catch (error) {
      setError('Error filtering data');
      console.error('Error filtering data:', error);
      toast.error('Error filtering data. Please try again.', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setTask(['All']);
    setSortBy('name');
    filterData();
  };

  const handleTaskChange = (e) => {
    const value = Array.from(e.target.selectedOptions, (option) => option.value);
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
        const { data } = await axios.get('http://localhost:5000/api/stats/tasks', {
          params: { cluster },
        });
        setDeepFilterData(data);
        calculateMetrics(data);
      } catch (error) {
        setError('Error fetching cluster data');
        console.error('Error fetching cluster data:', error);
        toast.error('Error fetching cluster data. Please try again.', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        });
      }
    } else {
      setDeepFilterData(null);
      setMetrics({ max: '', min: '', avg: '' });
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

    data.forEach((item) => {
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

    setMetrics({
      max: `${maxTask}: ${max}`,
      min: `${minTask}: ${min}`,
      avg: avg.toFixed(2),
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
      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={6}
        marginTop="20px"
        padding="20px"
        bg="#f9f9f9"
        borderRadius="8px"
        boxShadow="0 4px 8px rgba(0, 0, 0, 0.05)"
      >
        {Object.keys(metrics).map((key) => (
          <Box
            key={key}
            textAlign="center"
            padding="15px"
            bg="white"
            borderRadius="8px"
            color="#333"
            transition="transform 0.3s ease, background 0.3s ease"
            boxShadow="0 2px 4px rgba(0, 0, 0, 0.05)"
            as={motion.div}
            whileHover={{ scale: 1.03 }}
          >
            <Text
              fontSize="18px"
              color="#777"
              fontWeight="500"
              textTransform="capitalize"
            >
              {key}
            </Text>
            <Text fontSize="16px" color="#333">
              {metrics[key]}
            </Text>
          </Box>
        ))}
      </Grid>
    );
  };

  const renderChart = () => {
    const chartData = processChartData(filteredData);
    const ChartComponent = chartType === 'Bar' ? Bar : Line;
    return (
      <ChartContainer
        variants={chartVariants}
        initial="hidden"
        animate="visible"
      >
        <ChartComponent
          data={chartData}
          options={{ onClick: handleChartClick, maintainAspectRatio: false }}
        />
      </ChartContainer>
    );
  };

  const renderClusterChart = () => {
    const clusterChartData = processClusterChartData(deepFilterData);
    return (
      <ChartContainer
        variants={chartVariants}
        initial="hidden"
        animate="visible"
      >
        <Bar
          data={clusterChartData}
          options={{ maintainAspectRatio: false }}
        />
      </ChartContainer>
    );
  };

  return (
    <ChakraProvider>
      <m.div
        className="performance-visuals"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="header">
          <h2>Performance Visuals</h2>
          <div className="top-buttons">
            <div className="export-dropdown">
              <Button
                onClick={() => setShowExportOptions(!showExportOptions)}
                colorScheme="teal"
                variant="solid"
                size="sm"
                leftIcon={<FaDownload />}
              >
                Export <FaChevronDown />
              </Button>
              {showExportOptions && (
                <Box
                  position="absolute"
                  backgroundColor="white"
                  boxShadow="md"
                  borderRadius="md"
                  overflow="hidden"
                  zIndex="10"
                  mt="1"
                >
                  <CSVLink data={filteredData || []} className="export-option">
                    <Button
                      width="100%"
                      size="sm"
                      leftIcon={<FaDownload />}
                      variant="ghost"
                      justifyContent="start"
                    >
                      CSV
                    </Button>
                  </CSVLink>
                  <Button
                    onClick={exportPDF}
                    width="100%"
                    size="sm"
                    leftIcon={<FaDownload />}
                    variant="ghost"
                    justifyContent="start"
                  >
                    PDF
                  </Button>
                </Box>
              )}
            </div>
            <Button
              colorScheme="teal"
              variant="solid"
              size="sm"
              leftIcon={<FaFilter />}
              onClick={() => setShowFilterModal(true)}
            >
              Filters
            </Button>
          </div>
        </div>

        <Flex justifyContent="space-between" mt={6}>
          <Flex gap={4}>
            <Button
              variant={view === 'GDO' ? 'solid' : 'outline'}
              colorScheme="teal"
              onClick={() => setView('GDO')}
              size="md"
              leftIcon={<FaChartBar />}
            >
              GDO
            </Button>
            <Button
              variant={view === 'ClusterUtilization' ? 'solid' : 'outline'}
              colorScheme="teal"
              onClick={() => setView('ClusterUtilization')}
              size="md"
              leftIcon={<FaChartLine />}
            >
              Cluster Utilization
            </Button>
          </Flex>

          <Flex gap={4}>
            <Button
              variant={chartType === 'Bar' ? 'solid' : 'outline'}
              colorScheme="teal"
              size="sm"
              onClick={() => setChartType('Bar')}
              leftIcon={<FaChartBar />}
            >
              Bar
            </Button>
            <Button
              variant={chartType === 'Line' ? 'solid' : 'outline'}
              colorScheme="teal"
              size="sm"
              onClick={() => setChartType('Line')}
              leftIcon={<FaChartLine />}
            >
              Line
            </Button>
          </Flex>
        </Flex>

        {showFilterModal && (
          <div className="filter-modal">
            <motion.div
              className="filter-content"
              ref={filterRef}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Button
                className="close-button"
                onClick={() => setShowFilterModal(false)}
                size="sm"
                variant="ghost"
                color="gray.500"
              >
                <FaTimes />
              </Button>
              <h3>Filter Options</h3>
              <div className="filter-row">
                <div className="date-picker">
                  <label>Start Date:</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                  />
                </div>
                <div className="date-picker">
                  <label>End Date:</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                  />
                </div>
                <div className="sort-by">
                  <label>Sort By:</label>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="planned">Planned Hours</option>
                    <option value="actual">Actual Hours</option>
                  </Select>
                </div>
              </div>
              <div className="filter-buttons">
                <Button
                  onClick={() => {
                    filterData();
                    setShowFilterModal(false);
                  }}
                  colorScheme="teal"
                  size="md"
                >
                  Apply Filters
                </Button>
                <Button
                  onClick={() => {
                    clearFilters();
                    setShowFilterModal(false);
                  }}
                  colorScheme="red"
                  size="md"
                  leftIcon={<FaUndo />}
                >
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : view === 'GDO' ? (
          <>
            {filteredData && renderChart()}
          </>
        ) : (
          <div className="cluster-utilization">
            <div className="deep-filter-section">
              <div className="cluster-filter">
                <label>Select Cluster:</label>
                <Select
                  value={selectedCluster}
                  onChange={handleClusterChange}
                  size="md"
                  width="auto"
                  colorScheme="teal"
                >
                  <option value="All">All</option>
                  {clusterData &&
                    clusterData.map((cluster, index) => (
                      <option key={index} value={cluster.cluster}>
                        {cluster.cluster}
                      </option>
                    ))}
                </Select>
              </div>
            </div>
            <AnimatePresence>
              {deepFilterData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {renderMetrics()}
                </motion.div>
              )}
            </AnimatePresence>
            {deepFilterData && renderClusterChart()}
          </div>
        )}
        <ToastContainer />
      </m.div>
    </ChakraProvider>
  );
};

export default PerformanceVisuals;
