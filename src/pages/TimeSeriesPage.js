import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, CircularProgress, 
  Divider, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format, parseISO } from 'date-fns';
import { analyzeTimeSeries } from '../utils/dataProcessing';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const TimeSeriesPage = ({ data }) => {
  const [loading, setLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [metric, setMetric] = useState('responseTime');
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (data) {
        console.log("TimeSeriesPage received data:", Array.isArray(data) ? {
          length: data.length,
          sample: data.slice(0, 2)
        } : 'Not an array');
        
        const timeAnalysis = analyzeTimeSeries(data);
        console.log("Time analysis results:", {
          hasData: !!timeAnalysis,
          hasDates: !!(timeAnalysis && timeAnalysis.dates),
          dateCount: timeAnalysis && timeAnalysis.dates ? timeAnalysis.dates.length : 0
        });
        
        setTimeSeriesData(timeAnalysis);
        setError(null);
      } else {
        console.warn("No data provided to TimeSeriesPage");
        setError("No data available for time series analysis");
      }
    } catch (error) {
      console.error("Error in TimeSeriesPage data processing:", error);
      setError(`Error processing time series data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (timeSeriesData) {
      try {
        prepareChartData(metric);
      } catch (error) {
        console.error("Error preparing chart data:", error);
        setError(`Error preparing chart: ${error.message}`);
      }
    }
  }, [timeSeriesData, metric]);

  const prepareChartData = (selectedMetric) => {
    if (!timeSeriesData || !timeSeriesData.dates || !timeSeriesData[selectedMetric]) {
      console.warn("Missing required data for chart:", {
        hasTimeSeriesData: !!timeSeriesData,
        hasDates: !!(timeSeriesData && timeSeriesData.dates),
        hasSelectedMetric: !!(timeSeriesData && timeSeriesData[selectedMetric])
      });
      return;
    }

    let metricLabel = '';
    let bgColor = '';
    let borderColor = '';

    switch (selectedMetric) {
      case 'responseTime':
        metricLabel = 'Response Time (ms)';
        bgColor = 'rgba(54, 162, 235, 0.2)';
        borderColor = 'rgba(54, 162, 235, 1)';
        break;
      case 'sentimentScore':
        metricLabel = 'Sentiment Score';
        bgColor = 'rgba(75, 192, 192, 0.2)';
        borderColor = 'rgba(75, 192, 192, 1)';
        break;
      case 'wordCount':
        metricLabel = 'Word Count';
        bgColor = 'rgba(153, 102, 255, 0.2)';
        borderColor = 'rgba(153, 102, 255, 1)';
        break;
      case 'accuracy':
        metricLabel = 'Accuracy Score';
        bgColor = 'rgba(255, 159, 64, 0.2)';
        borderColor = 'rgba(255, 159, 64, 1)';
        break;
      default:
        metricLabel = 'Value';
        bgColor = 'rgba(201, 203, 207, 0.2)';
        borderColor = 'rgba(201, 203, 207, 1)';
    }
    
    // Create data points with proper x,y format for Time scale
    const dataPoints = [];
    
    // Make sure we have valid dates and metric values
    for (let i = 0; i < timeSeriesData.dates.length; i++) {
      if (i < timeSeriesData[selectedMetric].length) {
        try {
          // Format the date - handle different date formats
          let date;
          if (typeof timeSeriesData.dates[i] === 'string') {
            date = new Date(timeSeriesData.dates[i]);
          } else {
            date = timeSeriesData.dates[i];
          }
          
          // Validate date is valid
          if (isNaN(date.getTime())) {
            console.warn(`Invalid date at index ${i}:`, timeSeriesData.dates[i]);
            continue; // Skip invalid dates
          }
          
          dataPoints.push({
            x: date,
            y: timeSeriesData[selectedMetric][i]
          });
        } catch (error) {
          console.warn(`Error processing data point at index ${i}:`, error);
          // Skip this data point
        }
      }
    }
    
    console.log(`Prepared ${dataPoints.length} data points for chart`);
    
    setChartData({
      datasets: [
        {
          label: metricLabel,
          data: dataPoints,
          fill: true,
          backgroundColor: bgColor,
          borderColor: borderColor,
          tension: 0.1
        }
      ]
    });
  };

  const handleMetricChange = (event) => {
    setMetric(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Time Series Analysis
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Please try uploading a different dataset or refresh the page.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const hasValidData = timeSeriesData && 
                       chartData && 
                       chartData.datasets && 
                       chartData.datasets[0].data && 
                       chartData.datasets[0].data.length > 0;

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Time Series Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Tracking AI response metrics over time to identify trends and patterns.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">AI Response Metrics Over Time</Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="metric-select-label">Metric</InputLabel>
            <Select
              labelId="metric-select-label"
              id="metric-select"
              value={metric}
              label="Metric"
              onChange={handleMetricChange}
            >
              <MenuItem value="responseTime">Response Time</MenuItem>
              <MenuItem value="sentimentScore">Sentiment Score</MenuItem>
              <MenuItem value="wordCount">Word Count</MenuItem>
              <MenuItem value="accuracy">Accuracy</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ height: 400 }}>
          {hasValidData ? (
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    type: 'time',
                    time: {
                      unit: 'day',
                      displayFormats: {
                        day: 'MMM d'
                      }
                    },
                    title: {
                      display: true,
                      text: 'Date'
                    }
                  },
                  y: {
                    beginAtZero: metric === 'sentimentScore' ? false : true,
                    title: {
                      display: true,
                      text: chartData.datasets[0].label
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      title: function(context) {
                        // Format the date for the tooltip
                        const date = new Date(context[0].parsed.x);
                        return date.toLocaleDateString();
                      }
                    }
                  }
                }
              }} 
            />
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', pt: 12 }}>
              No time series data available
            </Typography>
          )}
        </Box>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Summary Statistics</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {timeSeriesData && timeSeriesData.summary ? (
              <Box sx={{ '& > *': { mb: 2 } }}>
                {Object.entries(timeSeriesData.summary).map(([key, value]) => (
                  <Box key={key}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Typography>
                    <Typography variant="body1">{typeof value === 'number' ? value.toFixed(2) : value}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No summary statistics available
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Key Observations</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {timeSeriesData && timeSeriesData.observations ? (
              <Box component="ul" sx={{ pl: 2 }}>
                {timeSeriesData.observations.map((observation, index) => (
                  <Typography component="li" variant="body1" key={index} sx={{ mb: 1 }}>
                    {observation}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No key observations available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TimeSeriesPage; 