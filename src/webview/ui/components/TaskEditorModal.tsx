import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import type { Task } from '../../../types/task';
import { createMessage, type MessageEnvelope } from '../../messaging';
import { vscode } from '../vscodeApi';
import loader from '@monaco-editor/loader';
import { defineNavyNightTheme, NAVY_NIGHT_MONACO_THEME } from './monaco-theme';
import { LocationPicker } from './LocationPicker';
import { TemplatePicker } from './TemplatePicker';
import { ContextPicker, type ContextFile } from './ContextPicker';
import { AgentPicker, type Agent } from './AgentPicker';

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

interface Template {
  id: string;
  name: string;
  description: string;
}

interface TaskMetadata {
  title: string;
  location: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  agent: string | null;
  template: string | null;
  contexts: string[];
  tags: string[];
}

interface TaskEditorModalProps {
  isOpen: boolean;
  task: Task;
  onClose: () => void;
  onSave?: (content: string) => void;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({ isOpen, task, onClose, onSave }) => {
  const [original, setOriginal] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taskIdRef = useRef<string>('');

  // Metadata state
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<{ type: 'inbox' } | { type: 'project'; project: string; phase?: string }>({ type: 'inbox' });
  const [agent, setAgent] = useState<string | null>(null);
  const [template, setTemplate] = useState<string | null>(null);
  const [contexts, setContexts] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Original metadata for dirty checking
  const [originalMetadata, setOriginalMetadata] = useState<TaskMetadata | null>(null);

  // Available options from backend
  const [templates, setTemplates] = useState<Template[]>([]);
  const [availableContexts, setAvailableContexts] = useState<ContextFile[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [phasesByProject, setPhasesByProject] = useState<Record<string, string[]>>({});

  // Template warning state
  const [showTemplateWarning, setShowTemplateWarning] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);

  const isMetadataDirty = useMemo(() => {
    if (!originalMetadata) return false;
    return (
      title !== originalMetadata.title ||
      JSON.stringify(location) !== JSON.stringify(originalMetadata.location) ||
      agent !== originalMetadata.agent ||
      template !== originalMetadata.template ||
      JSON.stringify([...contexts].sort()) !== JSON.stringify([...originalMetadata.contexts].sort()) ||
      JSON.stringify([...tags].sort()) !== JSON.stringify([...originalMetadata.tags].sort())
    );
  }, [title, location, agent, template, contexts, tags, originalMetadata]);

  const isDirty = useMemo(() => value !== original || isMetadataDirty, [value, original, isMetadataDirty]);

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
      metadata: { title, location, agent, template, contexts, tags }
    });
  };

  const retryLoad = () => {
    setError(null);
    setIsLoading(true);
    postMessage('RequestFullTaskData', { taskId: task.id });
  };

  const handleTemplateChange = (newTemplate: string | null) => {
    if (newTemplate && newTemplate !== template && value.trim()) {
      setPendingTemplate(newTemplate);
      setShowTemplateWarning(true);
    } else {
      setTemplate(newTemplate);
      if (newTemplate) {
        postMessage('RequestTemplateContent', { templateId: newTemplate });
      }
    }
  };

  const confirmTemplateChange = () => {
    if (pendingTemplate) {
      setTemplate(pendingTemplate);
      postMessage('RequestTemplateContent', { templateId: pendingTemplate });
    }
  };

  const cancelTemplateChange = () => {
    setShowTemplateWarning(false);
    setPendingTemplate(null);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  useEffect(() => {
    if (!isOpen) return;
    taskIdRef.current = task.id;
    ensureMonacoConfigured();
    setIsLoading(true);
    setIsSaving(false);
    setError(null);
    // Reset metadata state
    setTitle('');
    setLocation({ type: 'inbox' });
    setAgent(null);
    setTemplate(null);
    setContexts([]);
    setTags([]);
    setTagInput('');
    setOriginalMetadata(null);
    setShowTemplateWarning(false);
    setPendingTemplate(null);
    // Request full task data
    postMessage('RequestFullTaskData', { taskId: task.id });
  }, [isOpen, task.id]);

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
          templates: Template[];
          contexts: ContextFile[];
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
        setTemplate(payload.metadata.template);
        setContexts(payload.metadata.contexts);
        setTags(payload.metadata.tags);
        setOriginalMetadata(payload.metadata);
        setTemplates(payload.templates);
        setAvailableContexts(payload.contexts);
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
        setOriginalMetadata({ title, location, agent, template, contexts, tags });
        onSave?.(value);
        onClose();
      }

      if (message.type === 'TaskMetadataSaveFailed') {
        const payload = message.payload as { taskId: string; error: string };
        if (payload.taskId !== currentTaskId) return;
        setIsSaving(false);
        setError(payload.error || 'Failed to save task');
      }

      if (message.type === 'TemplateContentLoaded') {
        const payload = message.payload as { templateId: string; content: string };
        setValue(payload.content);
        setShowTemplateWarning(false);
        setPendingTemplate(null);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isOpen, onClose, onSave, value, title, location, agent, template, contexts, tags]);

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
      <div className="glass-modal task-editor-modal" role="dialog" aria-labelledby="task-editor-title">
        <div className="modal-header">
          <h2 id="task-editor-title">Edit Task: {task.title}</h2>
          <button className="modal-close-btn" onClick={requestClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body task-editor-body-split">
          {isLoading && <div className="board-loading">Loading editor...</div>}

          {!isLoading && error && (
            <div className="board-error">
              {error}
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-secondary" onClick={retryLoad}>Retry</button>
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
                    <label className="form-label">Title <span className="required">*</span></label>
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

                {/* Template */}
                <div className="task-editor-section">
                  <TemplatePicker
                    templates={templates}
                    value={template}
                    onChange={handleTemplateChange}
                    onCreateNew={() => postMessage('CreateTemplate', {})}
                  />
                  {showTemplateWarning && (
                    <div className="template-warning">
                      <span>Changing template will replace content</span>
                      <div className="template-warning-actions">
                        <button className="btn btn-secondary" onClick={cancelTemplateChange}>Cancel</button>
                        <button className="btn btn-primary" onClick={confirmTemplateChange}>Apply</button>
                      </div>
                    </div>
                  )}
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
                  />
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
                            <button type="button" className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</button>
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
            <button className="btn btn-secondary" onClick={requestClose} disabled={isSaving}>Cancel</button>
            <button className="btn btn-primary" onClick={requestSave} disabled={isSaving || isLoading || !title.trim()}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};
