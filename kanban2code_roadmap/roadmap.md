# Kanban2Code Development Roadmap

This roadmap outlines the complete development plan for Kanban2Code, organized into phases with specific tasks.

## Overview

Kanban2Code is a VS Code extension that brings Kanban board functionality to your development workflow, with a focus on integrating with AI agents and providing rich context for task management.

## Technology Stack

This project uses **Bun** as the package manager and runtime instead of npm. All build processes, dependency management, and scripts should use Bun commands.

## Phase Structure

Each phase contains multiple tasks that can be worked on independently. Tasks are organized by folder and include frontmatter with stage, tags, and metadata.

## Phases

### Phase 0 - Foundation & Bootstrapping
*Location: [`phase-0-foundation/`](./phase-0-foundation/)*

This phase establishes the basic infrastructure for VS Code extension.

**Key Tasks:**
- Create VS Code extension skeleton
- Implement workspace detection and validation
- Implement .kanban2code workspace scaffolder
- Define core types and constants
- Define extension activation and lifecycle

---

### Phase 0 Tasks

#### Task 0.0: Initialize project and build tooling
**Stage:** plan  
**Tags:** mvp, infra, foundation  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Create the foundational project structure using Bun before building the extension.

**Scope**
- Run `bun init` to create package.json
- Configure TypeScript (`tsconfig.json`)
- Set up esbuild for bundling
- Create `.gitignore` (node_modules, dist, .vscode-test)
- Set up ESLint + Prettier
- Create initial folder structure:
  - `src/`
  - `tests/`
  - `webview/`

**Notes**
This is the prerequisite for all other Phase 0 tasks.

---

#### Task 0.1: Create VS Code extension skeleton
**Stage:** plan  
**Tags:** mvp, infra, extension, foundation  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Set up a minimal but scalable VS Code extension project that can host the Kanban2Code sidebar and board webview.

**Scope**
- Initialize a new VS Code extension in TypeScript.
- Configure bundler/build pipeline (esbuild/webpack/etc.) using Bun.
- Register core commands:
  - `kanban2code.openBoard`
  - `kanban2code.newTask`
  - `kanban2code.scaffoldWorkspace`
- Create a basic webview panel that can render a simple React app.
- Set up project structure (`src/commands`, `src/services`, `src/webview`, etc.).

**Notes**
Focus on a clean, minimal scaffold. No real Kanban logic yet, just enough to iterate quickly.

---

#### Task 0.2: Implement core webview infrastructure
**Stage:** plan  
**Tags:** mvp, infra, webview  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Set up React bootstrapping, theme system, and Monaco integration for the Kanban2Code webview.

**Scope**
- Implement webview bootstrapping (`contentProvider`, CSP, message wiring).
- Create React entry (`main.tsx`, `App.tsx`).
- Set up theme provider + tokens (glassmorphic styles).
- Implement Monaco editor modal component.
- Confirm a simple "Hello from Kanban2Code" board renders in the webview.

**Notes**
Keep this lean: implement only what clearly supports Kanban2Code's UI and editing flows.

---

#### Task 0.3: Implement .kanban2code workspace scaffolder
**Stage:** plan  
**Tags:** mvp, infra, filesystem, scaffolding  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Provide a one-shot command that generates the canonical `.kanban2code` folder with all required subfolders and seed files.

**Scope**
- Create `.kanban2code` with:
  - `inbox/`
  - `projects/`
  - `_agents/`
  - `_templates/stages/`
  - `_templates/tasks/`
  - `_archive/`
- Create seed files:
  - `how-it-works.md`
  - `architecture.md`
  - `project-details.md`
  - `_agents/opus.md` (and optionally `sonnet.md`, `codex.md`)
  - `_templates/stages/inbox.md`, `code.md`, `plan.md`, `audit.md`, `completed.md`
  - `_templates/tasks/bug.md` (and optionally feature/spike)
  - `.gitignore` ignoring `_archive/`
  - A sample inbox task.
- Wire command `kanban2code.scaffoldWorkspace` with a friendly success/error message.
- Use workspace detection from task 0.5 to check if `.kanban2code` exists before scaffolding.

**Notes**
This is the "first run" experience: should only be called when workspace detection confirms `.kanban2code` is missing.

---

#### Task 0.4: Define core types and constants
**Stage:** plan  
**Tags:** mvp, infra, types, model  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Create a shared type system and constants for tasks, stages, and copy modes used across extension, services, and UI.

