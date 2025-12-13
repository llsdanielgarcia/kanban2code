import React, { useState, useEffect, useCallback } from 'react';
import type { Stage } from '../../../types/task';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  icon?: string;
  defaultStage?: Stage;
  defaultTags?: string[];
}

interface TemplateModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  template?: Template;
  onClose: () => void;
  onSaved?: (templateId: string) => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  icon: string;
  defaultStage: Stage;
  defaultTags: string[];
  content: string;
}

const STAGES: { value: Stage; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'plan', label: 'Plan' },
  { value: 'code', label: 'Code' },
  { value: 'audit', label: 'Audit' },
];

const TEMPLATE_PLACEHOLDERS = `## Goal
{{description}}

## Scope
- [ ] Define requirements
- [ ] Implement solution
- [ ] Write tests

## Notes
Created: {{date}}
Project: {{project}}`;

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  mode,
  template,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    icon: '',
    defaultStage: 'inbox',
    defaultTags: [],
    content: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Reset form when modal opens or template changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && template) {
        setFormData({
          name: template.name,
          description: template.description,
          icon: template.icon || '',
          defaultStage: template.defaultStage || 'inbox',
          defaultTags: template.defaultTags || [],
          content: template.content,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: '',
          defaultStage: 'inbox',
          defaultTags: [],
          content: '',
        });
      }
      setTagInput('');
    }
  }, [isOpen, mode, template]);

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

    const templateData = {
      id: mode === 'edit' && template ? template.id : undefined,
      name: formData.name.trim(),
      description: formData.description.trim(),
      icon: formData.icon || undefined,
      defaultStage: formData.defaultStage,
      defaultTags: formData.defaultTags.length > 0 ? formData.defaultTags : undefined,
      content: formData.content,
    };

    if (mode === 'edit' && template) {
      postMessage('UpdateTemplate', { templateId: template.id, ...templateData });
    } else {
      postMessage('CreateTemplate', templateData);
    }

    onClose();
    if (onSaved) {
      onSaved(templateData.name.toLowerCase().replace(/\s+/g, '-'));
    }
  }, [formData, mode, template, onClose, onSaved]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.defaultTags.includes(tag)) {
      setFormData((prev) => ({ ...prev, defaultTags: [...prev.defaultTags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      defaultTags: prev.defaultTags.filter((t) => t !== tag),
    }));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const generatePreview = () => {
    let preview = formData.content || TEMPLATE_PLACEHOLDERS;
    const today = new Date().toISOString().split('T')[0];

    preview = preview.replace(/\{\{title\}\}/g, 'Example Task Title');
    preview = preview.replace(/\{\{description\}\}/g, 'Example description');
    preview = preview.replace(/\{\{date\}\}/g, today);
    preview = preview.replace(/\{\{project\}\}/g, 'my-project');
    preview = preview.replace(/\{\{phase\}\}/g, 'phase-1');
    preview = preview.replace(/\{\{author\}\}/g, 'Developer');

    return preview;
  };

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={handleOverlayClick}>
      <div className="glass-modal template-modal" role="dialog" aria-labelledby="template-modal-title">
        <div className="modal-header">
          <h2 id="template-modal-title">{mode === 'edit' ? 'Edit Template' : 'Create Template'}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="template-name">
              Template Name <span className="required">*</span>
            </label>
            <input
              id="template-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Bug Report, Feature Request"
              autoFocus
            />
            <span className="form-hint">
              Filename: {formData.name ? `${formData.name.toLowerCase().replace(/\s+/g, '-')}.md` : 'template-name.md'}
            </span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="template-description">Description</label>
            <input
              id="template-description"
              type="text"
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of when to use this template..."
            />
          </div>

          {/* Icon */}
          <div className="form-group">
            <label className="form-label" htmlFor="template-icon">Icon (emoji)</label>
            <input
              id="template-icon"
              type="text"
              className="form-input"
              value={formData.icon}
              onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
              placeholder="e.g., 🐛, ✨, 📝"
              maxLength={4}
              style={{ width: '80px' }}
            />
          </div>

          {/* Default Stage */}
          <div className="form-group">
            <label className="form-label" htmlFor="template-stage">Default Stage</label>
            <select
              id="template-stage"
              className="form-select"
              value={formData.defaultStage}
              onChange={(e) => setFormData((prev) => ({ ...prev, defaultStage: e.target.value as Stage }))}
            >
              {STAGES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Default Tags */}
          <div className="form-group">
            <label className="form-label">Default Tags</label>
            <div className="tag-input-container">
              <input
                type="text"
                className="form-input tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter..."
              />
            </div>
            {formData.defaultTags.length > 0 && (
              <div className="tag-chips">
                {formData.defaultTags.map((tag) => (
                  <span key={tag} className="tag-chip active">
                    {tag}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Template Content */}
          <div className="form-group">
            <label className="form-label" htmlFor="template-content">Template Content</label>
            <textarea
              id="template-content"
              className="form-textarea monospace"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder={TEMPLATE_PLACEHOLDERS}
              rows={10}
            />
            <span className="form-hint">
              Available placeholders: {'{{title}}'}, {'{{description}}'}, {'{{date}}'}, {'{{project}}'}, {'{{phase}}'}, {'{{author}}'}
            </span>
          </div>

          {/* Preview */}
          <div className="metadata-preview">
            <div className="metadata-preview-title">Preview</div>
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
            {mode === 'edit' ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};
