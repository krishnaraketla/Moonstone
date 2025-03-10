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

  try {
    console.log('Making API request to Perplexity AI...');
    
    // Use provided options or defaults
    const model = options.model || 'sonar';
    const maxTokens = options.maxTokens || 1000;
    const temperature = options.temperature || 0.1;
    const timeoutMs = options.timeoutMs || 30000;
    
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

// Re-export the functions and types
export { extractKeywordsWithPplx, fixResumeFormatting };
export type { PplxResponse }; 