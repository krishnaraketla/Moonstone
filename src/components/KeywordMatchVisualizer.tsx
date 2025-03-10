import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/KeywordMatchVisualizer.css';
import { extractKeywordsWithPplx } from '../utils/pplxApi';

interface KeywordMatchVisualizerProps {
  jobDescription: string;
  resumeContent: string;
  onKeywordClick: (keyword: string) => void;
}

// Singleton to track API validation status across all component instances
const globalValidationState = {
  isValidated: false,
  isValidating: false,
  validationPromise: null as Promise<boolean> | null
};

// Create a simple fingerprint for job descriptions
const createFingerprint = (text: string): string => {
  const prefix = text.trim().slice(0, 50).replace(/\s+/g, ' ');
  const length = text.length;
  return `${prefix}_${length}`;
};

// Single shared promise for API validation
const validateApiOnce = async (): Promise<boolean> => {
  if (globalValidationState.isValidated) {
    return true;
  }
  
  if (globalValidationState.isValidating && globalValidationState.validationPromise) {
    return globalValidationState.validationPromise;
  }
  
  globalValidationState.isValidating = true;
  globalValidationState.validationPromise = new Promise<boolean>(async (resolve) => {
    try {
      // Use a minimal test query to save tokens
      const testResult = await extractKeywordsWithPplx("Software Engineer React");
      const isValid = testResult.length > 0;
      
      if (isValid) {
        console.log("PPLX API credentials validated successfully");
        globalValidationState.isValidated = true;
        resolve(true);
      } else {
        console.log("PPLX API responded but returned no keywords");
        resolve(false);
      }
    } catch (error) {
      console.error("PPLX API credential test failed:", error);
      resolve(false);
    } finally {
      globalValidationState.isValidating = false;
    }
  });
  
  return globalValidationState.validationPromise;
};

