# Kanban2Code Architecture Documentation

## Project Overview

Kanban2Code is a VS Code extension that brings Kanban board functionality directly into the editor, integrating AI agents and rich task context. The project aims to streamline task management for developers by providing a visual workflow system that seamlessly integrates with the coding environment.

Key features include:

- A Kanban board with five stages: Inbox, Plan, Code, Audit, and Completed
- Filesystem-based task management using markdown files with frontmatter
- AI agent integration for context-aware task handling
- A comprehensive sidebar interface for task navigation and management (Phase 3)
  - Hierarchical task tree with inbox/projects/phases organization
  - Multi-dimensional filtering (stage, project, tags, quick views, project visibility)
  - Task creation modal with agent assignment
  - Context menus for task operations
  - Full keyboard navigation and accessibility support
- Workspace scaffolding to set up the Kanban2Code folder structure
- Context system for building comprehensive XML prompts for AI agents (Phase 2)
- Copy-to-clipboard functionality for task context

The technology stack uses Bun as the runtime and package manager, TypeScript for type safety, React for webviews, and Vitest for testing. The extension follows a UI-first approach with comprehensive testing requirements at each phase of development.

## Agent-Driven Orchestration Pipeline

Kanban2Code supports an agent-driven workflow that turns an idea into executable tasks and then runs tasks through the 5-stage lifecycle.

### Agent Files (Source of Truth)

Agents are Markdown files under `.kanban2code/_agents/` and are scaffolded into new workspaces by the extension.

Bundled agent templates live in:

- `src/assets/agents.ts`

Scaffolding writes them via:

- `src/services/scaffolder.ts`

### Two Layers: Orchestration vs Execution

**Orchestration meta-tasks** (shape work):

- `roadmapper` → produces a vision/roadmap document under `.kanban2code/projects/<project>/`
- `architect` → edits the roadmap to add technical design, phases, and task specs
- `splitter` → generates phase folders + task files from the roadmap (no new decisions)

**Execution tasks** (build + verify, per task):

- `planner` (`stage: plan`) → refines prompt and gathers code/test context
- `coder` (`stage: code`) → implements and writes tests
- `auditor` (`stage: audit`) → reviews and gates completion

### Orchestration State Tags

The pipeline commonly uses status tags to track whether a project is ready to proceed:

- `missing-architecture` (remove once the roadmap has technical design + phases/tasks and is approved)
- `missing-decomposition` (remove once the roadmap has been split into phase/task files)

Canonical protocol and examples are documented in:

- `.kanban2code/_context/ai-guide.md`

## Directory Structure

