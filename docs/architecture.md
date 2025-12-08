# Kanban2Code Architecture

## Overview

Kanban2Code is a VS Code extension that provides a markdown-based kanban board with AI context management. Tasks are stored as markdown files with YAML frontmatter, enabling version control and external editing.

## Directory Structure

```
kanban2code/
├── src/                          # Extension source code
│   ├── extension.ts              # Extension entry point
│   ├── core/                     # Shared constants and utilities
│   │   └── constants.ts          # Stage definitions, folder names
│   ├── types/                    # TypeScript type definitions
│   │   ├── task.ts               # Task and Stage types
│   │   └── copy.ts               # CopyMode type for context copying
│   ├── services/                 # Business logic services
│   │   ├── frontmatter.ts        # Markdown parsing/serialization
│   │   ├── taskService.ts        # Task loading and management
│   │   ├── taskMoveService.ts    # Stage transitions
│   │   ├── archiveService.ts     # Archive operations
│   │   ├── fileWatcher.ts        # File system change detection
│   │   ├── contextService.ts     # Context file loaders (Phase 2)
│   │   ├── templateService.ts    # Stage template resolution (Phase 2)
│   │   ├── promptBuilder.ts      # 9-layer XML prompt builder (Phase 2)
│   │   └── copyService.ts        # Copy payload builder (Phase 2)
│   ├── workspace/                # Workspace management
│   │   ├── validation.ts         # Root detection and path guards
│   │   └── scaffolder.ts         # Workspace initialization
│   ├── commands/                 # VS Code command handlers
│   │   ├── openBoard.ts          # Open board webview
│   │   ├── newTask.ts            # Create new task
│   │   ├── scaffoldWorkspace.ts  # Initialize workspace
│   │   ├── archiveCommands.ts    # Archive task/project commands
│   │   └── copyTaskContext.ts    # Copy context to clipboard (Phase 2)
│   └── webview/                  # React webview UI
│       ├── BoardPanel.ts         # Board webview host
│       ├── SidebarProvider.ts    # Sidebar webview host
│       ├── App.tsx               # React root component
│       ├── main.tsx              # Webview entry point
│       ├── messaging/            # Host-webview communication
│       │   ├── types.ts          # Message type definitions
│       │   └── protocol.ts       # Message handling
│       ├── stores/               # Zustand state management
│       │   ├── taskStore.ts      # Task state
│       │   └── uiStore.ts        # UI state
│       └── components/           # React components
│           └── ...               # UI components
├── tests/                        # Test files (Vitest)
│   ├── services/                 # Service unit tests
│   │   ├── frontmatter.test.ts
│   │   ├── taskService.test.ts
│   │   ├── taskMoveService.test.ts
│   │   ├── archiveService.test.ts
│   │   ├── fileWatcher.test.ts
│   │   ├── contextService.test.ts   # Phase 2
│   │   ├── templateService.test.ts  # Phase 2
│   │   ├── promptBuilder.test.ts    # Phase 2
│   │   └── copyService.test.ts      # Phase 2
│   ├── workspace/                # Workspace tests
│   │   └── validation.test.ts
│   ├── webview/                  # Webview tests
│   │   └── messaging.test.ts
│   └── fixtures/                 # Test fixtures
│       └── ...                   # Sample task files
├── scripts/                      # Build tooling
│   └── build.ts                  # esbuild configuration
├── media/                        # Extension assets
│   └── icon.svg                  # Activity bar icon
├── dist/                         # Build output (generated)
│   ├── extension.js              # Bundled extension
│   └── webview.js                # Bundled webview
└── docs/                         # Documentation
    └── architecture.md           # This file
```

## Core Concepts

### Task Lifecycle

Tasks progress through stages defined in the kanban workflow:

```
inbox → plan → code → audit → completed → (archive)
```

**Stage Definitions:**
| Stage | Description |
|-------|-------------|
| `inbox` | New tasks awaiting triage |
| `plan` | Tasks being planned/designed |
| `code` | Active development |
| `audit` | Code review/testing |
| `completed` | Done (ready for archive) |

**Archive** is not a stage but a storage location for completed work.

### Workspace Layout (.kanban2code/)

