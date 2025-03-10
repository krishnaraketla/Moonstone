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
  needsFormatting?: boolean; // New prop to signal formatting needed
}

const ResumeEditor = forwardRef<any, ResumeEditorProps>(({ content, onChange, needsFormatting = false }, ref) => {
  const [displayContent, setDisplayContent] = useState<string>('');
  const [contentToFormat, setContentToFormat] = useState<string | null>(null);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  
  // Create a ref for the editor so we can access its methods
  const quillRef = useRef<ReactQuill>(null);
  
  // Create a ref to track if this is the first render
  const isInitialRender = useRef<boolean>(true);
  
  // Create a ref to track whether we should try to format
  const shouldFormatRef = useRef<boolean>(true);
  
  // Create a ref to track the previous content to detect new file uploads
  const previousContentRef = useRef<string>('');

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

  // Handle incoming content changes - simplified to follow strict flow
  useEffect(() => {
    // Don't do anything during formatting
    if (isFormatting) return;
    
    console.log('[ResumeEditor] Content received');
    
    // Clean any formatting markers
    const cleanContent = content.endsWith('___FORMATTED___') 
      ? content.replace('___FORMATTED___', '')
      : content;
    
    // If this is a new upload that needs formatting
    if (needsFormatting && cleanContent) {
      console.log('[ResumeEditor] New resume upload detected, will format');
      setContentToFormat(cleanContent);
      setDisplayContent(cleanContent);
      setIsFormatting(true);
    } 
    // For normal content changes (not needing format)
    else if (cleanContent) {
      console.log('[ResumeEditor] Content change that does not need formatting');
      setDisplayContent(cleanContent);
    }
  }, [content, isFormatting, needsFormatting]);

  // Handle formatting when contentToFormat changes
  useEffect(() => {
    if (!contentToFormat || !isFormatting) return;
    
    const formatResumeContent = async () => {
      console.log('[ResumeEditor] Starting resume formatting...');
      
      // Set a timeout to prevent infinite loading state
      const timeoutId = setTimeout(() => {
        console.log('[ResumeEditor] Formatting timeout reached');
        
        // Clear state and fallback to unformatted content
        setIsFormatting(false);
        setContentToFormat(null);
        
        if (contentToFormat) {
          setDisplayContent(contentToFormat);
          // Add marker to prevent reprocessing 
          onChange(contentToFormat + '___FORMATTED___');
        }
      }, 180000); // 3 minutes timeout (accounting for 60s timeout × 3 attempts)
      
      try {
        console.log('[ResumeEditor] Calling PPLX API for formatting');
        
        // Force format even if it has a marker (by removing the marker first)
        const contentToSend = contentToFormat.replace('___FORMATTED___', '');
        const formattedContent = await fixResumeFormatting(contentToSend);
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        // Clean any marker from the response
        const cleanFormattedContent = formattedContent.endsWith('___FORMATTED___')
          ? formattedContent.replace('___FORMATTED___', '')
          : formattedContent;
        
        // If the formatting was successful
        if (cleanFormattedContent) {
          console.log('[ResumeEditor] Successfully formatted content');
          
          // Check if the formatted content is markdown
          const hasMarkdownHeaders = /^#+ /m.test(cleanFormattedContent);
          const hasMarkdownBold = /\*\*[^*]+\*\*/m.test(cleanFormattedContent);
          const hasMarkdownItalic = /\*[^*]+\*/m.test(cleanFormattedContent);
          const hasMarkdownList = /^- /m.test(cleanFormattedContent);
          
          // First clear formatting state
          setIsFormatting(false);
          setContentToFormat(null);
          
          if (hasMarkdownHeaders || hasMarkdownBold || hasMarkdownItalic || hasMarkdownList) {
            console.log('[ResumeEditor] Content is markdown, converting to HTML');
            const htmlContent = convertMarkdownToHtml(cleanFormattedContent);
            setDisplayContent(htmlContent);
            onChange(htmlContent + '___FORMATTED___');
          } else {
            setDisplayContent(cleanFormattedContent);
            onChange(cleanFormattedContent + '___FORMATTED___');
          }
        } else {
          // If no formatting happened, use original content
          console.log('[ResumeEditor] No formatting changes, using original content');
          setIsFormatting(false);
          setContentToFormat(null);
          setDisplayContent(contentToFormat);
          onChange(contentToFormat + '___FORMATTED___');
        }
      } catch (error) {
        console.error('[ResumeEditor] Error formatting resume:', error);
        
        // Clear state on error
        setIsFormatting(false);
        setContentToFormat(null);
        
        // Use original content on error
        setDisplayContent(contentToFormat);
        onChange(contentToFormat + '___FORMATTED___');
        
        // Clear timeout
        clearTimeout(timeoutId);
      }
    };
    
    formatResumeContent();
  }, [contentToFormat, onChange]);

  // Skip formatting button handler - simplified
  const skipFormatting = () => {
    console.log('[ResumeEditor] User skipped formatting');
    
    // Clear formatting state
    setIsFormatting(false);
    setContentToFormat(null);
    
    // Use unformatted content but add marker
    if (content) {
      const cleanContent = content.endsWith('___FORMATTED___') 
        ? content.replace('___FORMATTED___', '')
        : content;
        
      setDisplayContent(cleanContent);
      onChange(cleanContent + '___FORMATTED___');
    }
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

  // Helper function to convert markdown to HTML
  const convertMarkdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    
    // Check if the content looks like markdown
    const hasMarkdownHeaders = /^#+ /m.test(markdown);
    const hasMarkdownBold = /\*\*[^*]+\*\*/m.test(markdown);
    const hasMarkdownItalic = /\*[^*]+\*/m.test(markdown);
    const hasMarkdownList = /^- /m.test(markdown);
    
    if (hasMarkdownHeaders || hasMarkdownBold || hasMarkdownItalic || hasMarkdownList) {
      console.log('Converting markdown to HTML with enhanced converter');
      
      // Process the markdown in stages for better control
      let html = markdown;
      
      // Handle headers first (order matters for regex replacements)
      html = html
        .replace(/^# ([^\n]+)$/gm, '<h1>$1</h1>')
        .replace(/^## ([^\n]+)$/gm, '<h2>$1</h2>')
        .replace(/^### ([^\n]+)$/gm, '<h3>$1</h3>');
      
      // Handle lists - need to handle both individual items and wrap in ul
      // First identify list sections
      const listSections: {start: number; end: number}[] = [];
      const lines = html.split('\n');
      let inList = false;
      let listStart = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('- ') && !inList) {
          inList = true;
          listStart = i;
        } else if (!lines[i].trim().startsWith('- ') && inList) {
          inList = false;
          listSections.push({start: listStart, end: i - 1});
        }
      }
      
      // If still in a list at the end, close it
      if (inList) {
        listSections.push({start: listStart, end: lines.length - 1});
      }
      
      // Process list sections from end to start to avoid index issues
      for (let i = listSections.length - 1; i >= 0; i--) {
        const {start, end} = listSections[i];
        const listItems = lines.slice(start, end + 1)
          .map(line => line.replace(/^- (.+)$/, '<li>$1</li>'))
          .join('');
        
        const listHtml = `<ul>${listItems}</ul>`;
        lines.splice(start, end - start + 1, listHtml);
      }
      
      // Rejoin lines and continue processing
      html = lines.join('\n');
      
      // Handle inline formatting
      html = html
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      
      return html;
    } else {
      // If it doesn't look like markdown, treat as plain text
      return convertPlainTextToHtml(markdown);
    }
  };

  // Local change handler for user edits (not triggering formatting)
  const handleEditorChange = (newContent: string) => {
    console.log('[ResumeEditor] Editor content changed by user');
    
    // Don't process changes while formatting is in progress
    if (isFormatting) {
      console.log('[ResumeEditor] Skipping user edit during formatting');
      return;
    }
    
    // Make sure we strip out any formatting markers
    const cleanContent = newContent.endsWith('___FORMATTED___')
      ? newContent.replace('___FORMATTED___', '')
      : newContent;
      
    setDisplayContent(cleanContent);
    
    // Add the marker when sending to parent
    onChange(cleanContent + '___FORMATTED___');
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
          Upload a resume file to start editing.
        </p>
      )}
    </div>
  );
});

export default ResumeEditor; 