```
.kanban2code/                               # Scaffolded kanban workspace state (created in user workspaces; committed here for dogfooding)
├── .gitignore                              # Repo-local ignore rules for `.kanban2code` contents
├── ARCHIVE_LOG.md                          # Human-readable archive/move log
├── config.json                             # User-configurable defaults (agents, etc.)
├── inbox/                                  # Inbox tasks (markdown w/ frontmatter)
│   └── .gitkeep
├── projects/                               # Project folders containing phase/task markdown
│   └── .gitkeep
├── _agents/                                # Agent CLI configuration files (markdown with YAML frontmatter)
│   ├── .gitkeep
│   ├── opus.md
│   ├── codex.md
│   ├── kimi.md
│   └── glm.md
├── _modes/                                 # Mode behavior files (markdown with YAML frontmatter)
│   ├── .gitkeep
│   ├── coder.md
│   ├── auditor.md
│   ├── planner.md
│   └── ...
├── _context/                               # Global context files (markdown)
│   └── ai-guide.md
│   ├── context/
│   │   ├── audit-phase.md
│   │   └── phase-context.md
│   ├── tasks/
│   │   ├── .gitkeep
│   │   ├── audit-phase.md
│   │   ├── bug-report.md
│   │   ├── create-roadmap.md
│   │   ├── design-task.md
│   │   ├── documentation.md
│   │   ├── feature.md
│   │   ├── refactor.md
│   │   ├── roadmap.md
│   │   ├── security-review.md
│   │   ├── spike-research.md
│   │   ├── split-phase.md
│   │   ├── test.md
└── _archive/                               # Internal backups/snapshots
    └── context-backups/
        ├── audit-phase1.md
        ├── audit-phase2.md
        ├── audit-phase3.md
        ├── audit-phase4.md
        └── audit-phase5.md

archive/
└── roadmap/                                # Historical phase task specs/audits (non-runtime)
    ├── phase-0-foundation/
    ├── phase-1-filesystem-and-tasks/
    ├── phase-2-context-system/
    ├── phase-3-sidebar-ui/
    ├── phase-4-board-webview/
    ├── phase-5-polish-and-docs/
    └── phase-6-bugs-and-features/

docs/                                      # Documentation (user guide, architecture, design mockups)
examples/                                  # Example `.kanban2code` layouts/projects
prompts/                                   # Prompt material used during development

src/
├── extension.ts                            # Main extension entry point handling activation and command registration
├── assets/
│   ├── agents.ts                          # Bundled agent templates for workspace scaffolding
│   ├── contexts.ts                        # Bundled context files for workspace
│   ├── modes.ts                          # Bundled mode files for workspace
│   └── seed-content.ts                    # Seed file contents for workspace scaffolding
├── commands/
│   └── index.ts                           # Command registration and implementation for VS Code commands
├── core/
│   ├── constants.ts                       # Core constants including stage definitions and folder names
│   └── rules.ts                           # Business rules and validation logic
├── services/
│   ├── archive.ts                         # Service for archiving completed tasks and projects
│   ├── config.ts                          # Service for reading/validating `.kanban2code/config.json`
│   ├── context.ts                         # Service for loading and managing context files
│   ├── copy.ts                            # Service for copying task context to clipboard
│   ├── delete-task.ts                     # Service for deleting tasks by ID
│   ├── error-recovery.ts                  # Error handling + retry/recovery helpers
│   ├── frontmatter.ts                     # Service for parsing and serializing task frontmatter
│   ├── logging.ts                         # Structured logging + Output Channel integration
│   ├── mode-service.ts                    # Service for CRUD operations on mode files (_modes/)
│   ├── migration.ts                       # Atomic migration service for agents → modes transition
│   ├── prompt-builder.ts                  # Service for building XML prompts
│   ├── projects.ts                        # Service for listing/creating projects and phases
│   ├── scaffolder.ts                      # Service for scaffolding new Kanban2Code workspaces
│   ├── scanner.ts                         # Service for scanning and loading task files
│   ├── stage-manager.ts                   # Service for managing task stage transitions
│   ├── task-content.ts                    # Service for loading/saving task file content + metadata (includes file relocation)
│   ├── task-watcher.ts                    # Debounced filesystem watcher for task events (create/update/delete/move)
│   └── fs-move.ts                          # Atomic-ish move helper used by task relocation
├── types/
│   ├── agent.ts                          # Agent CLI configuration interface and Zod schema
│   ├── config.ts                         # Configuration schema/types
│   ├── context.ts                        # Type definitions for context system
│   ├── copy.ts                           # Type definitions for copy functionality
│   ├── errors.ts                         # Typed error classes with recovery hints
│   ├── filters.ts                        # Filter state + tag taxonomy + helpers
│   ├── gray-matter.d.ts                  # Type definitions for gray-matter library
│   ├── mode.ts                          # Mode configuration interface and Zod schema
│   └── task.ts                           # Core type definitions for tasks and stages
├── utils/
│   └── text.ts                            # Text processing utilities
├── webview/
│   ├── KanbanPanel.ts                     # Webview panel implementation for the Kanban board
│   ├── messaging.ts                       # Message passing between extension and webviews
│   ├── SidebarProvider.ts                 # VS Code sidebar webview provider
│   ├── viewRegistry.ts                    # Creates/registers the shared webview (sidebar + board)
│   ├── ui/
│   │   ├── App.tsx                        # Main React component for webviews
│   │   ├── main.tsx                       # Entry point for React webview application
│   │   ├── vscodeApi.ts                   # Shared VS Code API instance (singleton pattern)
│   │   ├── components/                    # React components for the sidebar UI (Phase 3)
│   │   │   ├── AgentModal.tsx             # Create/edit agent modal
│   │   │   ├── AgentPicker.tsx            # Agent selection dropdown (used by create/edit task flows)
│   │   │   ├── Board.tsx                  # Board surface (shared bundle)
│   │   │   ├── BoardHeader.tsx            # Board header controls (filters/layout)
│   │   │   ├── BoardHorizontal.tsx        # Horizontal layout board renderer
│   │   │   ├── BoardSwimlane.tsx          # Swimlane layout board renderer
│   │   │   ├── ContextMenu.tsx            # Reusable context menu component
│   │   │   ├── ContextModal.tsx           # Create/edit context modal
│   │   │   ├── ContextPicker.tsx          # Multi-select list of context files (used by create/edit task flows)
│   │   │   ├── EmptyState.tsx             # Empty state display component
│   │   │   ├── FilterBar.tsx              # Project/tag filters with collapsible UI
│   │   │   ├── Icons.tsx                  # Icon components for the UI
│   │   │   ├── index.ts                   # Export barrel for components
│   │   │   ├── KeyboardHelp.tsx           # Keyboard shortcuts overlay
│   │   │   ├── LayoutToggle.tsx           # Columns ↔ swimlanes toggle
│   │   │   ├── LocationPicker.tsx         # Inbox/Project location selector for new tasks
│   │   │   ├── MoveModal.tsx              # Task relocation modal
│   │   │   ├── ProjectModal.tsx           # Create project modal
│   │   │   ├── QuickFilters.tsx          # Stage filter chips
│   │   │   ├── QuickViews.tsx             # Preset filter buttons
│   │   │   ├── Sidebar.tsx                # Main sidebar container component
│   │   │   ├── SidebarActions.tsx         # Action buttons section
│   │   │   ├── SidebarToolbar.tsx         # Top toolbar with title
│   │   │   ├── Swimlane.tsx               # Swimlane container
│   │   │   ├── TaskCard.tsx               # Task card for board view
│   │   │   ├── TaskEditorModal.tsx        # Split-panel task editor (metadata + markdown content editor)
│   │   │   ├── TaskContextMenu.tsx        # Task-specific context menu
│   │   │   ├── TaskItem.tsx               # Individual task item component
│   │   │   ├── TaskModal.tsx              # Task creation modal
│   │   │   ├── TaskTree.tsx               # Tree container with ARIA tree role
│   │   │   ├── TreeNode.tsx               # Project/phase tree node component
│   │   │   ├── TreeSection.tsx            # Inbox/Projects tree sections
│   │   │   ├── monaco-theme.ts            # Monaco editor theme definition
│   │   │   └── Column.tsx                 # Board column renderer
│   │   ├── hooks/                         # React hooks for state management (Phase 3)
│   │   │   ├── useBoardLayout.ts          # Board layout state (columns/swimlanes)
│   │   │   ├── useFilters.ts              # Hook for filter state management
│   │   │   ├── useKeyboard.ts             # Hook for keyboard navigation
│   │   │   └── useTaskData.ts             # Hook for task data management
│   │   └── styles/
│   │       ├── main.css                   # CSS styles for webview components
│   │       └── palette.css                # Shared color palette (fixed token set)
└── workspace/
    ├── state.ts                           # Workspace state management
    └── validation.ts                      # Workspace validation and detection logic

tests/
├── ai-guide.test.ts                       # Unit tests for AI guide/context conventions
├── agent-mode-schemas.test.ts             # Unit tests for agent and mode schema validation
├── archive.test.ts                        # Unit tests for archive service
├── config-service.test.ts                 # Unit tests for config loading/validation
├── context-service.test.ts                # Unit tests for context system (Phase 2)
├── copy-service.test.ts                   # Unit tests for copy functionality (Phase 2)
├── delete-task.test.ts                    # Unit tests for delete task service
├── error-recovery.test.ts                 # Unit tests for error recovery helpers
├── errors.test.ts                         # Unit tests for typed errors
├── frontmatter.test.ts                    # Unit tests for frontmatter parsing and serialization
├── logging.test.ts                        # Unit tests for logging service
├── migration.test.ts                      # Unit tests for migration service functionality
├── mode-service.test.ts                   # Unit tests for mode files CRUD operations
├── prompt-builder.test.ts                 # Unit tests for XML prompt builder (Phase 2)
├── rules.test.ts                          # Unit tests for business rules
├── scaffolder.test.ts                     # Unit tests for workspace scaffolding
├── smoke.test.ts                          # Basic smoke tests for core functionality
├── stage-manager.test.ts                  # Unit tests for stage management service
├── state.test.ts                          # Unit tests for workspace state management
├── tag-taxonomy.test.ts                   # Unit tests for tag taxonomy + validation
├── task-content.test.ts                   # Unit tests for task content load/save + relocation
├── task-loading.test.ts                   # Integration tests for task loading from filesystem
├── task-watcher.test.ts                   # Unit tests for debounced watcher events and move detection
├── types.test.ts                          # Unit tests for type definitions and utilities
├── utils.test.ts                          # Unit tests for utility functions
├── validation.test.ts                     # Unit tests for workspace validation
├── webview.test.ts                        # Unit tests for webview message envelope validation
├── vscode-stub.ts                         # Minimal VS Code API stub for tests
├── setup.ts                               # Global test setup and shared helpers
├── e2e/
│   ├── core-workflows.test.ts             # E2E workflows against temp workspaces
│   └── setup.ts                           # E2E workspace helpers
└── webview/
    ├── board.test.tsx                     # Component tests for board rendering
    ├── column.test.tsx                    # Component tests for columns
    ├── setup-dom.ts                       # jsdom + Monaco setup
    ├── setup-matchers.ts                  # Jest DOM matchers
    ├── task-editor-modal.test.tsx         # UI tests for the split-panel TaskEditorModal
    ├── task-modal-create-project.test.tsx # UI tests: create project flow from task modal
    ├── taskcard.test.tsx                  # Component tests for task cards
    └── components/
        └── SidebarToolbar.test.tsx        # Component tests for sidebar toolbar

media/                                     # Extension assets (e.g. activity bar icon in package.json)

dist/                                      # Build output (`bun run build.ts`)

.gitignore                                 # Git ignore configuration
.prettierrc                                # Prettier code formatting configuration
.vscodeignore                              # VS Code packaging exclusions
build.ts                                   # Build script configuration for esbuild
bun.lock                                   # Bun lockfile for dependency management
eslint.config.mjs                          # ESLint configuration for code linting
package.json                               # NPM package configuration with dependencies and scripts
tsconfig.json                              # TypeScript compiler configuration
vitest.config.ts                           # Vitest config (unit/integration/component)
vitest.e2e.config.ts                       # Vitest config (E2E)
roadmap_sync.sh                            # Roadmap sync helper script
major-refactor-roadmap.md                  # Project roadmap/notes (dogfooding)
kanban2code-0.0.1.vsix                     # Packaged extension artifact (local)
README.md                                  # Project README with setup instructions
.vscode/                                   # VS Code workspace configuration
```