**Scope**
- In `types/task.ts`:
  - Define `Stage = 'inbox' | 'plan' | 'code' | 'audit' | 'completed'`.
  - Define `Task` interface with:
    - `id` (stable identifier, e.g., derived from file path), `filePath`, `title`, `stage`, `project?`, `phase?`, `agent?`,
      `parent?`, `tags?`, `contexts?`, `order?`, `created?`, `content`.
    - `parent?`: Optional link to another task (used by follow-ups/dependencies).
    - `order?`: Optional floating-point for manual ordering within a stage (default: sort by created date)
- In `core/constants.ts`:
  - `STAGES` array in order.
  - Folder names for `inbox`, `projects`, `_archive`, etc.
- Ensure all services and UI components use these shared types.

**Notes**
This should be the single source of truth for task-related typing in Kanban2Code.

---

#### Task 0.5: Implement workspace detection and validation
**Stage:** plan  
**Tags:** mvp, infra, validation  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Reliably locate `.kanban2code` and prevent unsafe file operations.

**Scope**
- Implement `workspace/validation.ts`:
  - `findKanbanRoot(workspaceRoot)` to locate `.kanban2code`.
  - Guard against operations outside the kanban root.
- On missing `.kanban2code`:
  - Return null/false to indicate workspace needs scaffolding.
- Show clear error messages when the workspace is invalid.

**Notes**
This is the single owner for detection logic; Phase 1 task 1.1.5 only layers status plumbing—avoid parallel implementations. Keeps Kanban2Code from accidentally touching unrelated parts of the repo and provides foundation for scaffolder to check if workspace exists.

---

#### Task 0.6: Define extension activation and lifecycle
**Stage:** plan  
**Tags:** mvp, infra, extension, activation  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Ensure Kanban2Code activates at the right time and handles missing workspaces gracefully.

**Scope**
- Set `activationEvents` in package.json:
  - `workspaceContains:.kanban2code`
  - `onCommand:kanban2code.scaffoldWorkspace`
  - `onView:kanban2code.sidebar`
- On activation without `.kanban2code`:
  - Show empty state in sidebar with "Scaffold Workspace" button
  - Do NOT auto-prompt (let user discover via sidebar)
- Multi-root handling:
  - Use first folder containing `.kanban2code`
  - If none found, target first workspace folder for scaffolding
- Store workspace root in extension context for all services to use

**Notes**
Keep activation fast (<100ms). Defer heavy loading until actually needed.

---

#### Task 0.7: Initialize project and build tooling (superseded by task-0.0)
**Stage:** plan  
**Tags:** mvp, infra, foundation  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Avoid duplicate tracking of the project bootstrap work. Use `phase-0-foundation/task-0.0.md` as the single source of truth.

**Scope**
- Do not execute separately; reference and update `task-0.0` instead.
- If new bootstrap requirements emerge, add them to `task-0.0` rather than reviving this card.

**Notes**
Kept only as a pointer to prevent parallel/duplicate workstreams.

---

### Phase 1 - Filesystem and Tasks
*Location: [`phase-1-filesystem-and-tasks/`](./phase-1-filesystem-and-tasks/)*

This phase implements the core filesystem-based task management system.

**Key Tasks:**
- Implement task parsing and serialization
- Implement recursive task loading
- Implement stage update service
- Implement archive behavior for tasks and projects
- Implement workspace detection and validation
- Implement file watcher for task changes
- Define webview architecture and messaging protocol
- Implement unit tests for frontmatter parsing
- Implement integration tests for task loading

---

### Phase 1 Tasks

#### Task 1.1: Implement task parsing and serialization
**Stage:** plan  
**Tags:** mvp, filesystem, frontmatter, tasks  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Parse markdown task files into `Task` objects and write them back without losing metadata.

**Scope**
- Create `frontmatter.ts` using `gray-matter`:
  - `parseTaskFile(filePath): Promise<Task>`
  - `stringifyTaskFile(task, originalBody): string`
- Rules:
  - `stage` is required; default to `inbox` if missing.
  - `project` and `phase` are inferred from path (not trusted from frontmatter).
  - `tags` is an array of strings.
  - Unknown frontmatter fields are preserved.
- Handle invalid frontmatter gracefully with warnings, not crashes.

**Notes**
This is the bridge between disk state and the in-memory board.

---

#### Task 1.2: Implement recursive task loading
**Stage:** plan  
**Tags:** mvp, filesystem, tasks, loader  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Load all tasks from `.kanban2code` into memory with the correct `project` and `phase` inferred.

**Scope**
- Implement `taskService.loadAllTasks(root): Promise<Task[]>`:
  - Load `inbox/*.md`.
  - For each project in `projects/`:
    - Load direct tasks under `projects/{project}/*.md` (excluding `_context.md`).
    - Load phase tasks under `projects/{project}/{phase}/*.md` (excluding `_context.md`).
