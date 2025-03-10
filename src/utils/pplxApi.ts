import axios from 'axios';
// Environment variables in React are loaded automatically through the build process
// No need to use dotenv directly in browser code
/**
 * Interface for the PPLX API response
 */
interface PplxResponse {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      content: string;
      role: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

/**
 * Function to extract keywords from a job description using PPLX API
 * @param jobDescription - The job description text
 * @returns Promise containing array of keywords
 */
export const extractKeywordsWithPplx = async (jobDescription: string): Promise<string[]> => {
  // Ensure job description is provided
  if (!jobDescription || jobDescription.trim() === '') {
    console.log('No job description provided');
    return [];
  }

  // Clean up job description - remove any problematic characters
  const cleanJobDescription = jobDescription
    .replace(/[^\w\s,.;:'"!?()-]/g, '') // Remove special characters
    .trim();
    
  if (cleanJobDescription.length < 20) {
    console.log('Job description too short after cleaning:', cleanJobDescription);
    return [];
  }

  try {
    // PPLX API endpoint
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    // Get API key from environment variable
    const apiKey = process.env.REACT_APP_PPLX_API_KEY;
    
    if (!apiKey) {
      console.error('PPLX API key not found. Please add REACT_APP_PPLX_API_KEY to your environment variables.');
      return [];
    }

    console.log('Making API request to Perplexity AI...');
    console.log('Job description length:', cleanJobDescription.length);
    
    // Use a simplified prompt that's more direct
    const userPrompt = `Extract 5-10 professional keywords from this job description that would be valuable to include in a resume. Return ONLY a JSON array of strings like this: ["keyword1","keyword2"]. Job description: ${cleanJobDescription.slice(0, 1500)}`;
    
    // Prepare the API request
    const response = await axios.post<PplxResponse>(
      apiUrl,
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

    // Process the API response
    console.log('Received response from API');
    
    // The response format changed in newer API versions
    const result = response.data.choices[0]?.message?.content || '';
    console.log('Raw API response content:', result);
    
    // If the response is empty, return empty array
    if (!result || result.trim() === '') {
      console.error('Empty response from API');
      return [];
    }
    
    // Try different parsing approaches
    try {
      // First try: Direct JSON parse if the response is already a clean JSON array
      try {
        const directParse = JSON.parse(result);
        if (Array.isArray(directParse)) {
          console.log('Successfully parsed keywords using direct JSON parse');
          return directParse.filter(keyword => typeof keyword === 'string' && keyword.length > 0);
        }
      } catch (directParseError) {
        console.log('Direct JSON parse failed, trying regex extraction');
      }
      
      // Second try: Extract with regex
      const keywordsMatch = result.match(/\[([\s\S]*?)\]/);
      if (keywordsMatch && keywordsMatch[0]) {
        const arrayText = keywordsMatch[0];
        console.log('Extracted array text:', arrayText);
        
        // Parse the extracted array
        const keywords = JSON.parse(arrayText);
        if (Array.isArray(keywords)) {
          console.log('Successfully parsed keywords using regex extraction');
          return keywords.filter(keyword => typeof keyword === 'string' && keyword.length > 0);
        }
      }
      
      // Third try: Split by commas and clean up if JSON parsing fails
      if (result.includes(',')) {
        console.log('Trying comma splitting as fallback');
        const keywordCandidates = result
          .replace(/[\[\]"']/g, '')
          .split(',')
          .map(k => k.trim())
          .filter(k => k && k.length > 0);
          
        if (keywordCandidates.length > 0) {
          console.log('Successfully extracted keywords using comma splitting');
          return keywordCandidates;
        }
      }
      
      // Last resort: Look for words or phrases in quotes
      const quotedPhrases = result.match(/"([^"]*)"|'([^']*)'/g);
      if (quotedPhrases && quotedPhrases.length > 0) {
        console.log('Extracted quoted phrases as fallback');
        return quotedPhrases
          .map(phrase => phrase.replace(/["']/g, '').trim())
          .filter(phrase => phrase.length > 0);
      }
      
      // If all else fails, extract any words that look like they could be skills
      const possibleSkills = result.split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          !['the', 'and', 'that', 'with', 'for', 'from'].includes(word.toLowerCase())
        );
        
      if (possibleSkills.length > 0) {
        console.log('Extracted possible skills as last resort');
        return possibleSkills.slice(0, 10); // Limit to 10 skills
      }
      
      console.error('Failed to extract keywords from response:', result);
      return [];
    } catch (parseError) {
      console.error('Error parsing keyword JSON:', parseError);
      console.error('Raw response was:', result);
      return [];
    }
  } catch (error) {
    console.error('Error extracting keywords with PPLX API:', error);
    // Log more details about the error
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
    }
    return [];
  }
};

/**
 * Function to fix formatting issues in a resume using PPLX API
 * @param resumeContent - The resume content to format
 * @returns Promise containing properly formatted resume content
 */
export const fixResumeFormatting = async (resumeContent: string): Promise<string> => {
  // Ensure resume content is provided
  if (!resumeContent || resumeContent.trim() === '') {
    console.log('No resume content provided');
    return '';
  }

  // Add a unique identifier to each content we process to avoid reprocessing
  // Check if this content has a processing marker at the end
  if (resumeContent.endsWith('___FORMATTED___')) {
    console.log('Content already has formatting marker, skipping API call');
    return resumeContent;
  }

  try {
    // PPLX API endpoint
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    
    // Get API key from environment variable
    const apiKey = process.env.REACT_APP_PPLX_API_KEY;
    
    if (!apiKey) {
      console.error('PPLX API key not found. Please add REACT_APP_PPLX_API_KEY to your environment variables.');
      return resumeContent + '___FORMATTED___'; // Return original content with marker if no API key
    }

    console.log('Making API request to Perplexity AI for resume formatting...');
    console.log('Resume content length:', resumeContent.length);
    
    // Check if content is HTML or plain text
    const isHtml = resumeContent.includes('<') && resumeContent.includes('>');
    
    // If resume is too long, we should truncate it to prevent API issues
    // Typical token limits are around 4096, but we'll be conservative
    const MAX_CONTENT_LENGTH = 3000;
    const truncatedContent = resumeContent.length > MAX_CONTENT_LENGTH
      ? resumeContent.substring(0, MAX_CONTENT_LENGTH) + (isHtml ? ' ...' : '...')
      : resumeContent;
    
    if (resumeContent.length > MAX_CONTENT_LENGTH) {
      console.log(`Resume content truncated from ${resumeContent.length} to ${MAX_CONTENT_LENGTH} characters for API request`);
    }
    
    // Create a prompt based on the content type
    let userPrompt = '';
    
    if (isHtml) {
      userPrompt = `Format this HTML resume. Fix spacing and alignment only. Preserve all content. 

IMPORTANT: Return ONLY the formatted HTML resume. DO NOT include explanations, markdown code blocks, or "Changes Made" sections.

${truncatedContent}`;
    } else {
      userPrompt = `Format this resume text. Improve spacing, structure, and alignment. Preserve all content.

IMPORTANT: Return ONLY the formatted resume text. DO NOT include explanations, markdown code blocks, or "Changes Made" sections.

${truncatedContent}`;
    }
    
    // Prepare the API request
    console.log('Sending API request...');
    const response = await axios.post<PplxResponse>(
      apiUrl,
      {
        model: 'sonar', // Valid model from the documentation
        messages: [
          {
            role: 'system',
            content: 'You are a resume formatter. Your only task is to fix resume formatting issues without changing content. Return ONLY the formatted resume. Never include explanations, commentary, markdown code blocks like ```html or ```, or "Changes Made" sections in your response.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 3000, // Increase token limit to ensure complete response
        temperature: 0.1 // Lower temperature for more consistent results
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30-second timeout for the request
      }
    );

    // Process the API response
    console.log('Received formatting response from API');
    
    // Get the formatted content from the response
    let formattedContent = response.data.choices[0]?.message?.content || '';
    console.log('Formatted content length:', formattedContent.length);
    
    // More thorough cleanup to remove code blocks and explanations
    formattedContent = formattedContent
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();
      
    // Remove any explanatory sections using indexOf
    const explanationMarkers = [
      "### Changes Made:",
      "Changes Made:",
      "Here's the formatted",
      "I've formatted"
    ];
    
    for (const marker of explanationMarkers) {
      const index = formattedContent.indexOf(marker);
      if (index > 0) {
        formattedContent = formattedContent.substring(0, index).trim();
      }
    }
    
    // If the response is empty, return the original content
    if (!formattedContent || formattedContent.trim() === '') {
      console.error('Empty response from API');
      return resumeContent + '___FORMATTED___';
    }
    
    // If the content was truncated but the API returned something
    // We should return the formatted part and keep the original remainder
    let finalContent;
    if (resumeContent.length > MAX_CONTENT_LENGTH && formattedContent.length > 0) {
      console.log('Merging formatted content with original remainder');
      finalContent = formattedContent + resumeContent.substring(MAX_CONTENT_LENGTH);
    } else {
      finalContent = formattedContent;
    }
    
    // Add marker to indicate this content has been processed
    return finalContent + '___FORMATTED___';
  } catch (error) {
    console.error('Error fixing resume formatting with PPLX API:', error);
    // Log more details about the error
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
    }
    // Return original content with marker if there's an error to prevent reprocessing
    return resumeContent + '___FORMATTED___';
  }
}; 