## Phase 3 Sidebar UI Implementation

Phase 3 implemented a comprehensive sidebar interface with the following key features:

### Component Architecture

- **Main Container**: [`Sidebar.tsx`](../src/webview/ui/components/Sidebar.tsx) provides the overall layout and state coordination
- **Navigation**: [`SidebarToolbar.tsx`](../src/webview/ui/components/SidebarToolbar.tsx) and [`SidebarActions.tsx`](../src/webview/ui/components/SidebarActions.tsx) handle top-level actions
- **Filtering System**: [`FilterBar.tsx`](../src/webview/ui/components/FilterBar.tsx), [`QuickFilters.tsx`](../src/webview/ui/components/QuickFilters.tsx), and [`QuickViews.tsx`](../src/webview/ui/components/QuickViews.tsx) provide multi-dimensional filtering
- **Task Tree**: [`TaskTree.tsx`](../src/webview/ui/components/TaskTree.tsx), [`TreeSection.tsx`](../src/webview/ui/components/TreeSection.tsx), and [`TreeNode.tsx`](../src/webview/ui/components/TreeNode.tsx) implement hierarchical task display
- **Task Management**: [`TaskItem.tsx`](../src/webview/ui/components/TaskItem.tsx), [`TaskModal.tsx`](../src/webview/ui/components/TaskModal.tsx), and [`MoveModal.tsx`](../src/webview/ui/components/MoveModal.tsx) handle task operations
- **Context Menus**: [`ContextMenu.tsx`](../src/webview/ui/components/ContextMenu.tsx) and [`TaskContextMenu.tsx`](../src/webview/ui/components/TaskContextMenu.tsx) provide right-click actions
- **Accessibility**: Full ARIA support with keyboard navigation via [`KeyboardHelp.tsx`](../src/webview/ui/components/KeyboardHelp.tsx)

