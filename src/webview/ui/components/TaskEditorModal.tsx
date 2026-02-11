import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import type { Task } from '../../../types/task';
import { createMessage, type MessageEnvelope } from '../../messaging';
import { vscode } from '../vscodeApi';
import loader from '@monaco-editor/loader';
import { defineNavyNightTheme, NAVY_NIGHT_MONACO_THEME } from './monaco-theme';
import { LocationPicker } from './LocationPicker';
import { ContextPicker, type ContextFile } from './ContextPicker';
import { SkillPicker, type SkillFile } from './SkillPicker';
import { AgentPicker, type Agent } from './AgentPicker';
import { ProjectModal } from './ProjectModal';

const MonacoEditor = React.lazy(async () => {
  const mod = await import('@monaco-editor/react');
  return { default: mod.default };
});

function postMessage(type: string, payload: unknown) {
  if (vscode) {
    vscode.postMessage(createMessage(type as never, payload));
  }
}

let monacoConfigured = false;
function ensureMonacoConfigured() {
  if (monacoConfigured) return;
  const distUri = (window as any).__KANBAN2CODE_DIST_URI__ as string | undefined;
  if (distUri) {
    const vsPath = `${distUri}/monaco/vs`;
    loader.config({ paths: { vs: vsPath } });
    (self as any).MonacoEnvironment = {
      getWorkerUrl: () => `${vsPath}/base/worker/workerMain.js`,
    };
  }
  monacoConfigured = true;
}

interface TaskMetadata {
  title: string;
  location: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  agent: string | null;
  mode: string | null;
  contexts: string[];
  skills: string[];
  tags: string[];
}

