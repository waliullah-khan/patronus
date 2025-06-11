// Advanced text clustering utilities that work with pre-computed vectors
import * as d3 from 'd3';

/**
 * Performs k-means clustering on vector data
 * @param {Array} vectors Array of vectors to cluster
 * @param {number} k Number of clusters
 * @param {number} iterations Maximum number of iterations
 * @returns {Object} Clustering result with centroids and assignments
 */
export function kMeansWithVectors(vectors, k = 5, iterations = 50) {
  if (!vectors || vectors.length < k) {
    throw new Error(`Not enough vectors for clustering. Need at least ${k} vectors.`);
  }

  // Initialize centroids using k-means++
  const centroids = [vectors[Math.floor(Math.random() * vectors.length)]];
  
  // Select remaining centroids with probability proportional to squared distance
  for (let i = 1; i < k; i++) {
    // Calculate distance to nearest centroid for each point
    const distances = vectors.map(vector => {
      return Math.min(...centroids.map(centroid => 
        euclideanDistance(vector, centroid)
      ));
    });
    
    // Choose next centroid with probability proportional to squared distance
    const sumDistSquared = distances.reduce((sum, dist) => sum + dist * dist, 0);
    let r = Math.random() * sumDistSquared;
    let j = 0;
    
    while (r > 0 && j < vectors.length) {
      r -= distances[j] * distances[j];
      j++;
    }
    
    centroids.push(vectors[Math.min(j, vectors.length - 1)]);
  }
  
  // Run k-means clustering
  let assignments = new Array(vectors.length).fill(0);
  let iterations_count = 0;
  let changed = true;
  
  while (changed && iterations_count < iterations) {
    changed = false;
    iterations_count++;
    
    // Assign points to nearest centroid
    for (let i = 0; i < vectors.length; i++) {
      const dists = centroids.map(c => euclideanDistance(vectors[i], c));
      const closestCentroid = dists.indexOf(Math.min(...dists));
      
      if (assignments[i] !== closestCentroid) {
        assignments[i] = closestCentroid;
        changed = true;
      }
    }
    
    // Update centroids
    for (let j = 0; j < k; j++) {
      const assignedVectors = vectors.filter((_, i) => assignments[i] === j);
      
      if (assignedVectors.length > 0) {
        // Calculate average vector
        const dims = assignedVectors[0].length;
        const newCentroid = new Array(dims).fill(0);
        
        for (const vector of assignedVectors) {
          for (let d = 0; d < dims; d++) {
            newCentroid[d] += vector[d] / assignedVectors.length;
          }
        }
        
        centroids[j] = newCentroid;
      }
    }
  }
  
  return { centroids, assignments };
}

/**
 * Projects high-dimensional vectors to 2D space using t-SNE algorithm
 * This is a simplified implementation of t-SNE for visualization purposes
 * @param {Array} vectors Array of vectors to project
 * @param {number} iterations Number of iterations for the optimization
 * @returns {Array} Array of 2D points
 */
export function tSNEProjection(vectors, iterations = 1000) {
  if (!vectors || vectors.length === 0) {
    return [];
  }

  // Calculate pairwise distances
  const distances = [];
  for (let i = 0; i < vectors.length; i++) {
    distances[i] = [];
    for (let j = 0; j < vectors.length; j++) {
      distances[i][j] = euclideanDistance(vectors[i], vectors[j]);
    }
  }
  
  // Convert distances to probabilities (Gaussian kernel with adaptive sigma)
  const perplexity = Math.min(30, Math.max(5, Math.floor(vectors.length / 5)));
  const probs = convertDistancesToProbabilities(distances, perplexity);
  
  // Initialize 2D coordinates randomly
  const points = Array(vectors.length).fill().map(() => [
    Math.random() * 0.0001, 
    Math.random() * 0.0001
  ]);
  
  // Perform gradient descent
  const learningRate = 100;
  const earlyExaggeration = 12;
  
  // Main optimization loop
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate gradient
    const gradient = calculateGradient(points, probs, 
      iter < iterations / 5 ? earlyExaggeration : 1);
      
    // Update points
    for (let i = 0; i < points.length; i++) {
      for (let d = 0; d < 2; d++) {
        points[i][d] -= learningRate * gradient[i][d];
      }
    }
    
    // Normalize to prevent points from drifting too far
    if (iter % 50 === 0) {
      normalizePoints(points);
    }
  }
  
  // Final normalization
  normalizePoints(points);
  
  return points;
}

/**
 * Calculate Euclidean distance between two vectors
 * @param {Array} a First vector
 * @param {Array} b Second vector
 * @returns {number} Euclidean distance
 */
function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) {
    return Infinity;
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

/**
 * Convert distances to probabilities using perplexity-based Gaussian kernel
 * @param {Array} distances Pairwise distance matrix
 * @param {number} perplexity Target perplexity
 * @returns {Array} Probability matrix
 */
function convertDistancesToProbabilities(distances, perplexity) {
  const n = distances.length;
  const probs = Array(n).fill().map(() => Array(n).fill(0));
  
  // Find appropriate sigma for each point
  for (let i = 0; i < n; i++) {
    const sigma = findSigma(distances[i], perplexity, i);
    
    // Convert distances to probabilities
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        probs[i][j] = Math.exp(-distances[i][j] * distances[i][j] / (2 * sigma * sigma));
      }
    }
    
    // Normalize
    const sum = probs[i].reduce((a, b) => a + b, 0);
    for (let j = 0; j < n; j++) {
      probs[i][j] /= sum;
    }
  }
  
  // Symmetrize the probabilities
  const symProbs = Array(n).fill().map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      symProbs[i][j] = (probs[i][j] + probs[j][i]) / (2 * n);
    }
  }
  
  return symProbs;
}