- Note: Consider renaming `_context.md` to `_project.md` to avoid confusion with potential tasks named "context".
- Set:
  - `task.project` based on project folder.
  - `task.phase` based on phase folder (or `null`).
- Ensure function is resilient to missing folders and empty states.

**Notes**
This will drive both sidebar and board views, so correctness is crucial.

---

#### Task 1.3: Implement stage update service
**Stage:** plan  
**Tags:** mvp, filesystem, stages  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Allow stages to change by updating frontmatter only, without moving files.

**Scope**
- Implement `taskMoveService.moveTaskToStage(task, newStage)` with transition guards:
  - Read file, update `stage` in frontmatter, write back.
  - Enforce allowed transitions (e.g., Code → Audit via "Mark Implementation Done"; Completed only to Archive; disallow regressions unless explicitly allowed).
- Provide a higher-level helper for the UI:
  - `changeStageAndReload(taskId, newStage)` to refresh board/sidebar state.
- Ensure invalid stage values are avoided (only use known `Stage` values) and return explicit errors for disallowed transitions.

**Notes**
This is the core of Kanban behavior; keep it simple and reliable.

---

#### Task 1.4: Implement archive behavior for tasks and projects
**Stage:** plan  
**Tags:** mvp, filesystem, archive  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Support explicit archive actions that move files into `_archive/` while preserving structure.

**Scope**
- Implement `archiveTask(task, root)`:
  - Only allow if `stage: 'completed'`.
  - Move:
    - Inbox tasks → `_archive/inbox/{filename}`
    - Project/phase tasks → `_archive/projects/{project}/{phase?}/{filename}`
- Implement `archiveProject(root, projectName)`:
  - Move entire `projects/{project}` into `_archive/projects/{project}`.
- Add commands:
  - `Archive Task`
  - `Archive Completed in Project`
  - `Archive Project`

**Notes**
Archiving is a deliberate closure ritual, not automatic cleanup.

---

#### Task 1.5: Implement workspace detection and validation (extends phase-0 task)
**Stage:** plan  
**Tags:** mvp, infra, validation  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Reuse the phase-0 workspace detection while adding Phase 1-specific outputs (status codes and guardrails). Avoid duplicating the core implementation tracked in `phase-0-foundation/task-0.5.md`.

**Scope**
- Depend on the core detection from `task-0.5`; do not fork implementation.
- Extend API to return explicit status enums (valid | missing | invalid | forbidden).
- Provide helper guards used by filesystem services to block writes outside the kanban root.
- Emit consistent error strings for UI surfaces (sidebar, board, commands) without reimplementing detection logic.

**Notes**
Single-owner check: any detection fixes belong in `task-0.5`; this task only layers additional status plumbing for Phase 1 features.

---

#### Task 1.6: Implement unit tests for frontmatter parsing
**Stage:** plan  
**Tags:** mvp, testing, filesystem  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Ensure frontmatter parsing and serialization is reliable and handles edge cases.

**Scope**
- Create `tests/frontmatter.test.ts` using Vitest:
  - Test valid frontmatter parsing
  - Test missing required fields (stage)
  - Test default value handling
  - Test invalid frontmatter handling
  - Test preservation of unknown fields
- Test task serialization:
  - Verify round-trip parsing/stringifying
  - Test with special characters in content
  - Test with complex tag structures

**Notes**
Frontmatter is critical for task integrity; tests should cover all failure modes.

---

#### Task 1.7: Implement integration tests for task loading
**Stage:** plan  
**Tags:** mvp, testing, filesystem  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Ensure task loading works correctly across all folder structures and edge cases.

**Scope**
- Create `tests/task-loading.test.ts` using Vitest:
  - Test loading from empty workspace
  - Test loading from inbox only
  - Test loading from projects with phases
  - Test loading from projects without phases
  - Test handling of _context.md exclusion
  - Test project/phase inference from paths
  - Test error handling for missing folders
  - Test with malformed task files

**Notes**
Integration tests should use temporary test directories to avoid affecting real workspace.

---

#### Task 1.8: Implement file watcher for task changes
**Stage:** plan  
**Tags:** mvp, filesystem, watcher, events  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Keep UI in sync with filesystem changes and enable real-time updates.

**Scope**
- Implement FileSystemWatcher for `.kanban2code`:
  - Watch for file creation, modification, deletion.
  - Watch for file moves and renames.
  - Ignore non-task paths: `_templates/`, `_agents/`, `_archive/`, any `_context.md`, and non-`.md` files.
- Debounce rapid changes (300ms) to avoid excessive updates:
  - Batch multiple rapid changes into single update.
  - Reset debounce timer on each change.
