import React, { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/ResumeEditor.css';

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

  // Initialize Quill with any HTML content
  useEffect(() => {
    if (content && document.querySelector('.ql-editor')) {
      // Only apply this if the content is plain text and needs HTML conversion
      // If it's already HTML content (from DOCX conversion), it will be handled by Quill directly
      if (!content.includes('<') || !content.includes('>')) {
        // Don't modify content that's already HTML
        onChange(convertPlainTextToHtml(content));
      }
    }
  }, [content, onChange]);

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
      
      {content ? (
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={onChange}
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