import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Chip,
  Paper,
  Alert,
  Button
} from '@mui/material';

/**
 * FieldMapper component for mapping data fields to expected schema
 * @param {Object} props Component props
 * @param {Array} props.data The data array to map fields from
 * @param {Function} props.onFieldsSelected Callback when fields are selected
 * @param {boolean} props.isRequired Whether mapping is required before proceeding
 */
const FieldMapper = ({ data, onFieldsSelected, isRequired = true }) => {
  // Define expected fields and their descriptions
  const expectedFields = [
    { 
      id: 'content', 
      label: 'Message Content', 
      description: 'The actual text content of the message', 
      required: true 
    },
    { 
      id: 'sender', 
      label: 'Sender', 
      description: 'Who sent the message (e.g., candidate, bot)', 
      required: false 
    },
    { 
      id: 'intent', 
      label: 'Intent/Category', 
      description: 'The intent or category of the message', 
      required: false 
    },
    { 
      id: 'createdAt', 
      label: 'Created Date', 
      description: 'When the message was created', 
      required: false 
    },
    { 
      id: 'threadId', 
      label: 'Thread ID', 
      description: 'ID for grouping conversation threads', 
      required: false 
    }
  ];

  // State for field mappings and errors
  const [mappings, setMappings] = useState({});
  const [fields, setFields] = useState([]);
  const [errors, setErrors] = useState([]);
  const [sampleData, setSampleData] = useState({});
  const [mappingComplete, setMappingComplete] = useState(false);

  // Extract available fields from data
  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      setErrors([...errors, 'No valid data to extract fields from']);
      return;
    }
    
    // Extract fields from the first object in the data array
    const sample = data[0];
    const availableFields = Object.keys(sample).filter(field => {
      // Filter out MongoDB ID fields and fields that are objects or arrays
      const value = sample[field];
      const isValidType = typeof value === 'string' || typeof value === 'number' || value instanceof Date;
      
      // Special handling for MongoDB date objects or threadIDs
      if (typeof value === 'object' && value !== null) {
        if (value.$date || value.$oid) return true;
      }
      
      return isValidType || value === null;
    });
    
    setFields(availableFields);
    setSampleData(sample);

    // Try to auto-map fields based on common names
    const autoMappings = {};
    
    expectedFields.forEach(expectedField => {
      // Try to find an exact match
      let match = availableFields.find(field => 
        field.toLowerCase() === expectedField.id.toLowerCase());
      
      // If no exact match, try to find a field containing the expected field name
      if (!match) {
        match = availableFields.find(field => 
          field.toLowerCase().includes(expectedField.id.toLowerCase()));
      }
      
      // Special handling for certain fields
      if (!match) {
        // For content, try "text", "message", "body"
        if (expectedField.id === 'content') {
          match = availableFields.find(field => 
            ['text', 'message', 'body'].includes(field.toLowerCase()));
        }
        
        // For threadId, look for fields with 'thread' and 'id'
        if (expectedField.id === 'threadId') {
          match = availableFields.find(field => 
            field.toLowerCase().includes('thread') && field.toLowerCase().includes('id'));
        }
      }
      
      if (match) {
        autoMappings[expectedField.id] = match;
      }
    });
    
    setMappings(autoMappings);
  }, [data]);

  // Check if mappings are complete
  useEffect(() => {
    // Verify all required fields have mappings
    const requiredFields = expectedFields.filter(field => field.required);
    const hasAllRequired = requiredFields.every(field => mappings[field.id]);
    
    setMappingComplete(hasAllRequired);
    
    if (hasAllRequired && onFieldsSelected && typeof onFieldsSelected === 'function') {
      onFieldsSelected(mappings);
    }
  }, [mappings]);

  // Handle field selection change
  const handleFieldChange = (expectedField, selectedField) => {
    setMappings({
      ...mappings,
      [expectedField]: selectedField
    });
  };

  // Get sample value for a field
  const getSampleValue = (field) => {
    if (!field || !sampleData) return 'N/A';
    
    const value = sampleData[field];
    
    // Handle different types of values
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      // Handle MongoDB date objects
      if (value.$date) return new Date(value.$date).toLocaleString();
      // Handle MongoDB ObjectId
      if (value.$oid) return `ID: ${value.$oid.substring(0, 8)}...`;
      return JSON.stringify(value).substring(0, 30) + (JSON.stringify(value).length > 30 ? '...' : '');
    }
    
    return String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '');
  };

  // Apply the mappings and proceed
  const applyMappings = () => {
    if (onFieldsSelected && typeof onFieldsSelected === 'function') {
      onFieldsSelected(mappings);
    }
  };

  return (
    <Paper sx={{ p: 3, my: 2 }}>
      <Typography variant="h6" gutterBottom>
        Data Field Mapping
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Map fields from your data to the expected fields for analysis.
      </Typography>
      
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        {expectedFields.map((expectedField) => (
          <Grid item xs={12} md={6} key={expectedField.id}>
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id={`mapping-${expectedField.id}-label`}>
                  {expectedField.label} {expectedField.required && '(Required)'}
                </InputLabel>
                <Select
                  labelId={`mapping-${expectedField.id}-label`}
                  value={mappings[expectedField.id] || ''}
                  onChange={(e) => handleFieldChange(expectedField.id, e.target.value)}
                  label={`${expectedField.label} ${expectedField.required ? '(Required)' : ''}`}
                >
                  <MenuItem value="">
                    <em>Not Mapped</em>
                  </MenuItem>
                  {fields.map((field) => (
                    <MenuItem key={field} value={field}>
                      {field}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontSize: '0.75rem' }}>
                <Typography variant="caption" color="text.secondary">
                  {expectedField.description}
                </Typography>
                
                {mappings[expectedField.id] && (
                  <Chip 
                    label={`Sample: ${getSampleValue(mappings[expectedField.id])}`} 
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={applyMappings}
          disabled={isRequired && !mappingComplete}
        >
          Apply Mapping
        </Button>
      </Box>
    </Paper>
  );
};

export default FieldMapper;