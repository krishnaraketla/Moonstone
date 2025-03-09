import React, { useState } from 'react';
import '../styles/SidePanel.css';
import KeywordMatchVisualizer from './KeywordMatchVisualizer';

interface Suggestion {
  id: number;
  original: string;
  suggested: string;
  prompt: string;
}

interface SidePanelProps {
  onPromptSubmit: (prompt: string) => void;
  currentSuggestion: Suggestion | null;
  onAcceptEdit: () => void;
  onRejectEdit: () => void;
  jobDescription: string;
  resumeContent: string;
  onKeywordClick: (keyword: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ 
  onPromptSubmit, 
  currentSuggestion, 
  onAcceptEdit, 
  onRejectEdit,
  jobDescription,
  resumeContent,
  onKeywordClick
}) => {
  const [prompt, setPrompt] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onPromptSubmit(prompt.trim());
      setPrompt('');
    }
  };

  return (
    <div className="side-panel">
      <h2 className="side-panel-header">AI Assistant</h2>
      
      {/* Prompt Input */}
      <form className="prompt-form" onSubmit={handleSubmit}>
        <textarea
          className="prompt-input"
          placeholder="e.g., Tailor my resume for this job description"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button 
          className="submit-button" 
          type="submit"
          disabled={!prompt.trim()}
        >
          Submit
        </button>
      </form>
      
      <div className="divider"></div>
      
      {/* Keyword Match Visualizer */}
      {(jobDescription || resumeContent) && (
        <KeywordMatchVisualizer 
          jobDescription={jobDescription}
          resumeContent={resumeContent}
          onKeywordClick={onKeywordClick}
        />
      )}
      
      <div className="divider"></div>
      
      {/* Current Suggestion */}
      {currentSuggestion && (
        <div>
          <h3 className="suggestion-header">
            Suggested Edit
          </h3>
          <p className="suggestion-prompt">
            Based on: "{currentSuggestion.prompt}"
          </p>
          
          <div className="suggestion-content">
            {currentSuggestion.suggested}
          </div>
          
          <div className="suggestion-actions">
            <button 
              className="accept-button" 
              onClick={onAcceptEdit}
            >
              Accept
            </button>
            <button 
              className="reject-button" 
              onClick={onRejectEdit}
            >
              Reject
            </button>
          </div>
        </div>
      )}
      
      {!currentSuggestion && (
        <p className="help-text">
          Enter a prompt to get AI suggestions for improving your resume.
        </p>
      )}
    </div>
  );
};

export default SidePanel; 