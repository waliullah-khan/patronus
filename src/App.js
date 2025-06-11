import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import './App.css';

// Import components
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TopicModelingPage from './pages/TopicModelingPage';
import TimeSeriesPage from './pages/TimeSeriesPage';
import TextClusteringPage from './pages/TextClusteringPage';
import HallucinationDetectionPage from './pages/HallucinationDetectionPage';
import UploadPage from './pages/UploadPage';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4c78a8',
    },
    secondary: {
      main: '#3d5a80',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
        },
      },
    },
  },
});

function App() {
  const [open, setOpen] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [analysisData, setAnalysisData] = useState({
    topicModeling: null,
    sentimentAnalysis: null,
    timeSeries: null,
    textClustering: null,
    hallucination: null,
    rawData: null,
  });

  // Debug effect to log data state when it changes
  useEffect(() => {
    if (dataLoaded) {
      console.log("Data loaded state:", {
        topicModelingDataExists: !!analysisData.topicModeling,
        sentimentDataExists: !!analysisData.sentimentAnalysis,
        timeSeriesDataExists: !!analysisData.timeSeries,
        textClusteringDataExists: !!analysisData.textClustering,
        hallucinationDataExists: !!analysisData.hallucination,
        rawDataExists: !!analysisData.rawData,
      });
      
      if (analysisData.rawData) {
        console.log("Raw data sample:", analysisData.rawData.slice(0, 2));
        console.log("Raw data length:", analysisData.rawData.length);
      }
    }
  }, [dataLoaded, analysisData]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleDataUpload = (data) => {
    // Process the uploaded data and store analysis results
    console.log("Received data from upload:", {
      topicModelingDataExists: !!data.topicModeling,
      sentimentDataExists: !!data.sentimentAnalysis,
      timeSeriesDataExists: !!data.timeSeries,
      textClusteringDataExists: !!data.textClustering,
      hallucinationDataExists: !!data.hallucination,
      rawDataExists: !!data.rawData,
    });
    
    setAnalysisData(data);
    setDataLoaded(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <Navbar open={open} toggleDrawer={toggleDrawer} />
          <Sidebar open={open} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: '100vh',
              overflow: 'auto',
              pt: 8, // Padding top to account for app bar
              px: 3, // Padding left and right
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route 
                path="/upload" 
                element={<UploadPage onDataUpload={handleDataUpload} />} 
              />
              <Route 
                path="/topic-modeling" 
                element={
                  dataLoaded ? 
                  <TopicModelingPage data={analysisData.topicModeling || analysisData.rawData} /> : 
                  <Navigate to="/upload" replace />
                } 
              />
              {/* Sentiment Analysis page removed as requested */}
              <Route 
                path="/time-series" 
                element={
                  dataLoaded ? 
                  <TimeSeriesPage data={analysisData.timeSeries || analysisData.rawData} /> : 
                  <Navigate to="/upload" replace />
                } 
              />
              <Route 
                path="/text-clustering" 
                element={
                  dataLoaded ? 
                  <TextClusteringPage 
                    data={analysisData.textClustering || analysisData.rawData} 
                  /> : 
                  <Navigate to="/upload" replace />
                } 
              />
              <Route 
                path="/hallucination-detection" 
                element={
                  dataLoaded ? 
                  <HallucinationDetectionPage data={analysisData.hallucination || analysisData.rawData} /> : 
                  <Navigate to="/upload" replace />
                } 
              />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 