```
.kanban2code/
├── how-it-works.md           # Global context: workspace overview
├── architecture.md           # Global context: project architecture
├── project-details.md        # Global context: project specifics
├── inbox/                    # Unassigned tasks
│   └── *.md
├── projects/                 # Project-organized tasks
│   └── {project}/
│       ├── _context.md       # Project-level context for AI
│       ├── *.md              # Direct project tasks
│       └── {phase}/          # Optional phase grouping
│           ├── _context.md   # Phase-level context for AI
│           └── *.md          # Phase tasks
├── _templates/               # Task templates
│   ├── stages/               # Stage-specific guidance templates
│   └── tasks/                # Reusable task templates
├── _agents/                  # AI agent configurations
├── _contexts/                # Custom context files (Phase 2)
└── _archive/                 # Archived tasks (mirrors structure)
    ├── inbox/
    └── projects/
```

### Task File Format

Tasks are markdown files with YAML frontmatter:

```yaml
---
stage: plan
title: Implement user authentication
tags:
  - mvp
  - security
created: 2025-01-15T10:00:00Z
# Additional fields preserved
---

# Task Content

Description and implementation notes...
```

**Frontmatter Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stage` | Stage | Yes (default: inbox) | Current workflow stage |
| `title` | string | No | Task title (falls back to filename/h1) |
| `tags` | string[] | No | Categorization tags |
| `created` | ISO date | No | Creation timestamp |
| `agent` | string | No | Assigned AI agent |
| `parent` | string | No | Parent task ID |
| `contexts` | string[] | No | Related context files |
| `order` | number | No | Sort order within stage |

**Inferred Fields (not stored in frontmatter):**
- `id` - Generated from file path
- `filePath` - Absolute path to file
- `project` - Inferred from folder structure
- `phase` - Inferred from folder structure
- `content` - Markdown body after frontmatter

## Architecture Layers

### 1. Services Layer

Pure business logic with no VS Code dependencies (testable in isolation).

**frontmatter.ts**
- `parseTaskFile(content: string, filePath: string): Task`
- `stringifyTask(task: Task, originalContent?: string): string`
- Preserves unknown frontmatter fields
- Handles malformed YAML gracefully

**taskService.ts**
- `loadAllTasks(root: string): Promise<Task[]>`
- `loadTask(filePath: string): Promise<Task>`
- `saveTask(task: Task): Promise<void>`
- Infers project/phase from path structure

**taskMoveService.ts**
- `moveTaskToStage(task: Task, newStage: Stage): Promise<void>`
- `validateTransition(from: Stage, to: Stage): boolean`
- Enforces stage transition rules

**archiveService.ts**
- `archiveTask(task: Task, root: string): Promise<void>`
- `archiveProject(root: string, project: string): Promise<void>`
- Only allows archiving completed tasks

**fileWatcher.ts**
- Watches `.kanban2code/` for changes
- Emits task created/updated/deleted events
- Debounces rapid changes (300ms)
- Ignores non-task files (_templates, _agents, _contexts, etc.)

**contextService.ts** (Phase 2)

- `loadGlobalContext(root)`: Loads how-it-works.md, architecture.md, project-details.md
- `loadAgentContext(root, agentName)`: Loads agent config from `_agents/`
- `loadProjectContext(root, projectName)`: Loads project `_context.md`
- `loadPhaseContext(root, projectName, phaseName)`: Loads phase `_context.md`
- `loadCustomContexts(root, contextNames[])`: Loads files from `_contexts/`
- Returns `null` for missing files (never throws)

**templateService.ts** (Phase 2)

- `loadStageTemplate(root, stage)`: Loads from `_templates/stages/{stage}.md`
- `loadTaskTemplate(root, templateName)`: Loads task templates
- Returns `null` for missing templates

**promptBuilder.ts** (Phase 2)

- `buildXMLPrompt(task, root)`: Assembles 9-layer XML prompt
- `buildContextOnly(task, root)`: Context sections only
- `buildTaskOnly(task)`: Task section only
- Escapes XML special characters (`<`, `>`, `&`) in content

**copyService.ts** (Phase 2)

- `buildCopyPayload(task, root, mode)`: Builds copy payload
- Supports three modes: `full_xml`, `task_only`, `context_only`

### 2. Workspace Layer

VS Code workspace integration.

**validation.ts**
- `findKanbanRoot(): Promise<string | null>`
- `ensurePathInsideRoot(path, root): void`
- `getValidationStatus(): ValidationStatus`

**ValidationStatus Enum:**
```typescript
enum ValidationStatus {
  Valid = 'valid',
  Missing = 'missing',
  Invalid = 'invalid',
  Forbidden = 'forbidden'
}
```

### 3. Webview Layer

React-based UI with Zustand state management.

**Message Protocol:**
```typescript
interface Message<T = unknown> {
  version: 1;
  type: MessageType;
  payload: T;
}

