// Weaviate client implementation for vector database integration

// Default model to use for embeddings
const DEFAULT_MODEL = 'Snowflake/snowflake-arctic-embed-l-v2.0';

// Create a weaviate client for interacting with the vector database
class WeaviateClient {
  constructor() {
    this.url = process.env.REACT_APP_WEAVIATE_URL;
    this.apiKey = process.env.REACT_APP_WEAVIATE_API_KEY;
    this.collectionName = 'hacker-textlysis';
    this.initialized = false;

    // Create HTTP client with proper Authorization
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
  }

  // Check if client is properly configured
  isConfigured() {
    return this.url && this.apiKey;
  }

  // Initialize the client and create collection if it doesn't exist
  initialize() {
    if (!this.isConfigured()) {
      console.error("Weaviate client not configured - missing URL or API key");
      return Promise.resolve(false);
    }

    try {
      // For the browser implementation, we'll simulate success
      // In a real implementation, this would check the collection
      this.initialized = true;
      return Promise.resolve(true);
    } catch (error) {
      console.error("Failed to initialize Weaviate client:", error);
      return Promise.resolve(false);
    }
  }

  // Get list of available collections
  getCollections() {
    // Simulate collection retrieval for browser use
    // In a real implementation, this would fetch collections from the API
    return Promise.resolve([this.collectionName]);
  }

  // Create the collection with appropriate schema
  createCollection() {
    // Simulate collection creation for browser use
    console.log(`Created collection: ${this.collectionName}`);
    return Promise.resolve(true);
  }

  // Add objects to the collection
  addObjects(objects) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!Array.isArray(objects) || objects.length === 0) {
      console.error("Invalid objects for adding to Weaviate");
      return Promise.resolve({ success: false, count: 0 });
    }

    try {
      // Process in batches of 50 objects for better performance
      const batches = this.chunkArray(objects, 50);
      console.log(`Processing ${batches.length} batches of objects to Weaviate`);
      
      // Create promises for all batches
      const batchPromises = batches.map(batch => {
        const weaviateObjects = batch.map(obj => ({
          class: this.collectionName,
          properties: {
            content: obj.content || "",
            sender: obj.sender || "",
            intent: obj.intent || "",
            createdAt: obj.createdAt || new Date().toISOString(),
            threadId: obj.botThreadId || obj.threadId || ""
          }
        }));

        // Actual API call to Weaviate
        return fetch(`${this.url}/v1/batch/objects`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({ objects: weaviateObjects })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Weaviate upload failed: ${response.status}`);
          }
          return response.json();
        });
      });
      
      // Execute all batch requests
      return Promise.all(batchPromises)
        .then(results => {
          const totalAdded = results.reduce((sum, result) => {
            return sum + (result.objects ? result.objects.length : 0);
          }, 0);
          
          console.log(`Successfully added ${totalAdded} objects to Weaviate`);
          return { success: true, count: totalAdded };
        })
        .catch(error => {
          console.error("Error in batch processing:", error);
          return { success: false, count: 0, error: error.message };
        });
    } catch (error) {
      console.error("Error adding objects to Weaviate:", error);
      return Promise.resolve({ success: false, count: 0, error: error.message });
    }
  }

  // Get embeddings for objects
  getEmbeddings(texts) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      console.error("Invalid texts for embedding generation");
      return Promise.resolve(null);
    }

    try {
      // Simulate vector generation for browser use
      // In a real implementation, this would call the Weaviate API
      const mockVectors = texts.map(() => 
        Array(128).fill().map(() => Math.random() - 0.5)
      );
      
      return Promise.resolve(mockVectors);
    } catch (error) {
      console.error("Error getting embeddings from Weaviate:", error);
      return Promise.resolve(null);
    }
  }

  // Search for similar objects
  searchSimilar(text, limit = 10) {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      // Simulate searching for browser use
      // In a real implementation, this would query the Weaviate API
      return Promise.resolve([]);
    } catch (error) {
      console.error("Error searching Weaviate:", error);
      return Promise.resolve([]);
    }
  }

  // Get all objects for a specific cluster visualization
  getObjectsForClustering() {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      // Make a real request to get data with vectors from Weaviate
      return fetch(`${this.url}/v1/graphql`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          query: `
            {
              Get {
                ${this.collectionName}(limit: 500) {
                  content
                  sender
                  intent
                  createdAt
                  threadId
                  _additional {
                    vector
                  }
                }
              }
            }
          `
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Weaviate request failed: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Weaviate data received:", data);
        
        if (!data || !data.data || !data.data.Get || !data.data.Get[this.collectionName]) {
          console.warn("No valid data structure returned from Weaviate");
          return [];
        }
        
        // Transform the data to the format needed for clustering
        const objects = data.data.Get[this.collectionName];
        
        return objects.map((obj, index) => ({
          id: index,
          text: obj.content || "",
          sender: obj.sender || "",
          intent: obj.intent || "",
          vector: obj._additional?.vector || []
        }));
      })
      .catch(error => {
        console.error("Error fetching from Weaviate:", error);
        return [];
      });
    } catch (error) {
      console.error("Error getting objects for clustering:", error);
      return Promise.resolve([]);
    }
  }

  // Utility function to chunk arrays for batch processing
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Create and export a singleton instance
const weaviateClient = new WeaviateClient();
export default weaviateClient;