### State Management Hooks

- [`useTaskData.ts`](../src/webview/ui/hooks/useTaskData.ts): Manages task data loading and transformation
- [`useFilters.ts`](../src/webview/ui/hooks/useFilters.ts): Handles filter state and logic
- [`useKeyboard.ts`](../src/webview/ui/hooks/useKeyboard.ts): Implements keyboard navigation and shortcuts

### Key Features

- **Hierarchical Task Display**: Tasks organized by inbox/projects/phases with collapsible tree structure
- **Multi-dimensional Filtering**: Stage filters, project/tag filters, and preset quick views
- **Task Creation**: Modal-based task creation with agent assignment and location selection
- **Context Actions**: Right-click menus for task operations (move, archive, copy context, etc.)
- **Keyboard Navigation**: Full keyboard accessibility with shortcuts for all major actions
- **Real-time Updates**: Live synchronization with filesystem changes through the messaging system

### Design System

- Navy Night Gradient theme with glassmorphic effects
- Consistent spacing and typography
- Responsive design that adapts to sidebar width constraints
- Visual feedback for all interactive states

## Webview Messaging Architecture

- Messages between host and webview use a versioned envelope: `{ version: 1, type, payload }`, defined in `src/webview/messaging.ts` and validated with zod.
- Supported types:
  - Host → Webview: `ShowKeyboardShortcuts`, `OpenTaskModal`, `TaskUpdated`, `TaskSelected`, `ToggleLayout`, `FilterChanged`, `InitState`, `ContextsLoaded`, `AgentsLoaded`, `FilePicked`, `FolderPicked`, `TaskContentLoaded`, `TaskContentLoadFailed`, `TaskContentSaved`, `TaskContentSaveFailed`, `FullTaskDataLoaded`, `FullTaskDataLoadFailed`, `TaskMetadataSaved`, `TaskMetadataSaveFailed`.
  - Webview → Host: `FilterChanged`, `CreateTask`, `MoveTask`, `MoveTaskToLocation`, `ArchiveTask`, `DeleteTask`, `CopyContext`, `OpenTask`, `OpenBoard`, `OpenSettings`, `CreateKanban`, `CreateProject`, `CreateContext`, `CreateAgent`, `TaskContextMenu`, `RequestContexts`, `RequestAgents`, `PickFile`, `PickFolder`, `RequestTaskContent`, `SaveTaskContent`, `RequestFullTaskData`, `SaveTaskWithMetadata`, `RequestState`, `ALERT`.
