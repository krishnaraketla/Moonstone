import React, { useState, useRef } from 'react';
import ResumeEditor from './ResumeEditor';
import SidePanel from './SidePanel';
import KeywordMatchVisualizer from './KeywordMatchVisualizer';
import SavedResumes from './SavedResumes';
import '../styles/App.css';

interface Suggestion {
  id: number;
  original: string;
  suggested: string;
  prompt: string;
}

interface SelectedTextItem {
  id: string;
  text: string;
}

const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [resumeContent, setResumeContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [editHistory, setEditHistory] = useState<Suggestion[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null);
  const [needsFormatting, setNeedsFormatting] = useState<boolean>(false);
  const [selectedTexts, setSelectedTexts] = useState<SelectedTextItem[]>([]);
  // New state for cover letter
  const [coverLetterContent, setCoverLetterContent] = useState<string>('');
  
  const editorRef = useRef<any>(null);

  const handleUploadPDF = async () => {
    try {
      const result = await window.electronAPI.uploadFile('pdf');
      if (result.success) {
        console.log('[App] New PDF file uploaded, setting clean content');
        // Remove any formatting marker from the new content
        const cleanContent = result.content.replace('___FORMATTED___', '');
        // Set the flag to indicate this needs formatting
        setNeedsFormatting(true);
        // Pass the content to the editor
        setResumeContent(cleanContent);
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
        console.log('[App] New DOCX file uploaded, setting clean content');
        // Remove any formatting marker from the new content
        const cleanContent = result.content.replace('___FORMATTED___', '');
        // Set the flag to indicate this needs formatting
        setNeedsFormatting(true);
        // Pass the content to the editor
        setResumeContent(cleanContent);
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
    // Don't strip the marker as it may be needed by the formatter
    setResumeContent(content);
    // Format has been completed at this point
    setNeedsFormatting(false);
  };

  const handleCoverLetterChange = (content: string) => {
    setCoverLetterContent(content);
  };

  const handleAddSelectedText = (text: string) => {
    const newItem: SelectedTextItem = {
      id: Date.now().toString(),
      text
    };
    setSelectedTexts([...selectedTexts, newItem]);
  };

  const handleRemoveSelectedText = (id: string) => {
    setSelectedTexts(selectedTexts.filter(item => item.id !== id));
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

  const handleSavedResumeSelect = (resumeContent: string) => {
    setResumeContent(resumeContent);
    setNeedsFormatting(false);
  };

  // Function to save the current resume or cover letter
  const handleSaveResume = async () => {
    try {
      if (resumeContent.trim()) {
        const resumeName = fileName || `Resume_${new Date().toLocaleDateString()}`;
        const savedResume = await window.electronAPI.saveResume({
          name: resumeName,
          content: resumeContent
        });
        alert('Resume saved successfully!');
      } else {
        alert('Cannot save an empty resume.');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Error saving resume.');
    }
  };

  // Function to save the current cover letter
  const handleSaveCoverLetter = async () => {
    try {
      if (coverLetterContent.trim()) {
        // Get the cover letter content from the editor ref if available
        const coverLetterToSave = editorRef.current?.getCoverLetterContent?.() || coverLetterContent;
        
        const coverLetterName = `CoverLetter_${new Date().toLocaleDateString()}`;
        const savedCoverLetter = await window.electronAPI.saveResume({
          name: coverLetterName,
          content: coverLetterToSave
        });
        alert('Cover Letter saved successfully!');
      } else {
        alert('Cannot save an empty cover letter.');
      }
    } catch (error) {
      console.error('Error saving cover letter:', error);
      alert('Error saving cover letter.');
    }
  };

  return (
    <div className="app">
      {/* Main Content Area */}
      <div className="main-content">
        <div className="app-header">
          <h1 className="app-title">Moonstone.ai - Resume Tuner</h1>
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
            className="file-upload-button"
            onClick={handleUploadDOCX}
          >
            Upload DOCX
          </button>
          
          {/* SavedResumes component */}
          <div className="saved-resumes-wrapper">
            <SavedResumes 
              currentContent={resumeContent.replace('___FORMATTED___', '')}
              onResumeSelect={handleSavedResumeSelect}
            />
          </div>
        </div>
        
        {fileName && (
          <div className="file-name">
            Current File: {fileName}
          </div>
        )}
        
        {/* Resume Editor with Tabs */}
        <div className="editor-container">
          <ResumeEditor 
            content={resumeContent} 
            onChange={handleResumeChange}
            needsFormatting={needsFormatting}
            ref={editorRef}
            onAddSelectedText={handleAddSelectedText}
            jobDescription={jobDescription}
            coverLetterContent={coverLetterContent}
            onCoverLetterChange={handleCoverLetterChange}
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
        selectedTexts={selectedTexts}
        onRemoveSelectedText={handleRemoveSelectedText}
      />
    </div>
  );
};

export default App; 