- Emit events for:
  - Task created (new .md file in task locations).
  - Task updated (existing .md file modified).
  - Task deleted ( .md file removed).
  - Task moved (file renamed between folders).
- Handle external edits:
  - User edits in VS Code editor.
  - Git operations (checkout, merge, rebase).
- Integrate with task loading service to refresh data.

**Notes**
File watching is critical for responsive UI; must handle edge cases like rapid saves and external tool modifications.

---

#### Task 1.9: Define webview architecture and messaging protocol
**Stage:** plan  
**Tags:** mvp, infra, webview, architecture  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Establish foundation for React webviews with proper state management and host communication.

**Scope**
- Define message types for host ↔ webview communication:
  - TaskUpdated, TaskSelected, FilterChanged, etc.
  - Request types: CreateTask, MoveTask, CopyContext.
- Add a versioned envelope (e.g., `{version, type, payload}`) and runtime validation (zod/io-ts) for all messages to prevent silent schema drift.
- Set up React state management with Zustand:
  - Create stores for tasks, filters, UI state.
  - Define actions and selectors.
- Create base component library:
  - Button, Modal, Tree, Card components.
  - Use shadcn/ui for consistent styling.
- Establish CSS/styling approach:
  - Tailwind CSS for utility classes.
  - CSS-in-JS for component-specific styles.
- Define webview initialization pattern:
  - Consistent setup for sidebar and board webviews.
  - Message handling registration with validation.

**Notes**
This provides the foundation that both Phase 3 (sidebar) and Phase 4 (board) will build upon.

---

### Phase 2 - Context System
*Location: [`phase-2-context-system/`](./phase-2-context-system/)*

This phase builds the XML prompt assembly system for AI agent integration.

**Key Tasks:**
- Implement context file loaders
- Implement XML prompt builder (9-layer context)
- Implement stage template resolution
- Implement copy modes and copy payload builder
- Integrate copy-with-context with VS Code clipboard

---

### Phase 2 Tasks

#### Task 2.1: Implement context file loaders
**Stage:** plan  
**Tags:** mvp, context, filesystem  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Provide simple helpers for loading all context layers used in prompts.

**Scope**
- In `contextService.ts`, implement:
  - `loadGlobalContext(root)` → `how-it-works.md`, `architecture.md`, `project-details.md`.
  - `loadAgentContext(root, agentName)`.
  - `loadProjectContext(root, projectName)`.
  - `loadPhaseContext(root, projectName, phaseName)`.
  - `loadCustomContexts(root, contextNames[])`.
- Return empty strings or `null` for missing files, never crash.

**Notes**
These helpers will feed into the XML prompt builder.

---

#### Task 2.2: Implement XML prompt builder (9-layer context)
**Stage:** plan  
**Tags:** mvp, context, prompts  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Assemble a complete XML prompt for a task, following the defined context order.

**Scope**
- Implement `promptBuilder.buildXMLPrompt(task, root): Promise<string>`.
- Assembly order:
  1. `how-it-works.md`
  2. `architecture.md`
  3. `project-details.md`
  4. `_agents/{agent}.md` (if `agent` is set)
  5. `projects/{project}/_context.md` (if project)
  6. `projects/{project}/{phase}/_context.md` (if phase)
  7. `_templates/stages/{stage}.md`
  8. Custom contexts from `contexts:`
  9. Task body + metadata
- Wrap in `<system>`, `<context>`, `<task>` XML structure.

**Notes**
Keep formatting clean and model-friendly; avoid unnecessary whitespace noise.

---

#### Task 2.3: Implement stage template resolution
**Stage:** plan  
**Tags:** mvp, context, templates  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Load the correct stage template for a task's current stage.

**Scope**
- Implement `loadStageTemplate(root, stage)`:
  - Resolve `_templates/stages/{stage}.md`.
  - Read file content or return a minimal fallback template if missing.
- Integrate this into the XML prompt builder so every prompt gets stage-specific guidance.

**Notes**
These templates define "what to do at this stage" for the AI agent.

---

#### Task 2.4: Implement copy modes and copy payload builder
**Stage:** plan  
**Tags:** mvp, context, clipboard  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Support multiple copy modes while making "full XML context" the default.

**Scope**
- Define `CopyMode` in `types/copy.ts`:
  - `'full_xml' | 'task_only' | 'context_only'`.
- Implement `copyService.buildCopyPayload(task, mode)`:
  - `full_xml` → 9-layer XML prompt.
  - `task_only` → task metadata + body.
  - `context_only` → system + context sections without task content.
- Keep API simple; UI will mainly use `full_xml`.

**Notes**
Modes beyond `full_xml` are nice-to-have but valuable for future workflows.

---