// Host → Webview
type HostMessage =
  | { type: 'tasks:loaded'; payload: Task[] }
  | { type: 'task:updated'; payload: Task }
  | { type: 'task:deleted'; payload: { id: string } };

// Webview → Host
type WebviewMessage =
  | { type: 'task:move'; payload: { id: string; stage: Stage } }
  | { type: 'task:create'; payload: { title: string; project?: string } }
  | { type: 'task:archive'; payload: { id: string } }
  | { type: 'refresh'; payload: null };
```

**State Stores (Zustand):**
```typescript
// taskStore.ts
interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  updateTask: (task: Task) => void;
  removeTask: (id: string) => void;
}

// uiStore.ts
interface UIStore {
  selectedTaskId: string | null;
  filterProject: string | null;
  filterTags: string[];
  setSelectedTask: (id: string | null) => void;
  setFilters: (filters: Partial<Filters>) => void;
}
```

## Stage Transition Rules

Valid transitions are enforced by `taskMoveService`:

```
inbox    → plan, code
plan     → code, inbox
code     → audit, plan
audit    → completed, code
completed → (archive only, not a stage transition)
```

Backward transitions (e.g., audit → code) are allowed for rework.
Direct jumps (e.g., inbox → completed) are blocked.

## Context System (Phase 2)

The context system assembles rich prompts for AI agents by combining multiple layers of context.

### 9-Layer XML Prompt Structure

When copying a task for AI consumption, the prompt builder assembles content in this order:

| Layer | Source | Description |
|-------|--------|-------------|
| 1 | `how-it-works.md` | Global workspace overview |
| 2 | `architecture.md` | Project architecture |
| 3 | `project-details.md` | Project-specific details |
| 4 | `_agents/{agent}.md` | Agent-specific instructions (if task has `agent` field) |
| 5 | `projects/{project}/_context.md` | Project context (if task in project) |
| 6 | `projects/{project}/{phase}/_context.md` | Phase context (if task in phase) |
| 7 | `_templates/stages/{stage}.md` | Stage-specific guidance |
| 8 | `_contexts/{name}.md` | Custom contexts (from task's `contexts` field) |
| 9 | Task metadata + body | The task itself |

### XML Output Structure

```xml
<system>
  <context>
    <how-it-works>...</how-it-works>
    <architecture>...</architecture>
    <project-details>...</project-details>
    <agent>...</agent>
    <project>...</project>
    <phase>...</phase>
    <stage-guidance>...</stage-guidance>
    <custom-contexts>...</custom-contexts>
  </context>
  <task>
    <metadata>
      Title: ...
      Stage: ...
      Project: ...
    </metadata>
    <body>...</body>
  </task>
</system>
```

### Copy Modes

| Mode | Description |
|------|-------------|
| `full_xml` | Complete 9-layer prompt (default) |
| `task_only` | Just task metadata and body |
| `context_only` | System context without task content |

### VS Code Commands

- `kanban2code.copyTaskContext` - Copy full XML context
- `kanban2code.copyTaskOnly` - Copy task only
- `kanban2code.copyContextOnly` - Copy context only

## Build System

Uses esbuild via Bun for fast bundling:

```bash
bun run build          # Production build
bun run build:watch    # Development watch mode
bun test               # Run Vitest tests
bun run lint           # ESLint check
bun run format         # Prettier format
```

**Output:**
- `dist/extension.js` - Node.js extension bundle
- `dist/webview.js` - Browser webview bundle

## Testing Strategy

- **Unit tests**: Services layer with mocked filesystem
- **Integration tests**: Full task loading with temp directories
- **Framework**: Vitest for fast, ESM-native testing
- **Fixtures**: Sample task files in `tests/fixtures/`

## Security

- CSP enforced for webviews
- Path traversal prevention via `ensurePathInsideRoot`
- No execution of user-provided code
- Sandboxed webview context