const KeywordMatchVisualizer: React.FC<KeywordMatchVisualizerProps> = ({
  jobDescription,
  resumeContent,
  onKeywordClick
}) => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [matchPercentage, setMatchPercentage] = useState<number>(0);
  const [removedKeywords, setRemovedKeywords] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useApiKeywords, setUseApiKeywords] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Track the last processed job description
  const lastProcessedJob = useRef<string>('');
  const processingJob = useRef<string>('');
  
  // Perform one-time API validation
  useEffect(() => {
    if (useApiKeywords && !globalValidationState.isValidated) {
      validateApiOnce().then(isValid => {
        if (!isValid) {
          setApiError("Could not validate API credentials. Using local extraction as fallback.");
        }
      });
    }
  }, [useApiKeywords]);

  // Debounced and memoized getKeywords function
  const getKeywords = useCallback(async (jobDesc: string): Promise<void> => {
    if (!jobDesc || jobDesc.trim().length < 50) {
      setKeywords([]);
      setMatchedKeywords([]);
      setMatchPercentage(0);
      return;
    }

    // Generate a fingerprint for this job
    const jobFingerprint = createFingerprint(jobDesc);
    const lastJobFingerprint = createFingerprint(lastProcessedJob.current);
    
    // Skip if we're already processing this job or it matches the last one
    if (
      processingJob.current === jobDesc || 
      jobFingerprint === lastJobFingerprint
    ) {
      console.log('Skipping duplicate job description processing');
      return;
    }
    
    // Mark this job as being processed
    processingJob.current = jobDesc;
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Wait for API validation to complete if needed
      if (useApiKeywords && !globalValidationState.isValidated) {
        const isValid = await validateApiOnce();
        if (!isValid) {
          setApiError("API validation failed. Using local extraction.");
        }
      }
      
      // Try to get keywords from PPLX API if enabled
      if (useApiKeywords && globalValidationState.isValidated) {
        console.log('Attempting to extract keywords using PPLX API');
        
        const apiKeywords = await extractKeywordsWithPplx(jobDesc);
        
        if (apiKeywords.length > 0) {
          // Filter out removed keywords
          const filteredKeywords = apiKeywords.filter(
            keyword => !removedKeywords.has(keyword)
          );
          
          setKeywords(filteredKeywords);
          console.log('Successfully extracted keywords using API:', filteredKeywords);
          
          // Check which keywords are in the resume
          if (resumeContent) {
            checkMatchedKeywords(filteredKeywords, resumeContent);
          }
          
          lastProcessedJob.current = jobDesc;
          setIsLoading(false);
          processingJob.current = '';
          return;
        } else {
          // If API returned empty array, set error and fall back to local extraction
          console.error('API returned empty keyword array');
          setApiError('No keywords returned from API. Using local extraction as fallback.');
        }
      }
      
      // Fallback to local keyword extraction
      const extractedKeywords = extractKeywordsLocally(jobDesc);
      
      // Filter out removed keywords
      const filteredKeywords = extractedKeywords.filter(
        keyword => !removedKeywords.has(keyword)
      );
      
      setKeywords(filteredKeywords);
      
      // Check which keywords are in the resume
      if (resumeContent) {
        checkMatchedKeywords(filteredKeywords, resumeContent);
      }
      
      lastProcessedJob.current = jobDesc;
    } catch (error) {
      console.error('Error extracting keywords:', error);
      setApiError('Error using PPLX API. Using local extraction as fallback.');
      
      // Fallback to local extraction on error
      const extractedKeywords = extractKeywordsLocally(jobDesc);
      
      // Filter out removed keywords
      const filteredKeywords = extractedKeywords.filter(
        keyword => !removedKeywords.has(keyword)
      );
      
      setKeywords(filteredKeywords);
      
      // Check which keywords are in the resume
      if (resumeContent) {
        checkMatchedKeywords(filteredKeywords, resumeContent);
      }
    } finally {
      setIsLoading(false);
      processingJob.current = '';
    }
  }, [resumeContent, removedKeywords, useApiKeywords]);

  // Extract keywords from job description with debounce
  useEffect(() => {
    if (!jobDescription) return;
    
    // Use a timeout to debounce rapid changes
    const timeoutId = setTimeout(() => {
      getKeywords(jobDescription);
    }, 1000); // 1 second debounce
    
    // Clean up the timeout if the component unmounts or jobDescription changes
    return () => clearTimeout(timeoutId);
  }, [jobDescription, getKeywords]);

  // Local keyword extraction function (rename variables to avoid shadowing)
  const extractKeywordsLocally = (text: string): string[] => {
    // Remove HTML tags if present
    const plainText = text.replace(/<[^>]*>/g, '');
    
    // Split text into words, remove punctuation, and convert to lowercase
    const words = plainText.toLowerCase().split(/\s+/);
    
    // Filter common words and keep unique keywords
    const commonWords = new Set([
      'the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 
      'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 
      'as', 'your', 'have', 'more', 'an', 'was', 'we', 'will', 'can', 'all', 'has'
    ]);
    
    // Get unique keywords with a minimum length
    const uniqueKeywords = Array.from(new Set(
      words
        .map(word => word.replace(/[^\w]/g, ''))
        .filter(word => word.length > 3 && !commonWords.has(word))
    ));
    
    return uniqueKeywords.slice(0, 20); // Limit to top 20 keywords
  };

  // Check which keywords are in the resume
  const checkMatchedKeywords = (keywordList: string[], resume: string) => {
    const plainResume = resume.replace(/<[^>]*>/g, '').toLowerCase();
    
    // Filter out removed keywords first
    const activeKeywords = keywordList.filter(keyword => !removedKeywords.has(keyword));
    
    const matched = activeKeywords.filter(keyword => 
      plainResume.includes(keyword.toLowerCase())
    );
    
    setMatchedKeywords(matched);
    
    // Calculate percentage based on active keywords (not removed ones)
    const percentage = activeKeywords.length > 0 ? (matched.length / activeKeywords.length) * 100 : 0;
    setMatchPercentage(percentage);
    
    // Logging for debugging
    console.log(`Matched ${matched.length} of ${activeKeywords.length} keywords (${percentage.toFixed(1)}%)`);
  };

  // Handle keyword click
  const handleKeywordClick = (keyword: string) => {
    // Toggle selection state
    const newSelectedKeyword = keyword === selectedKeyword ? null : keyword;
    setSelectedKeyword(newSelectedKeyword);
    
    // Always call onKeywordClick with the current keyword
    // This ensures highlighting even if clicking the same keyword multiple times
    onKeywordClick(keyword);
  };

  // Handle keyword removal
  const handleRemoveKeyword = (keyword: string, event: React.MouseEvent) => {
    // Prevent the click from triggering the parent div's onClick handler
    event.stopPropagation();
    
    console.log(`Removing keyword: ${keyword}`);
    
    // Create a new Set with the current removed keywords
    const newRemovedKeywords = new Set(removedKeywords);
    newRemovedKeywords.add(keyword);
    setRemovedKeywords(newRemovedKeywords);
    
    // If the removed keyword was selected, clear the selection
    if (selectedKeyword === keyword) {
      setSelectedKeyword(null);
      onKeywordClick(''); // Clear the highlight in resume
    }
    
    // Force an immediate UI update for this keyword
    // This is done in the useEffect with the removedKeywords dependency
    // But we'll log to verify
    console.log(`Keyword ${keyword} added to removed set. Total removed: ${newRemovedKeywords.size}`);
    
    // Prevent default and stop propagation
    event.preventDefault();
  };

  // Toggle between API and local keyword extraction
  const toggleKeywordSource = () => {
    // If switching to API and we haven't validated yet, do it now
    if (!useApiKeywords && !globalValidationState.isValidated) {
      validateApiOnce().then(isValid => {
        if (!isValid) {
          setApiError("Could not validate API credentials. Using local extraction as fallback.");
        }
      });
    }
    setUseApiKeywords(!useApiKeywords);
  };

  // Update matched keywords when resume changes
  useEffect(() => {
    if (keywords.length > 0 && resumeContent) {
      // Directly call the matching logic without going through getKeywords
      // Filter out removed keywords
      const activeKeywords = keywords.filter(keyword => !removedKeywords.has(keyword));
      
      // Find matches in resume
      const plainResume = resumeContent.replace(/<[^>]*>/g, '').toLowerCase();
      const matched = activeKeywords.filter(keyword => 
        plainResume.includes(keyword.toLowerCase())
      );
      
      setMatchedKeywords(matched);
      
      // Calculate percentage
      const percentage = activeKeywords.length > 0 ? (matched.length / activeKeywords.length) * 100 : 0;
      setMatchPercentage(percentage);
      
      console.log(`Updated: Matched ${matched.length} of ${activeKeywords.length} keywords (${percentage.toFixed(1)}%)`);
    }
  }, [resumeContent, keywords, removedKeywords]); // Also recalculate when keywords are removed

  // Progress calculations
  const filteredKeywords = keywords.filter(keyword => !removedKeywords.has(keyword));
  const activeKeywordCount = filteredKeywords.length;
  
  // Only consider keywords that haven't been removed
  const displayedMatchedKeywords = matchedKeywords.filter(keyword => !removedKeywords.has(keyword));
  const matchedCount = displayedMatchedKeywords.length;
  
  // Recalculate percentage based on the filtered keywords
  const displayedPercentage = activeKeywordCount > 0 ? (matchedCount / activeKeywordCount) * 100 : 0;

  return (
    <div className="keyword-visualizer">
      <div className="visualizer-header">
        <h2 className="visualizer-title">Keyword Matches</h2>
        <div className="keyword-source-toggle">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={useApiKeywords}
              onChange={toggleKeywordSource}
              disabled={isLoading}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">Use PPLX AI</span>
        </div>
      </div>

      {apiError && (
        <div className="api-error-message">
          {apiError}
          {apiError.includes("API key") && (
            <div className="error-help-text">
              Make sure you've set up your API key in the .env file. Check the README.md for instructions.
            </div>
          )}
          {apiError.includes("No keywords returned") && (
            <div className="error-help-text">
              Try toggling the API switch off and on again, or try a different job description.
            </div>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="loading-indicator">
          <p>Analyzing job description...</p>
        </div>
      ) : keywords.length > 0 ? (
        <>
          <div className="progress-container">
            <div className="progress-label">
              <span>{matchedCount} of {activeKeywordCount} keywords matched</span>
              <span>{displayedPercentage.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${displayedPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="keywords-container">
            {keywords
              .filter(keyword => !removedKeywords.has(keyword))
              .map((keyword, index) => (
                <div 
                  key={index} 
                  className={`keyword-chip ${matchedKeywords.includes(keyword) ? 'matched' : 'unmatched'} ${selectedKeyword === keyword ? 'selected' : ''}`}
                  onClick={() => handleKeywordClick(keyword)}
                >
                  <span className="keyword-text">{keyword}</span>
                  <span 
                    className="keyword-remove" 
                    onClick={(e) => handleRemoveKeyword(keyword, e)}
                    title="Remove keyword"
                  >
                    ✕
                  </span>
                </div>
              ))}
          </div>
        </>
      ) : (
        <p className="no-keywords-message">
          Enter a job description to see keyword matches.
        </p>
      )}
    </div>
  );
};

export default KeywordMatchVisualizer; 