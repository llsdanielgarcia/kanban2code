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
│       ├── Board.tsx             # Main board React component (Phase 4)
│       ├── Sidebar.tsx           # Main sidebar React component (Phase 3)
│       ├── sidebarMain.tsx       # Sidebar entry point (Phase 3)
│       ├── App.tsx               # React root component
│       ├── main.tsx              # Webview entry point (renders Board)
│       ├── theme.tsx             # Theme support (Phase 3)
│       ├── messaging/            # Host-webview communication
│       │   ├── types.ts          # Message type definitions
│       │   └── protocol.ts       # Message handling
│       ├── stores/               # Zustand state management
│       │   ├── taskStore.ts      # Task state
│       │   └── uiStore.ts        # UI state
│       ├── components/           # React components
│       │   ├── BoardColumn.tsx   # Kanban column with tasks (Phase 4)
│       │   ├── TaskCard.tsx      # Task card for board view (Phase 4)
│       │   ├── FilterPanel.tsx   # Search, project/stage/tag filters (Phase 3)
│       │   ├── TaskTree.tsx      # Inbox/project/phase tree with task items (Phase 3)
│       │   ├── TaskModal.tsx     # Full task creation form (Phase 3/4)
│       │   ├── ContextMenu.tsx   # Right-click menu (Phase 3/4)
│       │   └── KeyboardHelp.tsx  # Shortcut help overlay (Phase 3)
│       └── hooks/                # React hooks
│           └── useKeyboardNavigation.ts # Keyboard shortcuts (Phase 3)
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
│   │   ├── messaging.test.ts
│   │   ├── components/           # Component tests (Phase 4)
│   │   │   ├── TaskCard.test.tsx
│   │   │   └── BoardColumn.test.tsx
│   │   ├── hooks/                # Webview hook tests
│   │   │   └── useKeyboardNavigation.test.ts # Phase 3
│   │   └── stores/               # Webview store tests
│   │       ├── taskStore.test.ts  # Phase 3
│   │       └── uiStore.test.ts    # Phase 3
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
  | { type: 'refresh'; payload: null }
  | { type: 'openBoard'; payload: null }; // Phase 3
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
  selectedQuickView: string | null; // Phase 3
  searchQuery: string; // Phase 3
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

## Sidebar UI (Phase 3)

The sidebar provides a comprehensive task management interface with the following components:

### Sidebar Shell
- **Sidebar.tsx**: Main sidebar React component with theme support
- **sidebarMain.tsx**: Sidebar entry point that initializes the React webview
- **SidebarProvider.ts**: Updated to use React webview with message bridge

### Filters & Quick Views
- **FilterPanel.tsx**: Search bar, project dropdown, stage toggles, and tag chips
- Quick view presets: "Today's Focus", "All In Development", "Bugs", "Ideas & Roadmaps"

### Task Tree
- **TaskTree.tsx**: Collapsible tree structure for Inbox/Projects/Phases with task counts
- Hierarchical organization with expand/collapse functionality

### Task Creation
- **TaskModal.tsx**: Full task creation form with location, stage, tags, and content fields
- Modal dialog with comprehensive form validation

### Context Menu
- **ContextMenu.tsx**: Right-click menu with stage change, archive, delete, and copy XML options
- Context-sensitive actions based on task state

### Keyboard Navigation
- **useKeyboardNavigation.ts**: Keyboard shortcuts hook for accessibility
- **KeyboardHelp.tsx**: Shortcut help overlay displaying all available shortcuts
- Supported shortcuts: Ctrl+N (new), ?, Escape, arrow keys, Ctrl+C for copy

### Message Bridge Updates
- Added `openBoard` message type to types.ts
- Added `createOpenBoardMessage` to protocol.ts
- Enhanced communication between sidebar and board webviews

## Board Webview (Phase 4)

The board webview provides a full kanban board view with drag-and-drop task management.

### Board Layout
- **Board.tsx**: Main board component with 5-column kanban layout
- **BoardColumn.tsx**: Individual column component with header, task list, and drag-drop zone
- Columns: Inbox, Plan, Code, Audit, Completed
- Each column shows stage description, task count, and collapse toggle

### TaskCard Component
- **TaskCard.tsx**: Card component for board view tasks
- Displays: title, location crumb (project › phase or "Inbox"), tags (max 3), stage pill
- Follow-up count badge when task has children
- Hover actions: Copy XML, Open, Follow-up, More
- Keyboard shortcuts: c (copy), Enter (open), 1-5 (move to stage)
- Draggable with visual feedback

### Drag-and-Drop
- TaskCard is draggable with `data-task-id` attribute
- BoardColumn has `onDragOver`/`onDrop` handlers
- Visual feedback during drag operations
- Sends `task:move` message on drop to change stage

### Filter Synchronization
Filter sync uses a broadcast registry pattern to keep sidebar and board in sync:

```typescript
// Shared filter state for cross-webview persistence
let sharedFilters: { search?: string; project?: string | null; tags?: string[]; stages?: Stage[] } = {};

// Registry for active webview bridges
const webviewBridges: Map<string, HostMessageBridge> = new Map();

// Broadcast filter changes to all webviews except sender
export function broadcastFiltersSync(filters: typeof sharedFilters, excludeId?: string) {
  sharedFilters = { ...sharedFilters, ...filters };
  for (const [id, bridge] of webviewBridges) {
    if (id !== excludeId) {
      bridge.send(createFiltersSyncMessage(sharedFilters));
    }
  }
}
```

- Both SidebarProvider and BoardPanel register with the bridge registry on init
- When either view changes filters, it sends `filters:changed` to the host
- The host broadcasts `filters:sync` to all other registered webviews
- FiltersSyncPayload includes: search, project, tags, stages

### Follow-up Tasks
- TaskCard hover action to add follow-up
- TaskModal accepts `parentTask` prop for creating child tasks
- **Follow-up tasks are enforced to go to inbox** - location and stage selection are hidden in the UI
- TaskModal uses `effectiveLocationType` and `effectiveStage` forced to 'inbox' when `isFollowUp` is true
- Parent ID is passed via `createTaskCreateMessage` and persisted in frontmatter `parent` field
- ContextMenu includes "Add Follow-up in Inbox" option

### Board Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+N | New task modal |
| ? | Toggle keyboard help |
| / | Focus search |
| Escape | Close modal/clear selection |
| Ctrl+R | Refresh tasks |
| 1-5 | Move selected task to stage |

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
- `dist/sidebar.js` - Sidebar webview bundle (Phase 3)

## Testing Strategy

- **Unit tests**: Services layer with mocked filesystem
- **Integration tests**: Full task loading with temp directories
- **Webview tests**: React components and stores (Phase 3)
- **Framework**: Vitest for fast, ESM-native testing
- **Fixtures**: Sample task files in `tests/fixtures/`

**Phase 4 Test Coverage:**

- `TaskCard.test.tsx`: 20 tests for task card rendering, interactions, accessibility
- `BoardColumn.test.tsx`: 21 tests for column rendering, collapsed state, drag-drop
- `TaskModal.test.tsx`: 16 tests for task/follow-up creation, validation, interactions
- `taskStore.test.ts`: 25 tests for task state management
- `uiStore.test.ts`: 19 tests for UI state management
- `useKeyboardNavigation.test.ts`: 8 tests for keyboard shortcuts
- Total: 313 passing tests across 18 test files

## Security

- CSP enforced for webviews
- Path traversal prevention via `ensurePathInsideRoot`
- No execution of user-provided code
- Sandboxed webview context