#### Task 2.5: Integrate copy-with-context with VS Code clipboard
**Stage:** plan  
**Tags:** mvp, context, clipboard  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Make "Copy XML (Full Context)" a one-click action that fills the clipboard.

**Scope**
- Implement `kanban2code.copyTaskContext` command:
  - Accepts task identifier + `CopyMode`.
  - Uses `copyService.buildCopyPayload`.
  - Writes result to VS Code clipboard API.
- Show a toast or VS Code notification on success:
  - "Copied full XML context for '{title}'."
- Handle errors gracefully.

**Notes**
This is one of the most-used actions; it should feel instant and reliable.

---

### Phase 3 - Sidebar UI ✅ COMPLETED
*Location: [`phase-3-sidebar-ui/`](./phase-3-sidebar-ui/)*

This phase creates the control tower sidebar interface.

**Key Tasks:**
- ✅ Implement Kanban2Code sidebar shell
- ✅ Implement filters and quick views in sidebar
- ✅ Implement Inbox and project tree in sidebar
- ✅ Implement New Task modal
- ✅ Implement sidebar task context menus
- ✅ Implement keyboard navigation for accessibility

**Implementation Summary:**
- Created full React-based sidebar with theme support and message bridge
- Implemented search + filters: Project dropdown, stage toggles, tag chips
- Added quick views: "Today's Focus", "All In Development", "Bugs", "Ideas & Roadmaps"
- Built collapsible tree for Inbox/Projects/Phases with task counts
- Created task creation modal with location, stage, tags, content fields
- Added context menu with Copy XML, Change Stage, Archive, Delete
- Implemented keyboard shortcuts: Ctrl+N (new), ?, Escape, arrow keys, Ctrl+C for copy
- Created comprehensive test suite: 243 passing tests, 578 expect() calls across 15 test files

---

### Phase 3 Tasks

#### Task 3.1: Implement Kanban2Code sidebar shell
**Stage:** completed  
**Tags:** mvp, ui, sidebar  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Create the main sidebar view in VS Code that will host filters, quick views, and the task tree.

**Scope**
- Register custom view `kanban2code.sidebar`.
- Render `<Sidebar />` React component with:
  - Title bar: "Kanban2Code".
  - Buttons:
    - `[Board]`
    - `[+ New Task]`
    - `⚙︎` for settings.
- Wire sidebar to task data from `taskService.loadAllTasks`.
- Support basic refresh when files change.

**Notes**
No fancy filters yet; this is the structural foundation for later UI work.

---

#### Task 3.2: Implement filters and quick views in sidebar
**Stage:** completed  
**Tags:** mvp, ui, filters  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Let the user constrain visible tasks by project, tags, and stage, and expose preset "quick views".

**Scope**
- Filters:
  - Project dropdown: All, Inbox only, each project.
  - Tag chips: multi-select tags (e.g. `bug`, `idea`, `roadmap`).
  - Stage toggles: Inbox / Plan / Code / Audit / Completed.
- Quick Views mapped to presets, such as:
  - Today's Focus (Plan + Code + Audit).
  - All In Development (Plan + Code + Audit, all projects).
  - Bugs (tag `bug`).
  - Ideas & Roadmaps (tags `idea` or `roadmap`).
- Ensure filter state is accessible to the board view later.

**Notes**
These filters drive your "show me everything, but sliced how I want" workflow.

---

#### Task 3.3: Implement Inbox and project tree in sidebar
**Stage:** completed  
**Tags:** mvp, ui, sidebar, tasks  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Render a clear tree of Inbox and Projects → Phases → Tasks matching the filesystem.

**Scope**
- Inbox section:
  - Show filtered tasks from `inbox/`.
  - Display title, stage pill, key tags (1–3).
- Projects section:
  - Show project nodes.
  - Under each project, show phase nodes and direct tasks.
  - Badge counts of tasks per phase/project.
- Click task row → open markdown file in editor.

**Notes**
This becomes your primary navigation surface for day-to-day work.

---

#### Task 3.4: Implement New Task modal
**Stage:** completed  
**Tags:** mvp, ui, tasks, creation  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Provide a rich task creation flow that defaults to Inbox-first but supports projects/phases.

**Scope**
- `<TaskModal />` with fields:
  - Location: Inbox or Project.
  - If Project: project + optional phase selection.
  - Title (required).
  - Stage (default `inbox`).
  - Agent (dropdown from `_agents/`).
  - Tags (free-text with chips).
  - Template (optional, from `_templates/tasks/`).
- On submit:
  - Generate filename: `{timestamp}-{slug(title)}.md`.
  - Apply selected template to build frontmatter + body.
  - Write file into appropriate folder.
  - Reload tasks.

