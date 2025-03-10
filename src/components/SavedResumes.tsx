import React, { useState, useEffect, useRef } from 'react';
import '../styles/SavedResumes.css';

// Define interfaces for our data
interface SavedResume {
  _id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedResumesProps {
  currentContent: string;
  onResumeSelect: (content: string) => void;
}

const SavedResumes: React.FC<SavedResumesProps> = ({ currentContent, onResumeSelect }) => {
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved resumes on component mount
  useEffect(() => {
    fetchSavedResumes();
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch saved resumes from MongoDB (via Electron API)
  const fetchSavedResumes = async () => {
    try {
      // This would be connected to your actual API
      const resumes = await window.electronAPI.getSavedResumes();
      setSavedResumes(resumes);
    } catch (error) {
      console.error('Error fetching saved resumes:', error);
    }
  };

  // Save current resume to MongoDB
  const saveResume = async () => {
    if (!resumeName.trim()) return;
    
    try {
      // This would be connected to your actual API
      await window.electronAPI.saveResume({
        name: resumeName,
        content: currentContent
      });
      
      setShowSaveDialog(false);
      setResumeName('');
      await fetchSavedResumes(); // Refresh the list
    } catch (error) {
      console.error('Error saving resume:', error);
    }
  };

  // Handle selecting a resume from the dropdown
  const handleResumeSelect = (resume: SavedResume) => {
    setSelectedResume(resume._id);
    onResumeSelect(resume.content);
    setIsDropdownOpen(false);
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="saved-resumes-container">
      {/* Save Icon */}
      <div 
        className="save-icon" 
        onClick={() => setShowSaveDialog(true)}
        title="Save Resume"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
      </div>

      {/* Resumes Dropdown */}
      <div 
        className={`resume-dropdown ${isDropdownOpen ? 'dropdown-open' : ''}`}
        ref={dropdownRef}
      >
        <div className="dropdown-button" onClick={toggleDropdown}>
          <span>{selectedResume ? 
            savedResumes.find(r => r._id === selectedResume)?.name || 'Select Resume' : 
            'Select Resume'}
          </span>
          <span className="arrow">▼</span>
        </div>
        
        <div className="dropdown-menu">
          {savedResumes.length > 0 ? (
            savedResumes.map((resume) => (
              <div 
                key={resume._id}
                className={`dropdown-item ${selectedResume === resume._id ? 'active' : ''}`}
                onClick={() => handleResumeSelect(resume)}
              >
                {resume.name}
              </div>
            ))
          ) : (
            <div className="no-resumes">No saved resumes</div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="save-resume-dialog">
          <div className="dialog-content">
            <h3 className="dialog-title">Save Resume</h3>
            <input
              type="text"
              className="dialog-input"
              placeholder="Resume Name"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
            />
            <div className="dialog-buttons">
              <button 
                className="dialog-cancel"
                onClick={() => {
                  setShowSaveDialog(false);
                  setResumeName('');
                }}
              >
                Cancel
              </button>
              <button onClick={saveResume}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedResumes; 