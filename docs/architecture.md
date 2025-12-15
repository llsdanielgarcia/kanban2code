# Kanban2Code Architecture Documentation

## Project Overview

Kanban2Code is a VS Code extension that brings Kanban board functionality directly into the editor, integrating AI agents and rich task context. The project aims to streamline task management for developers by providing a visual workflow system that seamlessly integrates with the coding environment.

Key features include:
- A Kanban board with five stages: Inbox, Plan, Code, Audit, and Completed
- Filesystem-based task management using markdown files with frontmatter
- AI agent integration for context-aware task handling
- A comprehensive sidebar interface for task navigation and management (Phase 3)
  - Hierarchical task tree with inbox/projects/phases organization
  - Multi-dimensional filtering (stage, project, tags, quick views)
  - Task creation modal with template support
  - Context menus for task operations
  - Full keyboard navigation and accessibility support
- Workspace scaffolding to set up the Kanban2Code folder structure
- Context system for building comprehensive XML prompts for AI agents (Phase 2)
- Copy-to-clipboard functionality for task context

The technology stack uses Bun as the runtime and package manager, TypeScript for type safety, React for webviews, and Vitest for testing. The extension follows a UI-first approach with comprehensive testing requirements at each phase of development.

## Directory Structure

```
phase-0-foundation/
├── .gitkeep                               # Placeholder file to ensure directory tracking in git
├── phase-0-audit.md                       # Audit file documenting the completion and status of Phase 0 tasks
├── task0.0_initialize-project-and-build-tooling.md    # Task specification for project initialization using Bun and build tooling setup
├── task0.1_create-vs-code-extension-skeleton.md      # Task specification for creating the basic VS Code extension structure
├── task0.2_implement-core-webview-infrastructure.md   # Task specification for implementing React webview infrastructure
├── task0.3_implement-kanban2code-workspace-scaffolder.md # Task specification for implementing workspace scaffolding functionality
├── task0.4_define-core-types-and-constants.md         # Task specification for defining shared types and constants
├── task0.5_implement-workspace-detection-and-validation.md # Task specification for workspace validation and detection
├── task0.6_define-extension-activation-and-lifecycle.md # Task specification for extension activation events and lifecycle
├── task0.7_initialize-project-and-build-tooling-superseded.md # Superseded task that points to task0.0
├── task0.8_phase-0-audit-and-sign-off.md               # Task specification for the final Phase 0 audit and sign-off
└── docs/
    └── architecture.md                    # This file containing project architecture documentation

phase-1-filesystem-and-tasks/
├── .gitkeep                               # Placeholder file to ensure directory tracking in git
├── phase-1-audit.md                       # Audit file documenting the completion and status of Phase 1 tasks
├── phase1-context.md                       # Context documentation for Phase 1
├── task1.1_implement-task-parsing-and-serialization.md    # Task specification for task parsing and serialization
├── task1.2_implement-recursive-task-loading.md      # Task specification for recursive task loading
├── task1.3_implement-stage-update-service.md   # Task specification for stage update service
├── task1.4_implement-archive-behavior-for-tasks-and-projects.md # Task specification for archive behavior
├── task1.5_implement-workspace-detection-and-validation-extended.md # Task specification for extended workspace validation
├── task1.6_implement-unit-tests-for-frontmatter-parsing.md         # Task specification for frontmatter parsing tests
├── task1.7_implement-integration-tests-for-task-loading.md         # Task specification for task loading integration tests
├── task1.8_implement-file-watcher-for-task-changes.md               # Task specification for file watcher implementation
├── task1.9_define-webview-architecture-and-messaging-protocol.md   # Task specification for webview architecture
└── task1.10_phase-1-audit-and-sign-off.md               # Task specification for the final Phase 1 audit and sign-off

phase-2-context-system/
├── .gitkeep                               # Placeholder file to ensure directory tracking in git
├── phase-2-audit.md                       # Audit file documenting the completion and status of Phase 2 tasks
├── phase2-context.md                       # Context documentation for Phase 2
├── task2.1_implement-context-file-loaders.md    # Task specification for context file loaders
├── task2.2_implement-xml-prompt-builder-9-layer-context.md      # Task specification for XML prompt builder
├── task2.3_implement-stage-template-resolution.md   # Task specification for stage template resolution
├── task2.4_implement-copy-modes-and-copy-payload-builder.md # Task specification for copy modes and payload builder
├── task2.5_integrate-copy-with-context-with-vs-code-clipboard.md # Task specification for clipboard integration
├── task2.6_implement-unit-tests-for-context-system.md         # Task specification for context system tests
└── task2.7_phase-2-audit-and-sign-off.md               # Task specification for the final Phase 2 audit and sign-off

phase-3-sidebar-ui/
├── .gitkeep                               # Placeholder file to ensure directory tracking in git
├── phase-3-audit.md                       # Audit file documenting the completion and status of Phase 3 tasks
├── phase3-context.md                       # Context documentation for Phase 3
├── task3.0_design-sidebar-shell-ui-only.md    # Task specification for sidebar shell design
├── task3.1_implement-kanban2code-sidebar-shell-wired.md      # Task specification for sidebar shell implementation
├── task3.2_implement-filters-and-quick-views-in-sidebar.md   # Task specification for filters and quick views
├── task3.3_implement-inbox-and-project-tree-in-sidebar.md # Task specification for inbox and project tree
├── task3.4_implement-new-task-modal.md         # Task specification for new task modal
├── task3.5_implement-sidebar-task-context-menus.md         # Task specification for task context menus
├── task3.6_implement-keyboard-navigation-for-sidebar-webview.md               # Task specification for keyboard navigation
└── task3.7_phase-3-audit-and-sign-off.md               # Task specification for the final Phase 3 audit and sign-off

src/
├── extension.ts                            # Main extension entry point handling activation and command registration
├── assets/
│   └── templates.ts                       # Template definitions for workspace scaffolding (agents, tasks, stages)
├── commands/
│   └── index.ts                           # Command registration and implementation for VS Code commands
├── core/
│   ├── constants.ts                       # Core constants including stage definitions and folder names
│   └── rules.ts                           # Business rules and validation logic
├── services/
│   ├── archive.ts                         # Service for archiving completed tasks and projects
│   ├── context.ts                         # Service for loading and managing context files
│   ├── copy.ts                            # Service for copying task context to clipboard
│   ├── delete-task.ts                     # Service for deleting tasks by ID
│   ├── frontmatter.ts                     # Service for parsing and serializing task frontmatter
│   ├── prompt-builder.ts                  # Service for building XML prompts with 9-layer context
│   ├── projects.ts                        # Service for listing/creating projects and phases
│   ├── scaffolder.ts                      # Service for scaffolding new Kanban2Code workspaces
│   ├── scanner.ts                         # Service for scanning and loading task files
│   ├── stage-manager.ts                   # Service for managing task stage transitions
│   ├── task-content.ts                    # Service for loading/saving task file content + metadata (includes file relocation)
│   ├── task-watcher.ts                    # Debounced filesystem watcher for task events (create/update/delete/move)
│   └── template.ts                        # Service for loading task templates from filesystem
├── types/
│   ├── context.ts                         # Type definitions for context system
│   ├── copy.ts                            # Type definitions for copy functionality
│   ├── gray-matter.d.ts                   # Type definitions for gray-matter library
│   └── task.ts                            # Core type definitions for tasks and stages
├── utils/
│   └── text.ts                            # Text processing utilities
├── webview/
│   ├── KanbanPanel.ts                     # Webview panel implementation for the Kanban board
│   ├── messaging.ts                       # Message passing between extension and webviews
│   ├── SidebarProvider.ts                 # VS Code sidebar webview provider
│   ├── ui/
│   │   ├── App.tsx                        # Main React component for webviews
│   │   ├── main.tsx                       # Entry point for React webview application
│   │   ├── vscodeApi.ts                   # Shared VS Code API instance (singleton pattern)
│   │   ├── components/                    # React components for the sidebar UI (Phase 3)
│   │   │   ├── AgentPicker.tsx            # Agent selection dropdown (used by create/edit task flows)
│   │   │   ├── ContextMenu.tsx            # Reusable context menu component
│   │   │   ├── ContextPicker.tsx          # Multi-select list of context files (used by create/edit task flows)
│   │   │   ├── EmptyState.tsx             # Empty state display component
│   │   │   ├── FilterBar.tsx              # Project/tag filters with collapsible UI
│   │   │   ├── Icons.tsx                  # Icon components for the UI
│   │   │   ├── index.ts                   # Export barrel for components
│   │   │   ├── KeyboardHelp.tsx           # Keyboard shortcuts overlay
│   │   │   ├── LocationPicker.tsx         # Inbox/Project location selector for new tasks
│   │   │   ├── MoveModal.tsx              # Task relocation modal
│   │   │   ├── QuickFilters.tsx          # Stage filter chips
│   │   │   ├── QuickViews.tsx             # Preset filter buttons
│   │   │   ├── Sidebar.tsx                # Main sidebar container component
│   │   │   ├── SidebarActions.tsx         # Action buttons section
│   │   │   ├── SidebarToolbar.tsx         # Top toolbar with title
│   │   │   ├── TaskEditorModal.tsx        # Split-panel task editor (metadata + markdown content editor)
│   │   │   ├── TaskContextMenu.tsx        # Task-specific context menu
│   │   │   ├── TaskItem.tsx               # Individual task item component
│   │   │   ├── TaskModal.tsx              # Task creation modal
│   │   │   ├── TaskTree.tsx               # Tree container with ARIA tree role
│   │   │   ├── TemplatePicker.tsx         # Template dropdown for new tasks
│   │   │   ├── TreeNode.tsx               # Project/phase tree node component
│   │   │   └── TreeSection.tsx            # Inbox/Projects tree sections
│   │   ├── hooks/                         # React hooks for state management (Phase 3)
│   │   │   ├── useFilters.ts              # Hook for filter state management
│   │   │   ├── useKeyboard.ts             # Hook for keyboard navigation
│   │   │   └── useTaskData.ts             # Hook for task data management
│   │   └── styles/
│   │       └── main.css                   # CSS styles for webview components
└── workspace/
    ├── state.ts                           # Workspace state management
    └── validation.ts                      # Workspace validation and detection logic

tests/
├── archive.test.ts                        # Unit tests for archive service
├── context-service.test.ts                # Unit tests for context system (Phase 2)
├── copy-service.test.ts                   # Unit tests for copy functionality (Phase 2)
├── frontmatter.test.ts                    # Unit tests for frontmatter parsing and serialization
├── prompt-builder.test.ts                 # Unit tests for XML prompt builder (Phase 2)
├── scaffolder.test.ts                     # Unit tests for workspace scaffolding
├── smoke.test.ts                          # Basic smoke tests for core functionality
├── stage-manager.test.ts                  # Unit tests for stage management service
├── state.test.ts                          # Unit tests for workspace state management
├── task-loading.test.ts                   # Integration tests for task loading from filesystem
├── task-watcher.test.ts                   # Unit tests for debounced watcher events and move detection
├── types.test.ts                          # Unit tests for type definitions and utilities
├── utils.test.ts                          # Unit tests for utility functions
├── validation.test.ts                     # Unit tests for workspace validation
├── webview.test.ts                        # Unit tests for message envelope validation
└── webview/
    └── task-editor-modal.test.tsx         # UI tests for the split-panel TaskEditorModal

media/                                     # Extension assets (e.g. activity bar icon in package.json)

webview/                                   # Build output directory for webview assets

.gitignore                                 # Git ignore configuration
.prettierrc                                # Prettier code formatting configuration
build.ts                                   # Build script configuration for esbuild
bun.lock                                   # Bun lockfile for dependency management
eslint.config.mjs                          # ESLint configuration for code linting
package.json                               # NPM package configuration with dependencies and scripts
README.md                                  # Project README with setup instructions
roadmap.md                                 # Comprehensive development roadmap with phase breakdown
tsconfig.json                              # TypeScript compiler configuration
.vscode/                                   # VS Code workspace configuration

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
- **Task Creation**: Modal-based task creation with template support and location selection
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
  - Host → Webview: `InitState`, `TaskUpdated`, `TaskSelected`, `FilterChanged`, `TemplatesLoaded`, `ContextsLoaded`, `AgentsLoaded`, `ShowKeyboardShortcuts`, `ToggleLayout`, `TaskContentLoaded`, `TaskContentLoadFailed`, `TaskContentSaved`, `TaskContentSaveFailed`.
  - Host → Webview (task editor): `FullTaskDataLoaded`, `FullTaskDataLoadFailed`, `TaskMetadataSaved`, `TaskMetadataSaveFailed`, `TemplateContentLoaded`, `TemplateContentLoadFailed`.
  - Webview → Host: `RequestState` (ready handshake), `FilterChanged` (sidebar/board filters), `CreateTask`, `MoveTask`, `MoveTaskToLocation`, `ArchiveTask`, `DeleteTask`, `CopyContext`, `OpenTask`, `OpenBoard`, `OpenSettings`, `CreateKanban`, `CreateProject`, `CreateContext`, `CreateAgent`, `CreateTemplate`, `UpdateTemplate`, `TaskContextMenu`, `RequestTemplates`, `RequestContexts`, `RequestAgents`, `PickFile`, `RequestTaskContent`, `SaveTaskContent`, `ALERT`.
  - Webview → Host (task editor): `RequestFullTaskData`, `SaveTaskWithMetadata`, `RequestTemplateContent`.
- Key pattern: **Ready Handshake** - React app sends `RequestState` on mount to signal readiness, then host responds with `InitState`. This avoids race conditions where messages are sent before the webview is fully loaded.
- Helper API: `createEnvelope`/`createMessage` build typed envelopes; `validateEnvelope` guards incoming data.
- VS Code API management: The shared `src/webview/ui/vscodeApi.ts` module ensures `acquireVsCodeApi()` is called only once (VS Code limitation), preventing "instance already acquired" errors.
- The React UI (`src/webview/ui/App.tsx`) uses the messaging system to communicate with the host extension, with the sidebar providing rich task management capabilities.
- `InitState` payload now includes optional `context: 'sidebar' | 'board'` and `filterState` so a shared UI bundle can render the correct surface and start in sync.

### Task Editing Flow (Split-Panel Editor)

- UI: [`src/webview/ui/components/TaskEditorModal.tsx`](../src/webview/ui/components/TaskEditorModal.tsx) renders a left metadata panel (title/location/agent/template/contexts/tags) and a right markdown editor (Monaco).
- Load: webview sends `RequestFullTaskData` → host replies `FullTaskDataLoaded` with file content, current metadata, and option lists (templates/agents/contexts/projects/phases).
- Save: webview sends `SaveTaskWithMetadata` → host persists content/metadata via [`src/services/task-content.ts`](../src/services/task-content.ts) and returns `TaskMetadataSaved` (or `TaskMetadataSaveFailed`).
- Templates: selecting a template triggers `RequestTemplateContent` → host loads via [`loadTemplateById`](../src/services/template.ts) and replies `TemplateContentLoaded` (or `TemplateContentLoadFailed`).

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
- `TaskCard.tsx`: draggable card; click/Enter opens task.

### Drag‑and‑Drop and Task Actions

- Board uses native HTML drag‑and‑drop; drops send `MoveTask` to host.
- Host validates stage transitions via existing `stage-manager` + `core/rules.ts` and broadcasts updated tasks.
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
- `Ctrl+Shift+N` / `Cmd+Shift+N`: New task (modal)
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
- `TemplateError`: Template loading problems
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
- `forms/agent.html` - Agent creation modal with quick templates
- `board-swimlane.html` - Swimlane layout reference
- `styles/variables.css` - Navy Night Gradient color palette