**Notes**
This should reflect your "I don't mind filling the form if it captures my thinking" preference.

---

#### Task 3.5: Implement sidebar task context menus
**Stage:** completed  
**Tags:** mvp, ui, sidebar, actions  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Enable core actions on tasks directly from the sidebar list.

**Scope**
- On right-click of a task:
  - `Copy XML (Full Context)`.
  - `Change Stage ▸` (Inbox / Plan / Code / Audit / Completed).
  - `Mark Implementation Done` (only if `stage: code`).
  - `Move to Project/Phase…`.
  - `Archive` (only if `stage: completed`).
  - `Delete task` (with confirmation).
- After actions, refresh relevant parts of the UI.

**Notes**
This is where your "Mark implementation done (Code → Audit only)" logic will live.

---

#### Task 3.6: Implement keyboard navigation for accessibility (webview focus)
**Stage:** completed  
**Tags:** mvp, ui, accessibility, keyboard  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Enable full keyboard navigation within the webviews (sidebar + board) for power users and accessibility, while coordinating with global keybindings defined in task 5.1.

**Scope**
- Define keyboard shortcuts for sidebar:
  - Navigate between sections (Inbox, Projects, Filters)
  - Focus task list with Ctrl+Shift+F
  - Create new task with Ctrl+N
- Define keyboard shortcuts for board:
  - Navigate between columns with Tab/Shift+Tab
  - Focus next/previous task with Arrow keys
  - Move focused task with Enter (edit) or Space (stage change)
  - Copy XML context with Ctrl+C
- Implement modal keyboard handling:
  - Escape to close modals
  - Enter to confirm actions
  - Arrow keys for navigation
- Add keyboard shortcut help overlay (? key)
- Ensure all keyboard actions work with screen readers

**Notes**
- Limit to in-webview behavior (focus management, ARIA, modal handling). Global VS Code keybindings and command registrations live in task 5.1; keep scopes non-overlapping.
- Keyboard navigation should be consistent across all UI components and follow VS Code extension patterns.

---

### Phase 4 - Board Webview
*Location: [`phase-4-board-webview/`](./phase-4-board-webview/)*

This phase implements the Kanban board view.

**Key Tasks:**
- Implement Board layout and data flow
- Implement TaskCard component
- Implement drag-and-drop stage changes
- Sync filters and search between sidebar and board
- Implement Add Follow-up in Inbox from board
- Implement webview component tests

---

### Phase 4 Tasks

#### Task 4.1: Implement Board layout and data flow
**Stage:** plan  
**Tags:** mvp, ui, board  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Create the main Kanban board webview with 5 stage columns.

**Scope**
- Implement `<Board />` React component:
  - Columns: Inbox, Plan, Code, Audit, Completed.
  - Each column shows tasks filtered by stage + global filters.
- Top bar:
  - Search box.
  - `[+ New Task]` (reusing task creation flow).
  - Filter controls synced with sidebar (via host messaging).
- Wire board to extension host for task data loading.

**Notes**
This view powers your mixed "see everything at once" workflow.

---

#### Task 4.2: Implement TaskCard component
**Stage:** plan  
**Tags:** mvp, ui, board, tasks  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Render individual tasks as Kanban cards with key information and actions.

**Scope**
- `<TaskCard />` shows:
  - Title.
  - Project › Phase crumb (or "Inbox").
  - Tag row (1–3 tags, type-like tags visually distinct).
  - Optional stage pill.
- On hover:
  - `Copy XML`.
  - `Open` file.
  - `[…]` menu for other actions (Mark Implementation Done, Change Stage, Move, Archive, Delete).
- Keyboard shortcuts when a card is focused:
  - `C` → copy XML.
  - `Enter` → open file.
  - `1–5` → move to specific stage.

**Notes**
This is the core visual unit of your board; keep it clean and readable.

---

#### Task 4.3: Implement drag-and-drop stage changes
**Stage:** plan  
**Tags:** mvp, ui, board, dnd  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Allow tasks to be moved between stages via drag-and-drop on the board.

**Scope**
- Enable dragging `TaskCard` between columns.
- On drop:
  - Send message to extension host to call `moveTaskToStage`.
  - Update UI state after successful write.
- Optional: support reordering within a column by updating `order:`.

**Notes**
DnD should feel smooth but always respect filesystem-backed state.

---

#### Task 4.4: Sync filters and search between sidebar and board
**Stage:** plan  
**Tags:** mvp, ui, filters, board  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Ensure sidebar filters and board views stay in sync so the user sees a consistent subset of tasks.

