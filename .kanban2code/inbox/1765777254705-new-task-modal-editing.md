---
stage: audit
tags: []
contexts: []
---

# Enhanced Task Editor Modal - Implementation Specification

## Design Reference

HTML/CSS mockup: `docs/design/forms/task-editor-enhanced.html`

## Objective

Extend `src/webview/ui/components/TaskEditorModal.tsx` to support editing task metadata (title, location, agent, template, contexts, tags) alongside the existing markdown content editor.

## Constraints

- DO NOT add stage editing (conflicts with drag-and-drop workflow)
- DO NOT add parent task selector
- Location changes MUST move the file on disk AND update metadata
- Template changes MUST re-apply template content (overwriting existing content)
- Cancel and Close buttons MUST work correctly with unsaved changes confirmation

## File Modifications Required

### 1. src/webview/messaging.ts

Add to `HostToWebviewMessageTypes` array (after line 19):
```typescript
'FullTaskDataLoaded',
'FullTaskDataLoadFailed',
'TaskMetadataSaved',
'TaskMetadataSaveFailed',
'TemplateContentLoaded',
'TemplateContentLoadFailed',
```

Add to `WebviewToHostMessageTypes` array (after line 46):
```typescript
'RequestFullTaskData',
'SaveTaskWithMetadata',
'RequestTemplateContent',
```

### 2. src/webview/ui/components/TaskEditorModal.tsx

#### Add Imports (after line 6)

```typescript
import { LocationPicker } from './LocationPicker';
import { TemplatePicker } from './TemplatePicker';
import { ContextPicker, type ContextFile } from './ContextPicker';
import { AgentPicker, type Agent } from './AgentPicker';
```

#### Add Interfaces (after line 31)

```typescript
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
```

#### Add State Variables (inside component, after line 45)

```typescript
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
```

#### Update isDirty Memoization (replace line 49)

```typescript
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
```

#### Update requestSave Function (replace lines 60-65)

```typescript
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
```

#### Update useEffect for isOpen (replace lines 73-81)

```typescript
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
```

#### Update Message Handler useEffect (replace lines 83-127)

Add handlers for new message types:

```typescript
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
```

#### Add Template Change Handler (after requestSave function)

```typescript
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
```

#### Update JSX Return (replace lines 156-225)

```jsx
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
                />
              </div>

              {/* Template */}
              <div className="task-editor-section">
                <TemplatePicker
                  templates={templates}
                  value={template}
                  onChange={handleTemplateChange}
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
```

### 3. src/webview/ui/styles/main.css

Add after line 1220 (after `.task-editor-actions`):

```css
/* Enhanced Task Editor - Split Layout */
.task-editor-body-split {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.task-editor-metadata {
  width: 320px;
  min-width: 280px;
  max-width: 360px;
  border-right: 1px solid var(--vscode-panel-border);
  padding: var(--spacing-lg);
  overflow-y: auto;
  background: var(--k2c-bg-surface-2);
  flex-shrink: 0;
}

.task-editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.task-editor-section {
  margin-bottom: var(--spacing-md);
}

.task-editor-section-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--k2c-border-subtle);
}

.task-editor-divider {
  height: 1px;
  background: var(--k2c-border-subtle);
  margin: var(--spacing-md) 0;
}

.template-warning {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--k2c-warning-muted);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-sm);
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--k2c-warning);
}

.template-warning-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.template-warning-actions .btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}
```

### 4. src/webview/SidebarProvider.ts

Add message handlers in switch statement (find the switch statement handling webview messages):

#### RequestFullTaskData Handler

```typescript
case 'RequestFullTaskData': {
  const { taskId } = payload as { taskId: string };
  try {
    const { task, content } = await loadTaskContentById(taskId);
    const templates = await loadTemplates();
    const contexts = await loadContexts();
    const agents = await loadAgents();
    const projects = await getProjects();
    const phasesByProject = await getPhasesByProject();

    this.postMessage('FullTaskDataLoaded', {
      taskId,
      content,
      metadata: {
        title: task.title,
        location: task.project
          ? { type: 'project', project: task.project, phase: task.phase }
          : { type: 'inbox' },
        agent: task.agent || null,
        template: null,
        contexts: task.contexts || [],
        tags: task.tags || [],
      },
      templates,
      contexts,
      agents,
      projects,
      phasesByProject,
    });
  } catch (err) {
    this.postMessage('FullTaskDataLoadFailed', {
      taskId,
      error: err instanceof Error ? err.message : 'Failed to load task',
    });
  }
  break;
}
```

