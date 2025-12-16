import React, { useEffect, useId, useMemo, useState } from 'react';
import type { Task } from '../../../types/task';

interface LocationPickerProps {
  tasks: Task[];
  projects?: string[];
  phasesByProject?: Record<string, string[]>;
  value: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  onChange: (location: LocationPickerProps['value']) => void;
  onCreateProject?: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  tasks,
  projects: knownProjects = [],
  phasesByProject: knownPhasesByProject = {},
  value,
  onChange,
  onCreateProject,
}) => {
  const projectSelectId = useId();
  const phaseSelectId = useId();
  const [locationType, setLocationType] = useState<'inbox' | 'project'>(value.type);
  const [selectedProject, setSelectedProject] = useState(
    value.type === 'project' ? value.project : ''
  );
  const [selectedPhase, setSelectedPhase] = useState(
    value.type === 'project' ? value.phase || '' : ''
  );

  useEffect(() => {
    setLocationType(value.type);
    if (value.type === 'project') {
      setSelectedProject(value.project);
      setSelectedPhase(value.phase || '');
    } else {
      setSelectedProject('');
      setSelectedPhase('');
    }
  }, [value]);

  // Extract unique projects from tasks
  const projectOptions = useMemo(() => {
    const projectSet = new Set<string>();
    knownProjects.forEach((project) => projectSet.add(project));
    tasks.forEach((task) => {
      if (task.project) projectSet.add(task.project);
    });
    return Array.from(projectSet).sort();
  }, [knownProjects, tasks]);

  // Extract phases for selected project
  const phaseOptions = useMemo(() => {
    const phaseSet = new Set<string>();
    (knownPhasesByProject[selectedProject] ?? []).forEach((phase) => phaseSet.add(phase));
    tasks.forEach((task) => {
      if (task.project === selectedProject && task.phase) {
        phaseSet.add(task.phase);
      }
    });
    return Array.from(phaseSet).sort();
  }, [knownPhasesByProject, selectedProject, tasks]);

  const handleTypeChange = (type: 'inbox' | 'project') => {
    setLocationType(type);
    if (type === 'inbox') {
      onChange({ type: 'inbox' });
    } else if (selectedProject) {
      onChange({
        type: 'project',
        project: selectedProject,
        phase: selectedPhase || undefined,
      });
    }
  };

  const handleProjectChange = (project: string) => {
    setSelectedProject(project);
    setSelectedPhase(''); // Reset phase when project changes
    if (project) {
      onChange({ type: 'project', project });
    }
  };

  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    onChange({
      type: 'project',
      project: selectedProject,
      phase: phase || undefined,
    });
  };

  return (
    <div className="location-picker">
      <div className="form-group">
        <label className="form-label">Location</label>
        <div className="location-type-selector">
          <button
            type="button"
            className={`location-type-btn ${locationType === 'inbox' ? 'active' : ''}`}
            onClick={() => handleTypeChange('inbox')}
            aria-pressed={locationType === 'inbox'}
          >
            📥 Inbox
          </button>
          <button
            type="button"
            className={`location-type-btn ${locationType === 'project' ? 'active' : ''}`}
            onClick={() => handleTypeChange('project')}
            aria-pressed={locationType === 'project'}
          >
            📁 Project
          </button>
        </div>
      </div>

      {locationType === 'project' && (
        <div className="location-selects">
          <div className="form-group">
            <label className="form-label" htmlFor={projectSelectId}>
              Project
            </label>
            <select
              id={projectSelectId}
              className="form-select"
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
            >
              <option value="">Select a project...</option>
              {projectOptions.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
            {onCreateProject && (
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={onCreateProject}>
                  Create Project
                </button>
              </div>
            )}
          </div>

          {phaseOptions.length > 0 && (
            <div className="form-group">
              <label className="form-label" htmlFor={phaseSelectId}>
                Phase (optional)
              </label>
              <select
                id={phaseSelectId}
                className="form-select"
                value={selectedPhase}
                onChange={(e) => handlePhaseChange(e.target.value)}
              >
                <option value="">No specific phase</option>
                {phaseOptions.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