/**
 * Find appropriate sigma for perplexity-based probability conversion
 * @param {Array} distances Array of distances from a point
 * @param {number} perplexity Target perplexity
 * @param {number} i Index of the point
 * @returns {number} Appropriate sigma value
 */
function findSigma(distances, perplexity, i) {
  // Binary search for sigma
  let sigmaMin = 0.0001;
  let sigmaMax = 1000;
  let sigma = 1.0;
  
  const target = Math.log(perplexity);
  
  for (let iter = 0; iter < 50; iter++) {
    // Calculate entropy with current sigma
    let entropy = 0;
    
    // Gaussian kernel with current sigma
    const probs = [];
    for (let j = 0; j < distances.length; j++) {
      if (i === j) {
        probs[j] = 0;
      } else {
        probs[j] = Math.exp(-distances[j] * distances[j] / (2 * sigma * sigma));
      }
    }
    
    // Normalize
    const sum = probs.reduce((a, b) => a + b, 0);
    for (let j = 0; j < probs.length; j++) {
      probs[j] /= sum;
      
      // Entropy contribution (avoiding log(0))
      if (probs[j] > 1e-10) {
        entropy -= probs[j] * Math.log(probs[j]);
      }
    }
    
    // Check if we're close enough
    if (Math.abs(entropy - target) < 0.01) {
      break;
    }
    
    // Binary search update
    if (entropy < target) {
      sigmaMin = sigma;
      sigma = (sigma + sigmaMax) / 2;
    } else {
      sigmaMax = sigma;
      sigma = (sigma + sigmaMin) / 2;
    }
  }
  
  return sigma;
}

/**
 * Calculate gradient for t-SNE optimization
 * @param {Array} points 2D points
 * @param {Array} probs High-dimensional probabilities
 * @param {number} exaggeration Exaggeration factor for early iterations
 * @returns {Array} Gradient
 */
function calculateGradient(points, probs, exaggeration) {
  const n = points.length;
  const gradient = Array(n).fill().map(() => [0, 0]);
  
  // Calculate low-dimensional affinities (Student's t-distribution)
  const qij = Array(n).fill().map(() => Array(n).fill(0));
  let qSum = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const dist = Math.pow(points[i][0] - points[j][0], 2) + 
                     Math.pow(points[i][1] - points[j][1], 2);
        qij[i][j] = 1 / (1 + dist);
        qSum += qij[i][j];
      }
    }
  }
  
  // Normalize q
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      qij[i][j] /= qSum;
    }
  }
  
  // Calculate gradient
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const pij = probs[i][j] * exaggeration;
        const qij_val = qij[i][j];
        
        // Gradient contribution
        const factor = 4 * (pij - qij_val) * qij_val;
        
        for (let d = 0; d < 2; d++) {
          gradient[i][d] += factor * (points[i][d] - points[j][d]);
        }
      }
    }
  }
  
  return gradient;
}

/**
 * Normalize 2D points to have zero mean and unit variance
 * @param {Array} points Array of 2D points
 */
function normalizePoints(points) {
  if (!points || points.length === 0) {
    return;
  }
  
  // Calculate mean
  const mean = [0, 0];
  for (const point of points) {
    mean[0] += point[0] / points.length;
    mean[1] += point[1] / points.length;
  }
  
  // Calculate standard deviation
  let variance = [0, 0];
  for (const point of points) {
    variance[0] += Math.pow(point[0] - mean[0], 2) / points.length;
    variance[1] += Math.pow(point[1] - mean[1], 2) / points.length;
  }
  
  const std = [Math.sqrt(variance[0]), Math.sqrt(variance[1])];
  
  // Normalize points
  for (const point of points) {
    point[0] = (point[0] - mean[0]) / (std[0] || 1);
    point[1] = (point[1] - mean[1]) / (std[1] || 1);
  }
}

/**
 * Process vectors for text clustering visualization
 * @param {Object} data Object containing text content and vectors
 * @returns {Object} Processed data with 2D coordinates and cluster assignments
 */
export function processVectorData(data) {
  if (!data || !data.points || data.points.length === 0) {
    throw new Error("Invalid data for vector processing");
  }
  
  // Extract vectors from data points
  const vectors = data.points.map(point => point.vector);
  
  // Check if we have vectors
  if (!vectors[0]) {
    throw new Error("No vector data found");
  }
  
  // Project vectors to 2D using t-SNE
  const coords = tSNEProjection(vectors);
  
  // Perform k-means clustering
  const k = data.clusterCount || 5;
  const { assignments } = kMeansWithVectors(vectors, k);
  
  // Update data points with coordinates and cluster assignments
  const updatedPoints = data.points.map((point, i) => ({
    ...point,
    coordinates: coords[i],
    cluster: assignments[i]
  }));
  
  // Compute cluster statistics
  const clusters = [];
  for (let c = 0; c < k; c++) {
    const clusterPoints = updatedPoints.filter(p => p.cluster === c);
    
    // Skip empty clusters
    if (clusterPoints.length === 0) continue;
    
    // Extract sample text
    const sampleTexts = clusterPoints.slice(0, 5).map(p => p.text);
    
    // Simple keyword extraction by word frequency
    const wordCounts = {};
    clusterPoints.forEach(point => {
      const words = point.text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    
    // Get top keywords
    const keyTerms = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
    
    clusters.push({
      id: c,
      size: clusterPoints.length,
      keyTerms,
      samples: sampleTexts
    });
  }
  
  return {
    points: updatedPoints,
    clusters,
    clusterCount: clusters.length
  };
}