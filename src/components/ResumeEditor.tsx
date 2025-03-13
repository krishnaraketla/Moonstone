import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/ResumeEditor.css';
import { fixResumeFormatting } from '../utils/pplxApi';
import TextSelectionTooltip from './TextSelectionTooltip';
import CoverLetterEditor from './CoverLetterEditor';

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
  onAddSelectedText?: (text: string) => void; // New prop to handle adding selected text
  jobDescription?: string; // Add job description for cover letter generation
  coverLetterContent?: string; // Add cover letter content
  onCoverLetterChange?: (content: string) => void; // Handler for cover letter changes
}

const ResumeEditor = forwardRef<any, ResumeEditorProps>(({ 
  content, 
  onChange, 
  needsFormatting = false,
  onAddSelectedText,
  jobDescription = '',
  coverLetterContent = '',
  onCoverLetterChange = () => {}
}, ref) => {
  const [displayContent, setDisplayContent] = useState<string>('');
  const [contentToFormat, setContentToFormat] = useState<string | null>(null);
  const [isFormatting, setIsFormatting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter'>('resume');
  
  // Create a ref for the editor so we can access its methods
  const quillRef = useRef<ReactQuill>(null);
  const coverLetterRef = useRef<any>(null);
  
  // Create a ref to track if this is the first render
  const isInitialRender = useRef<boolean>(true);
  
  // Create a ref to track whether we should try to format
  const shouldFormatRef = useRef<boolean>(true);
  
  // Create a ref to track the previous content to detect new file uploads
  const previousContentRef = useRef<string>('');

  // State for text selection tooltip
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState<string>('');
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    highlightText: (text: string) => highlightText(text),
    resetHighlights: () => resetHighlights(),
    getContent: () => displayContent,
    // Include the cover letter content as well
    getCoverLetterContent: () => coverLetterRef.current ? coverLetterRef.current.getContent() : '',
  }));
  
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

  // Setup text selection handling
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!quillRef.current || activeTab !== 'resume') return;
      
      const selection = window.getSelection();
      
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        setSelectedText(selectedText);
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position the tooltip above the selection
        setTooltipPosition({
          top: rect.top - 45, // Position above the selection with a bit more space
          left: rect.left + (rect.width / 2) - 50 // Center horizontally
        });
        
        setTooltipVisible(true);
      }
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [activeTab]);
  
  // Handle clicking outside to hide tooltip
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const tooltipElement = document.querySelector('.text-selection-tooltip');
      // Don't hide if clicking on the tooltip itself
      if (tooltipElement && tooltipElement.contains(e.target as Node)) {
        return;
      }
      
      if (tooltipVisible) {
        setTooltipVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tooltipVisible]);

  // Function to handle adding selected text to chat
  const handleAddToChat = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from propagating and closing the tooltip
    
    if (selectedText && onAddSelectedText) {
      onAddSelectedText(selectedText);
      setTooltipVisible(false);
    }
  };

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
        
        // Optionally, show an error message to the user here
      }
    };
    
    formatResumeContent();
  }, [contentToFormat, onChange]);
  
  // Function to skip formatting and just use the content as-is
  const skipFormatting = () => {
    if (contentToFormat) {
      console.log('[ResumeEditor] User skipped formatting, using original content');
      
      // Clear formatting state
      setIsFormatting(false);
      
      // Set content and add marker to prevent reprocessing
      setDisplayContent(contentToFormat);
      onChange(contentToFormat + '___FORMATTED___');
      
      // Clear the content to format
      setContentToFormat(null);
    }
  };
  
  // Handle Quill editor changes
  const handleEditorChange = (newContent: string) => {
    setDisplayContent(newContent);
    
    // Ensure we don't add the marker again if it already exists
    if (!newContent.endsWith('___FORMATTED___')) {
      onChange(newContent);
    } else {
      onChange(newContent);
    }
  };
  
  // Function to highlight text in the editor
  const highlightText = (text: string) => {
    if (!quillRef.current) return;
    
    // Get the editor instance
    const editor = quillRef.current.getEditor();
    
    // First, remove any existing highlights
    resetHighlights();
    
    // Simple text highlight - searches for and highlights text
    const content = editor.getText();
    let startIndex = 0;
    
    // Convert both to lowercase for case-insensitive search
    const lowerContent = content.toLowerCase();
    const lowerText = text.toLowerCase();
    
    while (startIndex < content.length) {
      const index = lowerContent.indexOf(lowerText, startIndex);
      
      if (index !== -1) {
        // Calculate end index based on the original text length
        const endIndex = index + text.length;
        
        // Apply formatting to highlight the text
        editor.formatText(index, text.length, {
          'background': '#f0f0f0',
          'color': '#000000',
          'class': 'highlight-text'
        });
        
        startIndex = endIndex;
      } else {
        break;
      }
    }
  };
  
  // Function to reset/remove all highlights
  const resetHighlights = () => {
    if (!quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const content = editor.getText();
    
    // Remove all formatting from the entire document
    editor.formatText(0, content.length, {
      'background': false,
      'color': false,
      'class': false
    });
  };
  
  // Handle tab switching
  const handleTabChange = (tab: 'resume' | 'coverLetter') => {
    setActiveTab(tab);
    
    // Hide tooltip when switching tabs
    setTooltipVisible(false);
  };
  
  // Render component based on state
  return (
    <div className="editor-wrapper">
      <div className="tab-container">
        <div 
          className={`tab ${activeTab === 'resume' ? 'active' : ''}`} 
          onClick={() => handleTabChange('resume')}
        >
          Resume
        </div>
        <div 
          className={`tab ${activeTab === 'coverLetter' ? 'active' : ''}`}
          onClick={() => handleTabChange('coverLetter')}
        >
          Cover Letter
        </div>
      </div>
      
      <div className="tab-content">
        {activeTab === 'resume' && (
          <>
            {isFormatting ? (
              <div className="formatting-message">
                <p>Formatting your resume...</p>
                <p className="formatting-description">
                  We're improving your resume formatting for better readability and parsing by ATS systems.
                  This may take up to a minute.
                </p>
                <button onClick={skipFormatting} className="skip-formatting-btn">
                  Skip Formatting
                </button>
              </div>
            ) : (
              <ReactQuill
                ref={quillRef}
                value={displayContent}
                onChange={handleEditorChange}
                modules={modules}
                formats={formats}
                placeholder="Paste your resume or upload a file..."
              />
            )}
            
            {tooltipVisible && (
              <TextSelectionTooltip
                position={tooltipPosition}
                onAddToChat={handleAddToChat}
                isVisible={tooltipVisible}
              />
            )}
          </>
        )}
        
        {activeTab === 'coverLetter' && (
          <CoverLetterEditor
            ref={coverLetterRef}
            resumeContent={displayContent}
            jobDescription={jobDescription}
            content={coverLetterContent}
            onChange={onCoverLetterChange}
          />
        )}
      </div>
    </div>
  );
});

export default ResumeEditor;

// Helper functions

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