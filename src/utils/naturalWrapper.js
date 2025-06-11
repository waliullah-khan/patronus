// A lightweight wrapper around natural.js to make it browser-compatible
// This provides safe fallbacks for features that won't work in the browser

// Use try-catch to handle potential import failures
let natural;

try {
  natural = require('natural');
} catch (e) {
  console.warn("Failed to import natural.js directly. Using mock implementations.");
  natural = {};
}

// Default English stopwords if natural.StopwordsEn is unavailable
const defaultStopwords = [
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll',
  'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out',
  'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll',
  'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
  'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who',
  'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you',
  'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
];

// MockTokenizer class for fallback
class MockTokenizer {
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text.split(/\s+/).filter(Boolean);
  }
}

// MockTfIdf class for fallback
class MockTfIdf {
  constructor() {
    this.docs = [];
    this.terms = {};
  }
  
  addDocument(text) {
    if (!text) {
      this.docs.push('');
      return;
    }
    this.docs.push(text);
    
    // Create simple term frequency for the document
    const words = text.split(/\s+/).filter(Boolean);
    const docIndex = this.docs.length - 1;
    
    words.forEach(word => {
      if (!this.terms[word]) {
        this.terms[word] = [];
      }
      if (!this.terms[word][docIndex]) {
        this.terms[word][docIndex] = 0;
      }
      this.terms[word][docIndex]++;
    });
  }
  
  listTerms(docIndex) {
    if (docIndex >= this.docs.length) return [];
    
    const result = [];
    Object.keys(this.terms).forEach(term => {
      if (this.terms[term][docIndex]) {
        result.push({
          term: term,
          tfidf: this.terms[term][docIndex] / (this.docs[docIndex].split(/\s+/).length || 1)
        });
      }
    });
    
    return result.sort((a, b) => b.tfidf - a.tfidf);
  }
  
  tfidf(term, docIndex) {
    if (!this.terms[term] || !this.terms[term][docIndex]) return 0;
    return this.terms[term][docIndex] / (this.docs[docIndex].split(/\s+/).length || 1);
  }
}

// MockSentimentAnalyzer for fallback
class MockSentimentAnalyzer {
  constructor(language, stemmer, lexicon) {
    this.language = language;
    this.stemmer = stemmer;
    this.lexicon = lexicon;
    
    // Simple AFINN-style lexicon for common words
    this.simpleAFINN = {
      'good': 3, 'nice': 3, 'great': 4, 'excellent': 5, 'wonderful': 4,
      'bad': -3, 'terrible': -4, 'awful': -4, 'horrible': -5, 'poor': -2,
      'love': 4, 'hate': -4, 'like': 2, 'dislike': -2,
      'happy': 3, 'sad': -3, 'angry': -4, 'pleased': 3,
      'best': 5, 'worst': -5, 'better': 2, 'worse': -2
    };
  }
  
  getSentiment(tokens) {
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return 0;
    }
    
    let score = 0;
    let validTokens = 0;
    
    tokens.forEach(token => {
      const word = token.toLowerCase();
      if (this.simpleAFINN[word]) {
        score += this.simpleAFINN[word];
        validTokens++;
      }
    });
    
    // If no sentiment words found, generate a slightly random result
    if (validTokens === 0) {
      return (Math.random() * 0.4) - 0.2; // Between -0.2 and 0.2
    }
    
    // Normalize to -1 to 1 range
    return score / (validTokens * 5);
  }
}

// Mock PorterStemmer if not available
const mockPorterStemmer = {
  stem: word => {
    // Very simple stemming rules
    const simpleRules = [
      { suffix: 'ing', replacement: '' },
      { suffix: 'ed', replacement: '' },
      { suffix: 's', replacement: '' },
      { suffix: 'es', replacement: '' },
      { suffix: 'ly', replacement: '' },
      { suffix: 'ies', replacement: 'y' }
    ];
    
    if (!word || typeof word !== 'string') return '';
    
    let result = word.toLowerCase();
    for (const rule of simpleRules) {
      if (result.endsWith(rule.suffix)) {
        result = result.substring(0, result.length - rule.suffix.length) + rule.replacement;
        break;
      }
    }
    
    return result;
  }
};

// Safe extractors for the parts of natural we need
const safeNatural = {
  // Tokenizers
  WordTokenizer: natural.WordTokenizer || MockTokenizer,
  WordPunctTokenizer: natural.WordPunctTokenizer || MockTokenizer,
  
  // Stemmers
  PorterStemmer: natural.PorterStemmer || mockPorterStemmer,
  LancasterStemmer: natural.LancasterStemmer || mockPorterStemmer,
  
  // Stopwords
  StopwordsEn: natural.StopwordsEn || defaultStopwords,
  
  // TF-IDF
  TfIdf: natural.TfIdf || MockTfIdf,
  
  // Sentiment analysis (with fallback)
  SentimentAnalyzer: natural.SentimentAnalyzer || MockSentimentAnalyzer
};

// Create safe instances of commonly used tools
const tokenizer = new safeNatural.WordTokenizer();
// Ensure stopwords is always an array with an includes method
const stopwords = Array.isArray(safeNatural.StopwordsEn) 
  ? safeNatural.StopwordsEn 
  : defaultStopwords;

// Make sure stopwords has an includes method (for browsers that may not support it)
if (!stopwords.includes) {
  stopwords.includes = function(item) {
    return this.indexOf(item) !== -1;
  };
}

console.log("Natural wrapper initialized with the following components:", {
  hasWordTokenizer: !!safeNatural.WordTokenizer,
  hasPorterStemmer: !!safeNatural.PorterStemmer,
  hasTfIdf: !!safeNatural.TfIdf,
  hasSentimentAnalyzer: !!safeNatural.SentimentAnalyzer,
  stopwordsCount: stopwords.length
});

export {
  safeNatural as natural,
  tokenizer,
  stopwords
}; 