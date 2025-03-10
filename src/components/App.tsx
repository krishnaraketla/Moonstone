import React, { useState, useRef } from 'react';
import ResumeEditor from './ResumeEditor';
import SidePanel from './SidePanel';
import KeywordMatchVisualizer from './KeywordMatchVisualizer';
import '../styles/App.css';

interface Suggestion {
  id: number;
  original: string;
  suggested: string;
  prompt: string;
}

const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resumeContent, setResumeContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [editHistory, setEditHistory] = useState<Suggestion[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null);
  const editorRef = useRef<any>(null);

  const handleUploadPDF = async () => {
    try {
      const result = await window.electronAPI.uploadFile('pdf');
      if (result.success) {
        setResumeContent(result.content);
        setFileName(result.fileName);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error uploading PDF file.');
    }
  };

  const handleUploadDOCX = async () => {
    try {
      const result = await window.electronAPI.uploadFile('docx');
      if (result.success) {
        setResumeContent(result.content);
        // save content to txt file 
        setFileName(result.fileName);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error uploading DOCX:', error);
      alert('Error uploading DOCX file.');
    }
  };

  const handleResumeChange = (content: string) => {
    setResumeContent(content);
  };

  const handlePromptSubmit = (prompt: string) => {
    // In a real app, this would call an AI service or API
    // For now, we'll just simulate a suggested edit
    const suggestion: Suggestion = {
      id: Date.now(),
      original: resumeContent,
      suggested: `${resumeContent} [Suggested edit based on prompt: "${prompt}"]`,
      prompt
    };
    setCurrentSuggestion(suggestion);
  };

  const handleAcceptEdit = () => {
    if (currentSuggestion) {
      setResumeContent(currentSuggestion.suggested);
      setEditHistory([...editHistory, currentSuggestion]);
      setCurrentSuggestion(null);
    }
  };

  const handleRejectEdit = () => {
    setCurrentSuggestion(null);
  };

  const handleKeywordClick = (keyword: string) => {
    if (editorRef.current && editorRef.current.highlightText) {
      editorRef.current.highlightText(keyword);
    }
  };

  return (
    <div className="app">
      {/* Main Content Area */}
      <div className="main-content">
        <div className="app-header">
          <h1 className="app-title">Moonstone.ai - Resume Editor</h1>
        </div>
        
        {/* Job Description */}
        <textarea
          className="job-description"
          placeholder="Paste job description here"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        
        {/* File Upload Buttons */}
        <div className="file-upload-buttons">
          <button
            className="file-upload-button"
            onClick={handleUploadPDF}
          >
            Upload PDF
          </button>
          <button
            onClick={handleUploadDOCX}
          >
            Upload DOCX
          </button>
        </div>
        
        {fileName && (
          <div className="file-name">
            Current File: {fileName}
          </div>
        )}
        
        {/* Resume Editor */}
        <div className="editor-container">
          <ResumeEditor 
            content={resumeContent} 
            onChange={handleResumeChange}
            ref={editorRef}
          />
        </div>
      </div>
      
      {/* Side Panel */}
      <SidePanel 
        onPromptSubmit={handlePromptSubmit}
        currentSuggestion={currentSuggestion}
        onAcceptEdit={handleAcceptEdit}
        onRejectEdit={handleRejectEdit}
        jobDescription={jobDescription}
        resumeContent={resumeContent}
        onKeywordClick={handleKeywordClick}
      />
    </div>
  );
};

export default App; 