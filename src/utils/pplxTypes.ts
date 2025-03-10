/**
 * Interface for the PPLX API response
 */
export interface PplxResponse {
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