**Scope**
- Share filter state (project, tags, stages) between sidebar and board via the extension host.
- When a quick view is selected in the sidebar, update the board automatically.
- Board search bar:
  - Filters tasks client-side without changing global filter state.

**Notes**
This avoids cognitive dissonance between what the sidebar and board show.

---

#### Task 4.5: Implement Add Follow-up in Inbox from board
**Stage:** plan  
**Tags:** mvp, ui, board, inbox  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Let the user create follow-up/dependency tasks in Inbox directly from a card.

**Scope**
- On card `[…]` menu, add `Add Follow-up in Inbox`.
- Show mini modal:
  - Parent task title (read-only).
  - Fields: Title, Tags (prefilled if appropriate), Stage (locked to `inbox`), Agent (optional).
- On submit:
  - Create a new inbox task with `parent` reference in frontmatter.
- Display a small indicator on the original card (e.g. "↗ 1 follow-up").

**Notes**
This directly supports your "I see I need backend schema → capture it without losing flow" use case.

---

#### Task 4.6: Implement webview component tests
**Stage:** plan  
**Tags:** mvp, testing, ui, board  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Ensure board webview components render correctly and handle user interactions properly.

**Scope**
- Create `tests/board.test.tsx` using Vitest + React Testing Library:
  - Test TaskCard component rendering
  - Test board column rendering
  - Test drag-and-drop functionality
  - Test filter application
  - Test search functionality
  - Test context menu actions
- Create `tests/sidebar.test.tsx`:
  - Test sidebar tree rendering
  - Test filter controls
  - Test task selection
- Mock VS Code APIs for testing
- Test webview message passing

**Notes**
Component tests should catch UI regressions before they reach users.

---

### Phase 5 - Polish and Docs
*Location: [`phase-5-polish-and-docs/`](./phase-5-polish-and-docs/)*

This phase focuses on final polish, shortcuts, and documentation.

**Key Tasks:**
- Implement test infrastructure
- Define formal tag taxonomy and conventions
- Implement keyboard shortcuts and command palette entries
- Improve error handling and logging
- Dogfood Kanban2Code on Kanban2Code project
- Polish how-it-works and project documentation
- Validate MVP feature checklist and define post-v1 backlog
- Implement E2E tests for core workflows

---

### Phase 5 Tasks

#### Task 5.0: Implement test infrastructure
**Stage:** plan  
**Tags:** mvp, testing, ci, infrastructure  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Set up comprehensive testing strategy for Kanban2Code to ensure reliability and prevent regressions.

**Scope**
- Set up Vitest for unit tests:
  - Configure test environment
  - Add test scripts to package.json
- Set up @vscode/test-electron for extension tests:
  - Configure VS Code extension testing framework
  - Set up test runner for extension commands
- Add CI pipeline (GitHub Actions):
  - Automated test runs on PR/merge
  - Test matrix across Node.js versions
- Write tests for critical paths:
  - Frontmatter parsing (Phase 1)
  - Task loading (Phase 1)
  - Stage changes (Phase 1)
  - Webview component rendering (Phase 3-4)
  - Core workflows (Phase 5)

**Notes**
Testing should be integrated into development workflow with all new features including corresponding tests.

---

#### Task 5.1: Implement keyboard shortcuts and command palette entries (global bindings)
**Stage:** plan  
**Tags:** mvp, polish, shortcuts  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Make common actions fast via keyboard and easily discoverable at the VS Code level, building on in-webview navigation from task 3.6.

**Scope**
- Define VS Code-level keybindings, for example:
  - Toggle board.
  - Focus Kanban2Code sidebar.
  - New task.
  - Copy XML for current task.
  - Mark implementation done.
- Ensure all actions are also available via the command palette:
  - `Kanban2Code: New Task`
  - `Kanban2Code: Copy XML for Current Task`
  - `Kanban2Code: Mark Implementation Done`
  - etc.
- Keep in-webview focus rules and ARIA behavior in task 3.6; avoid duplicating that work here.

**Notes**
This supports your desire to "execute without touching the UI" once tasks are queued. Coordinate with task 3.6 so global shortcuts cooperate with in-webview navigation.

---

#### Task 5.2: Improve error handling and logging
**Stage:** plan  
**Tags:** mvp, polish, robustness  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Make Kanban2Code resilient and transparent when things go wrong.

**Scope**
- Wrap filesystem operations with try/catch and user-facing messages:
  - Missing `.kanban2code`.
  - Invalid frontmatter.
  - Failed archive/move operations.
- Write debug logs to VS Code output channel for troubleshooting.
- Avoid blocking the entire UI on a single failing task.

**Notes**
Good error messages prevent frustration and mysterious failures.

---

