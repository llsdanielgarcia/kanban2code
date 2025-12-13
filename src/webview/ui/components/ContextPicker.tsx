import React from 'react';

export interface ContextFile {
  id: string;
  name: string;
  description: string;
  path: string;
  scope?: 'global' | 'project';
}

interface ContextPickerProps {
  contexts: ContextFile[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onCreateNew: () => void;
}

export const ContextPicker: React.FC<ContextPickerProps> = ({
  contexts,
  selected,
  onChange,
  onCreateNew,
}) => {
  const handleToggle = (contextId: string) => {
    if (selected.includes(contextId)) {
      onChange(selected.filter((id) => id !== contextId));
    } else {
      onChange([...selected, contextId]);
    }
  };

  return (
    <div className="context-picker">
      <div className="form-group">
        <div className="section-header">Context Files</div>
        <label className="form-label">Select Context Files</label>
        <div className="context-list">
          {contexts.length === 0 ? (
            <div className="context-list-empty">
              No context files available
            </div>
          ) : (
            contexts.map((context) => (
              <label key={context.id} className="context-item">
                <input
                  type="checkbox"
                  checked={selected.includes(context.id)}
                  onChange={() => handleToggle(context.id)}
                />
                <div className="context-item-content">
                  <div className="context-item-name">{context.name}</div>
                  {context.description && (
                    <div className="context-item-description">
                      {context.description}
                    </div>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
        <span className="form-hint">
          <button type="button" className="link-button" onClick={onCreateNew}>
            Create new context file
          </button>
        </span>
      </div>
    </div>
  );
};
