// Test utility for directly testing the PPLX API
require('dotenv').config(); // Load environment variables from .env file
const axios = require('axios');

// Sample job description for testing
const sampleJobDescription = `
Senior Software Engineer - Frontend
We are looking for a skilled Frontend Developer with 3+ years of experience.
Required skills:
- JavaScript/TypeScript
- React.js or similar frontend frameworks
- HTML/CSS
- REST APIs
- Git version control
- Testing frameworks (Jest, React Testing Library)
`;

/**
 * Test function to directly call the PPLX API
 */
async function testPplxApi() {
  try {
    console.log('Starting PPLX API test...');
    
    // Get API key from environment variables
    const apiKey = process.env.REACT_APP_PPLX_API_KEY;
    
    if (!apiKey) {
      console.error('PPLX API key not found in environment variables. Please check your .env file.');
      return;
    }
    
    console.log('API Key found in environment:', apiKey.substring(0, 10) + '...');
    console.log('Making API request to Perplexity AI...');
    
    // Clean up job description - remove any problematic characters
    const cleanJobDescription = sampleJobDescription
      .replace(/[^\w\s,.;:'"!?()-]/g, '') // Remove special characters
      .trim();
      
    // Use a simplified prompt that's more direct
    const userPrompt = `Extract 5-10 professional keywords from this job description that would be valuable to include in a resume. Return ONLY a JSON array of strings like this: ["keyword1","keyword2"]. Job description: ${cleanJobDescription}`;
    
    // Make API request
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar', // Valid model from the documentation
        messages: [
          {
            role: 'system',
            content: 'You extract keywords from job descriptions to help with resume writing. Always respond with only a JSON array of strings.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1 // Lower temperature for more consistent results
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('API Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Extract content from response
    const content = response.data.choices[0]?.message?.content;
    console.log('\nRaw content from API:');
    console.log(content);
    
    // Try to parse keywords
    try {
      // Try direct JSON parse
      const directParse = JSON.parse(content);
      if (Array.isArray(directParse)) {
        console.log('\nSuccessfully parsed keywords using direct JSON parse:');
        console.log(directParse);
        return;
      }
    } catch (error) {
      console.log('Direct JSON parse failed, trying regex extraction');
    }
    
    // Try regex extraction
    const keywordsMatch = content.match(/\[([\s\S]*?)\]/);
    if (keywordsMatch && keywordsMatch[0]) {
      try {
        const keywords = JSON.parse(keywordsMatch[0]);
        console.log('\nSuccessfully parsed keywords using regex:');
        console.log(keywords);
        return;
      } catch (error) {
        console.log('Regex JSON parse failed');
      }
    }
    
    // Simple comma splitting as fallback
    if (content.includes(',')) {
      const keywordCandidates = content
        .replace(/[\[\]"']/g, '')
        .split(',')
        .map(k => k.trim())
        .filter(k => k && k.length > 0);
        
      if (keywordCandidates.length > 0) {
        console.log('\nExtracted keywords using comma splitting:');
        console.log(keywordCandidates);
        return;
      }
    }
    
    // Last resort: Look for words or phrases in quotes
    const quotedPhrases = content.match(/"([^"]*)"|'([^']*)'/g);
    if (quotedPhrases && quotedPhrases.length > 0) {
      console.log('\nExtracted quoted phrases as fallback:');
      console.log(quotedPhrases.map(phrase => phrase.replace(/["']/g, '').trim()));
      return;
    }
    
    console.log('\nFailed to extract keywords from response');
    
  } catch (error) {
    console.error('Error during API test:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request (no response received):', error.request);
    }
  }
}

// Run the test
testPplxApi(); 