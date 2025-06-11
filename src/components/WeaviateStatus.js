import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button, 
  Paper,
  Divider,
  Chip
} from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SyncIcon from '@mui/icons-material/Sync';

import weaviateClient from '../utils/weaviateClient';

/**
 * Component to show the status of Weaviate vector database integration
 * @param {Object} props Component props
 * @param {boolean} props.onStatusChange Callback when status changes
 */
const WeaviateStatus = ({ onStatusChange }) => {
  const [status, setStatus] = useState('checking');  // 'checking', 'connected', 'error'
  const [error, setError] = useState(null);
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  // Check the Weaviate connection status
  const checkStatus = async () => {
    setChecking(true);
    setStatus('checking');
    
    try {
      if (!weaviateClient.isConfigured()) {
        setStatus('error');
        setError('Weaviate client not configured. Add REACT_APP_WEAVIATE_URL and REACT_APP_WEAVIATE_API_KEY to your .env file.');
        if (onStatusChange) onStatusChange(false);
        return;
      }
      
      const initialized = await weaviateClient.initialize();
      
      if (initialized) {
        setStatus('connected');
        setError(null);
        
        // Get collection list to show in the UI
        const collections = await weaviateClient.getCollections();
        setCollectionInfo({
          collections,
          main: collections.includes(weaviateClient.collectionName) ? weaviateClient.collectionName : null
        });
        
        if (onStatusChange) onStatusChange(true);
      } else {
        setStatus('error');
        setError('Could not initialize Weaviate client. Check your connection details.');
        if (onStatusChange) onStatusChange(false);
      }
    } catch (err) {
      setStatus('error');
      setError(`Error connecting to Weaviate: ${err.message}`);
      if (onStatusChange) onStatusChange(false);
    } finally {
      setChecking(false);
    }
  };

  // Check status on component mount
  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'success';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <CloudDoneIcon />;
      case 'error': return <CloudOffIcon />;
      default: return <CircularProgress size={20} />;
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Vector Database Status
        </Typography>
        
        <Chip
          icon={getStatusIcon()}
          label={status === 'checking' ? 'Checking connection...' : 
                status === 'connected' ? 'Connected' : 'Connection Error'}
          color={getStatusColor()}
          variant="outlined"
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        {status === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {status === 'connected' && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully connected to Weaviate vector database
            </Alert>
            
            {collectionInfo && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Collection: <strong>{weaviateClient.collectionName}</strong>
                  {collectionInfo.main ? ' (Ready)' : ' (Will be created on first upload)'}
                </Typography>
                
                {collectionInfo.collections.length > 0 && (
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Available collections: {collectionInfo.collections.join(', ')}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          startIcon={<SyncIcon />}
          onClick={checkStatus}
          disabled={checking}
          variant="outlined"
          size="small"
        >
          {checking ? 'Checking...' : 'Check Connection'}
        </Button>
      </Box>
    </Paper>
  );
};

export default WeaviateStatus;