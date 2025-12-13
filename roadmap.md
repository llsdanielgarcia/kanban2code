Here’s an updated roadmap with:

* A **UI‑first approach** (sidebar + board shells first, then wiring/backend).
* A **3‑button sidebar nav** (`Create Kanban`, `View Kanban`, `Settings`).
* An explicit **unit-testing requirement** across the project.
* A **phase audit file** at the end of every phase that must be created and checked before moving on.

---

# Kanban2Code Development Roadmap (UI‑First, Tested, Audited)

This roadmap outlines the development plan for Kanban2Code, organized into phases with specific tasks and per‑phase audits.

## Overview

Kanban2Code is a VS Code extension that adds Kanban board functionality directly into your editor, integrating AI agents and rich task context.

## Technology Stack

* **Runtime & package manager:** [Bun](https://bun.sh)
* **Language:** TypeScript
* **Bundler:** esbuild
* **UI:** React (webviews), Tailwind CSS + shadcn/ui
* **Testing:** Vitest (unit + component), React Testing Library, @vscode/test-electron (extension/e2e)

All scripts (build, test, lint) are run via **Bun**.

---

## Global Principles

### 1. UI‑First Workflow

**Sidebar UI‑first:**

1. Build a **sidebar shell** that:

   * Renders and opens in VS Code.
   * Shows a top nav with three buttons:

     * `Create Kanban`
     * `View Kanban`
     * `Settings`
   * Uses placeholder/dummy data only (no filesystem/host dependencies).
2. Get visual/UX approval on this sidebar shell.
3. **Only then** wire the shell to:

   * Actual data (`taskService.loadAllTasks`, filters, etc.).
   * Real commands (`kanban2code.scaffoldWorkspace`, `kanban2code.openBoard`, settings).

**Board UI‑first:**

1. Build a **board shell**:

   * 5 columns: Inbox, Plan, Code, Audit, Completed.
   * Static or fake TaskCards.
   * A visible top bar with search and placeholder controls.
   * Buttons and interactions can be no‑ops/logs.
2. Get visual/UX approval on the board layout.
3. **Only then**:

   * Wire buttons and interactions (open file, copy XML, drag & drop).
   * Connect to real task data and filesystem services.

### 2. Testing Requirements

* **Every non‑trivial module must have unit tests.**

  * Services (filesystem, context, copy, etc.).
  * React components (sidebar, board, TaskCard, modals).
  * Utility functions (types, constants, workspace detection).
* No feature is **Done** until:

  * Unit tests exist and pass.
  * For filesystem behavior, related **integration tests** exist (Phase 1).
  * For critical workflows, related **e2e tests** exist (Phase 5).
* Use:

  * **Vitest** for unit/component tests.
  * **React Testing Library** for webview components.
  * **@vscode/test-electron** for extension + e2e flows.
* Tests run via Bun (e.g. `bun test`), and will be enforced in CI (Phase 5).

### 3. Phase Audit Files

At the end of **every phase**, create and check an **audit file** before starting the next phase.

* File naming/location:

  * `phase-0-foundation/phase-0-audit.md`
  * `phase-1-filesystem-and-tasks/phase-1-audit.md`
  * `phase-2-context-system/phase-2-audit.md`
  * `phase-3-sidebar-ui/phase-3-audit.md`
  * `phase-4-board-webview/phase-4-audit.md`
  * `phase-5-polish-and-docs/phase-5-audit.md`
* Each audit file must include:

  * Checklist of phase goals and tasks.
  * Summary of what was implemented.
  * Testing status:

    * Unit tests (where they live and what they cover).
    * Integration/e2e tests if applicable.
  * Known issues / deferred items (with links to tasks).
  * Explicit signoff: `Checked by: <name>  |  Date: YYYY-MM-DD`.

**You do not start the next phase until the audit file for the previous phase is created and checked.**

---

## Phase Structure

Each phase is represented as a folder with task files (markdown).
Tasks have frontmatter like:

* `stage` (plan/code/audit/etc.)
* `tags`
* `goal`, `scope`, `notes`

Each phase ends with a **Phase Audit** task that produces the audit file described above.

---

## Phases

---

### Phase 0 – Foundation & Bootstrapping

*Location: [`phase-0-foundation/`](./phase-0-foundation/)*

This phase sets up the project, build tooling, minimal test harness, and core VS Code extension skeleton.

**Key Goals:**

* Bun‑based project bootstrap.
* TypeScript + esbuild build pipeline.
* Minimal test harness (Vitest + `bun test`).
* Basic VS Code extension skeleton.
* Core webview infrastructure (React app bootstrapping).
* Workspace detection, types, activation.
* **Audit file** capturing the state of the foundation.

---

#### Task 0.0: Initialize project and build tooling

**Stage:** plan
**Tags:** mvp, infra, foundation, testing

**Goal**
Create the foundational project structure using Bun and set up the initial test harness.

**Scope**

* Run `bun init` to create `package.json`.
* Configure TypeScript (`tsconfig.json`).
* Set up esbuild for bundling.
* Create `.gitignore` (node_modules, dist, .vscode-test).
* Set up ESLint + Prettier.
* Create initial folder structure:

  * `src/`
  * `tests/`
  * `webview/`
* **Testing:**

  * Add Vitest as a dev dependency.
  * Configure a minimal Vitest setup.
  * Add `bun test` script.
  * Add a trivial sample test (`tests/smoke.test.ts`) to prove the pipeline.

**Notes**
This is the prerequisite for all other Phase 0 tasks, including any later tests.

---

#### Task 0.1: Create VS Code extension skeleton

**Stage:** plan
**Tags:** mvp, infra, extension, foundation

**Goal**
Set up a minimal but scalable VS Code extension project that can host the Kanban2Code sidebar and board webview.

**Scope**

* Initialize a new VS Code extension in TypeScript.
* Configure bundler/build pipeline (esbuild) using Bun.
* Register core commands:

  * `kanban2code.openBoard`
  * `kanban2code.newTask`
  * `kanban2code.scaffoldWorkspace`
* Create a basic webview panel that can render a simple React app.
* Set up project structure:

  * `src/commands`
  * `src/services`
  * `src/webview`
* **Testing requirement:**

  * Ensure extension entry and commands are written in a testable, modular way.
  * Add at least one small unit test for a pure helper used by the extension (no VS Code API mocking yet).

**Notes**
Keep the scaffold minimal but clean; focus on modular design to make unit testing easy later.

---

#### Task 0.2: Implement core webview infrastructure

**Stage:** plan
**Tags:** mvp, infra, webview, ui-shell

**Goal**
Set up React bootstrapping, theme system, and message wiring for Kanban2Code webviews, including a thin UI shell.

**Scope**

* Implement webview bootstrapping (`contentProvider`, CSP, message wiring).
* Create React entry (`main.tsx`, `App.tsx`).
* Set up theme provider + tokens (glassmorphic styles).
* Render a minimal **UI shell**:

  * Placeholder sidebar area.
  * Placeholder board area.
  * Simple `"Hello from Kanban2Code"` content.
* **Testing requirement:**

  * Add unit tests for any pure utilities (theme tokens, message serializers).
  * Optional: simple component test to assert `<App />` renders a known string.

**Notes**
This is still infrastructure; real sidebar/board designs happen in Phases 3 and 4.

---

#### Task 0.3: Implement `.kanban2code` workspace scaffolder

**Stage:** plan
**Tags:** mvp, infra, filesystem, scaffolding

**Goal**
Provide a one-shot command that generates the canonical `.kanban2code` folder with all required subfolders and seed files.

**Scope**

* Create `.kanban2code` with:

  * `inbox/`
  * `projects/`
  * `_agents/`
  * `_templates/stages/`
  * `_templates/tasks/`
  * `_archive/`
* Create seed files:

  * `how-it-works.md`
  * `architecture.md`
  * `project-details.md`
  * `_agents/opus.md` (optional `sonnet.md`, `codex.md`)
  * `_templates/stages/inbox.md`, `code.md`, `plan.md`, `audit.md`, `completed.md`
  * `_templates/tasks/bug.md` (optional: feature/spike)
  * `.gitignore` ignoring `_archive/`
  * A sample inbox task.
* Wire command `kanban2code.scaffoldWorkspace` with success/error messages.
* Use workspace detection from task 0.5 to check if `.kanban2code` exists before scaffolding.
* **Testing requirement:**

  * Add unit tests for the scaffolder’s pure logic (e.g. path generation, idempotency checks).

**Notes**
This defines the “Create Kanban” experience the sidebar will trigger.

---

#### Task 0.4: Define core types and constants

**Stage:** plan
**Tags:** mvp, infra, types, model, testing

**Goal**
Create a shared type system and constants for tasks, stages, and copy modes used across the extension, services, and UI.

**Scope**

* In `types/task.ts`:

  * Define `Stage = 'inbox' | 'plan' | 'code' | 'audit' | 'completed'`.
  * Define `Task` interface with:

    * `id`, `filePath`, `title`, `stage`, `project?`, `phase?`, `agent?`,
      `parent?`, `tags?`, `contexts?`, `order?`, `created?`, `content`.
* In `core/constants.ts`:

  * `STAGES` array in order.
  * Folder names for `inbox`, `projects`, `_archive`, etc.
* **Testing requirement:**

  * Unit tests to assert `STAGES` ordering and valid `Stage` values.
  * Simple type-guard tests (where applicable).

**Notes**
This file is the single source of truth for task structure.

---

#### Task 0.5: Implement workspace detection and validation

**Stage:** plan
**Tags:** mvp, infra, validation, testing

**Goal**
Reliably locate `.kanban2code` and prevent unsafe file operations.

**Scope**

* Implement `workspace/validation.ts`:

  * `findKanbanRoot(workspaceRoot)` to locate `.kanban2code`.
  * Guard against operations outside the kanban root.
* On missing `.kanban2code`:

  * Return null/false to indicate workspace needs scaffolding.
* Show clear error messages when the workspace is invalid.
* **Testing requirement:**

  * Unit tests for detection in different workspace layouts (single-root, multi-root, missing folder, forbidden paths).

**Notes**
Phase 1 will extend this with richer status codes.

---

#### Task 0.6: Define extension activation and lifecycle

**Stage:** plan
**Tags:** mvp, infra, extension, activation

**Goal**
Ensure Kanban2Code activates at the right time and handles missing workspaces gracefully.

**Scope**

* Set `activationEvents` in `package.json`:

  * `workspaceContains:.kanban2code`
  * `onCommand:kanban2code.scaffoldWorkspace`
  * `onView:kanban2code.sidebar`
* On activation without `.kanban2code`:

  * Show an empty state in sidebar with “Create Kanban” (scaffold) button.
* Multi-root handling:

  * Use first folder containing `.kanban2code`.
  * If none found, target first workspace folder for scaffolding.
* Store workspace root in extension context for all services to use.
* **Testing requirement:**

  * Add unit tests for helper functions that compute activation state.
  * Full activation/e2e tests will come in Phase 5.

**Notes**
Keep activation fast; heavy loading is deferred.

---

#### Task 0.7: Initialize project and build tooling (superseded)

**Stage:** plan
**Tags:** mvp, infra, foundation

**Goal**
Avoid duplicate tracking of the project bootstrap work. Use `phase-0-foundation/task-0.0.md` as the single source of truth.

**Scope**

* Do not execute separately; reference and update `task-0.0` instead.

**Notes**
Kept only as a pointer.

---

#### Task 0.8: Phase 0 audit & sign-off

**Stage:** plan
**Tags:** audit, docs, testing

**Goal**
Confirm the foundation is in place and testable before touching the filesystem logic.

**Scope**

* Create `phase-0-foundation/phase-0-audit.md` including:

  * Checklist of tasks 0.0–0.7.
  * Build & test status (`bun test`, bun build).
  * Summary of extension skeleton + webview shell.
  * List of known issues / tech debt.
* Ensure at least:

  * One passing unit test.
  * Linting and build steps succeed.
* Mark the audit file as “Checked” (with name + date) before starting Phase 1.

---

### Phase 1 – Filesystem and Tasks

*Location: [`phase-1-filesystem-and-tasks/`](./phase-1-filesystem-and-tasks/)*

This phase implements the core filesystem-based task management system plus related unit and integration tests.

**Key Goals:**

* Task parsing/serialization.
* Recursive task loading.
* Stage update and archive behavior.
* Extended workspace validation.
* File watcher.
* Webview architecture/messaging baseline.
* Unit tests for parsing, services, and protocol.
* Integration tests for file-based workflows.
* **Phase audit file**.

---

#### Task 1.1: Implement task parsing and serialization

**Stage:** plan
**Tags:** mvp, filesystem, frontmatter, tasks, testing

**Goal**
Parse markdown task files into `Task` objects and write them back without losing metadata.

**Scope**

* Create `frontmatter.ts` using `gray-matter`:

  * `parseTaskFile(filePath): Promise<Task>`
  * `stringifyTaskFile(task, originalBody): string`
* Rules:

  * `stage` is required; default to `inbox` if missing.
  * `project` and `phase` are inferred from path (not trusted from frontmatter).
  * `tags` is an array of strings.
  * Unknown frontmatter fields are preserved.
* Handle invalid frontmatter gracefully with warnings, not crashes.
* **Testing requirement:**

  * Covered by unit tests in Task 1.6 (frontmatter tests).
  * Design API to be pure/testable (no VS Code APIs).

---

#### Task 1.2: Implement recursive task loading

**Stage:** plan
**Tags:** mvp, filesystem, tasks, loader, testing

**Goal**
Load all tasks from `.kanban2code` into memory with the correct `project` and `phase` inferred.

**Scope**

* Implement `taskService.loadAllTasks(root): Promise<Task[]>`:

  * Load `inbox/*.md`.
  * For each project in `projects/`:

    * Load direct tasks under `projects/{project}/*.md` (excluding `_context.md`).
    * Load phase tasks under `projects/{project}/{phase}/*.md` (excluding `_context.md`).
* Set:

  * `task.project` based on project folder.
  * `task.phase` based on phase folder (or `null`).
* Resilient to missing folders and empty states.
* **Testing requirement:**

  * Integration tests in Task 1.7 will cover loading behavior.
  * Keep logic stateless and testable.

---

#### Task 1.3: Implement stage update service

**Stage:** plan
**Tags:** mvp, filesystem, stages, testing

**Goal**
Allow stages to change by updating frontmatter only, without moving files.

**Scope**

* Implement `taskMoveService.moveTaskToStage(task, newStage)` with transition guards:

  * Read file, update `stage` in frontmatter, write back.
  * Enforce allowed transitions (e.g., Code → Audit via "Mark Implementation Done").
  * Completed can only move to Archive.
  * Disallow regressions unless explicitly allowed.
* Provide `changeStageAndReload(taskId, newStage)` helper for the UI.
* **Testing requirement:**

  * Unit tests for allowed/forbidden transitions and error cases.

---

#### Task 1.4: Implement archive behavior for tasks and projects

**Stage:** plan
**Tags:** mvp, filesystem, archive, testing

**Goal**
Support explicit archive actions that move files into `_archive/` while preserving structure.

**Scope**

* Implement `archiveTask(task, root)`:

  * Only allow if `stage: 'completed'`.
  * Move:

    * Inbox tasks → `_archive/inbox/{filename}`
    * Project/phase tasks → `_archive/projects/{project}/{phase?}/{filename}`
* Implement `archiveProject(root, projectName)`:

  * Move entire `projects/{project}` into `_archive/projects/{project}`.
* Add commands:

  * `Archive Task`
  * `Archive Completed in Project`
  * `Archive Project`
* **Testing requirement:**

  * Unit tests for path calculations and guard conditions.

---

#### Task 1.5: Implement workspace detection and validation (extended)

**Stage:** plan
**Tags:** mvp, infra, validation, testing

**Goal**
Reuse the Phase 0 workspace detection while adding Phase 1-specific outputs (status codes and guardrails).

**Scope**

* Reuse core detection from Task 0.5.
* Extend API to return explicit status enums:

  * `valid | missing | invalid | forbidden`.
* Provide helper guards for filesystem services to block writes outside the kanban root.
* Emit consistent error strings for UI surfaces.
* **Testing requirement:**

  * Unit tests verifying each status is returned in the correct scenarios.

---

#### Task 1.6: Implement unit tests for frontmatter parsing

**Stage:** plan
**Tags:** mvp, testing, filesystem

**Goal**
Ensure frontmatter parsing and serialization is reliable and handles edge cases.

**Scope**

* Create `tests/frontmatter.test.ts` using Vitest:

  * Test valid frontmatter parsing.
  * Test missing required fields (stage).
  * Test default value handling.
  * Test invalid frontmatter handling.
  * Test preservation of unknown fields.
* Test task serialization:

  * Verify round‑trip parsing/stringifying.
  * Test with special characters.
  * Test complex tag structures.

---

#### Task 1.7: Implement integration tests for task loading

**Stage:** plan
**Tags:** mvp, testing, filesystem

**Goal**
Ensure task loading works correctly across all folder structures and edge cases.

**Scope**

* Create `tests/task-loading.test.ts` using Vitest:

  * Test loading from empty workspace.
  * Inbox only.
  * Projects with phases and without phases.
  * `_context.md` exclusion.
  * Project/phase inference.
  * Missing folders and malformed files.
* Use temporary test directories, not real workspace.

---

#### Task 1.8: Implement file watcher for task changes

**Stage:** plan
**Tags:** mvp, filesystem, watcher, events, testing

**Goal**
Keep UI in sync with filesystem changes and enable real-time updates.

**Scope**

* Implement `FileSystemWatcher` for `.kanban2code`:

  * Creation, modification, deletion.
  * Renames/moves.
  * Ignore non-task paths and non-`.md` files.
* Debounce rapid changes (e.g. 300ms).
* Emit events:

  * Task created / updated / deleted / moved.
* Handle external edits (Git, external tools).
* Integrate with task loading service to refresh data.
* **Testing requirement:**

  * Unit tests with mocked watchers to ensure debounce and event emission logic is correct.

---

#### Task 1.9: Define webview architecture and messaging protocol

**Stage:** plan
**Tags:** mvp, infra, webview, architecture, testing

**Goal**
Establish foundation for React webviews with proper state management and host communication.

**Scope**

* Define message types for host ↔ webview communication:

  * TaskUpdated, TaskSelected, FilterChanged, etc.
  * Request types: CreateTask, MoveTask, CopyContext.
* Add a versioned envelope `{version, type, payload}` and runtime validation (zod/io-ts).
* Set up React state management with Zustand:

  * Stores for tasks, filters, UI state.
* Create base component library:

  * Button, Modal, Tree, Card (using shadcn/ui).
* Styling:

  * Tailwind CSS utilities + any needed CSS-in-JS.
* Webview initialization pattern:

  * Shared setup for sidebar and board.
* **Testing requirement:**

  * Unit tests for message validation and reducers/store actions.

---

#### Task 1.10: Phase 1 audit & sign-off

**Stage:** plan
**Tags:** audit, docs, testing

**Goal**
Confirm the filesystem layer is correct and well-tested before building the context system.

**Scope**

* Create `phase-1-filesystem-and-tasks/phase-1-audit.md` including:

  * Checklist of tasks 1.1–1.9.
  * Summary of task parsing/loading behavior.
  * List of stage and archive behaviors implemented.
  * Test coverage summary for 1.6 and 1.7, plus any extra tests.
* List any known edge cases or deferred behavior.
* Mark as “Checked” (with name + date) before starting Phase 2.

---

### Phase 2 – Context System

*Location: [`phase-2-context-system/`](./phase-2-context-system/)*

This phase builds the XML prompt assembly system used for AI integration.

**Key Goals:**

* Context file loaders.
* XML prompt builder (9-layer context).
* Stage template resolution.
* Copy modes and payload builder.
* Copy-with-context clipboard command.
* Unit tests for all context components.
* **Phase audit file**.

---

#### Task 2.1: Implement context file loaders

**Stage:** plan
**Tags:** mvp, context, filesystem, testing

**Goal**
Provide helpers for loading all context layers used in prompts.

**Scope**

* In `contextService.ts`, implement:

  * `loadGlobalContext(root)` → `how-it-works.md`, `architecture.md`, `project-details.md`.
  * `loadAgentContext(root, agentName)`.
  * `loadProjectContext(root, projectName)`.
  * `loadPhaseContext(root, projectName, phaseName)`.
  * `loadCustomContexts(root, contextNames[])`.
* Return empty strings or `null` for missing files.
* **Testing requirement:**

  * Unit tests (Task 2.6) covering missing-file behavior and correct file resolution.

---

#### Task 2.2: Implement XML prompt builder (9-layer context)

**Stage:** plan
**Tags:** mvp, context, prompts, testing

**Goal**
Assemble a complete XML prompt for a task, following the defined context order.

**Scope**

* Implement `promptBuilder.buildXMLPrompt(task, root): Promise<string>`.
* Order:

  1. `how-it-works.md`
  2. `architecture.md`
  3. `project-details.md`
  4. `_agents/{agent}.md` (if `agent`)
  5. `projects/{project}/_context.md` (if project)
  6. `projects/{project}/{phase}/_context.md` (if phase)
  7. `_templates/stages/{stage}.md`
  8. Custom contexts from `contexts:`
  9. Task body + metadata
* Wrap in `<system>`, `<context>`, `<task>` structure.
* **Testing requirement:**

  * Unit tests (Task 2.6) to verify ordering, inclusion, and correct XML wrapping.

---

#### Task 2.3: Implement stage template resolution

**Stage:** plan
**Tags:** mvp, context, templates, testing

**Goal**
Load the correct stage template for a task's current stage.

**Scope**

* Implement `loadStageTemplate(root, stage)`:

  * Resolve `_templates/stages/{stage}.md`.
  * Read file or return minimal fallback if missing.
* Integrate into the XML prompt builder.
* **Testing requirement:**

  * Unit tests (Task 2.6) verifying correct file resolution and fallback behavior.

---

#### Task 2.4: Implement copy modes and copy payload builder

**Stage:** plan
**Tags:** mvp, context, clipboard, testing

**Goal**
Support multiple copy modes while making "full XML context" the default.

**Scope**

* Define `CopyMode` in `types/copy.ts`:

  * `'full_xml' | 'task_only' | 'context_only'`.
* Implement `copyService.buildCopyPayload(task, mode)`:

  * `full_xml` → 9-layer XML prompt.
  * `task_only` → task metadata + body.
  * `context_only` → system + context sections without task content.
* **Testing requirement:**

  * Unit tests (Task 2.6) for each mode and edge cases.

---

#### Task 2.5: Integrate copy-with-context with VS Code clipboard

**Stage:** plan
**Tags:** mvp, context, clipboard

**Goal**
Make "Copy XML (Full Context)" a one-click action that fills the clipboard.

**Scope**

* Implement `kanban2code.copyTaskContext` command:

  * Accepts task identifier + `CopyMode`.
  * Uses `copyService.buildCopyPayload`.
  * Writes result to VS Code clipboard API.
* Show a toast/notification on success.
* Handle errors gracefully.

**Notes**
Command logic should be thin; most logic is in testable services.

---

#### Task 2.6: Implement unit tests for context system

**Stage:** plan
**Tags:** mvp, testing, context

**Goal**
Ensure all context-related modules are thoroughly unit tested.

**Scope**

* Create `tests/context-service.test.ts`:

  * Global, agent, project, phase, and custom context loaders.
  * Missing file behavior.
* Create `tests/prompt-builder.test.ts`:

  * Correct 9-layer ordering.
  * Handling of different stage/agent/project/phase combinations.
* Create `tests/copy-service.test.ts`:

  * Output for `full_xml`, `task_only`, `context_only`.
  * Error handling or fallback behavior.

---

#### Task 2.7: Phase 2 audit & sign-off

**Stage:** plan
**Tags:** audit, docs, testing

**Goal**
Confirm the context system is correct, stable, and testable before UI-heavy phases.

**Scope**

* Create `phase-2-context-system/phase-2-audit.md` including:

  * Checklist of tasks 2.1–2.6.
  * Summary of XML prompt structure.
  * Testing summary for context loaders and prompt builder.
* List any known modeling or performance issues.
* Mark as “Checked” before starting Phase 3.

---

### Phase 3 – Sidebar UI (UI‑First)

*Location: [`phase-3-sidebar-ui/`](./phase-3-sidebar-ui/)*

This phase creates the control tower sidebar UI with a UI‑first approach.

**Key Goals:**

* Sidebar shell with 3-button nav.
* Filters, quick views, Inbox/project tree.
* New Task modal.
* Sidebar task context menus.
* Keyboard navigation.
* Component tests (later in Phase 4 Task 4.6).
* **Phase audit file**.

---

#### Task 3.0: Design sidebar shell (UI‑only)

**Stage:** plan
**Tags:** mvp, ui, sidebar, ui-shell

**Goal**
Design and implement a visual sidebar shell that opens in VS Code with the correct layout and navigation, using placeholders only.

**Scope**

* Create `<SidebarShell />` React component that:

  * Renders in the sidebar webview (no data yet).
  * Shows a title bar: **“Kanban2Code”**.
  * Includes three main buttons:

    * `Create Kanban`
    * `View Kanban`
    * `Settings`
  * Uses dummy content for the rest (e.g., placeholder task list).
* Buttons may:

  * Be no‑ops.
  * Or just log to the console/postMessage for now.
* Get visual/UX approval on:

  * Layout.
  * Button placement and naming.
  * Overall look and feel.

**Notes**
No filesystem calls or task data yet. This is purely about what the sidebar looks like.

---

#### Task 3.1: Implement Kanban2Code sidebar shell (wired)

**Stage:** plan
**Tags:** mvp, ui, sidebar

**Goal**
Turn the approved sidebar shell into a functional view.

**Scope**

* Register custom view `kanban2code.sidebar`.
* Render `<Sidebar />` (production component) using the approved shell design.
* Wire top nav buttons:

  * `Create Kanban` → `kanban2code.scaffoldWorkspace` or equivalent flow.
  * `View Kanban` → `kanban2code.openBoard`.
  * `Settings` → open settings/config view or config webview.
* Wire sidebar to task data from `taskService.loadAllTasks`.
* Support basic refresh when files change (using Phase 1 watcher events).

---

#### Task 3.2: Implement filters and quick views in sidebar

**Stage:** plan
**Tags:** mvp, ui, filters

**Goal**
Let the user constrain visible tasks by project, tags, and stage, and expose preset quick views.

**Scope**

* Filters:

  * Project dropdown (All, Inbox only, each project).
  * Tag chips (multi-select).
  * Stage toggles: Inbox / Plan / Code / Audit / Completed.
* Quick Views:

  * Today’s Focus.
  * All In Development.
  * Bugs.
  * Ideas & Roadmaps.
* Ensure filter state is shareable with the board (Phase 4.4).

---

#### Task 3.3: Implement Inbox and project tree in sidebar

**Stage:** plan
**Tags:** mvp, ui, sidebar, tasks

**Goal**
Render a clear tree of Inbox and Projects → Phases → Tasks matching the filesystem.

**Scope**

* Inbox section:

  * Filtered tasks from `inbox/`.
* Projects section:

  * Show project nodes and phase nodes.
  * Show direct tasks per phase/project with counts.
* Clicking a task opens the markdown file in the editor.

---

#### Task 3.4: Implement New Task modal

**Stage:** plan
**Tags:** mvp, ui, tasks, creation

**Goal**
Provide a rich task creation flow, accessible from the sidebar (and later from the board).

**Scope**

* `<TaskModal />` with fields:

  * Location (Inbox or Project + optional phase).
  * Title (required).
  * Stage (default `inbox`).
  * Agent (dropdown from `_agents/`).
  * Tags (free-text with chips).
  * Template (from `_templates/tasks/`).
* On submit:

  * Generate filename `{timestamp}-{slug(title)}.md`.
  * Apply selected template to build frontmatter + body.
  * Write file into appropriate folder.
  * Reload tasks.

---

#### Task 3.5: Implement sidebar task context menus

**Stage:** plan
**Tags:** mvp, ui, sidebar, actions

**Goal**
Enable core actions on tasks directly from the sidebar list.

**Scope**

* On right-click of a task:

  * `Copy XML (Full Context)`.
  * `Change Stage ▸`.
  * `Mark Implementation Done` (Code → Audit).
  * `Move to Project/Phase…`.
  * `Archive` (if `stage: completed`).
  * `Delete task` (with confirmation).
* Refresh relevant UI after actions.

---

#### Task 3.6: Implement keyboard navigation for sidebar webview

**Stage:** plan
**Tags:** mvp, ui, accessibility, keyboard

**Goal**
Enable full keyboard navigation within the sidebar webview.

**Scope**

* Sidebar keyboard shortcuts:

  * Navigate between sections (Inbox, Projects, Filters).
  * Focus task list.
  * Create new task via keyboard.
* Modal handling:

  * Escape to close.
  * Enter to confirm.
* Keyboard shortcut help overlay (`?` key).
* Ensure ARIA attributes and screen reader compatibility.

---

#### Task 3.7: Phase 3 audit & sign-off

**Stage:** plan
**Tags:** audit, docs, testing

**Goal**
Confirm the sidebar UI meets the UI‑first design, behaves correctly, and is ready to pair with the board.

**Scope**

* Create `phase-3-sidebar-ui/phase-3-audit.md` including:

  * Checklist of tasks 3.0–3.6.
  * Confirmation that UI shell was approved before wiring.
  * Summary of sidebar interactions and any known UX issues.
  * Notes on sidebar-related tests (once added in Phase 4.6).
* Mark as “Checked” before starting Phase 4.

---

### Phase 4 – Board Webview (UI‑First)

*Location: [`phase-4-board-webview/`](./phase-4-board-webview/)*

This phase implements the Kanban board view with a UI‑first approach.

**Key Goals:**

* Board shell layout (UI‑only) with 5 columns.
* TaskCard component.
* Drag-and-drop stage changes.
* Filter & search sync with sidebar.
* Add Follow‑up in Inbox from board.
* Component tests for board & sidebar.
* **Phase audit file**.

---

#### Task 4.0: Design board shell (UI‑only)

**Stage:** plan
**Tags:** mvp, ui, board, ui-shell

**Goal**
Create a static board layout to visualize the final UI before wiring it to real data or actions.

**Scope**

* Implement `<BoardShell />` React component:

  * Columns: Inbox, Plan, Code, Audit, Completed.
  * Static/fake TaskCards in each column.
* Top bar:

  * Search box (client-side only on fake data).
  * Non-functional buttons mirroring core actions (e.g., “New Task”, quick filter).
* Click/drag on cards can be:

  * No‑ops.
  * Simple console logs.
* Get explicit visual/UX approval for:

  * Column layout.
  * Card appearance.
  * Top bar controls.

**Notes**
No filesystem writes or real data here. Once approved, proceed to 4.1–4.5.

---

#### Task 4.1: Implement Board layout and data flow

**Stage:** plan
**Tags:** mvp, ui, board

**Goal**
Turn the approved board shell into the main Kanban board webview with real data.

**Scope**

* Replace `<BoardShell />` with `<Board />` using real data:

  * Columns show tasks filtered by stage + global filters.
* Top bar:

  * Search box (client-side filtering on real tasks).
  * `[+ New Task]` button that reuses the task creation flow.
  * Filter controls synced with sidebar (via host messaging).
* Wire board to extension host for task data loading and updates.

---

#### Task 4.2: Implement TaskCard component

**Stage:** plan
**Tags:** mvp, ui, board, tasks

**Goal**
Render individual tasks as Kanban cards with key information and actions.

**Scope**

* `<TaskCard />` shows:

  * Title.
  * Project › Phase crumb (or “Inbox”).
  * Tag row (1–3 tags).
  * Stage pill (optional).
* On hover:

  * `Copy XML`.
  * `Open` file.
  * `[…]` menu (Mark Implementation Done, Change Stage, Move, Archive, Delete).
* Keyboard shortcuts when focused:

  * `C` → copy XML.
  * `Enter` → open file.
  * `1–5` → move to specific stage.

---

#### Task 4.3: Implement drag-and-drop stage changes

**Stage:** plan
**Tags:** mvp, ui, board, dnd

**Goal**
Allow tasks to be moved between stages via drag-and-drop.

**Scope**

* Enable dragging `TaskCard` between columns.
* On drop:

  * Send message to extension host to call `moveTaskToStage`.
  * Update UI state after success.
* Optional: support ordering within a column via `order:`.

---

#### Task 4.4: Sync filters and search between sidebar and board

**Stage:** plan
**Tags:** mvp, ui, filters, board

**Goal**
Ensure sidebar filters and board views stay in sync.

**Scope**

* Share filter state (project, tags, stages) via extension host.
* When a quick view is selected in the sidebar, update the board automatically.
* Board search:

  * Filters tasks client-side without overwriting global filter state.

---

#### Task 4.5: Implement Add Follow-up in Inbox from board

**Stage:** plan
**Tags:** mvp, ui, board, inbox

**Goal**
Let users quickly create follow-up/dependency tasks in Inbox directly from a card.

**Scope**

* In card `[…]` menu, add `Add Follow-up in Inbox`.
* Show mini modal:

  * Parent task title (read-only).
  * Fields: Title, Tags (prefilled if useful), Agent (optional).
  * Stage locked to `inbox`.
* On submit:

  * Create new inbox task with `parent` reference in frontmatter.
* Show a small indicator on the original card (e.g., “↗ 1 follow-up”).

---

#### Task 4.6: Implement webview component tests (board + sidebar)

**Stage:** plan
**Tags:** mvp, testing, ui, board, sidebar

**Goal**
Ensure webview components render correctly and handle interactions.

**Scope**

* `tests/board.test.tsx` (Vitest + React Testing Library):

  * TaskCard rendering.
  * Board column rendering.
  * Drag-and-drop (using test-friendly abstractions).
  * Filter and search behavior.
  * Context menu actions.
* `tests/sidebar.test.tsx`:

  * Sidebar tree rendering.
  * Filters and quick views.
  * Task selection.
  * Top nav (`Create Kanban`, `View Kanban`, `Settings`) click behavior.
* Mock VS Code APIs and message bridge for tests.

---

#### Task 4.7: Phase 4 audit & sign-off

**Stage:** plan
**Tags:** audit, docs, testing

**Goal**
Validate the board UI and interactions before final polish and docs.

**Scope**

* Create `phase-4-board-webview/phase-4-audit.md` including:

  * Checklist of tasks 4.0–4.6.
  * Confirmation that the board shell was approved before wiring.
  * Summary of drag-and-drop and follow-up flows.
  * Overview of component tests and coverage.
* Record known UX or performance issues.
* Mark as “Checked” before starting Phase 5.

---

### Phase 5 – Polish and Docs

*Location: [`phase-5-polish-and-docs/`](./phase-5-polish-and-docs/)*

This phase focuses on polish, shortcuts, logging, docs, CI, and e2e tests.

**Key Goals:**

* Mature test infrastructure and CI.
* Command palette + keyboard shortcuts.
* Error handling and logging.
* Dogfooding.
* Documentation.
* E2E tests for core workflows.
* Tag taxonomy.
* **Final audit file**.

---

#### Task 5.0: Implement test infrastructure (full) and CI

**Stage:** plan
**Tags:** mvp, testing, ci, infrastructure

**Goal**
Upgrade the testing setup into a full, CI-backed test infrastructure.

**Scope**

* Refine Vitest configuration:

  * Coverage thresholds.
  * Watch mode for dev.
* Configure @vscode/test-electron for extension + e2e tests.
* Add GitHub Actions (or similar) CI pipeline:

  * Run unit tests.
  * Run integration tests.
  * Run extension/e2e tests on suitable matrix.
* Ensure `bun test` is the single entry point for local tests; CI calls it (or variants).

---

#### Task 5.1: Implement keyboard shortcuts and command palette entries (global)

**Stage:** plan
**Tags:** mvp, polish, shortcuts

**Goal**
Make common actions fast via keyboard and discoverable via the Command Palette.

**Scope**

* VS Code-level keybindings, for example:

  * Toggle board.
  * Focus Kanban2Code sidebar.
  * New task.
  * Copy XML for current task.
  * Mark implementation done.
* Expose commands:

  * `Kanban2Code: New Task`
  * `Kanban2Code: Copy XML for Current Task`
  * `Kanban2Code: Mark Implementation Done`
  * etc.
* Ensure global shortcuts and in-webview shortcuts (Phase 3.6) are consistent and non-conflicting.

---

#### Task 5.2: Improve error handling and logging

**Stage:** plan
**Tags:** mvp, polish, robustness

**Goal**
Make Kanban2Code resilient and transparent when things go wrong.

**Scope**

* Wrap filesystem operations with try/catch and user-facing messages.
* Write debug logs to a dedicated VS Code output channel.
* Ensure a single failing task does not break the whole UI.

---

#### Task 5.3: Dogfood Kanban2Code on the Kanban2Code project

**Stage:** plan
**Tags:** mvp, polish, dogfooding

**Goal**
Use Kanban2Code to manage its own development and validate the workflow end-to-end.

**Scope**

* Create `projects/kanban2code/_context.md`.
* Use roadmap tasks as real tasks:

  * Set stages, tags, agents.
* Use copy-with-context with your preferred models.
* Capture friction as new tasks.

---

#### Task 5.4: Polish how-it-works and project documentation

**Stage:** plan
**Tags:** mvp, docs, polish

**Goal**
Make it easy for you and AI agents to understand Kanban2Code.

**Scope**

* Refine `how-it-works.md`:

  * Emphasize Inbox-first philosophy.
  * Describe stage semantics.
  * Explain tag conventions.
* Update `architecture.md` to reflect reality.
* Update `project-details.md` with clear problem statement, users, success criteria.

---

#### Task 5.5: Validate MVP feature checklist and define post-v1 backlog

**Stage:** plan
**Tags:** mvp, roadmap, planning

**Goal**
Confirm that v1.0 matches the approved spec and define post-MVP work.

**Scope**

* Cross-check implemented features against MVP requirements.
* Mark missing/partial items as `post-v1` tasks.
* Create a follow-up roadmap or project (e.g. `projects/kanban2code-post-v1/`).

---

#### Task 5.6: Implement E2E tests for core workflows

**Stage:** plan
**Tags:** mvp, testing, e2e, workflows

**Goal**
Verify critical workflows end-to-end in a real VS Code environment.

**Scope**

* `tests/e2e/` using @vscode/test-electron:

  * Workspace scaffolding.
  * Task creation from sidebar and board.
  * Stage changes via drag-and-drop.
  * Copy XML context functionality.
  * Archive workflow.
  * Filter synchronization.
* Set up fixtures and cleanup.

---

#### Task 5.7: Define formal tag taxonomy and conventions

**Stage:** plan
**Tags:** mvp, docs, taxonomy

**Goal**
Establish a clear tagging system for tasks.

**Scope**

* Document tag taxonomy in `how-it-works.md`:

  * Scope: `mvp`, `post-v1`
  * Type: `bug`, `feature`, `spike`, `idea`, `roadmap`
  * Domain: `infra`, `ui`, `context`, `board`, `filesystem`
  * Priority: `urgent` (optional)
* Update task creation UI to:

  * Suggest tags.
  * Support autocomplete.
  * Visually distinguish categories.
* Extend filtering to use tag categories.

---

#### Task 5.8: Phase 5 audit & final sign-off

**Stage:** plan
**Tags:** audit, docs, testing

**Goal**
Confirm the MVP is complete, tested, and documented.

**Scope**

* Create `phase-5-polish-and-docs/phase-5-audit.md` including:

  * Checklist of tasks 5.0–5.7.
  * CI status and test coverage summary.
  * E2E tests overview and results.
  * Documentation status.
  * Final MVP checklist.
* Mark as “Checked” to confirm v1 is ready.

---

### Phase 6 – Bug Fixes and Feature Completion

*Location: [`phase-6-bugs-and-features/`](./phase-6-bugs-and-features/)*

This phase addresses critical bugs and implements remaining features from the original design specifications.

**Key Goals:**

* Fix delete button in Board view.
* Implement fixed color palette (Navy Night Gradient).
* Redesign swimlane layout (Rows = Stages, Columns = Projects).
* Add context file selection to Task Modal.
* Implement Context creation modal.
* Implement Agent selection and creation modal.
* Implement Template creation/editing modal.
* Add Monaco Editor for in-place task editing.
* **Phase audit file**.

---

#### Task 6.0: Fix delete button in Board view

**Stage:** plan
**Tags:** bug, board, mvp, p0

**Goal**
Fix the non-functional delete button on TaskCard components so tasks can be deleted directly from the Kanban board.

**Scope**

* Trace delete flow from TaskCard through Board to host messaging.
* Ensure `DeleteTask` message is sent with correct payload.
* Add/fix host-side handler to delete file and broadcast update.

---

#### Task 6.1: Implement fixed color palette

**Stage:** plan
**Tags:** feature, ui, mvp, p1

**Goal**
Replace VS Code theme-dependent CSS variables with a fixed "Navy Night Gradient" color palette for consistent appearance across all themes.

**Scope**

* Create `palette.css` with fixed color variables.
* Override VS Code theme variables.
* Apply Navy Night Gradient background.
* Update all components to use fixed palette.

---

#### Task 6.2: Fix swimlane layout

**Stage:** plan
**Tags:** bug, board, ui, mvp, p1

**Goal**
Redesign swimlane view so Rows = Stages and Columns = Projects, providing a matrix view of project progress.

**Scope**

* Update `BoardSwimlane.tsx` to render stage rows.
* Add project column headers.
* Update drag-and-drop to handle stage and/or project changes.
* Add sticky stage labels during horizontal scroll.

---

#### Task 6.3: Add context selection to Task Modal

**Stage:** plan
**Tags:** feature, ui, context, mvp, p1

**Goal**
Add multi-select context file picker to Task Modal, allowing users to select context files for AI agent prompts.

**Scope**

* Add context discovery service.
* Create `ContextPicker` component with checkboxes.
* Update Task Modal to include context section.
* Save selected contexts to task frontmatter.

---

#### Task 6.4: Implement Context creation modal

**Stage:** plan
**Tags:** feature, ui, context, mvp, p1

**Goal**
Implement modal for creating new context files following the design in `docs/design/forms/context.html`.

**Scope**

* Create `ContextModal` component with:
  * Name, scope, description fields.
  * File references picker.
  * Content textarea.
  * Metadata preview.
* Add host-side handler to create context file.

---

#### Task 6.5: Implement Agent selection and creation modal

**Stage:** plan
**Tags:** feature, ui, agent, mvp, p1

**Goal**
Add agent selection to Task Modal and implement Agent creation modal following `docs/design/forms/agent.html`.

**Scope**

* Add agent discovery service.
* Create `AgentPicker` dropdown component.
* Create `AgentModal` with:
  * Quick templates grid.
  * Name, description, instructions fields.
  * XML preview.
* Add host-side handler to create agent file.

---

#### Task 6.6: Implement Template creation/editing modal

**Stage:** plan
**Tags:** feature, ui, template, mvp, p2

**Goal**
Implement modal for creating and editing task templates with default values and placeholder support.

**Scope**

* Create `TemplateModal` component with:
  * Name, description fields.
  * Default stage and tags.
  * Content textarea with placeholders.
  * Preview section.
* Support both create and edit modes.
* Add host-side handlers.

---

#### Task 6.7: Implement Monaco Editor for task editing

**Stage:** plan
**Tags:** feature, ui, editor, mvp, p2

**Goal**
Embed Monaco Editor in a modal for in-place task editing without opening files externally.

**Scope**

* Install `@monaco-editor/react` package.
* Create `TaskEditorModal` component.
* Configure Monaco with markdown language and custom theme.
* Add save/cancel handling with dirty state tracking.
* Update TaskCard and context menus to use editor modal.

---

#### Task 6.8: Phase 6 audit & sign-off

**Stage:** plan
**Tags:** audit, docs, testing

**Goal**
Confirm all Phase 6 bug fixes and features are complete before production release.

**Scope**

* Create `phase-6-bugs-and-features/phase-6-audit.md` including:
  * Checklist of tasks 6.0–6.7.
  * Testing status summary.
  * Known issues and deferred items.
* Mark as "Checked" to confirm production readiness.

---

## Task Management & Workflow

Each task file includes:

* **Stage:** Current development stage (plan, code, audit, etc.).
* **Tags:** For categorization.
* **Title, Goal, Scope, Notes.**

Development workflow:

1. Start with **Phase 0**, complete tasks and the **Phase 0 audit file**.
2. Proceed phase by phase. Within a phase, tasks can be parallelized.
3. For any feature:

   * Implement logic/UI.
   * Add corresponding **unit tests** (and integration/e2e where applicable).
4. At the end of each phase:

   * Create/update the **phase audit file**.
   * Mark it as **checked** before starting the next phase.
5. Use Kanban2Code itself to manage these tasks (dogfooding in Phase 5).

## Post-MVP

After Phase 5, create a `projects/kanban2code-post-v1/` project for future features:

* Project templates.
* Agent presets.
* Batch operations.
* Advanced dependencies.
* Time tracking.
* Exports.
* Migrations from other systems.

---

If you’d like, I can also extract these changes into actual `.md` task files (with frontmatter) for your `.kanban2code` workspace.