#### SaveTaskWithMetadata Handler

```typescript
case 'SaveTaskWithMetadata': {
  const { taskId, content, metadata } = payload as {
    taskId: string;
    content: string;
    metadata: {
      title: string;
      location: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
      agent: string | null;
      template: string | null;
      contexts: string[];
      tags: string[];
    };
  };
  try {
    const tasks = await saveTaskWithMetadata(taskId, content, metadata);
    this.postMessage('TaskMetadataSaved', { taskId });
    this.postMessage('TaskUpdated', { tasks });
  } catch (err) {
    this.postMessage('TaskMetadataSaveFailed', {
      taskId,
      error: err instanceof Error ? err.message : 'Failed to save task',
    });
  }
  break;
}
```

#### RequestTemplateContent Handler

```typescript
case 'RequestTemplateContent': {
  const { templateId } = payload as { templateId: string };
  try {
    const template = await loadTemplateById(templateId);
    this.postMessage('TemplateContentLoaded', {
      templateId,
      content: template.content,
    });
  } catch (err) {
    this.postMessage('TemplateContentLoadFailed', {
      templateId,
      error: err instanceof Error ? err.message : 'Failed to load template',
    });
  }
  break;
}
```

Add import at top of file:
```typescript
import { saveTaskWithMetadata } from '../services/task-content';
import { loadTemplateById } from '../services/template';
```

### 5. src/services/task-content.ts

Add import at top:
```typescript
import * as path from 'path';
import { stringifyTaskFile } from './frontmatter';
```

Add function after `saveTaskContentById`:

```typescript
export async function saveTaskWithMetadata(
  taskId: string,
  content: string,
  metadata: {
    title: string;
    location: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
    agent: string | null;
    template: string | null;
    contexts: string[];
    tags: string[];
  }
): Promise<Task[]> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) throw new Error('Kanban workspace not detected.');
  if (!taskId) throw new Error('Missing taskId.');

  const task = await findTaskById(root, taskId);
  if (!task) throw new Error('Task not found.');

  validateTaskFileContent(content);

  const currentLocation = task.project
    ? { type: 'project' as const, project: task.project, phase: task.phase }
    : { type: 'inbox' as const };

  const locationChanged = JSON.stringify(currentLocation) !== JSON.stringify(metadata.location);
  let targetPath = task.filePath;

  if (locationChanged) {
    const fileName = path.basename(task.filePath);

    if (metadata.location.type === 'inbox') {
      targetPath = path.join(root, 'inbox', fileName);
    } else {
      const { project, phase } = metadata.location;
      targetPath = phase
        ? path.join(root, 'projects', project, phase, fileName)
        : path.join(root, 'projects', project, fileName);
    }

    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(targetPath)));
  }

  const updatedTask: Task = {
    ...task,
    title: metadata.title,
    agent: metadata.agent || undefined,
    contexts: metadata.contexts.length > 0 ? metadata.contexts : undefined,
    tags: metadata.tags.length > 0 ? metadata.tags : undefined,
    content,
  };

  const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(task.filePath));
  const originalContent = new TextDecoder('utf-8').decode(raw);
  const serialized = stringifyTaskFile(updatedTask, originalContent);

  await vscode.workspace.fs.writeFile(vscode.Uri.file(targetPath), new TextEncoder().encode(serialized));

  if (locationChanged && targetPath !== task.filePath) {
    await vscode.workspace.fs.delete(vscode.Uri.file(task.filePath));
  }

  return loadAllTasks(root);
}
```

### 6. src/services/template.ts

Add function (create file if it doesn't exist):

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { WorkspaceState } from '../workspace/state';

export async function loadTemplateById(templateId: string): Promise<{ id: string; content: string }> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) throw new Error('Kanban workspace not detected.');

  const templatePath = path.join(root, 'templates', `${templateId}.md`);

  try {
    const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(templatePath));
    const content = new TextDecoder('utf-8').decode(raw);
    return { id: templateId, content };
  } catch {
    throw new Error(`Template '${templateId}' not found.`);
  }
}
```

## Helper Functions Required

If `getProjects` and `getPhasesByProject` don't exist in SidebarProvider.ts, add:

```typescript
async function getProjects(): Promise<string[]> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) return [];
  const projectsDir = path.join(root, 'projects');
  try {
    const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(projectsDir));
    return entries.filter(([, type]) => type === vscode.FileType.Directory).map(([name]) => name);
  } catch {
    return [];
  }
}

