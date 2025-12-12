import React, { useState, useEffect, useCallback } from 'react';
import type { Task, Stage } from '../../../types/task';
import { createMessage } from '../../messaging';
import { LocationPicker } from './LocationPicker';
import { TemplatePicker } from './TemplatePicker';
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
}

interface TaskModalProps {
  isOpen: boolean;
  tasks: Task[];
  templates?: Template[];
  projects?: string[];
  phasesByProject?: Record<string, string[]>;
  onClose: () => void;
  defaultLocation?: 'inbox' | { project: string; phase?: string };
  parentTaskId?: string;
}

interface TaskFormData {
  title: string;
  location: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  stage: Stage;
  agent: string;
  tags: string[];
  template: string | null;
  content: string;
}

const STAGES: { value: Stage; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'plan', label: 'Plan' },
  { value: 'code', label: 'Code' },
  { value: 'audit', label: 'Audit' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  tasks,
  templates = [],
  projects = [],
  phasesByProject = {},
  onClose,
  defaultLocation = 'inbox',
  parentTaskId,
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    location: typeof defaultLocation === 'string'
      ? { type: 'inbox' }
      : { type: 'project', project: defaultLocation.project, phase: defaultLocation.phase },
    stage: 'inbox',
    agent: '',
    tags: [],
    template: null,
    content: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        location: typeof defaultLocation === 'string'
          ? { type: 'inbox' }
          : { type: 'project', project: defaultLocation.project, phase: defaultLocation.phase },
        stage: 'inbox',
        agent: '',
        tags: [],
        template: null,
        content: '',
      });
      setTagInput('');
    }
  }, [isOpen, defaultLocation]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Cmd/Ctrl+Enter to submit
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
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title.trim(),
      location: formData.location,
      stage: formData.stage,
      agent: formData.agent || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      template: formData.template || undefined,
      parent: parentTaskId || undefined,
      content: formData.content || undefined,
    };

    postMessage('CreateTask', taskData);
    onClose();
  }, [formData, onClose]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={handleOverlayClick}>
      <div className="glass-modal task-modal" role="dialog" aria-labelledby="task-modal-title">
        <div className="modal-header">
          <h2 id="task-modal-title">New Task</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {parentTaskId && (
            <div className="form-group">
              <label className="form-label">Parent</label>
              <div className="form-hint">Follow-up for {parentTaskId}</div>
            </div>
          )}
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          {/* Location */}
          <LocationPicker
            tasks={tasks}
            projects={projects}
            phasesByProject={phasesByProject}
            value={formData.location}
            onChange={(location) => setFormData((prev) => ({ ...prev, location }))}
          />

          {/* Stage */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-stage">Stage</label>
            <select
              id="task-stage"
              className="form-select"
              value={formData.stage}
              onChange={(e) => setFormData((prev) => ({ ...prev, stage: e.target.value as Stage }))}
            >
              {STAGES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Template */}
          <TemplatePicker
            templates={templates}
            value={formData.template}
            onChange={(template) => setFormData((prev) => ({ ...prev, template }))}
          />

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags</label>
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
            {formData.tags.length > 0 && (
              <div className="tag-chips">
                {formData.tags.map((tag) => (
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

          {/* Content */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-content">
              Content (optional)
            </label>
            <textarea
              id="task-content"
              className="form-textarea"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Task description or notes..."
              rows={4}
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
            disabled={!formData.title.trim()}
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};
