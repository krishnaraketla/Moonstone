import React from 'react';
import '../styles/TextSelectionTooltip.css';

interface TextSelectionTooltipProps {
  position: { top: number; left: number };
  onAddToChat: (e: React.MouseEvent) => void;
  isVisible: boolean;
}

const TextSelectionTooltip: React.FC<TextSelectionTooltipProps> = ({
  position,
  onAddToChat,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className="text-selection-tooltip" 
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px` 
      }}
    >
      <button className="tooltip-button" onClick={onAddToChat}>
        Add to chat
      </button>
    </div>
  );
};

export default TextSelectionTooltip; 