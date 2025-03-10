import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/ResumeEditor.css';
import { fixResumeFormatting } from '../utils/pplxApi';

// Add custom styles for the Quill editor
// This will be injected into the page when the component mounts
const addCustomStyles = () => {
  // Check if our custom styles already exist
  if (!document.getElementById('quill-highlight-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'quill-highlight-styles';
    styleElement.textContent = `
      .ql-editor .highlight-text {
        background-color: rgba(200, 200, 200, 0.4) !important;
        border-radius: 2px;
        padding: 0 2px;
        border-bottom: 2px solid #0077cc;
      }
    `;
    document.head.appendChild(styleElement);
  }
};

interface ResumeEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const ResumeEditor = forwardRef<any, ResumeEditorProps>(({ content, onChange }, ref) => {
  const quillRef = useRef<ReactQuill>(null);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  // Store the original content that needs to be formatted
  const [contentToFormat, setContentToFormat] = useState<string | null>(null);
  // Store the actual content to display in the editor
  const [displayContent, setDisplayContent] = useState<string>(content || '');
  // Flag to track whether we need to format
  const shouldFormatRef = useRef<boolean>(true);
  // Flag to prevent infinite loops
  const isInitialRender = useRef<boolean>(true);

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

  // Add custom styles when component mounts
  useEffect(() => {
    addCustomStyles();
  }, []);

  // Handle incoming content changes
  useEffect(() => {
    // Skip if no content or if we're currently formatting
    if (!content || isFormatting) return;
    
    // Remove the formatting marker if present
    const cleanContent = content.endsWith('___FORMATTED___') 
      ? content.replace('___FORMATTED___', '')
      : content;
    
    // Only set content for initial render or genuine external content changes
    if (isInitialRender.current) {
      isInitialRender.current = false;
      // Don't format content that already has the marker (it was previously formatted)
      if (content.endsWith('___FORMATTED___')) {
        console.log('Content already has formatting marker, skipping formatting');
        setDisplayContent(cleanContent);
      } else {
        setContentToFormat(cleanContent);
        setDisplayContent(cleanContent);
      }
    } else if (cleanContent !== displayContent) {
      // Don't format content that already has the marker
      if (content.endsWith('___FORMATTED___')) {
        console.log('Content already has formatting marker, skipping formatting');
        setDisplayContent(cleanContent);
      } else {
        setContentToFormat(cleanContent);
        setDisplayContent(cleanContent);
      }
    }
  }, [content, isFormatting, displayContent]);

  // Handle formatting when contentToFormat changes
  useEffect(() => {
    if (!contentToFormat || !shouldFormatRef.current) return;
    
    const formatResumeContent = async () => {
      // Prevent multiple formatting attempts
      shouldFormatRef.current = false;
      setIsFormatting(true);
      
      // Set a timeout to prevent infinite loading state
      const timeoutId = setTimeout(() => {
        console.log('Formatting timeout reached, displaying original content');
        setIsFormatting(false);
        
        // Make sure content is clean
        const cleanContent = contentToFormat?.endsWith('___FORMATTED___')
          ? contentToFormat.replace('___FORMATTED___', '')
          : contentToFormat;
          
        if (cleanContent) {
          setDisplayContent(cleanContent);
          // Add marker to prevent reprocessing 
          onChange(cleanContent + '___FORMATTED___');
          setContentToFormat(null);
        }
      }, 10000); // 10 seconds timeout
      
      try {
        console.log('Starting resume formatting');
        
        // Make sure we're not sending content with a marker
        const cleanContentToFormat = contentToFormat?.endsWith('___FORMATTED___')
          ? contentToFormat.replace('___FORMATTED___', '')
          : contentToFormat;
          
        if (!cleanContentToFormat) {
          console.error('No content to format after cleaning');
          setIsFormatting(false);
          clearTimeout(timeoutId);
          return;
        }
        
        // Use the PPLX API to fix formatting issues
        const formattedContent = await fixResumeFormatting(cleanContentToFormat);
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        // The API now adds a marker, so let's clean it before displaying
        const cleanFormattedContent = formattedContent.endsWith('___FORMATTED___')
          ? formattedContent.replace('___FORMATTED___', '')
          : formattedContent;
        
        // If the formatting was successful and content changed
        if (cleanFormattedContent && cleanFormattedContent !== cleanContentToFormat) {
          console.log('Successfully formatted content');
          setDisplayContent(cleanFormattedContent);
          // Let the parent know about the formatted content (with marker)
          onChange(formattedContent); // Keep the marker if it exists
        } else if (!cleanContentToFormat.includes('<') || !cleanContentToFormat.includes('>')) {
          // If content is plain text and no formatting was applied, convert to HTML
          console.log('Converting plain text to HTML');
          const htmlContent = convertPlainTextToHtml(cleanContentToFormat);
          setDisplayContent(htmlContent);
          // Let the parent know about the HTML content (with marker)
          onChange(htmlContent + '___FORMATTED___');
        } else {
          // If no changes, just use the original content
          console.log('No formatting changes needed');
          setDisplayContent(cleanContentToFormat);
          // Add marker
          onChange(cleanContentToFormat + '___FORMATTED___');
        }
      } catch (error) {
        console.error('Error formatting resume:', error);
        // Fallback to plain text conversion if the API call fails
        
        // Clean up the content first
        const cleanContentToFormat = contentToFormat?.endsWith('___FORMATTED___')
          ? contentToFormat.replace('___FORMATTED___', '')
          : contentToFormat;
          
        if (!cleanContentToFormat) {
          console.error('No content to format after cleaning');
          setIsFormatting(false);
          clearTimeout(timeoutId);
          return;
        }
        
        if (!cleanContentToFormat.includes('<') || !cleanContentToFormat.includes('>')) {
          console.log('Error occurred, falling back to plain text conversion');
          const htmlContent = convertPlainTextToHtml(cleanContentToFormat);
          setDisplayContent(htmlContent);
          onChange(htmlContent + '___FORMATTED___');
        } else {
          // Use original content if HTML and there was an error
          setDisplayContent(cleanContentToFormat);
          onChange(cleanContentToFormat + '___FORMATTED___');
        }
      } finally {
        // Clear the timeout and set formatting to false
        clearTimeout(timeoutId);
        setIsFormatting(false);
        setContentToFormat(null);
      }
    };
    
    formatResumeContent();
  }, [contentToFormat, onChange]);

  // Local change handler that doesn't trigger reformatting
  const handleEditorChange = (newContent: string) => {
    // Make sure we strip out any formatting markers
    const cleanContent = newContent.endsWith('___FORMATTED___')
      ? newContent.replace('___FORMATTED___', '')
      : newContent;
      
    setDisplayContent(cleanContent);
    // Add the marker when sending to parent to prevent reprocessing
    onChange(cleanContent + '___FORMATTED___');
  };

  // Skip formatting button handler
  const skipFormatting = () => {
    setIsFormatting(false);
    if (contentToFormat) {
      // Clean content just in case it has a marker
      const cleanContent = contentToFormat.endsWith('___FORMATTED___')
        ? contentToFormat.replace('___FORMATTED___', '')
        : contentToFormat;
        
      setDisplayContent(cleanContent);
      // Add marker to prevent reprocessing
      onChange(cleanContent + '___FORMATTED___');
      setContentToFormat(null);
    }
    console.log('User skipped formatting, displaying original content');
  };

  // Expose the highlightText function via ref
  useImperativeHandle(ref, () => ({
    highlightText: (keyword: string) => {
      if (!quillRef.current || !keyword) return;

      const quill = quillRef.current.getEditor();
      const text = quill.getText();
      
      // Remove any existing highlights first
      resetHighlights();
      
      // Find and highlight all occurrences
      const keywordLower = keyword.toLowerCase();
      const textLower = text.toLowerCase();
      
      let startIndex = 0;
      while (startIndex < textLower.length) {
        const index = textLower.indexOf(keywordLower, startIndex);
        if (index === -1) break;
        
        // Apply custom class to the keyword
        quill.formatText(index, keyword.length, {
          'background': 'rgba(200, 200, 200, 0.4)',
          'class': 'highlight-text'
        });
        
        startIndex = index + keyword.length;
      }
      
      // Scroll to the first occurrence if found
      const firstIndex = textLower.indexOf(keywordLower);
      if (firstIndex !== -1) {
        // Set the cursor position to the highlighted text
        quill.setSelection(firstIndex, keyword.length);
        
        // Get the editor element
        const editorElement = document.querySelector('.ql-editor');
        if (editorElement) {
          // Calculate the position of the text within the editor
          const leaf = quill.getLeaf(firstIndex)[0];
          const leafElement = leaf && leaf.domNode ? leaf.domNode.parentElement : null;
          
          // If we found the text element, scroll to it
          if (leafElement) {
            leafElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // Fallback to the old method
            editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    },
    resetHighlights: () => {
      resetHighlights();
    }
  }));
  
  // Helper function to reset all highlights
  const resetHighlights = () => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    const text = quill.getText();
    
    // Remove all background formatting and custom classes
    quill.formatText(0, text.length, {
      'background': false,
      'class': false
    });
  };

  // Helper function to convert plain text to HTML with preserved formatting
  const convertPlainTextToHtml = (text: string) => {
    if (!text) return '';
    
    // Convert newlines to <br> tags and preserve spaces
    return text
      .replace(/\n/g, '<br>')
      .replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length));
  };

  return (
    <div className="editor-wrapper">
      <h2 className="editor-title">Resume Editor</h2>
      
      {isFormatting ? (
        <div className="formatting-message">
          <p>Formatting your resume...</p>
          <p className="formatting-description">
            This might take a few seconds as we improve the layout and structure.
          </p>
          <button 
            className="skip-formatting-btn"
            onClick={skipFormatting}
          >
            Skip formatting
          </button>
        </div>
      ) : displayContent ? (
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={displayContent}
          onChange={handleEditorChange}
          modules={modules}
          formats={formats}
        />
      ) : (
        <p className="editor-placeholder">
          Upload a resume file or paste content to start editing.
        </p>
      )}
    </div>
  );
});

export default ResumeEditor; 