- Key pattern: **Ready Handshake** - React app sends `RequestState` on mount to signal readiness, then host responds with `InitState`. This avoids race conditions where messages are sent before the webview is fully loaded.
- Helper API: `createEnvelope`/`createMessage` build typed envelopes; `validateEnvelope` guards incoming data.
- VS Code API management: The shared `src/webview/ui/vscodeApi.ts` module ensures `acquireVsCodeApi()` is called only once (VS Code limitation), preventing "instance already acquired" errors.
- The React UI (`src/webview/ui/App.tsx`) uses the messaging system to communicate with the host extension, with the sidebar providing rich task management capabilities.
- `InitState` payload now includes optional `context: 'sidebar' | 'board'` and `filterState` so a shared UI bundle can render the correct surface and start in sync.

### Task Editing Flow (Split-Panel Editor)

- UI: [`src/webview/ui/components/TaskEditorModal.tsx`](../src/webview/ui/components/TaskEditorModal.tsx) renders a left metadata panel (title/location/agent/contexts/tags) and a right markdown editor (Monaco).
- Load: webview sends `RequestFullTaskData` → host replies `FullTaskDataLoaded` with file content, current metadata, and option lists (agents/contexts/projects/phases).
- Save: webview sends `SaveTaskWithMetadata` → host persists content/metadata via [`src/services/task-content.ts`](../src/services/task-content.ts) and returns `TaskMetadataSaved` (or `TaskMetadataSaveFailed`).

## Phase 3 Implementation Notes (Post-Completion Fixes)

### Issue: Webview Race Condition

**Problem**: The sidebar appeared blank with only "Kanban2Code" title visible.

**Root Cause**: The host was sending `InitState` before React had mounted and set up its message listener, causing the critical initialization message to be lost.

