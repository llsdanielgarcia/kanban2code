import React, { useState, useEffect, useCallback } from 'react';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (projectName: string) => void;
}

interface ProjectFormData {
  name: string;
  phases: string[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    phases: [],
  });
  const [phaseInput, setPhaseInput] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        phases: [],
      });
      setPhaseInput('');
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, formData]);

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim()) return;

    const projectData = {
      name: formData.name.trim(),
      phases: formData.phases.length > 0 ? formData.phases : undefined,
    };

    postMessage('CreateProject', projectData);
    onClose();
    if (onCreated) {
      onCreated(formData.name.toLowerCase().replace(/\s+/g, '-'));
    }
  }, [formData, onClose, onCreated]);

  const handleAddPhase = () => {
    const phase = phaseInput.trim();
    if (phase && !formData.phases.includes(phase)) {
      setFormData((prev) => ({ ...prev, phases: [...prev.phases, phase] }));
      setPhaseInput('');
    }
  };

  const handleRemovePhase = (phase: string) => {
    setFormData((prev) => ({
      ...prev,
      phases: prev.phases.filter((p) => p !== phase),
    }));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const generatePreview = () => {
    const projectName = formData.name
      ? formData.name.toLowerCase().replace(/\s+/g, '-')
      : 'project-name';
    const lines = [`projects/`, `  ${projectName}/`];

    if (formData.phases.length > 0) {
      for (const phase of formData.phases) {
        const phaseName = phase.toLowerCase().replace(/\s+/g, '-');
        lines.push(`    ${phaseName}/`);
      }
    } else {
      lines.push(`    (no phases yet)`);
    }

    return lines.join('\n');
  };

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={handleOverlayClick}>
      <div className="glass-modal project-modal" role="dialog" aria-labelledby="project-modal-title">
        <div className="modal-header">
          <h2 id="project-modal-title">Create Project</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">
              Project Name <span className="required">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., my-awesome-project"
              autoFocus
            />
            <span className="form-hint">
              Directory: {formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-') : 'project-name'}
            </span>
          </div>

          {/* Phases */}
          <div className="form-group">
            <label className="form-label">Initial Phases (optional)</label>
            <div className="tag-input-container">
              <input
                type="text"
                className="form-input tag-input"
                value={phaseInput}
                onChange={(e) => setPhaseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPhase();
                  }
                }}
                placeholder="Add phase and press Enter..."
              />
            </div>
            {formData.phases.length > 0 && (
              <div className="tag-chips">
                {formData.phases.map((phase) => (
                  <span key={phase} className="tag-chip active">
                    {phase}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemovePhase(phase)}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
            <span className="form-hint">
              Phases help organize tasks within a project (e.g., phase-1, sprint-1, mvp)
            </span>
          </div>

          {/* Preview */}
          <div className="metadata-preview">
            <div className="metadata-preview-title">Directory Structure Preview</div>
            <pre className="metadata-preview-content">{generatePreview()}</pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};