#### Task 5.3: Dogfood Kanban2Code on the Kanban2Code project
**Stage:** plan  
**Tags:** mvp, polish, dogfooding  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Use Kanban2Code to manage its own development and validate the workflow.

**Scope**
- Create `projects/kanban2code/_context.md` with:
  - Project goals, scope, success criteria.
- Use the tasks defined in this roadmap as real tasks:
  - Set stages, tags, and agents as you work.
- Use copy-with-context with your preferred models for:
  - Planning, coding, and auditing.
- Capture friction, missing features, and confusing flows as new tasks.

**Notes**
This is where real UX issues surface; treat them as first-class work.

---

#### Task 5.4: Polish how-it-works and project documentation
**Stage:** plan  
**Tags:** mvp, docs, polish  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Make it easy for both you and AI agents to understand the Kanban2Code system.

**Scope**
- Refine `how-it-works.md`:
  - Emphasize Inbox-first philosophy.
  - Describe stage semantics.
  - Explain tags-as-type convention (`bug`, `idea`, `roadmap`, etc.).
- Update `architecture.md` to reflect actual extension architecture.
- Update `project-details.md` with:
  - Clear problem statement.
  - Users (solo devs with multi-agent workflows).
  - Success criteria.

**Notes**
These docs become core context for AI agents and future you.

---

#### Task 5.5: Validate MVP feature checklist and define post-v1 backlog
**Stage:** plan  
**Tags:** mvp, roadmap, planning  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Confirm that v1.0 matches the approved spec and identify post-MVP work.

**Scope**
- Cross-check implemented features against the MVP list:
  - Filesystem, stages, archive, context system, sidebar, board, copy-with-context, etc.
- Mark anything missing or partial as new tasks tagged `post-v1`.
- Create a separate roadmap or project for:
  - Project templates.
  - Agent presets.
  - Batch operations.
  - Task dependencies.
  - Time tracking.
  - Exports.
  - Migration tools for other task management systems.
- Optionally create a `projects/kanban2code-post-v1/` project to hold these.

**Notes**
This keeps v1 focused while giving you a place to park future ideas.

---

#### Task 5.6: Implement E2E tests for core workflows
**Stage:** plan  
**Tags:** mvp, testing, e2e, workflows  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Verify critical user workflows work end-to-end in real VS Code environment.

**Scope**
- Create `tests/e2e/` using @vscode/test-electron:
  - Test workspace scaffolding workflow
  - Test task creation from sidebar
  - Test task creation from board
  - Test stage changes via drag-and-drop
  - Test copy XML context functionality
  - Test archive workflow
  - Test filter synchronization
- Set up test workspace fixtures
- Configure test data cleanup

**Notes**
E2E tests catch integration issues that unit tests might miss, especially around VS Code APIs.

---

#### Task 5.7: Define formal tag taxonomy and conventions
**Stage:** plan  
**Tags:** mvp, docs, taxonomy  
**Created:** 2025-12-07T00:00:00Z

**Goal**
Establish clear, consistent tagging system for tasks to improve organization and filtering.

**Scope**
- Create tag taxonomy documentation in `how-it-works.md`:
  - **Scope**: mvp, post-v1
  - **Type**: bug, feature, spike, idea, roadmap
  - **Domain**: infra, ui, context, board, filesystem
  - **Priority**: urgent (optional)
- Update task creation UI to:
  - Provide tag suggestions based on taxonomy
  - Allow free-text entry with autocomplete
  - Visual distinction between tag categories
- Update filtering system to support tag categories:
  - Filter by scope (MVP vs post-v1)
  - Filter by type (bugs only, features only)
  - Filter by domain (infra tasks, UI tasks)

**Notes**
Tags should be an input field for users to type if that helps their workflow, but taxonomy provides structure and consistency.

---

## Task Management

Each task file includes:
- **Stage**: Current development stage (plan, code, etc.)
- **Tags**: Relevant tags for categorization
- **Title**: Clear task description
- **Goal**: High-level objective
- **Scope**: Detailed implementation requirements
- **Notes**: Additional context or constraints

## Development Workflow

1. Start with Phase 0 to establish the foundation
2. Work through phases sequentially, but individual tasks within a phase can be parallelized
3. Move tasks from `plan` to `code` stage as work begins
4. Update task status as work progresses
5. Use the Kanban2Code extension itself to manage these tasks (dogfooding)

## Post-MVP

After completing all phases, consider creating a `projects/kanban2code-post-v1/` project for future enhancements like:
- Project templates
- Agent presets
- Batch operations
- Task dependencies
- Time tracking
- Exports
- Migration tools for other task management systems

---

*This roadmap is a living document. As development progresses, new tasks may be discovered and existing ones refined.*