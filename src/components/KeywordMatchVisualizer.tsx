import React, { useState, useEffect } from 'react';
import '../styles/KeywordMatchVisualizer.css';
import { extractKeywordsWithPplx } from '../utils/pplxApi';

interface KeywordMatchVisualizerProps {
  jobDescription: string;
  resumeContent: string;
  onKeywordClick: (keyword: string) => void;
}

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
  const [apiStatusChecked, setApiStatusChecked] = useState<boolean>(false);

  // Function to test API credentials on mount
  useEffect(() => {
    if (!apiStatusChecked && useApiKeywords) {
      testApiCredentials();
    }
  }, [apiStatusChecked, useApiKeywords]);

  // Test if API credentials are working
  const testApiCredentials = async () => {
    try {
      const testResult = await extractKeywordsWithPplx("Software Engineer with experience in React, JavaScript, TypeScript, and Node.js");
      if (testResult.length > 0) {
        console.log("PPLX API credentials validated successfully");
        setApiError(null);
      } else {
        console.log("PPLX API responded but returned no keywords");
        setApiError("API is connected but not returning keywords. Using local extraction as fallback.");
      }
    } catch (error) {
      console.error("PPLX API credential test failed:", error);
      setApiError("Could not connect to PPLX API. Please check your API key and internet connection.");
    } finally {
      setApiStatusChecked(true);
    }
  };

  // Extract keywords from job description
  useEffect(() => {
    if (!jobDescription || jobDescription.trim().length < 50) {
      setKeywords([]);
      setMatchedKeywords([]);
      setMatchPercentage(0);
      setApiError(null);
      return;
    }

    const getKeywords = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        // Try to get keywords from PPLX API if enabled
        if (useApiKeywords) {
          console.log('Attempting to extract keywords using PPLX API');
          console.log('Job description length:', jobDescription.length);
          
          const apiKeywords = await extractKeywordsWithPplx(jobDescription);
          
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
            
            setIsLoading(false);
            return;
          } else {
            // If API returned empty array, set error and fall back to local extraction
            console.error('API returned empty keyword array');
            setApiError('No keywords returned from API. Using local extraction as fallback.');
          }
        }
        
        // Fallback to local keyword extraction
        const extractedKeywords = extractKeywordsLocally(jobDescription);
        
        // Filter out removed keywords
        const filteredKeywords = extractedKeywords.filter(
          keyword => !removedKeywords.has(keyword)
        );
        
        setKeywords(filteredKeywords);
        
        // Check which keywords are in the resume
        if (resumeContent) {
          checkMatchedKeywords(filteredKeywords, resumeContent);
        }
      } catch (error) {
        console.error('Error extracting keywords:', error);
        setApiError('Error using PPLX API. Using local extraction as fallback.');
        
        // Fallback to local extraction on error
        const extractedKeywords = extractKeywordsLocally(jobDescription);
        
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
      }
    };
    
    getKeywords();
  }, [jobDescription, resumeContent, removedKeywords, useApiKeywords]);

  // Local keyword extraction function (renamed from original extractKeywords)
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
    
    const matched = keywordList.filter(keyword => 
      plainResume.includes(keyword.toLowerCase())
    );
    
    setMatchedKeywords(matched);
    setMatchPercentage(keywordList.length > 0 ? (matched.length / keywordList.length) * 100 : 0);
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
    
    // Add the keyword to the removed set
    const newRemovedKeywords = new Set(removedKeywords);
    newRemovedKeywords.add(keyword);
    setRemovedKeywords(newRemovedKeywords);
    
    // If the removed keyword was selected, clear the selection
    if (selectedKeyword === keyword) {
      setSelectedKeyword(null);
    }
  };

  // Toggle between API and local keyword extraction
  const toggleKeywordSource = () => {
    // If switching to API and we haven't checked status yet, do it now
    if (!useApiKeywords && !apiStatusChecked) {
      testApiCredentials();
    }
    setUseApiKeywords(!useApiKeywords);
  };

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
              <span>{matchedKeywords.length} of {keywords.length} keywords matched</span>
              <span>{matchPercentage.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${matchPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="keywords-container">
            {keywords.map((keyword, index) => (
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