**Solution**: Implemented a ready handshake pattern:

1. React app sends `RequestState` message when it mounts (via `App.tsx` useEffect)
2. `SidebarProvider` receives `RequestState` and responds with `InitState`
3. React app receives `InitState` and sets `hasKanban` state, triggering full UI render

### Issue: VS Code API Acquisition Error

**Problem**: Console showed "Error: An instance of the VS Code API has already been acquired" and webview failed to load.

**Root Cause**: Multiple components were calling `acquireVsCodeApi()` independently:

- `App.tsx`
- `Sidebar.tsx`
- `TaskContextMenu.tsx`
- `MoveModal.tsx`
- `TaskModal.tsx`

VS Code only allows the API to be acquired once per webview instance.

**Solution**: Created centralized `vscodeApi.ts` module that acquires the API once and exports it as a singleton. All components import from this shared module instead of calling `acquireVsCodeApi()` directly.

## Phase 4 Board Webview Implementation

Phase 4 added a full board webview in the editor area, sharing task data and filters with the Phase 3 sidebar.

### Two‑Webview Model

- **Sidebar webview** (`src/webview/SidebarProvider.ts`) remains the persistent left panel and owns filter controls.
- **Board webview** (`src/webview/KanbanPanel.ts`) is opened via `kanban2code.openBoard` and renders the Kanban board in an editor tab.
- Both webviews load the same React bundle (`dist/webview.js`) and select UI in `src/webview/ui/App.tsx` based on `InitState.payload.context`.

### Shared Filter State

- Sidebar broadcasts any filter changes to the host via `FilterChanged`.
- Host stores the last known filters in `WorkspaceState.filterState` and forwards changes to the board with Host → Webview `FilterChanged`.
- Board applies filters client‑side to its own task list, plus a local search term in the board header.

### Board Component Architecture

Board UI lives in `src/webview/ui/components/`:

- `Board.tsx`: top‑level container, applies filters, groups tasks, routes actions.
- `BoardHeader.tsx`: title, search input, layout toggle, “New Task”.
- `LayoutToggle.tsx` + `useBoardLayout.ts`: columns/swimlanes preference persisted in localStorage key `kanban2code.boardLayout`.
- `BoardHorizontal.tsx` + `Column.tsx`: five stage columns from `STAGES`.
- `BoardSwimlane.tsx` + `Swimlane.tsx`: project/phase rows with stage columns.
- `TaskCard.tsx`: draggable card; click/Enter opens task; resolves agent display name from the `agents` list provided by `InitState`.

### Drag‑and‑Drop and Task Actions

- Board uses native HTML drag‑and‑drop; drops send `MoveTask` to host.
- Host validates stage transitions via existing `stage-manager` + `core/rules.ts`, and auto-assigns the destination stage’s default agent (from `.kanban2code/_agents` frontmatter `stage`) when the task is unassigned or previously on the current stage default.
- Board reuses Phase 3 `TaskModal` for "New Task"; `kanban2code.newTask` now supports optional `parent` in frontmatter to enable follow‑up tasks.

## Phase 5 Polish and Documentation

Phase 5 focuses on production-readiness: test infrastructure, keyboard shortcuts, error handling, logging, comprehensive documentation, and MVP validation.

### Test Infrastructure (Task 5.0)

**Configuration Files:**

- [`vitest.config.ts`](../vitest.config.ts): Main Vitest config with coverage thresholds (70% statements/lines/functions, 65% branches) and reporter setup
- [`vitest.e2e.config.ts`](../vitest.e2e.config.ts): Separate E2E config with longer timeouts and sequential execution
- [`tests/setup.ts`](../tests/setup.ts): Global test setup with VS Code mocks and test utilities
- [`tests/e2e/setup.ts`](../tests/e2e/setup.ts): E2E workspace utilities for creating test workspaces and tasks

**Test Coverage:**

- **Unit/Integration/Component Tests**: 128 tests covering core services and utilities
  - Logging service (11 tests)
  - Error types (20 tests)
  - Tag taxonomy (23 tests)
  - Existing services: scanner, context, copy, stage-manager, archive, frontmatter, etc.
- **Integration Tests**: Task loading, file operations, context assembly (10+ tests)
- **Component Tests**: Board, TaskCard, Column, Sidebar interactions (5+ tests)
- **E2E Tests**: Core workflows including workspace creation, task progression, filtering (13 tests)

