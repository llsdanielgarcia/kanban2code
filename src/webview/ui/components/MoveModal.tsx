import React, { useState, useMemo, useEffect } from 'react';
import type { Task } from '../../../types/task';
import { createMessage } from '../../messaging';
import { vscode } from '../vscodeApi';

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

interface MoveModalProps {
  isOpen: boolean;
  task: Task;
  allTasks: Task[];
  onClose: () => void;
}

type LocationValue = { type: 'inbox' } | { type: 'project'; project: string; phase?: string };

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  task,
  allTasks,
  onClose,
}) => {
  const [locationType, setLocationType] = useState<'inbox' | 'project'>('inbox');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');

  // Extract unique projects from tasks
  const projects = useMemo(() => {
    const projectSet = new Set<string>();
    allTasks.forEach((t) => {
      if (t.project) projectSet.add(t.project);
    });
    return Array.from(projectSet).sort();
  }, [allTasks]);

  // Extract phases for selected project
  const phases = useMemo(() => {
    const phaseSet = new Set<string>();
    allTasks.forEach((t) => {
      if (t.project === selectedProject && t.phase) {
        phaseSet.add(t.phase);
      }
    });
    return Array.from(phaseSet).sort();
  }, [allTasks, selectedProject]);

  // Initialize from task's current location
  useEffect(() => {
    if (isOpen) {
      if (task.project) {
        setLocationType('project');
        setSelectedProject(task.project);
        setSelectedPhase(task.phase || '');
      } else {
        setLocationType('inbox');
        setSelectedProject('');
        setSelectedPhase('');
      }
    }
  }, [isOpen, task]);

  // Handle escape key
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
  }, [isOpen, onClose, locationType, selectedProject, selectedPhase]);

  const handleSubmit = () => {
    const location: LocationValue = locationType === 'inbox'
      ? { type: 'inbox' }
      : { type: 'project', project: selectedProject, phase: selectedPhase || undefined };

    // Check if actually moving somewhere different
    const currentIsInbox = !task.project;
    const targetIsInbox = location.type === 'inbox';

    if (currentIsInbox && targetIsInbox) {
      onClose();
      return;
    }

    if (
      location.type === 'project' &&
      task.project === location.project &&
      (task.phase || '') === (location.phase || '')
    ) {
      onClose();
      return;
    }

    postMessage('MoveTaskToLocation', {
      taskId: task.id,
      location,
    });
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTypeChange = (type: 'inbox' | 'project') => {
    setLocationType(type);
    if (type === 'inbox') {
      setSelectedProject('');
      setSelectedPhase('');
    }
  };

  const handleProjectChange = (project: string) => {
    setSelectedProject(project);
    setSelectedPhase(''); // Reset phase when project changes
  };

  if (!isOpen) return null;

  const canSubmit = locationType === 'inbox' || selectedProject;

  return (
    <div className="glass-overlay" onClick={handleOverlayClick}>
      <div className="glass-modal move-modal" role="dialog" aria-labelledby="move-modal-title">
        <div className="modal-header">
          <h2 id="move-modal-title">Move Task</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="move-task-preview">
            <span className={`stage-indicator ${task.stage}`} />
            <span className="task-title">{task.title}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Move to</label>
            <div className="location-type-buttons">
              <button
                type="button"
                className={`location-type-btn ${locationType === 'inbox' ? 'active' : ''}`}
                onClick={() => handleTypeChange('inbox')}
              >
                Inbox
              </button>
              <button
                type="button"
                className={`location-type-btn ${locationType === 'project' ? 'active' : ''}`}
                onClick={() => handleTypeChange('project')}
              >
                Project
              </button>
            </div>
          </div>

          {locationType === 'project' && (
            <>
              <div className="form-group">
                <label className="form-label">Project</label>
                <select
                  className="form-select"
                  value={selectedProject}
                  onChange={(e) => handleProjectChange(e.target.value)}
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>

              {phases.length > 0 && selectedProject && (
                <div className="form-group">
                  <label className="form-label">Phase (optional)</label>
                  <select
                    className="form-select"
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                  >
                    <option value="">No specific phase</option>
                    {phases.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Move Task
          </button>
        </div>
      </div>
    </div>
  );
};