async function getPhasesByProject(): Promise<Record<string, string[]>> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) return {};
  const projects = await getProjects();
  const result: Record<string, string[]> = {};
  for (const project of projects) {
    const projectDir = path.join(root, 'projects', project);
    try {
      const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(projectDir));
      result[project] = entries.filter(([, type]) => type === vscode.FileType.Directory).map(([name]) => name);
    } catch {
      result[project] = [];
    }
  }
  return result;
}
```

## Testing Checklist

1. Open edit modal from TaskCard - all metadata loads correctly
2. Change title - dirty indicator appears
3. Change location inbox -> project - file moves on save
4. Change location project -> inbox - file moves on save
5. Change agent - saved correctly
6. Change template - warning appears, content updates on confirm
7. Add/remove contexts - saved correctly
8. Add/remove tags - saved correctly
9. Press Escape with unsaved changes - confirmation dialog
10. Click Cancel with unsaved changes - confirmation dialog
11. Click overlay with unsaved changes - confirmation dialog
12. Press Ctrl+S - saves correctly
13. Click Save - saves correctly, modal closes
14. Invalid content - error handling works

---

### Audit

**Implementation Date:** 2025-12-15

**Status:** Completed - TypeScript compilation passed, build successful

#### Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `src/webview/messaging.ts` | Modified | Added 6 new host-to-webview message types (`FullTaskDataLoaded`, `FullTaskDataLoadFailed`, `TaskMetadataSaved`, `TaskMetadataSaveFailed`, `TemplateContentLoaded`, `TemplateContentLoadFailed`) and 3 new webview-to-host message types (`RequestFullTaskData`, `SaveTaskWithMetadata`, `RequestTemplateContent`) |
| `src/webview/ui/components/TaskEditorModal.tsx` | Rewritten | Complete rewrite to support split-panel layout with metadata editing (left panel) and Monaco editor (right panel). Added imports for picker components, new state variables for metadata, dirty checking for metadata changes, template change warning dialog, tag management |
| `src/webview/ui/styles/main.css` | Modified | Added ~70 lines of CSS for enhanced editor split layout (`.task-editor-body-split`, `.task-editor-metadata`, `.task-editor-content`, `.task-editor-section`, `.task-editor-section-title`, `.task-editor-divider`, `.template-warning`) |
| `src/webview/SidebarProvider.ts` | Modified | Added import for `loadTemplateById` and `saveTaskWithMetadata`. Added 3 new message handlers: `RequestFullTaskData` (loads task with all metadata and available options), `SaveTaskWithMetadata` (saves task with metadata, handles file relocation), `RequestTemplateContent` (loads template content) |
| `src/services/task-content.ts` | Modified | Added `path` import and `stringifyTaskFile` import. Added new `saveTaskWithMetadata` function (~70 lines) that handles title/agent/contexts/tags updates, detects location changes, moves files between inbox/projects, creates target directories, deletes old files after successful move |
| `src/services/template.ts` | Modified | Added `loadTemplateById` function (~15 lines) that loads template content by ID from the templates folder and returns parsed markdown content without frontmatter |

#### Key Implementation Details

1. **Split Panel Layout**: Left panel (320px) for metadata editing, right panel for Monaco editor
2. **Metadata Fields Supported**: title, location (inbox/project/phase), agent, template, contexts, tags
3. **Dirty Checking**: Tracks both content changes and metadata changes separately
4. **File Relocation**: When location changes, file is moved to new path and old file is deleted
5. **Template Warning**: Shows confirmation dialog before overwriting content with template
6. **Tag Management**: Add tags via Enter key, remove via × button
7. **Uses Existing Picker Components**: `LocationPicker`, `TemplatePicker`, `ContextPicker`, `AgentPicker`

#### Constraints Followed

- ✅ NO stage editing (conflicts with drag-and-drop workflow)
- ✅ NO parent task selector
- ✅ Location changes move file on disk AND update metadata
- ✅ Template changes re-apply template content with warning
- ✅ Cancel/Close buttons work with unsaved changes confirmation
