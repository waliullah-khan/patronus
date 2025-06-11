import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StorageIcon from '@mui/icons-material/Storage';

// Import analysis functions
import { performTopicModeling, performSentimentAnalysis, performTimeSeriesAnalysis, 
  performTextClustering, performHallucinationDetection } from '../utils/dataProcessing';

// Import Weaviate components
import weaviateClient from '../utils/weaviateClient';
import FieldMapper from '../components/FieldMapper';
import WeaviateStatus from '../components/WeaviateStatus';

function UploadPage({ onDataUpload }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [shouldUseWeaviate, setShouldUseWeaviate] = useState(true);
  const [weaviateStatus, setWeaviateStatus] = useState(false);
  const [expandedSection, setExpandedSection] = useState('dataUpload');

  const steps = ['Select File', 'Map Fields', 'Process Data', 'View Results'];

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const handleFieldsSelected = (mappings) => {
    console.log("Field mappings selected:", mappings);
    setFieldMappings(mappings);
    // Only set mappings, don't automatically advance steps
  };
  
  const applyMappings = () => {
    // Validate we have at least content mapping
    if (!fieldMappings.content) {
      setError('Content field mapping is required');
      return;
    }
    setActiveStep(2);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setFile(selectedFile);
        setError(null);
        setActiveStep(1);
        // Preview the data
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            // Try to parse as standard JSON
            let data = JSON.parse(e.target.result);
            
            // Check if data is an array
            if (!Array.isArray(data)) {
              console.log("Data is not an array, checking if it's a JSON object with an array property");
              // If it's not an array but an object, look for array properties
              const arrayProps = Object.entries(data).filter(([_, value]) => Array.isArray(value));
              if (arrayProps.length > 0) {
                console.log(`Found array property: ${arrayProps[0][0]}`);
                data = data[arrayProps[0][0]];
              } else {
                // If no array found, convert to single-item array
                console.log("Converting non-array data to an array with a single item");
                data = [data];
              }
            }
            
            // Check if JSON is in the expected format (array of objects with content)
            const hasContentFields = data.some(item => item && typeof item === 'object' && item.content);
            console.log("Data has content fields:", hasContentFields);
            
            if (!hasContentFields) {
              // Try to adapt the data if it doesn't have content field
              console.log("Adapting data to expected format");
              
              // If objects have 'text' field instead of 'content', adapt them
              const adaptedData = data.map(item => {
                if (item && typeof item === 'object') {
                  // Copy the item
                  const newItem = {...item};
                  
                  // If it has text but not content, use text as content
                  if (item.text && !item.content) {
                    newItem.content = item.text;
                  }
                  
                  // If no content/text field, create a dummy one with stringified properties
                  if (!newItem.content) {
                    newItem.content = JSON.stringify(item);
                  }
                  
                  return newItem;
                }
                return { content: String(item) }; // Convert non-objects to objects with content
              });
              
              data = adaptedData;
              console.log("Adapted data sample:", data.slice(0, 2));
            }
            
            setRawData(data); // Store the raw data for processing
            
            // Display preview of first few records
            setPreviewData({
              records: data.length,
              sample: JSON.stringify(data.slice(0, 1), null, 2)
            });
            
          } catch (err) {
            console.error("JSON parse error:", err);
            
            // Try to determine the format of the file
            const fileContent = e.target.result;
            const firstFewChars = fileContent.slice(0, 100).trim();
            const errorDetails = err.toString();
            
            // Special handling for various formats
            if (firstFewChars.startsWith('[{') && firstFewChars.includes('"')) {
              setError('JSON parsing failed, but file appears to be in a JSON array format. The file might have invalid syntax or special characters. Please check the file format.');
            } else if (firstFewChars.startsWith('{') && firstFewChars.includes('"')) {
              setError('JSON parsing failed, but file appears to be in a JSON object format. The file might have invalid syntax or special characters. Please check the file format.');
            } else if (firstFewChars.includes(',') && firstFewChars.includes('\n')) {
              setError('The file appears to be in a CSV or similar format, not JSON. Please convert to JSON first.');
            } else {
              setError('Failed to parse JSON file: ' + errorDetails);
            }
            
            setRawData(null);
          }
        };
        reader.readAsText(selectedFile);
      } else {
        setFile(null);
        setError('Please upload a valid JSON file');
      }
    }
  };

  // Transform raw data using field mappings
  const getTransformedData = () => {
    if (!rawData || !fieldMappings || !fieldMappings.content) {
      return rawData;
    }
    
    return rawData.map(item => {
      const transformed = { };
      
      // Apply mappings
      Object.entries(fieldMappings).forEach(([expectedField, sourceField]) => {
        if (sourceField && item[sourceField] !== undefined) {
          transformed[expectedField] = item[sourceField];
        }
      });
      
      // Ensure we have a content field
      if (!transformed.content && item.content) {
        transformed.content = item.content;
      }
      
      // Include the original fields too
      return { ...item, ...transformed };
    });
  };

  // Upload data to Weaviate
  const uploadToWeaviate = (data) => {
    try {
      if (!weaviateClient.isConfigured()) {
        console.warn("Weaviate not configured, skipping vector upload");
        return Promise.resolve({ success: false, reason: 'notConfigured' });
      }
      
      // Initialize the client - returns a Promise
      return weaviateClient.initialize()
        .then(initialized => {
          if (!initialized) {
            return { success: false, reason: 'initFailed' };
          }
          
          // Add objects to the collection - returns a Promise
          return weaviateClient.addObjects(data);
        })
        .catch(error => {
          console.error("Error uploading to Weaviate:", error);
          return { success: false, error: error.message };
        });
    } catch (error) {
      console.error("Error in uploadToWeaviate:", error);
      return Promise.resolve({ success: false, error: error.message });
    }
  };

  const processData = async () => {
    if (!file || !rawData) {
      setError('Please select a file first');
      return;
    }

    // Validate that we have field mappings for required fields
    if (!fieldMappings.content) {
      setError('Content field mapping is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get transformed data based on field mappings
      const transformedData = getTransformedData();
      console.log("Transformed data sample:", transformedData.slice(0, 2));
      
      // Process data incrementally with progress updates
      let progressCounter = 0;
      const updateProgress = () => {
        progressCounter += 5;
        setProgress(Math.min(progressCounter, 100));
      };

      const intervalId = setInterval(updateProgress, 100);

      // Upload to Weaviate if enabled
      let weaviateUploadResult = { success: false, reason: 'skipped' };
      if (shouldUseWeaviate && weaviateStatus) {
        console.log("Uploading data to Weaviate...");
        weaviateUploadResult = await uploadToWeaviate(transformedData)
          .then(result => {
            console.log("Weaviate upload result:", result);
            updateProgress();
            return result;
          })
          .catch(error => {
            console.error("Error uploading to Weaviate:", error);
            updateProgress();
            return { success: false, error: error.message };
          });
      }

      // Process the data for different analyses using the transformed data
      let topicModelingResults, sentimentResults, timeSeriesResults, 
          clusteringResults, hallucinationResults;
          
      try {
        console.log("Starting topic modeling processing...");
        topicModelingResults = await performTopicModeling(transformedData);
        console.log("Topic modeling processed successfully:", !!topicModelingResults);
        updateProgress();
      } catch (err) {
        console.error("Error processing topic modeling:", err);
        topicModelingResults = null;
      }

      try {
        console.log("Starting sentiment analysis processing...");
        sentimentResults = await performSentimentAnalysis(transformedData);
        console.log("Sentiment analysis processed successfully:", !!sentimentResults);
        updateProgress();
      } catch (err) {
        console.error("Error processing sentiment analysis:", err);
        sentimentResults = null;
      }

      try {
        console.log("Starting time series processing...");
        timeSeriesResults = await performTimeSeriesAnalysis(transformedData);
        console.log("Time series processed successfully:", !!timeSeriesResults);
        updateProgress();
      } catch (err) {
        console.error("Error processing time series:", err);
        timeSeriesResults = null;
      }

      // For text clustering, try to use Weaviate vectors if available
      try {
        console.log("Starting text clustering processing...");
        // If Weaviate is available and upload was successful, get vectors from there
        if (shouldUseWeaviate && weaviateStatus && weaviateUploadResult.success) {
          console.log("Getting vectors from Weaviate for clustering...");
          const vectorData = await weaviateClient.getObjectsForClustering();
          if (vectorData && vectorData.length > 0) {
            console.log("Using Weaviate vectors for clustering");
            clusteringResults = {
              points: vectorData.map(item => ({
                id: item.id,
                text: item.text,
                coordinates: [0, 0], // Will be computed during visualization
                vector: item.vector,
                cluster: 0 // Will be assigned during visualization
              })),
              clusters: [],
              clusterCount: 5,
              useVectors: true // Flag to indicate we're using pre-computed vectors
            };
          } else {
            console.log("No vectors returned from Weaviate, falling back to local clustering");
            clusteringResults = await performTextClustering(transformedData);
          }
        } else {
          console.log("Weaviate not available, using local clustering");
          clusteringResults = await performTextClustering(transformedData);
        }
        console.log("Text clustering processed successfully:", !!clusteringResults);
        updateProgress();
      } catch (err) {
        console.error("Error processing text clustering:", err);
        clusteringResults = null;
      }

      try {
        console.log("Starting hallucination detection processing...");
        hallucinationResults = await performHallucinationDetection(transformedData);
        console.log("Hallucination detection processed successfully:", !!hallucinationResults);
      } catch (err) {
        console.error("Error processing hallucination detection:", err);
        hallucinationResults = null;
      }
      
      clearInterval(intervalId);
      setProgress(100);

      // Combine all results
      const analysisResults = {
        topicModeling: topicModelingResults,
        sentimentAnalysis: sentimentResults,
        timeSeries: timeSeriesResults,
        textClustering: clusteringResults,
        hallucination: hallucinationResults,
        rawData: transformedData, // Include the transformed data
        fieldMappings, // Include the field mappings
        weaviateStatus: {
          enabled: shouldUseWeaviate,
          connected: weaviateStatus,
          uploadSuccess: weaviateUploadResult.success,
          count: weaviateUploadResult.count
        }
      };

      // Call the callback function to update parent state
      onDataUpload(analysisResults);
      
      setLoading(false);
      setActiveStep(3);
    } catch (err) {
      console.error("Error in overall data processing:", err);
      setError('Error processing data: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Data for Analysis
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Weaviate Status */}
      {activeStep >= 0 && (
        <WeaviateStatus onStatusChange={setWeaviateStatus} />
      )}
      
      <Accordion 
        expanded={expandedSection === 'dataUpload'}
        onChange={handleAccordionChange('dataUpload')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Data Upload</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* Step 1: File Upload */}
          {activeStep === 0 && (
            <Box textAlign="center">
              <input
                accept=".json"
                style={{ display: 'none' }}
                id="upload-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="upload-file">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  size="large"
                  sx={{ mb: 2 }}
                >
                  Select JSON File
                </Button>
              </label>
              <Typography variant="body2" color="textSecondary">
                Select a JSON file containing your conversation data
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}
          
          {/* Step 2: Field Mapping */}
          {activeStep === 1 && rawData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                File Selected: {file ? file.name : 'None'}
              </Typography>
              
              {previewData && (
                <Box mb={3}>
                  <Typography variant="subtitle1">Preview:</Typography>
                  <Typography variant="body2">Records: {previewData.records}</Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      mt: 1, 
                      maxHeight: '200px', 
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      bgcolor: '#f5f5f5'
                    }}
                  >
                    {previewData.sample}
                  </Paper>
                </Box>
              )}
              
              <FieldMapper 
                data={rawData} 
                onFieldsSelected={handleFieldsSelected} 
              />
              
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFile(null);
                    setRawData(null);
                    setActiveStep(0);
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={applyMappings}
                  disabled={!fieldMappings.content}
                >
                  Continue with Mapping
                </Button>
              </Stack>
            </Box>
          )}
          
          {/* Step 3: Processing */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Ready to Process Data
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Paper sx={{ p: 2, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Processing Options:
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shouldUseWeaviate}
                        onChange={(e) => setShouldUseWeaviate(e.target.checked)}
                        disabled={!weaviateStatus}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" component="span">
                          Store and analyze in vector database
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Improves text clustering with better embeddings
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Box>
              
              {loading ? (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Processing... {progress}%
                  </Typography>
                </Box>
              ) : (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setActiveStep(1);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={processData}
                    startIcon={<StorageIcon />}
                  >
                    Process Data
                  </Button>
                </Stack>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}
          
          {/* Step 4: Results */}
          {activeStep === 3 && (
            <Box textAlign="center">
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Data Processing Complete!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your data has been processed and is ready for analysis.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFile(null);
                    setRawData(null);
                    setActiveStep(0);
                  }}
                >
                  Upload Another File
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/topic-modeling')}
                >
                  View Analysis
                </Button>
              </Stack>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
      
      {/* Instructions */}
      <Accordion 
        expanded={expandedSection === 'instructions'}
        onChange={handleAccordionChange('instructions')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Data Format Instructions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            The dashboard expects JSON files with a specific structure:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Box component="li">
              <Typography>Must contain a <code>content</code> column with message text</Typography>
            </Box>
            <Box component="li">
              <Typography>For message pairing, should have a <code>sender</code> column (with values like 'candidate' or 'bot')</Typography>
            </Box>
            <Box component="li">
              <Typography>For time series analysis, should have a <code>createdAt</code> column with timestamps</Typography>
            </Box>
            <Box component="li">
              <Typography>For threading, should have a <code>botThreadId</code> or <code>threadId</code> column</Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            Vector Database Integration
          </Typography>
          <Typography variant="body2" paragraph>
            When enabled, the dashboard will:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Box component="li">
              <Typography variant="body2">Store your data in a Weaviate vector database</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2">Generate embeddings for better text clustering</Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2">Enable semantic search capabilities</Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Container>
  );
}

export default UploadPage;