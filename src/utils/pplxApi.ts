import { extractKeywordsWithPplx } from './keywordExtractor';
import { fixResumeFormatting } from './resumeFormatter';
import type { PplxResponse } from './pplxTypes';
import axios from 'axios';

/**
 * Configuration options for the PPLX API call
 */
export interface PplxApiCallOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  retries?: number;
}

/**
 * Make a call to the Perplexity AI API
 * @param options - Configuration options for the API call
 * @returns Promise with the API response content
 */
export async function callPplxApi(options: PplxApiCallOptions): Promise<string> {
  // PPLX API endpoint
  const apiUrl = 'https://api.perplexity.ai/chat/completions';
  
  // Get API key from environment variable
  const apiKey = process.env.REACT_APP_PPLX_API_KEY;
  
  if (!apiKey) {
    console.error('PPLX API key not found. Please add REACT_APP_PPLX_API_KEY to your environment variables.');
    throw new Error('PPLX API key not found');
  }

  // Use provided options or defaults
  const model = options.model || 'sonar';
  const maxTokens = options.maxTokens || 1000;
  const temperature = options.temperature || 0.1;
  const timeoutMs = options.timeoutMs || 60000; // Increased default timeout to 60 seconds
  const maxRetries = options.retries || 2; // Default to 2 retries
  
  let retryCount = 0;
  let lastError: any = null;

  while (retryCount <= maxRetries) {
    try {
      console.log(`Making API request to Perplexity AI... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // Prepare the API request
      const response = await axios.post<PplxResponse>(
        apiUrl,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: options.systemPrompt
            },
            {
              role: 'user',
              content: options.userPrompt
            }
          ],
          max_tokens: maxTokens,
          temperature: temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: timeoutMs
        }
      );
      
      // Extract the content from the response
      const result = response.data.choices[0]?.message?.content || '';
      return result;
    } catch (error) {
      lastError = error;
      
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        console.warn(`API request timed out (Attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying API request in 2 seconds... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
          continue;
        }
      }
      
      console.error('Error calling PPLX API:', error);
      // Log more details about the error
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data
        });
      }
      throw error;
    }
  }
  
  // This will only be reached if all retries were used up
  throw lastError;
}

// Re-export the functions and types
export { extractKeywordsWithPplx, fixResumeFormatting };
export type { PplxResponse }; 