interface TaskEditorModalProps {
  isOpen: boolean;
  task: Task;
  onClose: () => void;
  onSave?: (content: string) => void;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  isOpen,
  task,
  onClose,
  onSave,
}) => {
  const [original, setOriginal] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taskIdRef = useRef<string>('');
  const folderPickRequestIdRef = useRef<string | null>(null);

  // Metadata state
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<
    { type: 'inbox' } | { type: 'project'; project: string; phase?: string }
  >({ type: 'inbox' });
  const [agent, setAgent] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [contexts, setContexts] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Original metadata for dirty checking
  const [originalMetadata, setOriginalMetadata] = useState<TaskMetadata | null>(null);

  // Available options from backend
  const [availableContexts, setAvailableContexts] = useState<ContextFile[]>([]);
  const [availableSkills, setAvailableSkills] = useState<SkillFile[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [phasesByProject, setPhasesByProject] = useState<Record<string, string[]>>({});
  const [showProjectModal, setShowProjectModal] = useState(false);

  const isMetadataDirty = useMemo(() => {
    if (!originalMetadata) return false;
    return (
      title !== originalMetadata.title ||
      JSON.stringify(location) !== JSON.stringify(originalMetadata.location) ||
      agent !== originalMetadata.agent ||
      mode !== originalMetadata.mode ||
      JSON.stringify([...contexts].sort()) !==
        JSON.stringify([...originalMetadata.contexts].sort()) ||
      JSON.stringify([...skills].sort()) !== JSON.stringify([...originalMetadata.skills].sort()) ||
      JSON.stringify([...tags].sort()) !== JSON.stringify([...originalMetadata.tags].sort())
    );
  }, [title, location, agent, mode, contexts, skills, tags, originalMetadata]);

  const isDirty = useMemo(
    () => value !== original || isMetadataDirty,
    [value, original, isMetadataDirty],
  );

  const requestClose = () => {
    if (isSaving) return;
    if (isDirty) {
      const ok = window.confirm('Discard unsaved changes?');
      if (!ok) return;
    }
    onClose();
  };

  const requestSave = () => {
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    postMessage('SaveTaskWithMetadata', {
      taskId: task.id,
      content: value,
      metadata: { title, location, agent, mode, contexts, skills, tags },
    });
  };

  const retryLoad = () => {
    setError(null);
    setIsLoading(true);
    postMessage('RequestFullTaskData', { taskId: task.id });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  useEffect(() => {
    if (!isOpen) return;
    taskIdRef.current = task.id;
    folderPickRequestIdRef.current = null;
    ensureMonacoConfigured();
    setIsLoading(true);
    setIsSaving(false);
    setError(null);
    setShowProjectModal(false);
    // Reset metadata state
    setTitle('');
    setLocation({ type: 'inbox' });
    setAgent(null);
    setMode(null);
    setContexts([]);
    setSkills([]);
    setTags([]);
    setTagInput('');
    setOriginalMetadata(null);
    // Request full task data
    postMessage('RequestFullTaskData', { taskId: task.id });
  }, [isOpen, task.id]);

  const handleProjectCreated = (projectName: string) => {
    setProjects((prev) => {
      const merged = new Set([...prev, projectName]);
      return Array.from(merged).sort();
    });
    setLocation({ type: 'project', project: projectName });
  };

  const handlePickFolder = () => {
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    folderPickRequestIdRef.current = requestId;
    postMessage('PickFolder', { requestId });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handler = (event: MessageEvent<MessageEnvelope>) => {
      const message = event.data;
      if (!message?.type) return;

      const currentTaskId = taskIdRef.current;

      if (message.type === 'FullTaskDataLoaded') {
        const payload = message.payload as {
          taskId: string;
          content: string;
          metadata: TaskMetadata;
          contexts: ContextFile[];
          skills: SkillFile[];
          agents: Agent[];
          projects: string[];
          phasesByProject: Record<string, string[]>;
        };
        if (payload.taskId !== currentTaskId) return;
        setOriginal(payload.content);
        setValue(payload.content);
        setTitle(payload.metadata.title);
        setLocation(payload.metadata.location);
        setAgent(payload.metadata.agent);
        setMode(payload.metadata.mode);
        setContexts(payload.metadata.contexts);
        setSkills(payload.metadata.skills);
        setTags(payload.metadata.tags);
        setOriginalMetadata(payload.metadata);
        setAvailableContexts(payload.contexts);
        setAvailableSkills(payload.skills);
        setAgents(payload.agents);
        setProjects(payload.projects);
        setPhasesByProject(payload.phasesByProject);
        setIsLoading(false);
        setError(null);
      }

      if (message.type === 'FullTaskDataLoadFailed') {
        const payload = message.payload as { taskId: string; error: string };
        if (payload.taskId !== currentTaskId) return;
        setIsLoading(false);
        setError(payload.error || 'Failed to load task data');
      }

      if (message.type === 'TaskMetadataSaved') {
        const payload = message.payload as { taskId: string };
        if (payload.taskId !== currentTaskId) return;
        setIsSaving(false);
        setOriginal(value);
        setOriginalMetadata({ title, location, agent, mode, contexts, skills, tags });
        onSave?.(value);
        onClose();
      }

      if (message.type === 'TaskMetadataSaveFailed') {
        const payload = message.payload as { taskId: string; error: string };
        if (payload.taskId !== currentTaskId) return;
        setIsSaving(false);
        setError(payload.error || 'Failed to save task');
      }

      if (message.type === 'FolderPicked') {
        const payload = message.payload as { path?: string; requestId?: string };
        if (!payload.path) return;
        if (!payload.requestId || payload.requestId !== folderPickRequestIdRef.current) return;
        folderPickRequestIdRef.current = null;
        const folderRef = `folder:${payload.path}`;
        setContexts((prev) => (prev.includes(folderRef) ? prev : [...prev, folderRef]));
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isOpen, onClose, onSave, value, title, location, agent, contexts, skills, tags]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        requestSave();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isDirty, isSaving, value]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      requestClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glass-overlay" onClick={handleOverlayClick}>
      <div
        className="glass-modal task-editor-modal"
        role="dialog"
        aria-labelledby="task-editor-title"
      >
        <div className="modal-header">
          <h2 id="task-editor-title">Edit Task: {title || task.title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              requestClose();
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body task-editor-body-split">
          {isLoading && <div className="board-loading">Loading editor...</div>}

          {!isLoading && error && (
            <div className="board-error">
              {error}
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-secondary" onClick={retryLoad}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* Left: Metadata Panel */}
              <div className="task-editor-metadata">
                {/* Title */}
                <div className="task-editor-section">
                  <div className="task-editor-section-title">Basic Info</div>
                  <div className="form-group">
                    <label className="form-label">
                      Title <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Task title..."
                    />
                  </div>
                </div>

                <div className="task-editor-divider" />

                {/* Location */}
                <div className="task-editor-section">
                  <div className="task-editor-section-title">Location</div>
                  <LocationPicker
                    tasks={[]}
                    projects={projects}
                    phasesByProject={phasesByProject}
                    value={location}
                    onChange={setLocation}
                    onCreateProject={() => setShowProjectModal(true)}
                  />
                  <span className="form-hint">Changing location will move the file</span>
                </div>

                <div className="task-editor-divider" />

                {/* Agent */}
                <div className="task-editor-section">
                  <div className="task-editor-section-title">Assignment</div>
                  <AgentPicker
                    agents={agents}
                    value={agent}
                    onChange={setAgent}
                    onCreateNew={() => postMessage('CreateAgent', {})}
                  />
                </div>

                <div className="task-editor-divider" />

                {/* Contexts */}
                <div className="task-editor-section">
                  <div className="task-editor-section-title">Context Files</div>
                  <ContextPicker
                    contexts={availableContexts}
                    selected={contexts}
                    onChange={setContexts}
                    onCreateNew={() => postMessage('CreateContext', {})}
                    onPickFolder={handlePickFolder}
                  />
                </div>

                <div className="task-editor-divider" />

                {/* Skills */}
                <div className="task-editor-section">
                  <div className="task-editor-section-title">Skills</div>
                  <SkillPicker skills={availableSkills} selected={skills} onChange={setSkills} />
                </div>

                <div className="task-editor-divider" />

                {/* Tags */}
                <div className="task-editor-section">
                  <div className="task-editor-section-title">Tags</div>
                  <div className="form-group">
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
                        placeholder="Add tag..."
                      />
                    </div>
                    {tags.length > 0 && (
                      <div className="tag-chips">
                        {tags.map((tag) => (
                          <span key={tag} className="tag-chip active">
                            {tag}
                            <button
                              type="button"
                              className="tag-remove"
                              aria-label={`Remove tag ${tag}`}
                              onClick={() => handleRemoveTag(tag)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Monaco Editor */}
              <div className="task-editor-content">
                <div className="task-editor-container">
                  <Suspense fallback={<div className="board-loading">Loading Monaco...</div>}>
                    <MonacoEditor
                      language="markdown"
                      value={value}
                      height="100%"
                      theme={NAVY_NIGHT_MONACO_THEME}
                      beforeMount={(monaco) => defineNavyNightTheme(monaco as any)}
                      onChange={(next) => setValue(next ?? '')}
                      options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        renderWhitespace: 'selection',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        tabSize: 2,
                        automaticLayout: true,
                      }}
                    />
                  </Suspense>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer task-editor-footer">
          <div className="task-editor-hints">
            <span>[Esc] Cancel</span>
            <span>[Ctrl+S] Save</span>
            {isDirty && <span className="task-editor-dirty">Unsaved changes</span>}
            {isSaving && <span className="task-editor-saving">Saving...</span>}
          </div>
          <div className="task-editor-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                requestClose();
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={requestSave}
              disabled={isSaving || isLoading || !title.trim()}
            >
              Save
            </button>
          </div>
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
