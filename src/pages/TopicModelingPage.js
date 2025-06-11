import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import Plot from 'react-plotly.js';

function TopicModelingPage({ data }) {
  const [tabValue, setTabValue] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    // If data is available, select the first topic by default
    if (data && data.topics && data.topics.length > 0) {
      setSelectedTopic(data.topics[0]);
    }
  }, [data]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
  };

  // If no data is available, show a placeholder or loading message
  if (!data || !data.topics) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Topic Modeling
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">
            No data available. Please upload data first.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Mock data for visualizations
  const heatmapData = {
    z: [
      [0.8, 0.2, 0.3, 0.1, 0.05, 0.5, 0.4, 0.2, 0.1, 0.05],
      [0.1, 0.7, 0.2, 0.3, 0.1, 0.1, 0.2, 0.3, 0.2, 0.05],
      [0.05, 0.05, 0.6, 0.2, 0.05, 0.2, 0.1, 0.05, 0.6, 0.1],
      [0.01, 0.02, 0.05, 0.7, 0.2, 0.1, 0.01, 0.02, 0.05, 0.7],
      [0.05, 0.03, 0.02, 0.1, 0.8, 0.05, 0.03, 0.02, 0.1, 0.1]
    ],
    x: data.topics.map(topic => `Topic ${topic.id}: ${topic.name}`),
    y: ['Doc 1', 'Doc 2', 'Doc 3', 'Doc 4', 'Doc 5']
  };

  const topicDistribution = {
    x: data.topics.map(topic => `Topic ${topic.id}: ${topic.name}`),
    y: [0.23, 0.18, 0.15, 0.13, 0.11, 0.08, 0.06, 0.04, 0.01, 0.01].slice(0, data.topics.length),
    type: 'bar'
  };

  // Word clouds would typically be generated using a library like react-wordcloud
  // For this example, we'll simulate using a simple weighted list
  
  // Example documents for the selected topic
  const topicDocuments = [
    "This document strongly relates to the topic of workplace environment and discusses office culture.",
    "Leadership assessment is critical for organizational development and growth strategies.",
    "The application process for our company includes resume screening, initial interviews, and skills assessment.",
    "We are looking for candidates with experience in creating positive workplace environments.",
    "The hiring manager will conduct a thorough leadership assessment during the final interview."
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Topic Modeling Analysis
      </Typography>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Topic Overview" />
        <Tab label="Topic Distribution" />
        <Tab label="Document-Topic Heatmap" />
        <Tab label="Word Cloud" />
        <Tab label="Sample Documents" />
      </Tabs>
      
      {/* Topic Overview Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Topic List
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {data.topics.map((topic) => (
                  <Chip
                    key={topic.id}
                    label={`Topic ${topic.id}: ${topic.name}`}
                    onClick={() => handleTopicClick(topic)}
                    color={selectedTopic?.id === topic.id ? "primary" : "default"}
                    sx={{ my: 0.5, cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              {selectedTopic ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Topic Details: {selectedTopic.name}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    Key Words:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {selectedTopic.words.map((word, index) => (
                      <Chip
                        key={index}
                        label={word}
                        size="small"
                        sx={{ 
                          bgcolor: index < 3 ? 'primary.light' : 'default',
                          color: index < 3 ? 'primary.contrastText' : 'default'
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Topic Explanation:
                  </Typography>
                  <Typography>
                    This topic appears to be about {selectedTopic.name.toLowerCase()}. 
                    The key words suggest discussions related to {selectedTopic.words.slice(0, 3).join(', ')}.
                    This topic represents approximately {Math.round(topicDistribution.y[selectedTopic.id] * 100)}% 
                    of the overall conversation data.
                  </Typography>
                </>
              ) : (
                <Typography variant="body1">
                  Select a topic from the list to view details.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Topic Distribution Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Average Topic Distribution
          </Typography>
          <Box height={500}>
            <Plot
              data={[{
                ...topicDistribution,
                marker: {
                  color: 'rgb(76, 120, 168)'
                }
              }]}
              layout={{
                title: 'Average Topic Distribution Across All Documents',
                xaxis: {
                  title: 'Topics',
                  tickangle: 45
                },
                yaxis: {
                  title: 'Average Probability'
                },
                margin: {
                  l: 50,
                  r: 50,
                  b: 150,
                  t: 50,
                  pad: 4
                }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        </Paper>
      )}
      
      {/* Document-Topic Heatmap Tab */}
      {tabValue === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Document-Topic Distribution Heatmap
          </Typography>
          <Box height={500}>
            <Plot
              data={[{
                type: 'heatmap',
                z: heatmapData.z,
                x: heatmapData.x,
                y: heatmapData.y,
                colorscale: 'YlOrRd'
              }]}
              layout={{
                title: 'Topic Distribution Across First 5 Documents',
                xaxis: {
                  title: 'Topics',
                  tickangle: 45
                },
                yaxis: {
                  title: 'Documents'
                },
                margin: {
                  l: 100,
                  r: 50,
                  b: 150,
                  t: 50,
                  pad: 4
                }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        </Paper>
      )}
      
      {/* Word Cloud Tab */}
      {tabValue === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Topic Word Cloud
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Select a Topic:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {data.topics.map((topic) => (
                    <Chip
                      key={topic.id}
                      label={`Topic ${topic.id}: ${topic.name}`}
                      onClick={() => handleTopicClick(topic)}
                      color={selectedTopic?.id === topic.id ? "primary" : "default"}
                      sx={{ my: 0.5 }}
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              {selectedTopic && (
                <Paper sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Words for Topic {selectedTopic.id}: {selectedTopic.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                    {selectedTopic.words.map((word, index) => (
                      <Typography
                        key={index}
                        variant="body1"
                        sx={{
                          fontSize: `${Math.max(1, (10 - index) / 2)}rem`,
                          fontWeight: index < 3 ? 'bold' : 'normal',
                          opacity: Math.max(0.4, 1 - (index * 0.1)),
                          m: 1
                        }}
                      >
                        {word}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Sample Documents Tab */}
      {tabValue === 4 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Representative Documents for Selected Topic
          </Typography>
          {selectedTopic ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Topic {selectedTopic.id}: {selectedTopic.name}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Probability</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topicDocuments.map((doc, index) => (
                      <TableRow key={index}>
                        <TableCell>{doc}</TableCell>
                        <TableCell>{(0.9 - (index * 0.15)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Typography>
              Please select a topic to see representative documents.
            </Typography>
          )}
        </Paper>
      )}
      
      <Box mt={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            About Topic Modeling
          </Typography>
          <Typography variant="body1">
            Topic modeling is a technique for discovering the hidden themes or topics that occur in a collection of documents. 
            The algorithm uses statistical methods to analyze the words in each document and identify groups of words that frequently occur together.
            Each topic is represented as a distribution over words, and each document is represented as a distribution over topics.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default TopicModelingPage; 