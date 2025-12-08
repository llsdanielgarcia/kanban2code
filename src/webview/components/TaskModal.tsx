import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTaskStore, selectProjects, selectPhases } from '../stores/taskStore';
import { postMessageToHost, createTaskCreateMessage } from '../messaging/protocol';
import type { Stage, Task } from '../../types/task';

export interface TaskModalProps {
  onClose: () => void;
  parentTask?: Task;
}

type LocationType = 'inbox' | 'project';

const STAGES: { key: Stage; label: string }[] = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'plan', label: 'Plan' },
  { key: 'code', label: 'Code' },
  { key: 'audit', label: 'Audit' },
  { key: 'completed', label: 'Done' },
];

export function TaskModal({ onClose, parentTask }: TaskModalProps) {
  const tasks = useTaskStore((state) => state.tasks);
  const filters = useTaskStore((state) => state.filters);

  // Determine if this is a follow-up creation
  const isFollowUp = !!parentTask;

  // Form state - follow-ups are forced to inbox location and stage
  const [title, setTitle] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('inbox');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [stage, setStage] = useState<Stage>('inbox');
  const [tagsInput, setTagsInput] = useState(
    isFollowUp && parentTask.tags ? parentTask.tags.join(', ') : '',
  );
  const [agent, setAgent] = useState<string>(isFollowUp && parentTask.agent ? parentTask.agent : '');
  const [template, setTemplate] = useState<string>('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For follow-ups, the effective location and stage are always inbox (enforced)
  const effectiveLocationType = isFollowUp ? 'inbox' : locationType;
  const effectiveStage = isFollowUp ? 'inbox' : stage;

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get available projects and phases
  const projects = useMemo(() => {
    return selectProjects({ tasks, filters, loading: false, error: null } as never);
  }, [tasks, filters]);

  const phases = useMemo(() => {
    if (!selectedProject) return [];
    return selectPhases({ tasks, filters, loading: false, error: null } as never, selectedProject);
  }, [tasks, filters, selectedProject]);

  const agents = useMemo(() => {
    const set = new Set<string>();
    for (const task of tasks) {
      if (task.agent) set.add(task.agent);
    }
    return Array.from(set).sort();
  }, [tasks]);

  // Focus title input on mount
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid immediate close
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleLocationChange = useCallback((type: LocationType) => {
    setLocationType(type);
    if (type === 'inbox') {
      setSelectedProject('');
      setSelectedPhase('');
    }
  }, []);

  const handleProjectChange = useCallback(
    (project: string) => {
      setSelectedProject(project);
      setSelectedPhase('');
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!title.trim()) {
        setError('Title is required');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // Parse tags
        const tags = tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        // Build create options - follow-ups always go to inbox with inbox stage
        const createOptions: Parameters<typeof createTaskCreateMessage>[1] = {
          project: effectiveLocationType === 'project' ? selectedProject || undefined : undefined,
          phase: effectiveLocationType === 'project' ? selectedPhase || undefined : undefined,
          stage: effectiveStage,
          content: content || undefined,
          tags,
          agent: agent || undefined,
          template: template || undefined,
        };

        // Add parent reference for follow-ups
        if (isFollowUp && parentTask) {
          createOptions.parent = parentTask.id;
        }

        // Send create message
        postMessageToHost(createTaskCreateMessage(title.trim(), createOptions));

        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create task');
        setIsSubmitting(false);
      }
    },
    [title, effectiveLocationType, selectedProject, selectedPhase, effectiveStage, tagsInput, content, agent, template, isFollowUp, parentTask, onClose],
  );

  return (
    <div className="task-modal-overlay">
      <style>{styles}</style>
      <div className="task-modal" ref={modalRef} role="dialog" aria-labelledby="task-modal-title">
        <div className="task-modal__header">
          <h2 id="task-modal-title" className="task-modal__title">
            {isFollowUp ? 'Add Follow-up' : 'New Task'}
          </h2>
          <button
            className="task-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Parent task info for follow-ups */}
        {isFollowUp && parentTask && (
          <div className="task-modal__parent">
            <span className="task-modal__parent-label">Follow-up to:</span>
            <span className="task-modal__parent-title">{parentTask.title}</span>
          </div>
        )}

        <form className="task-modal__form" onSubmit={handleSubmit}>
          {error && <div className="task-modal__error">{error}</div>}

          {/* Location - hidden for follow-ups since they always go to inbox */}
          {!isFollowUp && (
            <div className="task-modal__field">
              <label className="task-modal__label">Location</label>
              <div className="task-modal__location-toggle">
                <button
                  type="button"
                  className={`task-modal__location-btn ${locationType === 'inbox' ? 'task-modal__location-btn--active' : ''}`}
                  onClick={() => handleLocationChange('inbox')}
                >
                  <InboxIcon />
                  Inbox
                </button>
                <button
                  type="button"
                  className={`task-modal__location-btn ${locationType === 'project' ? 'task-modal__location-btn--active' : ''}`}
                  onClick={() => handleLocationChange('project')}
                >
                  <FolderIcon />
                  Project
                </button>
              </div>
            </div>
          )}

          {/* Project/Phase Selection - hidden for follow-ups */}
          {!isFollowUp && locationType === 'project' && (
            <div className="task-modal__field-group">
              <div className="task-modal__field">
                <label className="task-modal__label" htmlFor="project-select">
                  Project
                </label>
                <select
                  id="project-select"
                  className="task-modal__select"
                  value={selectedProject}
                  onChange={(e) => handleProjectChange(e.target.value)}
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__new__">+ New Project</option>
                </select>
              </div>

              {selectedProject === '__new__' && (
                <div className="task-modal__field">
                  <label className="task-modal__label" htmlFor="new-project">
                    New Project Name
                  </label>
                  <input
                    id="new-project"
                    type="text"
                    className="task-modal__input"
                    placeholder="project-name"
                    onChange={(e) => setSelectedProject(e.target.value)}
                  />
                </div>
              )}

              {selectedProject && selectedProject !== '__new__' && phases.length > 0 && (
                <div className="task-modal__field">
                  <label className="task-modal__label" htmlFor="phase-select">
                    Phase (optional)
                  </label>
                  <select
                    id="phase-select"
                    className="task-modal__select"
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                  >
                    <option value="">No phase</option>
                    {phases.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="task-modal__field">
            <label className="task-modal__label" htmlFor="task-title">
              Title <span className="task-modal__required">*</span>
            </label>
            <input
              id="task-title"
              ref={titleInputRef}
              type="text"
              className="task-modal__input"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Stage - hidden for follow-ups since they always start in inbox */}
          {!isFollowUp && (
            <div className="task-modal__field">
              <label className="task-modal__label">Stage</label>
              <div className="task-modal__stages">
                {STAGES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className={`task-modal__stage-btn ${stage === s.key ? 'task-modal__stage-btn--active' : ''}`}
                    onClick={() => setStage(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="task-modal__field">
            <label className="task-modal__label" htmlFor="task-tags">
              Tags
            </label>
            <input
              id="task-tags"
              type="text"
              className="task-modal__input"
              placeholder="bug, mvp, idea (comma separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <span className="task-modal__hint">Separate tags with commas</span>
          </div>

          {/* Agent */}
          <div className="task-modal__field">
            <label className="task-modal__label" htmlFor="task-agent">
              Agent
            </label>
            <input
              id="task-agent"
              className="task-modal__input"
              list="agent-list"
              placeholder="Select or type agent"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
            />
            {agents.length > 0 && (
              <datalist id="agent-list">
                {agents.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            )}
          </div>

          {/* Template */}
          <div className="task-modal__field">
            <label className="task-modal__label" htmlFor="task-template">
              Template (optional)
            </label>
            <input
              id="task-template"
              type="text"
              className="task-modal__input"
              placeholder="template-name (from _templates/tasks)"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="task-modal__field">
            <label className="task-modal__label" htmlFor="task-content">
              Description
            </label>
            <textarea
              id="task-content"
              className="task-modal__textarea"
              placeholder="Add details, context, or notes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="task-modal__actions">
            <button
              type="button"
              className="task-modal__btn task-modal__btn--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="task-modal__btn task-modal__btn--primary"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Creating...' : isFollowUp ? 'Create Follow-up' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Icons
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 9H2V3a1 1 0 011-1h10a1 1 0 011 1v6zm0 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3h4l1 2h2l1-2h4z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 4H8l-1-2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1z" />
    </svg>
  );
}

const styles = `
.task-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  z-index: 100;
  overflow-y: auto;
}

.task-modal {
  width: 100%;
  max-width: 480px;
  background: var(--colors-bg);
  border: 1px solid var(--colors-border);
  border-radius: var(--radius);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.task-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--colors-border);
}

.task-modal__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--colors-text);
}

.task-modal__close {
  padding: 4px;
  background: none;
  border: none;
  color: var(--colors-subtext);
  cursor: pointer;
  border-radius: 4px;
}

.task-modal__close:hover {
  background: var(--colors-panel);
  color: var(--colors-text);
}

.task-modal__parent {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: color-mix(in srgb, var(--colors-accent) 10%, transparent);
  border-bottom: 1px solid var(--colors-border);
  font-size: 12px;
}

.task-modal__parent-label {
  color: var(--colors-subtext);
}

.task-modal__parent-title {
  color: var(--colors-accent);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-modal__form {
  padding: 20px;
}

.task-modal__error {
  margin-bottom: 16px;
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 12px;
}

.task-modal__field {
  margin-bottom: 16px;
}

.task-modal__field-group {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--colors-panel);
  border-radius: 8px;
}

.task-modal__field-group .task-modal__field {
  margin-bottom: 12px;
}

.task-modal__field-group .task-modal__field:last-child {
  margin-bottom: 0;
}

.task-modal__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--colors-text);
}

.task-modal__required {
  color: var(--colors-accent);
}

.task-modal__input,
.task-modal__select,
.task-modal__textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--colors-border);
  border-radius: 6px;
  background: var(--colors-panel);
  color: var(--colors-text);
  font-size: 13px;
  font-family: inherit;
}

.task-modal__input:focus,
.task-modal__select:focus,
.task-modal__textarea:focus {
  outline: none;
  border-color: var(--colors-accent);
}

.task-modal__input::placeholder,
.task-modal__textarea::placeholder {
  color: var(--colors-subtext);
}

.task-modal__textarea {
  resize: vertical;
  min-height: 80px;
}

.task-modal__hint {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--colors-subtext);
}

/* Location Toggle */
.task-modal__location-toggle {
  display: flex;
  gap: 8px;
}

.task-modal__location-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--colors-border);
  border-radius: 6px;
  background: transparent;
  color: var(--colors-subtext);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.task-modal__location-btn:hover {
  background: var(--colors-panel);
  color: var(--colors-text);
}

.task-modal__location-btn--active {
  background: color-mix(in srgb, var(--colors-accent) 15%, transparent);
  border-color: var(--colors-accent);
  color: var(--colors-text);
}

/* Stages */
.task-modal__stages {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.task-modal__stage-btn {
  padding: 6px 12px;
  border: 1px solid var(--colors-border);
  border-radius: 4px;
  background: transparent;
  color: var(--colors-subtext);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.task-modal__stage-btn:hover {
  background: var(--colors-panel);
  color: var(--colors-text);
}

.task-modal__stage-btn--active {
  background: var(--colors-accent);
  border-color: var(--colors-accent);
  color: white;
}

/* Actions */
.task-modal__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--colors-border);
}

.task-modal__btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.task-modal__btn--secondary {
  background: transparent;
  border: 1px solid var(--colors-border);
  color: var(--colors-text);
}

.task-modal__btn--secondary:hover {
  background: var(--colors-panel);
}

.task-modal__btn--primary {
  background: linear-gradient(135deg, var(--colors-accent), var(--colors-accent2));
  border: none;
  color: white;
}

.task-modal__btn--primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.task-modal__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
