import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Stage } from '../../../types/task';
import { createMessage } from '../../messaging';
import { LocationPicker } from './LocationPicker';
import { ContextPicker, type ContextFile } from './ContextPicker';
import { SkillPicker, type SkillFile } from './SkillPicker';
import { AgentPicker, type LlmProvider } from './AgentPicker';
import { ModePicker, type Mode } from './ModePicker';
import { ProjectModal } from './ProjectModal';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface TaskModalProps {
  isOpen: boolean;
  tasks: Task[];
  contexts?: ContextFile[];
  skills?: SkillFile[];
  agents?: LlmProvider[];
  modes?: Mode[];
  projects?: string[];
  phasesByProject?: Record<string, string[]>;
  onClose: () => void;
  onOpenContextModal?: () => void;
  onOpenAgentModal?: () => void;
  defaultLocation?: 'inbox' | { project: string; phase?: string };
  parentTaskId?: string;
}

interface TaskFormData {
  title: string;
  location: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  stage: Stage;
  agent: string | null;
  mode: string | null;
  tags: string[];
  contexts: string[];
  skills: string[];
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
  contexts = [],
  skills = [],
  agents = [],
  modes = [],
  projects = [],
  phasesByProject = {},
  onClose,
  onOpenContextModal,
  onOpenAgentModal,
  defaultLocation = 'inbox',
  parentTaskId,
}) => {
  const folderPickRequestIdRef = useRef<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [localProjects, setLocalProjects] = useState<string[]>(projects);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    location: typeof defaultLocation === 'string'
      ? { type: 'inbox' }
      : { type: 'project', project: defaultLocation.project, phase: defaultLocation.phase },
    stage: 'inbox',
    agent: null,
    mode: null,
    tags: [],
    contexts: [],
    skills: [],
    content: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      folderPickRequestIdRef.current = null;
      setShowProjectModal(false);
      setFormData({
        title: '',
        location: typeof defaultLocation === 'string'
          ? { type: 'inbox' }
          : { type: 'project', project: defaultLocation.project, phase: defaultLocation.phase },
        stage: 'inbox',
        agent: null,
        mode: null,
        tags: [],
        contexts: [],
        skills: [],
        content: '',
      });
      setTagInput('');
    }
  }, [isOpen, defaultLocation]);

  useEffect(() => {
    setLocalProjects((prev) => {
      const merged = new Set([...prev, ...projects]);
      return Array.from(merged).sort();
    });
  }, [projects]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (event: MessageEvent) => {
      const message = event.data;
      if (message?.type !== 'FolderPicked') return;
      if (!message.payload?.path) return;
      const requestId = message.payload?.requestId as string | undefined;
      if (!requestId || requestId !== folderPickRequestIdRef.current) return;
      folderPickRequestIdRef.current = null;

      const folderRef = `folder:${message.payload.path}`;
      setFormData((prev) => ({
        ...prev,
        contexts: prev.contexts.includes(folderRef) ? prev.contexts : [...prev.contexts, folderRef],
      }));
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isOpen]);

  const handlePickFolder = () => {
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    folderPickRequestIdRef.current = requestId;
    postMessage('PickFolder', { requestId });
  };

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
      mode: formData.mode || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      contexts: formData.contexts.length > 0 ? formData.contexts : undefined,
      skills: formData.skills.length > 0 ? formData.skills : undefined,
      parent: parentTaskId || undefined,
      content: formData.content || undefined,
    };

    postMessage('CreateTask', taskData);
    onClose();
  }, [formData, onClose, parentTaskId]);

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

  const handleCreateContext = () => {
    if (onOpenContextModal) {
      onOpenContextModal();
    }
  };


  const handleProjectCreated = (projectName: string) => {
    setLocalProjects((prev) => {
      const merged = new Set([...prev, projectName]);
      return Array.from(merged).sort();
    });
    setFormData((prev) => ({
      ...prev,
      location: { type: 'project', project: projectName },
    }));
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
            projects={localProjects}
            phasesByProject={phasesByProject}
            value={formData.location}
            onChange={(location) => setFormData((prev) => ({ ...prev, location }))}
            onCreateProject={() => setShowProjectModal(true)}
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

          {/* Agent */}
          <AgentPicker
            providers={agents}
            value={formData.agent}
            onChange={(agent) => setFormData((prev) => ({ ...prev, agent }))}
          />

          {/* Mode */}
          <ModePicker
            modes={modes}
            value={formData.mode}
            onChange={(mode) => setFormData((prev) => ({ ...prev, mode }))}
            onCreateNew={() => {}}
          />

          {/* Context Files */}
          <ContextPicker
            contexts={contexts}
            selected={formData.contexts}
            onChange={(selectedContexts) => setFormData((prev) => ({ ...prev, contexts: selectedContexts }))}
            onCreateNew={handleCreateContext}
            onPickFolder={handlePickFolder}
          />

          {/* Skills */}
          <SkillPicker
            skills={skills}
            selected={formData.skills}
            onChange={(selectedSkills) => setFormData((prev) => ({ ...prev, skills: selectedSkills }))}
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

      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
};