**CI Integration (Provider-Specific):**

- Run `bun run typecheck`, `bun run lint`, `bun run test`, `bun run test:coverage`, and `bun run test:e2e`
- Release packaging: `bun run package`

### Keyboard Shortcuts and Command Palette (Task 5.1)

**Global Shortcuts** (wired in `useKeyboard.ts` and `package.json`):

- `Ctrl+Shift+C` / `Cmd+Shift+C`: Copy task context (full XML)
- `Alt+Shift+N`: New task (modal)
- `Ctrl+Shift+K` / `Cmd+Shift+K`: Open board
- `Ctrl+L` / `Cmd+L`: Toggle board layout (columns ↔ swimlanes)
- `1-5`: Move focused task to stage (1=plan, 2=code, 3=audit, 4=completed, 5=inbox)
- `Delete` / `Backspace`: Delete focused task
- `a`: Archive focused task
- `c`: Copy task only
- `Enter`: Open focused task file
- `?`: Show keyboard help overlay
- Arrow keys: Navigate task tree
- `Escape`: Close modal/clear focus

**Command Palette** (`package.json` contributes):

- Kanban2Code: Open Board
- Kanban2Code: New Task
- Kanban2Code: Copy Task Context (Full XML)
- Kanban2Code: Copy Task Only
- Kanban2Code: Copy Context Only
- Kanban2Code: Toggle Board Layout
- Kanban2Code: Show Keyboard Shortcuts
- Kanban2Code: New Project
- Kanban2Code: New Agent
- Kanban2Code: Open Settings

### Error Handling and Logging (Task 5.2)

**Logging Service** (`src/services/logging.ts`):

- Structured logging with levels: debug, info, warn, error
- Module-specific loggers via `createModuleLogger()`
- Circular buffer (max 1000 entries) stored in memory
- Integration with VS Code Output Channel ("Kanban2Code")
- Filtering by level and module
- Timestamp and context tracking for each entry

**Error Types** (`src/types/errors.ts`):

- `KanbanError`: Base class for all typed errors
- `FileSystemError`: File I/O failures with recovery hints
- `StageTransitionError`: Invalid stage transitions
- `TaskValidationError`: Malformed task properties
- `ContextError`: Context file loading failures
- `WorkspaceError`: Workspace validation issues
- `CopyError`: Clipboard operations
- `ArchiveError`: Archive workflow errors

**Error Recovery** (`src/services/error-recovery.ts`):

- `handleError()`: Display user-friendly notifications with "Show Details" and "Retry" buttons
- `withRecovery()`: Wrapper for async functions with automatic error handling
- `createRecoverableOperation()`: Implements exponential backoff retry logic (max 3 attempts)
- `tryCatch()`: Synchronous error boundary with fallback values
- Full stack traces logged to output channel

### Tag Taxonomy and Conventions (Task 5.7)

**Tag Categories** (defined in `src/types/filters.ts`):

- **Type Tags** (pick 1): feature, bug, spike, refactor, docs, test, chore
- **Priority Tags** (pick 1): p0/critical, p1/high, p2/medium, p3/low
- **Status Tags** (informational): blocked, in-progress, review, approved, shipped
- **Domain Tags** (multiple OK): mvp, accessibility, performance, security, ci
- **Component Tags** (multiple OK): sidebar, board, messaging, keyboard, filters, context, copy, archive, test

**Validation Rules:**

- Only one type tag per task
- At most one priority tag recommended
- MVP tasks with p3 priority trigger warning
- Blocked tasks must include explanation in content
- Color-coded in UI based on tag type

**Usage Example:**

```yaml
---
stage: code
tags: [feature, mvp, keyboard, board]
agent: sonnet
---
# Implement Keyboard Shortcuts

Add Ctrl+N, 1-5, and copy shortcuts globally.
```

### New Services and Files Added

**Core Services:**

- `src/services/logging.ts` (315 lines) - Structured logging with VS Code integration
- `src/services/error-recovery.ts` (295 lines) - Error handling with retry and recovery
- `src/types/errors.ts` (230 lines) - Typed error classes with context and recovery hints

**Enhanced Utilities:**

