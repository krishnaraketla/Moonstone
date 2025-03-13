import React from 'react';
import '../styles/SelectedTextContext.css';

interface SelectedTextItem {
  id: string;
  text: string;
}

interface SelectedTextContextProps {
  selectedTexts: SelectedTextItem[];
  onRemove: (id: string) => void;
}

const SelectedTextContext: React.FC<SelectedTextContextProps> = ({
  selectedTexts,
  onRemove
}) => {
  if (selectedTexts.length === 0) return null;

  return (
    <div className="selected-text-context">
      <h3 className="context-header">Selected Text</h3>
      <div className="selected-texts-container">
        {selectedTexts.map((item) => (
          <div key={item.id} className="selected-text-item">
            <p className="selected-text-content">{item.text}</p>
            <button 
              className="remove-text-button" 
              onClick={() => onRemove(item.id)}
              aria-label="Remove selected text"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedTextContext; 