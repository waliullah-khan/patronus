import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  CardMedia
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MoodIcon from '@mui/icons-material/Mood';
import TimelineIcon from '@mui/icons-material/Timeline';
import CloudIcon from '@mui/icons-material/Cloud';
import ErrorIcon from '@mui/icons-material/Error';

function Dashboard() {
  const navigate = useNavigate();

  const featuredCards = [
    {
      title: 'Topic Modeling',
      description: 'Discover main topics in your AI conversation data using Latent Dirichlet Allocation (LDA).',
      icon: <AccountTreeIcon fontSize="large" color="primary" />,
      path: '/topic-modeling',
      image: 'https://miro.medium.com/max/1200/1*9qX6EkuX7hZvbvYLHsATWQ.png'
    },
    {
      title: 'Sentiment Analysis',
      description: 'Analyze emotional tone in messages using VADER and other sentiment analysis techniques.',
      icon: <MoodIcon fontSize="large" color="primary" />,
      path: '/sentiment-analysis',
      image: 'https://miro.medium.com/max/1200/1*mQoLEWuYGQOFrq3OoEcCuQ.png'
    },
    {
      title: 'Time Series Analysis',
      description: 'Explore temporal patterns and trends in conversation data over time.',
      icon: <TimelineIcon fontSize="large" color="primary" />,
      path: '/time-series',
      image: 'https://miro.medium.com/max/1200/1*wsMmJNyR7mT-5v3onUJNrg.png'
    },
    {
      title: 'Text Clustering',
      description: 'Group similar messages using embeddings and visualize clusters.',
      icon: <CloudIcon fontSize="large" color="primary" />,
      path: '/text-clustering',
      image: 'https://miro.medium.com/max/1200/1*-pz2W7JaGvNDvGCSDRE5mA.png'
    },
    {
      title: 'Hallucination Detection',
      description: 'Detect potential AI hallucinations and evaluate factual consistency.',
      icon: <ErrorIcon fontSize="large" color="primary" />,
      path: '/hallucination-detection',
      image: 'https://miro.medium.com/max/1200/1*xTfbtvK8ZPJ2n6WYzYHxkQ.png'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          AI Response Analysis Dashboard
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          Comprehensive analysis tools for evaluating AI conversation data
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={() => navigate('/upload')}
          sx={{ mt: 2 }}
        >
          Upload Data to Begin
        </Button>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '8px', bgcolor: 'background.paper' }}>
        <Typography variant="h5" gutterBottom>
          Welcome to the AI Response Analysis Dashboard
        </Typography>
        <Typography>
          This dashboard provides a comprehensive set of tools to analyze conversation data from your AI assistants.
          Upload your JSON data to access a variety of analysis techniques including topic modeling, sentiment analysis,
          time series analysis, text clustering, and hallucination detection.
        </Typography>
      </Paper>

      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3 }}>
        Analysis Tools
      </Typography>

      <Grid container spacing={4}>
        {featuredCards.map((card) => (
          <Grid item key={card.title} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <CardMedia
                component="img"
                height="140"
                image={card.image}
                alt={card.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  {card.icon}
                  <Typography variant="h6" component="h2" ml={1}>
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate(card.path)}
                >
                  Explore
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Dashboard; 