- `src/types/filters.ts` - Extended with tag taxonomy, validation, and color utilities
- `src/webview/ui/hooks/useKeyboard.ts` - Enhanced with Phase 5.1 shortcuts (1-5, copy, layout toggle)
- `package.json` - Updated with commands, keybindings, and test scripts

**Tests:**

- `tests/logging.test.ts` (11 tests) - Logger functionality
- `tests/errors.test.ts` (20 tests) - Error type creation and recovery
- `tests/tag-taxonomy.test.ts` (23 tests) - Tag validation and UI colors
- `tests/e2e/core-workflows.test.ts` (13 tests) - End-to-end scenarios
- `tests/e2e/setup.ts` - E2E workspace utilities

**Configuration:**

- `vitest.config.ts` - Coverage thresholds, reporter setup
- `vitest.e2e.config.ts` - E2E-specific configuration
- `tests/setup.ts` - Global test mocks and utilities

### Scripts Added

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "vitest run --config vitest.e2e.config.ts",
  "typecheck": "tsc --noEmit"
}
```

### File Structure Updated

```
src/
├── services/
│   ├── logging.ts                 # NEW: Structured logging service
│   └── error-recovery.ts          # NEW: Error recovery and retry logic
├── types/
│   ├── errors.ts                  # NEW: Typed error classes
│   └── filters.ts                 # ENHANCED: Tag taxonomy and validation
└── webview/ui/hooks/
    └── useKeyboard.ts             # ENHANCED: Phase 5.1 shortcuts

tests/
├── logging.test.ts                # NEW: Logger tests (11)
├── errors.test.ts                 # NEW: Error type tests (20)
├── tag-taxonomy.test.ts           # NEW: Tag validation tests (23)
├── e2e/
│   ├── setup.ts                   # NEW: E2E workspace utilities
│   └── core-workflows.test.ts      # NEW: E2E workflow tests (13)
├── setup.ts                       # NEW: Global test setup

vitest.config.ts                    # ENHANCED: Coverage, reporters
vitest.e2e.config.ts               # NEW: E2E configuration

package.json                        # ENHANCED: Commands, keybindings, scripts
```

### Test Results Summary

**All tests passing:**

- Unit/Integration/Component Tests: 128 passed
- Integration Tests: 10+ tests for filesystem operations
- Component Tests: 5+ tests for board and sidebar
- E2E Tests: 13 tests covering core workflows
- **Coverage thresholds**: 70% statements/lines/functions, 65% branches (covered scope; enforced by `bun run test:coverage`)

### Integration with Existing Code

**Non-Breaking Changes:**

- New services are opt-in; existing services unchanged
- Error types are throw-only; regular Error objects still work
- Logging is optional; no logs written without explicit calls
- Tag taxonomy extends filters.ts; existing FilterState interface unchanged
- Keyboard hook additions are backward-compatible

**Extension Host Integration:**

- Logging service can be initialized in `extension.ts` during activation
- Error recovery helpers used in command implementations
- Tag validation used during task creation modal (future enhancement)
- Keyboard shortcuts integrated into board and sidebar components

### MVP Status

**Phase 5 Completion Criteria:**
✅ Test infrastructure configured and working (128 tests passing)
✅ Keyboard shortcuts implemented and wired (8+ shortcuts)
✅ Error handling and logging fully implemented
✅ Tag taxonomy defined with validation
✅ Comprehensive test coverage (70%+)
✅ All code compiles without errors
✅ E2E tests covering core workflows

**Next Phase: Phase 6 - Bug Fixes and Feature Completion**

Phase 6 addresses critical bugs and implements remaining design features:

- Fix delete button in Board view (Task 6.0)
- Implement fixed Navy Night Gradient color palette (Task 6.1)
- Fix swimlane layout: Rows = Stages, Columns = Projects (Task 6.2)
- Add context file selection to Task Modal (Task 6.3)
- Implement Context creation modal (Task 6.4)
- Implement Agent selection and creation modal (Task 6.5)
- Implement Template creation/editing modal (Task 6.6)
- Add Monaco Editor for in-place task editing (Task 6.7)

Design references in `docs/design/`:

- `forms/task.html` - Task modal with context selection
- `forms/context.html` - Context creation modal
- `forms/agent.html` - Agent creation modal
- `board-swimlane.html` - Swimlane layout reference
- `styles/variables.css` - Navy Night Gradient color palette
