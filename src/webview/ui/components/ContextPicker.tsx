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
  onPickFolder?: () => void;
}

const FOLDER_PREFIX = 'folder:' as const;

function isFolderRef(value: string): boolean {
  return value.startsWith(FOLDER_PREFIX);
}

function getDisplayPath(value: string): string {
  if (isFolderRef(value)) return value.slice(FOLDER_PREFIX.length);
  return value;
}

function getBasename(value: string): string {
  const display = getDisplayPath(value);
  const parts = display.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? display;
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M10 4.5l2 2H20a2 2 0 012 2v1H2v-3a2 2 0 012-2h6zm12 6v9a2 2 0 01-2 2H4a2 2 0 01-2-2v-9h20z"
        fill="currentColor"
      />
    </svg>
  );
}

export const ContextPicker: React.FC<ContextPickerProps> = ({
  contexts,
  selected,
  onChange,
  onCreateNew,
  onPickFolder,
}) => {
  const knownIds = React.useMemo(() => new Set(contexts.map((c) => c.id)), [contexts]);
  const customSelected = React.useMemo(
    () => selected.filter((value) => !knownIds.has(value)),
    [selected, knownIds],
  );

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
        <div className="context-list">
          {customSelected.length > 0 && (
            <div className="context-custom-section">
              <div className="context-custom-header">Custom</div>
              {customSelected.map((value) => {
                const isFolder = isFolderRef(value);
                const displayPath = getDisplayPath(value);
                return (
                  <label key={value} className={`context-item ${isFolder ? 'context-item--folder' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(value)}
                      onChange={() => handleToggle(value)}
                    />
                    {isFolder && (
                      <span className="context-item-icon" aria-hidden="true">
                        <FolderIcon />
                      </span>
                    )}
                    <div className="context-item-content">
                      <div className="context-item-name">{getBasename(value)}</div>
                      <div className="context-item-description">{displayPath}</div>
                    </div>
                  </label>
                );
              })}
              {contexts.length > 0 && <div className="context-custom-divider" />}
            </div>
          )}
          {contexts.length === 0 && customSelected.length === 0 ? (
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
          {onPickFolder && (
            <button
              type="button"
              className="link-button"
              onClick={onPickFolder}
            >
              Add folder as context
            </button>
          )}
          <button type="button" className="link-button" onClick={onCreateNew}>
            Create new context file
          </button>
        </span>
      </div>
    </div>
  );
};
