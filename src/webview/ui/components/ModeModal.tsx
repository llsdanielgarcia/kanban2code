import React, { useCallback, useEffect, useState } from 'react';
import type { Stage } from '../../../types/task';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

const STAGE_OPTIONS: Array<{ value: ''; label: string } | { value: Stage; label: string }> = [
  { value: '', label: 'No default stage' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'plan', label: 'Plan' },
  { value: 'code', label: 'Code' },
  { value: 'audit', label: 'Audit' },
  { value: 'completed', label: 'Completed' },
];

interface EditableMode {
  id: string;
  name: string;
  description: string;
  stage?: Stage;
  instructions: string;
}

interface ModeFormData {
  name: string;
  description: string;
  stage: '' | Stage;
  instructions: string;
}

interface ModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: EditableMode | null;
  onSaved?: (modeIdOrName: string) => void;
}

export const ModeModal: React.FC<ModeModalProps> = ({ isOpen, onClose, mode = null, onSaved }) => {
  const [formData, setFormData] = useState<ModeFormData>({
    name: '',
    description: '',
    stage: '',
    instructions: '',
  });

  const isEditMode = !!mode;

  useEffect(() => {
    if (!isOpen) return;

    if (mode) {
      setFormData({
        name: mode.name,
        description: mode.description,
        stage: mode.stage ?? '',
        instructions: mode.instructions,
      });
      return;
    }

    setFormData({
      name: '',
      description: '',
      stage: '',
      instructions: '',
    });
  }, [isOpen, mode]);

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.description.trim()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      stage: formData.stage || undefined,
      content: formData.instructions,
    };

    if (mode) {
      postMessage('UpdateMode', {
        modeId: mode.id,
        ...payload,
      });
      onSaved?.(mode.id);
    } else {
      postMessage('CreateMode', payload);
      onSaved?.(payload.name);
    }

    onClose();
  }, [formData, mode, onClose, onSaved]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSubmit]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={handleOverlayClick}>
      <div className="glass-modal mode-modal" role="dialog" aria-labelledby="mode-modal-title">
        <div className="modal-header">
          <h2 id="mode-modal-title">{isEditMode ? 'Edit Mode' : 'Create Mode'}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="mode-name">
              Name <span className="required">*</span>
            </label>
            <input
              id="mode-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="e.g., coder, auditor"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mode-description">
              Description <span className="required">*</span>
            </label>
            <input
              id="mode-description"
              type="text"
              className="form-input"
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Brief summary of this mode's purpose"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mode-stage">Stage (optional)</label>
            <select
              id="mode-stage"
              className="form-select"
              value={formData.stage}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, stage: event.target.value as '' | Stage }))
              }
            >
              {STAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="mode-instructions">Instructions</label>
            <textarea
              id="mode-instructions"
              className="form-textarea monospace"
              value={formData.instructions}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, instructions: event.target.value }))
              }
              placeholder="Write markdown instructions for this mode..."
              rows={14}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || !formData.description.trim()}
          >
            {isEditMode ? 'Save Mode' : 'Create Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};
