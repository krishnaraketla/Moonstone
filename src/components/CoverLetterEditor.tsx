import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/CoverLetterEditor.css';
import { generateCoverLetter } from '../utils/CoverGenerator';

interface CoverLetterEditorProps {
  resumeContent: string;
  jobDescription: string;
  onChange: (content: string) => void;
  content: string;
}

const CoverLetterEditor = forwardRef<any, CoverLetterEditorProps>(({
  resumeContent,
  jobDescription,
  onChange,
  content
}, ref) => {
  const [letterContent, setLetterContent] = useState<string>(content || '');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Set up forward ref to expose methods to parent component
  useImperativeHandle(ref, () => ({
    getContent: () => letterContent,
  }));

  // Update local state when content prop changes
  useEffect(() => {
    if (content && content !== letterContent) {
      setLetterContent(content);
    }
  }, [content]);

  // Configure Quill editor options
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align'
  ];

  // Handle editor content changes
  const handleEditorChange = (newContent: string) => {
    setLetterContent(newContent);
    onChange(newContent);
  };

  // Function to generate cover letter
  const handleGenerateCoverLetter = async () => {
    if (!resumeContent || !jobDescription) {
      alert('Both resume and job description are required to generate a cover letter.');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateCoverLetter({
        resumeContent,
        jobDescription,
        userName,
        targetCompany,
        additionalNotes
      });

      if (result.success && result.content) {
        setLetterContent(result.content);
        onChange(result.content);
      } else {
        alert(result.error || 'Failed to generate cover letter. Please try again.');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('An error occurred while generating the cover letter. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render editor or loading state
  return (
    <div className="cover-letter-container">
      <div className="cover-letter-header">
        <h2 className="cover-letter-title">Cover Letter Editor</h2>
        <button 
          className="generate-letter-button"
          onClick={handleGenerateCoverLetter}
          disabled={isGenerating || !resumeContent || !jobDescription}
        >
          {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
        </button>
      </div>

      <div className="cover-letter-options">
        <input
          type="text"
          placeholder="Your Name (optional)"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          disabled={isGenerating}
        />
        <input
          type="text"
          placeholder="Target Company (optional)"
          value={targetCompany}
          onChange={(e) => setTargetCompany(e.target.value)}
          disabled={isGenerating}
        />
        <input
          type="text"
          placeholder="Additional Notes (optional)"
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          disabled={isGenerating}
        />
      </div>

      {isGenerating ? (
        <div className="generating-message">
          <p>Generating your cover letter...</p>
          <p className="generating-description">
            This may take up to a minute. We're crafting a personalized cover letter 
            based on your resume and the job description.
          </p>
        </div>
      ) : (
        <ReactQuill
          value={letterContent}
          onChange={handleEditorChange}
          modules={modules}
          formats={formats}
          placeholder="Your cover letter will appear here... Click 'Generate Cover Letter' to create one based on your resume and job description."
        />
      )}
    </div>
  );
});

export default CoverLetterEditor; 