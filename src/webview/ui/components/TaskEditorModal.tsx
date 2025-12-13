import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import type { Task } from '../../../types/task';
import { createMessage, type MessageEnvelope } from '../../messaging';
import { vscode } from '../vscodeApi';
import loader from '@monaco-editor/loader';
import { defineNavyNightTheme, NAVY_NIGHT_MONACO_THEME } from './monaco-theme';

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

  const isDirty = useMemo(() => value !== original, [value, original]);

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
    postMessage('SaveTaskContent', { taskId: task.id, content: value });
  };

  const retryLoad = () => {
    setError(null);
    setIsLoading(true);
    postMessage('RequestTaskContent', { taskId: task.id });
  };

  useEffect(() => {
    if (!isOpen) return;
    taskIdRef.current = task.id;
    ensureMonacoConfigured();
    setIsLoading(true);
    setIsSaving(false);
    setError(null);
    postMessage('RequestTaskContent', { taskId: task.id });
  }, [isOpen, task.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (event: MessageEvent<MessageEnvelope>) => {
      const message = event.data;
      if (!message?.type) return;

      const currentTaskId = taskIdRef.current;

      if (message.type === 'TaskContentLoaded') {
        const payload = message.payload as { taskId: string; content: string };
        if (payload.taskId !== currentTaskId) return;
        setOriginal(payload.content);
        setValue(payload.content);
        setIsLoading(false);
        setError(null);
      }

      if (message.type === 'TaskContentLoadFailed') {
        const payload = message.payload as { taskId: string; error: string };
        if (payload.taskId !== currentTaskId) return;
        setIsLoading(false);
        setError(payload.error || 'Failed to load task content');
      }

      if (message.type === 'TaskContentSaved') {
        const payload = message.payload as { taskId: string };
        if (payload.taskId !== currentTaskId) return;
        setIsSaving(false);
        setOriginal(value);
        onSave?.(value);
        onClose();
      }

      if (message.type === 'TaskContentSaveFailed') {
        const payload = message.payload as { taskId: string; error: string };
        if (payload.taskId !== currentTaskId) return;
        setIsSaving(false);
        setError(payload.error || 'Failed to save task');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isOpen, onClose, onSave, value]);

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
          <button className="modal-close-btn" onClick={requestClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body task-editor-body">
          {isLoading && <div className="board-loading">Loading editor…</div>}

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
            <div className="task-editor-container">
              <Suspense fallback={<div className="board-loading">Loading Monaco…</div>}>
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
          )}
        </div>

        <div className="modal-footer task-editor-footer">
          <div className="task-editor-hints">
            <span>[Esc] Cancel</span>
            <span>[Ctrl+S] Save</span>
            {isDirty && <span className="task-editor-dirty">Unsaved changes</span>}
            {isSaving && <span className="task-editor-saving">Saving…</span>}
          </div>
          <div className="task-editor-actions">
            <button className="btn btn-secondary" onClick={requestClose} disabled={isSaving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={requestSave} disabled={isSaving || isLoading}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
