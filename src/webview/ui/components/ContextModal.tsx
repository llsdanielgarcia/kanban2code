import React, { useState, useEffect, useCallback } from 'react';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (contextPath: string) => void;
  projects?: string[];
  defaultScope?: 'global' | 'project';
  defaultProject?: string;
}

interface ContextFormData {
  name: string;
  scope: 'global' | 'project';
  project: string;
  description: string;
  fileReferences: string[];
  content: string;
}

export const ContextModal: React.FC<ContextModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  projects = [],
  defaultScope = 'global',
  defaultProject = '',
}) => {
  const [formData, setFormData] = useState<ContextFormData>({
    name: '',
    scope: defaultScope,
    project: defaultProject || projects[0] || '',
    description: '',
    fileReferences: [],
    content: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        scope: defaultScope,
        project: defaultProject || projects[0] || '',
        description: '',
        fileReferences: [],
        content: '',
      });
    }
  }, [isOpen, defaultScope, defaultProject, projects]);

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

  // Listen for file picker response
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'FilePicked' && message.payload?.path) {
        setFormData((prev) => ({
          ...prev,
          fileReferences: [...prev.fileReferences, message.payload.path],
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.description.trim()) return;

    const contextData = {
      name: formData.name.trim(),
      scope: formData.scope,
      project: formData.scope === 'project' ? formData.project : undefined,
      description: formData.description.trim(),
      fileReferences: formData.fileReferences.length > 0 ? formData.fileReferences : undefined,
      content: formData.content,
    };

    postMessage('CreateContext', contextData);
    onClose();
    if (onCreated) {
      onCreated(`${formData.name.toLowerCase().replace(/\s+/g, '-')}.md`);
    }
  }, [formData, onClose, onCreated]);

  const handleAddFile = () => {
    postMessage('PickFile', {});
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fileReferences: prev.fileReferences.filter((_, i) => i !== index),
    }));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const generateMetadataPreview = () => {
    const lines = [
      '---',
      `name: ${formData.name || 'context-name'}`,
      `description: ${formData.description || 'Description of the context'}`,
      `scope: ${formData.scope}`,
      `created: ${new Date().toISOString().split('T')[0]}`,
    ];

    if (formData.fileReferences.length > 0) {
      lines.push('file_references:');
      formData.fileReferences.forEach((ref) => {
        lines.push(`  - ${ref}`);
      });
    }

    lines.push('---');
    return lines.join('\n');
  };

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={handleOverlayClick}>
      <div className="glass-modal context-modal" role="dialog" aria-labelledby="context-modal-title">
        <div className="modal-header">
          <h2 id="context-modal-title">Create Context File</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="context-name">
              Context Name <span className="required">*</span>
            </label>
            <input
              id="context-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., architecture, phase-1-context"
              autoFocus
            />
            <span className="form-hint">
              Filename will be: {formData.name ? `${formData.name.toLowerCase().replace(/\s+/g, '-')}.md` : 'name.md'}
            </span>
          </div>

          {/* Scope */}
          <div className="form-group">
            <label className="form-label">Scope</label>
            <div className="location-type-selector">
              <button
                type="button"
                className={`location-type-btn ${formData.scope === 'global' ? 'active' : ''}`}
                onClick={() => setFormData((prev) => ({ ...prev, scope: 'global' }))}
              >
                Global
              </button>
              <button
                type="button"
                className={`location-type-btn ${formData.scope === 'project' ? 'active' : ''}`}
                onClick={() => setFormData((prev) => ({ ...prev, scope: 'project' }))}
              >
                Project
              </button>
            </div>
          </div>

          {/* Project Selection (when scope is project) */}
          {formData.scope === 'project' && (
            <div className="form-group">
              <label className="form-label" htmlFor="context-project">Project</label>
              <select
                id="context-project"
                className="form-select"
                value={formData.project}
                onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((project) => (
                    <option key={project} value={project}>{project}</option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="context-description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="context-description"
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this context covers..."
              rows={2}
            />
          </div>

          {/* File References */}
          <div className="form-group">
            <label className="form-label">File References</label>
            {formData.fileReferences.length > 0 && (
              <div className="file-reference-list">
                {formData.fileReferences.map((file, index) => (
                  <div key={index} className="file-reference-item">
                    <span className="file-reference-path">{file}</span>
                    <button
                      type="button"
                      className="file-reference-remove"
                      onClick={() => handleRemoveFile(index)}
                      aria-label="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className="btn btn-secondary" onClick={handleAddFile}>
              Add File Reference
            </button>
          </div>

          {/* Content */}
          <div className="form-group">
            <label className="form-label" htmlFor="context-content">Content</label>
            <textarea
              id="context-content"
              className="form-textarea monospace"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="# Context Overview

## Purpose
Describe the purpose of this context...

## Key Components
- Component 1
- Component 2

## Notes
Additional notes..."
              rows={8}
            />
          </div>

          {/* Metadata Preview */}
          <div className="metadata-preview">
            <div className="metadata-preview-title">Metadata Preview</div>
            <pre className="metadata-preview-content">{generateMetadataPreview()}</pre>
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
            Create Context
          </button>
        </div>
      </div>
    </div>
  );
};
