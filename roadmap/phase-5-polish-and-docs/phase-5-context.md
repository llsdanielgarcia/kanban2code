# Phase 5 Context: Polish and Docs

**Version**: 1.0
**Date**: 2025-12-12
**Status**: Planning → Implementation
**Target**: MVP-ready extension with comprehensive documentation and CI/CD

---

## Executive Summary

Phase 5 builds on the completed Phase 4 board webview to deliver a production-ready VS Code extension. This phase focuses on:

1. **Test Infrastructure**: Full unit, integration, and E2E test coverage with CI/CD
2. **Keyboard Navigation**: Global shortcuts and command palette integration
3. **Error Handling & Logging**: Robust error recovery and diagnostic logging
4. **Documentation**: User guides, architecture docs, and contribution guides
5. **MVP Validation**: Feature checklist completion and post-v1 backlog definition
6. **Polish**: UI refinements, performance optimization, and accessibility hardening

---

## Phase 4 Summary (Ready State)

### Completion Status ✅
- **Board webview** with columns and swimlane layouts
- **Drag-and-drop** stage transitions with validation
- **Filter sync** between sidebar and board
- **Follow-up tasks** via context menu
- **Component tests** (5 tests across 3 files)
- **No TypeScript errors** | **No runtime errors**

### Known Phase 4 Issues (Phase 5 Scope)
| Issue | Priority | Task |
|-------|----------|------|
| TaskCard missing hover actions | Medium | 5.1 Keyboard Shortcuts |
| Missing keyboard shortcuts (C, 1-5) | Medium | 5.1 Keyboard Shortcuts |
| No follow-up indicator on cards | Low | 5.4 Polish |
| Board header missing filter controls | Medium | 5.4 Polish |
| Sidebar search not implemented | Medium | 5.4 Polish |
| No task ordering in columns | Low | 5.4 Polish |
| No virtualization for 500+ tasks | Low | 5.4 Polish |

---

## Immutable Foundations from Previous Phases

### Core Type System (Phase 0-4)
```typescript
// From src/types/task.ts
interface Task {
  id: string;
  filePath: string;
  title: string;
  stage: 'inbox' | 'plan' | 'code' | 'audit' | 'completed';
  project?: string;
  phase?: string;
  agent?: string;
  parent?: string;
  tags?: string[];
  contexts?: string[];
  order?: number;
  created?: string;
  content: string;
}

// From src/core/constants.ts
export const STAGES = ['inbox', 'plan', 'code', 'audit', 'completed'];
export const KANBAN_FOLDER = '.kanban2code';
export const INBOX_FOLDER = 'inbox';
export const PROJECTS_FOLDER = 'projects';
export const ARCHIVE_FOLDER = '_archive';
```

### Message Protocol (Phase 1-4)
```typescript
interface MessageEnvelope<T> {
  version: 1;
  type: MessageType;
  payload: T;
}

// Message types remain immutable; new types can be added
type MessageType =
  // Host → Webview
  | 'InitState' | 'TaskUpdated' | 'TaskSelected' | 'FilterChanged' | 'TemplatesLoaded'
  // Webview → Host
  | 'RequestState' | 'CreateTask' | 'MoveTask' | 'MoveTaskToLocation'
  | 'ArchiveTask' | 'DeleteTask' | 'CopyContext' | 'OpenTask' | 'OpenBoard'
  | 'OpenSettings' | 'CreateKanban' | 'CreateProject' | 'TaskContextMenu'
  | 'RequestTemplates' | 'ALERT';
```

### Filesystem Structure (Immutable)
```
.kanban2code/
├── inbox/                    # Inbox stage tasks
├── projects/                 # Project containers
│   └── {project}/{phase}/    # Phase containers
├── _agents/                  # Agent definitions
├── _templates/
│   ├── stages/              # Stage templates (inbox, plan, code, audit, completed)
│   └── tasks/               # Task templates
├── _archive/                # Archived items
├── _context/                # Custom context files
├── how-it-works.md          # Layer 1: Global context
├── architecture.md
└── project-details.md
```

### 9-Layer Context System (Phase 2 - Immutable Order)
1. **Global Context**: `how-it-works.md` → `architecture.md` → `project-details.md`
2. **Agent Context**: `_agents/{agent}.md`
3. **Project Context**: `projects/{project}/_context.md`
4. **Phase Context**: `projects/{project}/{phase}/_context.md`
5. **Stage Template**: `_templates/stages/{stage}.md`
6. **Custom Contexts**: From `task.contexts[]`
7. **Task Metadata**: All frontmatter properties
8. **Task Content**: Markdown body
9. **System Wrapper**: XML structure

### Stage Transition Rules (Phase 1 - Immutable)
```
inbox → plan → code → audit → completed → (archive only)
```

---

## Phase 5 Task Breakdown

### Task 5.0: Test Infrastructure (Full and CI)

**File**: [task5.0_implement-test-infrastructure-full-and-ci.md](task5.0_implement-test-infrastructure-full-and-ci.md)
**Status**: Pending
**Deliverables**: Vitest config, @vscode/test-electron setup, CI integration (provider-specific)

#### Requirements Checklist

| Requirement | Dependencies | Notes |
|-------------|--------------|-------|
| Vitest coverage thresholds configured | Phase 4 tests | Target 70%+ coverage |
| Watch mode for development | Vitest config | `bun test --watch` |
| @vscode/test-electron configured | package.json | Extension e2e tests |
| CI workflow created (provider-specific) | package.json | Run on PR/push to main |
| CI matrix tested (Node versions, platforms) | @vscode/test-electron | Windows/Linux/Mac support |
| `bun test` is single entry point | All test suites | Local and CI use same command |
| Pre-commit hook for tests (optional) | husky setup | Lint + test before commit |

#### Testing Strategy

**Unit Tests** (existing 54 tests, target 80+ total):
- Core services: archive, context, copy, frontmatter, prompt-builder, scanner, stage-manager
- Utilities: text utilities, validation, state management
- Types: Task interface, constants, rules

**Integration Tests** (target 10+):
- File system operations (create, read, update, delete tasks)
- Stage transitions with validation
- Archive workflow (complete → archive)
- Context loading pipeline (9-layer assembly)

**Component Tests** (Phase 4: 5 tests, target 15+):
- Board rendering with filters
- TaskCard interactions (click, drag, keyboard)
- Column drop targets
- Sidebar tree navigation
- TaskModal creation

**E2E Tests** (target 5+):
- Open VS Code extension
- Create workspace → create task → move through stages
- Sidebar filter → Board sync
- Drag-and-drop stage change
- Copy context to clipboard

#### Success Criteria
```bash
✅ All tests pass locally: bun test
✅ Coverage report: 70%+ overall, 80%+ for critical paths
✅ CI pipeline: Green on PR (provider-specific)
✅ E2E tests: Pass on at least 2 platforms
✅ No flaky tests: 3 consecutive runs succeed
```

---

### Task 5.1: Keyboard Shortcuts and Command Palette

**File**: [task5.1_implement-keyboard-shortcuts-and-command-palette-entries-global.md](task5.1_implement-keyboard-shortcuts-and-command-palette-entries-global.md)
**Status**: Pending
**Deliverables**: Global keyboard shortcuts, command palette entries, keyboard help UI

#### Requirements Checklist

| Requirement | Component | Shortcut | Notes |
|-------------|-----------|----------|-------|
| Copy task context (full XML) | Board + Sidebar | `Ctrl+Shift+C` / `Cmd+Shift+C` | From Phase 2 copy service |
| Move task to stage | TaskCard | `1-5` | 1=plan, 2=code, 3=audit, 4=completed, 5=inbox |
| Open task file | TaskCard/TaskItem | `Enter` / `Space` | Existing in Phase 4 |
| Create new task | Board + Sidebar | `Ctrl+N` / `Cmd+N` | Opens TaskModal |
| Toggle layout (columns/swimlanes) | Board | `Ctrl+L` / `Cmd+L` | Existing; add shortcut |
| Search/filter | Board + Sidebar | `Ctrl+F` / `Cmd+F` | Focus board/sidebar search |
| Keyboard help | Global | `?` | Show shortcuts overlay |
| Command palette entries | Extension | Auto-registered | All major commands |

#### Phase 4 Dependencies
- **TaskCard.tsx**: Add keyboard event listeners for 1-5, C (copy), Enter (open)
- **Board.tsx**: Add keyboard handler for Ctrl+N, Ctrl+L, Ctrl+F
- **Sidebar.tsx**: Add keyboard handler for Ctrl+N, Ctrl+F
- **KeyboardHelp.tsx**: Expand from existing to show all shortcuts

#### Webview Keyboard Handlers

```typescript
// Add to Board.tsx and Sidebar.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'n') { e.preventDefault(); openTaskModal(); }
      if (e.key === 'f') { e.preventDefault(); focusSearch(); }
      if (e.key === 'l') { e.preventDefault(); toggleLayout(); }
      if (e.shiftKey && e.key === 'c') { e.preventDefault(); copyContext(); }
    }
    if (e.key === '?') { toggleKeyboardHelp(); }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [/* deps */]);
```

#### Command Palette Registration

```json
// package.json
{
  "commands": [
    {
      "command": "kanban2code.copyTaskContext",
      "title": "Kanban2Code: Copy Task Context (Full XML)"
    },
    {
      "command": "kanban2code.copyTaskOnly",
      "title": "Kanban2Code: Copy Task Only"
    },
    {
      "command": "kanban2code.copyContextOnly",
      "title": "Kanban2Code: Copy Context Only"
    },
    {
      "command": "kanban2code.openBoard",
      "title": "Kanban2Code: Open Board"
    },
    {
      "command": "kanban2code.newTask",
      "title": "Kanban2Code: New Task"
    },
    {
      "command": "kanban2code.toggleLayout",
      "title": "Kanban2Code: Toggle Board Layout"
    }
  ],
  "keybindings": [
    {
      "command": "kanban2code.copyTaskContext",
      "key": "ctrl+shift+c",
      "mac": "cmd+shift+c"
    },
    {
      "command": "kanban2code.newTask",
      "key": "ctrl+n",
      "mac": "cmd+n"
    }
  ]
}
```

#### Success Criteria
```bash
✅ All keyboard shortcuts work in sidebar and board
✅ Command palette lists all major commands
✅ Keyboard help overlay displays all shortcuts
✅ No conflicts with VS Code built-in shortcuts
✅ Tests verify keyboard event handling
```

---

### Task 5.2: Error Handling and Logging

**File**: [task5.2_improve-error-handling-and-logging.md](task5.2_improve-error-handling-and-logging.md)
**Status**: Pending
**Deliverables**: Centralized error handling, structured logging, error recovery UI

#### Requirements Checklist

| Layer | Component | Improvements | Dependencies |
|-------|-----------|--------------|--------------|
| **Extension Host** | extension.ts | Try-catch all commands; log to output channel | None |
| **Services** | All services (context, copy, stage-manager, etc.) | Throw typed errors; include context in messages | None |
| **Webview** | App.tsx + messaging | Catch message errors; display ALERT to user | messaging.ts |
| **Recovery** | Board + Sidebar | Show error banner; allow retry on UI errors | None |

#### Logging Strategy

**Output Channel**: `Kanban2Code` (user-visible in VS Code Output panel)

```typescript
// src/logging.ts (new file)
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  module: string;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

export class KanbanLogger {
  private output: vscode.OutputChannel;

  constructor() {
    this.output = vscode.window.createOutputChannel('Kanban2Code');
  }

  debug(module: string, message: string, context?: Record<string, any>) { }
  info(module: string, message: string, context?: Record<string, any>) { }
  warn(module: string, message: string, context?: Record<string, any>) { }
  error(module: string, message: string, error?: Error, context?: Record<string, any>) { }
}

export const logger = new KanbanLogger();
```

#### Error Recovery Flow

```
User Action (e.g., Drag-and-Drop)
  ↓
Try Service Operation
  ├─ Success: Update state, refresh UI
  └─ Error:
      ├─ Catch: Type error, build error message
      ├─ Log: Write to output channel + console
      └─ Display: Show error banner to user
         ├─ "Retry" button (re-run operation)
         └─ "Details" link (open output channel)
```

#### Error Types (TypeScript)

```typescript
// src/types/errors.ts
export class KanbanError extends Error {
  constructor(
    public module: string,
    message: string,
    public context?: Record<string, any>,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'KanbanError';
  }
}

export class FileSystemError extends KanbanError {
  constructor(filePath: string, operation: string, cause: Error) {
    super('FileSystem', `Failed to ${operation} ${filePath}`, { filePath, operation, cause: cause.message });
  }
}

export class StageTransitionError extends KanbanError {
  constructor(taskId: string, from: Stage, to: Stage) {
    super('StageManager', `Invalid transition ${from} → ${to}`, { taskId, from, to }, true);
  }
}
```

#### Success Criteria
```bash
✅ All service errors are typed and logged
✅ Webview displays user-friendly error messages
✅ Error banner includes "Retry" and "Details" options
✅ Output channel logs all operations with timestamp
✅ No unhandled promise rejections in console
✅ Tests verify error handling paths
```

---

### Task 5.3: Dogfood Kanban2Code on Kanban2Code

**File**: [task5.3_dogfood-kanban2code-on-the-kanban2code-project.md](task5.3_dogfood-kanban2code-on-the-kanban2code-project.md)
**Status**: Pending
**Deliverables**: Kanban2Code workspace for tracking Phase 5 work, real-world feedback

#### Requirements

- Initialize `.kanban2code/` in project root with all Phase 5 tasks
- Create 5 agents (opus, sonnet, haiku, user, reviewer)
- Define 3 projects: `Extension`, `Docs`, `Infrastructure`
- Move Phase 5 tasks from roadmap → inbox → plan → code → etc.
- Document workflow in `how-it-works.md`
- Capture real-world feedback on UX friction points

#### Expected Insights

1. **Usability**: Which shortcuts are missing? Which workflows are slow?
2. **Performance**: How does the extension handle real task counts (50+ tasks)?
3. **Documentation**: What docs are needed for users?
4. **Accessibility**: Are keyboard navigation and ARIA labels sufficient?

#### Success Criteria
```bash
✅ .kanban2code/ workspace initialized with Phase 5 tasks
✅ At least 3 tasks moved through full stage pipeline
✅ At least 1 follow-up task created from parent task
✅ Feedback collected: UX issues, missing features
✅ Issues logged for Phase 5.4 (Polish) and post-v1 backlog
```

---

### Task 5.4: Polish (UI, Docs, Performance)

**File**: [task5.4_polish-how-it-works-and-project-documentation.md](task5.4_polish-how-it-works-and-project-documentation.md)
**Status**: Pending
**Deliverables**: User docs, architecture diagrams, UI polish, performance optimization

#### 5.4.1 Documentation

**Target Audience**: Users, contributors, AI agents

**Files to Create/Update**:
1. **README.md** (User-facing guide)
   - Installation instructions
   - Quick start (create workspace, create task, open board)
   - Feature overview
   - Troubleshooting

2. **docs/USER_GUIDE.md** (Comprehensive user guide)
   - Sidebar navigation
   - Board views (columns vs swimlanes)
   - Filtering and search
   - Keyboard shortcuts
   - Context menu operations
   - Creating tasks and follow-ups
   - Copy modes (full XML, task only, context only)

3. **docs/architecture.md** (Update Phase 4 sections)
   - Phase 5 additions: keyboard, error handling, logging
   - E2E test architecture
   - Performance considerations
   - Extension lifecycle diagram

4. **docs/CONTRIBUTING.md** (Contributor guide)
   - Local dev setup (Bun, TypeScript, esbuild)
   - Running tests and CI locally
   - Adding new features (checklist)
   - Code style guidelines (Prettier, ESLint)
   - PR process

5. **ROADMAP.md** (Update to include Phase 5)
   - Completed phases (0-5)
   - Post-v1 backlog
   - Known limitations
   - Future directions

6. **.kanban2code/how-it-works.md** (Workspace guide)
   - Folder structure
   - Task properties (tags, agent, parent, order)
   - Stage descriptions (inbox → completed)
   - Copy to clipboard workflow
   - Agent context system

#### 5.4.2 UI Polish

**Phase 4 Known Issues to Fix**:

| Issue | Component | Fix |
|-------|-----------|-----|
| Missing hover actions | TaskCard | Add copy, open, delete buttons on hover (use Ctrl+Shift+C, Enter, Delete) |
| No follow-up indicator | TaskCard | Show badge "↗ N follow-ups" if task has children |
| Missing footer (date, assignee) | TaskCard | Display created date and agent assignment |
| No board filter controls | BoardHeader | Add project dropdown, stage chips, tag multi-select |
| Sidebar search not wired | Sidebar | Connect search input to filter state |
| No task reordering | Column | Allow drag within column to set `order` field |

**Minor Enhancements**:
- Improve empty state messages (suggest creating task)
- Add task count badges to project tree
- Add visual indication for parent tasks (icon + count)
- Improve visual feedback for drag-and-drop (ghost image, drop zones)
- Consistent loading states (spinners, skeletons)

#### 5.4.3 Performance Optimization

**Targets** (from Phase 4 TODOs):

| Goal | Implementation | Target |
|------|----------------|--------|
| Virtualization for 500+ tasks | React-window or react-virtual | Render only visible tasks |
| Memoization of expensive renders | React.memo, useMemo | Prevent TaskCard re-renders on filter change |
| Lazy-load context files | Context service | Only load when copy is triggered |
| Debounce search input | useCallback + debounce | No re-render on every keystroke |
| CSS optimization | Use CSS classes instead of inline styles | Reduce bundle size |

**Benchmarks**:
- Initial board load: < 500ms for 100 tasks
- Filter change: < 100ms for column re-group
- Drag-and-drop: 60 FPS (no janking)
- Search input: 16ms per keystroke (no lag)

#### Success Criteria
```bash
✅ README.md covers installation, quick start, features
✅ docs/USER_GUIDE.md is comprehensive (1000+ words)
✅ docs/CONTRIBUTING.md is complete
✅ docs/architecture.md is updated with Phase 5
✅ Roadmap reflects all completed phases
✅ All Phase 4 UI issues are fixed
✅ Performance benchmarks met (500ms, 100ms, 60fps, 16ms)
✅ No accessibility violations (axe-core scan)
```

---

### Task 5.5: MVP Feature Checklist and Post-v1 Backlog

**File**: [task5.5_validate-mvp-feature-checklist-and-define-post-v1-backlog.md](task5.5_validate-mvp-feature-checklist-and-define-post-v1-backlog.md)
**Status**: Pending
**Deliverables**: MVP validation, post-v1 feature list, release notes

#### MVP Feature Checklist

| Feature | Phase | Status | Notes |
|---------|-------|--------|-------|
| **Core Kanban** | | | |
| 5-stage pipeline (inbox/plan/code/audit/completed) | Phase 1 | ✅ | Immutable, validated |
| Filesystem-based tasks (markdown + YAML frontmatter) | Phase 1 | ✅ | All properties preserved |
| Stage transitions (forward-only) | Phase 1 | ✅ | Validation rules enforced |
| Archive workflow | Phase 1 | ✅ | Completed → archive |
| **Sidebar UI** | Phase 3 | ✅ | All features complete |
| Hierarchical task tree (inbox/projects/phases) | Phase 3 | ✅ | Keyboard navigable |
| Multi-dimensional filters (stage, project, tags) | Phase 3 | ✅ | Real-time sync |
| Task creation modal with templates | Phase 3 | ✅ | Agent + context support |
| Context menus (move, archive, copy, delete) | Phase 3 | ✅ | Full keyboard support |
| **Board Webview** | Phase 4 | ✅ | All features complete |
| Columns layout (5 stages) | Phase 4 | ✅ | Persisted preference |
| Swimlane layout (project/phase rows) | Phase 4 | ✅ | Alternative view |
| Drag-and-drop stage changes | Phase 4 | ✅ | Validation + visual feedback |
| Filter sync with sidebar | Phase 4 | ✅ | Real-time updates |
| Follow-up task creation | Phase 4 | ✅ | Parent relationship tracking |
| **Context System** | Phase 2 | ✅ | All 9 layers complete |
| 9-layer context assembly | Phase 2 | ✅ | Immutable order |
| XML prompt builder | Phase 2 | ✅ | AI-ready format |
| Copy modes (full, task-only, context-only) | Phase 2 | ✅ | Clipboard integration |
| Stage templates | Phase 2 | ✅ | Context at stage level |
| **Testing & Quality** | Phase 5 | ✅ | Comprehensive coverage |
| Unit tests (70%+ coverage) | Phase 5 | ✅ | All core services |
| Component tests | Phase 4-5 | ✅ | Board, sidebar, modal |
| E2E tests | Phase 5 | ✅ | Core workflows |
| CI/CD pipeline | Phase 5 | ✅ | Provider-specific |
| **Documentation** | Phase 5 | ✅ | User + contributor guides |
| User guide | Phase 5 | ✅ | Installation, features, how-to |
| Architecture docs | Phase 5 | ✅ | System design |
| Contributor guide | Phase 5 | ✅ | Dev setup, PR process |
| **Polish** | Phase 5 | ✅ | UI refinements |
| Keyboard shortcuts | Phase 5 | ✅ | Global + command palette |
| Error handling & logging | Phase 5 | ✅ | Graceful failures |
| Performance optimization | Phase 5 | ✅ | 500+ tasks support |

#### Post-v1 Backlog

**High Priority** (v1.1 candidate):
1. Task history / undo-redo
2. Team collaboration (shared .kanban2code)
3. Recurring tasks
4. Custom stages (beyond default 5)
5. AI agent commands (from command palette)

**Medium Priority** (v1.2-1.5):
1. Task templates (project-specific)
2. Notification system (task assigned, milestone due)
3. Time tracking (estimated vs actual)
4. Burndown charts
5. Report generation (weekly summary, etc.)

**Low Priority** (Future):
1. Cloud sync (GitHub, Notion integration)
2. Mobile companion app
3. VSCode settings UI (theme, behavior customization)
4. Extension marketplace (task packs, themes)
5. Collaborative board annotations

#### Success Criteria
```bash
✅ MVP checklist 100% complete (all marked ✅)
✅ No critical bugs remaining
✅ All tests passing
✅ Documentation complete
✅ Performance benchmarks met
✅ Post-v1 backlog prioritized and groomed
✅ Release notes drafted
```

---

### Task 5.6: E2E Tests for Core Workflows

**File**: [task5.6_implement-e2e-tests-for-core-workflows.md](task5.6_implement-e2e-tests-for-core-workflows.md)
**Status**: Pending
**Deliverables**: @vscode/test-electron test suite, core workflow coverage

#### E2E Test Scenarios

**Workflow 1: Workspace Creation and Task**
```gherkin
Given VS Code is open
When user runs "Kanban2Code: Initialize Workspace"
Then .kanban2code folder is created with default structure
And user sees "Kanban2Code: Open Board" command available
When user creates a new task "Fix login bug" in inbox
Then task appears in sidebar inbox
And task appears in board inbox column
```

**Workflow 2: Task Stage Progression**
```gherkin
Given a task "Fix login bug" exists in inbox
When user drags task to "plan" column
Then task is moved to plan stage (file updated)
And sidebar shows task in plan section
When user transitions task through code → audit → completed
Then task ends up in completed column
And can be archived from completed
```

**Workflow 3: Filter and Search Sync**
```gherkin
Given board and sidebar are both open
When user filters sidebar by project "Extension"
Then board shows only tasks from Extension project
When user searches board header for "login"
Then board shows only tasks matching "login"
When sidebar filter changes, board updates in real-time
```

**Workflow 4: Copy Context to Clipboard**
```gherkin
Given a task with context files exists
When user right-clicks task and selects "Copy Context (Full XML)"
Then task, agent context, project context, and global context assembled
And full XML prompt copied to clipboard
When user opens an editor and pastes, XML is valid
```

**Workflow 5: Follow-up Task Creation**
```gherkin
Given a task "Implement auth" in "Code" stage
When user right-clicks and selects "Add Follow-up in Inbox"
And creates follow-up "Test auth flows"
Then follow-up appears in inbox
And has parent reference to "Implement auth"
And appears as child under parent in sidebar tree
```

**Workflow 6: Task Keyboard Navigation**
```gherkin
Given sidebar is focused with task item selected
When user presses arrow keys, other tasks are focused
When user presses Enter, task opens
When user presses C, context is copied
When user presses Ctrl+N, new task modal opens
```

#### Test Implementation

**Test Framework**: `@vscode/test-electron`
**Test Runner**: Vitest
**Browser Automation**: Webdriver-like access to VS Code API

```typescript
// tests/e2e/core-workflows.test.ts
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import * as vscode from 'vscode';

describe('E2E: Core Workflows', () => {
  let extension: vscode.Extension<any>;

  beforeAll(async () => {
    extension = vscode.extensions.getExtension('cynic.kanban2code');
    expect(extension).toBeDefined();
    await extension?.activate();
  });

  it('should create workspace and initialize board', async () => {
    await vscode.commands.executeCommand('kanban2code.initWorkspace');
    // Assert .kanban2code folder exists
    // Assert folders created (inbox, projects, _agents, _templates, _archive)
  });

  it('should move task through stage pipeline', async () => {
    // Create task in inbox
    // Verify file and state
    // Move to plan via messaging
    // Verify board updates
    // Continue through audit → completed
  });

  // More tests...
});
```

#### Success Criteria
```bash
✅ 5+ E2E workflows fully automated
✅ Tests pass on Windows, Linux, Mac
✅ Can run locally: bun run test:e2e
✅ CI runs E2E tests on PR (optional: can be slow)
✅ No flaky tests (3 consecutive runs pass)
```

---

### Task 5.7: Tag Taxonomy and Conventions

**File**: [task5.7_define-formal-tag-taxonomy-and-conventions.md](task5.7_define-formal-tag-taxonomy-and-conventions.md)
**Status**: Pending
**Deliverables**: Tag taxonomy, usage conventions, validation rules

#### Tag Categories

**Type Tags** (Mutually Exclusive - Pick 1):
- `feature` - New capability
- `bug` - Defect fix
- `spike` - Research / exploration
- `refactor` - Code improvement without behavior change
- `docs` - Documentation only
- `test` - Test infrastructure
- `chore` - Maintenance, no user impact

**Priority Tags** (Recommended - Pick 1):
- `p0` / `critical` - Blocks release or breaks core functionality
- `p1` / `high` - Important but not blocking
- `p2` / `medium` - Nice to have
- `p3` / `low` - Polish or future consideration

**Status Tags** (Informational):
- `blocked` - Waiting on external blocker
- `in-progress` - Active work (assign to agent)
- `review` - Waiting for code review
- `approved` - Design/requirements signed off
- `shipped` - Released in version X.Y

**Domain Tags** (Multiple OK):
- `mvp` - Required for v1.0 release
- `accessibility` - WCAG compliance
- `performance` - Speed or memory optimization
- `security` - Security fix or hardening
- `ci` - CI/CD infrastructure
- `docs` - Documentation

**Component Tags** (Multiple OK):
- `sidebar` - Sidebar webview component
- `board` - Board webview component
- `messaging` - Extension ↔ webview communication
- `keyboard` - Keyboard navigation or shortcuts
- `filters` - Filtering and search
- `context` - Context system (9-layer)
- `copy` - Copy-to-clipboard functionality
- `archive` - Archive workflow
- `test` - Test infrastructure

#### Validation Rules

```typescript
// src/types/filters.ts
export const TAG_TAXONOMY = {
  type: ['feature', 'bug', 'spike', 'refactor', 'docs', 'test', 'chore'],
  priority: ['p0', 'critical', 'p1', 'high', 'p2', 'medium', 'p3', 'low'],
  status: ['blocked', 'in-progress', 'review', 'approved', 'shipped'],
  domain: ['mvp', 'accessibility', 'performance', 'security', 'ci', 'docs'],
  component: ['sidebar', 'board', 'messaging', 'keyboard', 'filters', 'context', 'copy', 'archive', 'test'],
};

// Rule: Tasks with 'blocked' must have a comment explaining blocker
// Rule: Tasks with 'shipped' should have version tag (v1.0, v1.1, etc.)
// Rule: MVP tasks must be resolved before v1.0 release
```

#### Usage Examples

**Phase 5 Task Example**:
```markdown
# Implement Keyboard Shortcuts

---
stage: plan
tags: [feature, mvp, keyboard, sidebar, board]
agent: sonnet
---

Implement Ctrl+N, Ctrl+Shift+C, 1-5 shortcuts globally.
```

**Bug Task Example**:
```markdown
# TaskCard missing hover actions

---
stage: plan
tags: [bug, p1, high, board]
parent: task-5-1-keyboard-shortcuts
---

Copy, open, delete buttons not visible on hover.
```

#### Success Criteria
```bash
✅ Tag taxonomy documented
✅ Validation rules implemented (TSDoc, comments)
✅ All Phase 5 tasks use consistent tags
✅ MVP checklist uses 'mvp' tag consistently
✅ Post-v1 backlog uses 'shipped' version tags
✅ Filters UI supports tag multi-select
```

---

### Task 5.8: Phase 5 Audit and Final Sign-Off

**File**: [task5.8_phase-5-audit-and-final-sign-off.md](task5.8_phase-5-audit-and-final-sign-off.md)
**Status**: Pending
**Deliverables**: Phase 5 completion audit, MVP sign-off, release readiness

#### Audit Checklist

**Code Quality**:
- [ ] All tests pass (unit, integration, E2E)
- [ ] Coverage ≥70% overall, ≥80% critical paths
- [ ] No TypeScript errors or warnings
- [ ] No ESLint errors or warnings
- [ ] No console errors or warnings in webview
- [ ] No unhandled promise rejections

**Documentation**:
- [ ] README.md complete and user-friendly
- [ ] USER_GUIDE.md comprehensive (1000+ words)
- [ ] CONTRIBUTING.md complete with dev setup
- [ ] docs/architecture.md updated with Phase 5
- [ ] ROADMAP.md reflects all phases and backlog
- [ ] All code has JSDoc comments for public APIs
- [ ] No broken links in docs

**Features**:
- [ ] All Phase 5 tasks completed (5.0-5.7)
- [ ] MVP feature checklist 100% complete
- [ ] All Phase 4 known issues resolved
- [ ] Keyboard shortcuts working (8+ shortcuts)
- [ ] Error handling and logging functional
- [ ] Performance benchmarks met (500ms, 100ms, 60fps)
- [ ] Accessibility (axe-core) passing

**Testing**:
- [ ] Unit tests: 80+ tests, 70%+ coverage
- [ ] Component tests: 15+ tests (sidebar, board, modal)
- [ ] Integration tests: 10+ tests (filesystem, context)
- [ ] E2E tests: 5+ workflow tests
- [ ] CI pipeline: Green on PR/push
- [ ] No flaky tests (3 consecutive runs pass)

**Polish**:
- [ ] All Phase 4 UI issues fixed
- [ ] Consistent visual design (navy night theme)
- [ ] Responsive layout (sidebar width)
- [ ] Consistent error messages
- [ ] Loading states visible
- [ ] Empty states helpful

**Release**:
- [ ] CHANGELOG.md created (v1.0.0)
- [ ] Version bumped in package.json
- [ ] Extension metadata (name, icon, description) finalized
- [ ] License file present (MIT or similar)
- [ ] Contributing guide linked in README

#### Sign-Off Decision Matrix

| Criterion | Status | Owner | Notes |
|-----------|--------|-------|-------|
| Core functionality | ✅ | Dev | All 5 stages, drag-drop, filters |
| Webview quality | ✅ | Dev | Board, sidebar, modals working |
| Test coverage | ✅ | QA | 70%+ coverage, E2E passing |
| Documentation | ✅ | Dev | README, guides, architecture |
| Accessibility | ⚠️ | QA | axe-core scan, keyboard nav |
| Performance | ⚠️ | Dev | 500+ tasks, benchmark targets |

#### Release Notes Template

```markdown
# Kanban2Code v1.0.0 - MVP Release

## What's New

### Board Webview
- [NEW] Full Kanban board with columns and swimlane layouts
- [NEW] Drag-and-drop stage transitions with validation
- [NEW] Real-time filter sync between sidebar and board

### Keyboard Navigation
- [NEW] Global keyboard shortcuts (Ctrl+N, Ctrl+Shift+C, 1-5)
- [NEW] Command palette integration for all major actions
- [NEW] Keyboard help overlay (Press ?)

### Error Handling
- [NEW] User-friendly error messages with recovery options
- [NEW] Structured logging to Output channel
- [NEW] Graceful error recovery

### Documentation
- [NEW] User guide with feature overview
- [NEW] Contributor guide for developers
- [NEW] Complete architecture documentation

## Bug Fixes
- Fixed TaskCard missing hover actions
- Fixed sidebar search implementation
- Fixed board header filter controls

## Known Limitations
- No task reordering within columns (order field unused)
- No virtualization for 500+ task workspaces
- No follow-up indicator on parent cards

## Breaking Changes
- None (v1.0 is MVP)

## Contributors
- Claude Code (AI)
- [User name]

**Download**: [VS Code Marketplace](#)
**Documentation**: [User Guide](docs/USER_GUIDE.md)
**Report Bugs**: [GitHub Issues](#)
```

#### Success Criteria
```bash
✅ Audit checklist 100% complete
✅ All sign-off owners approve
✅ Release notes published
✅ Version bumped to 1.0.0
✅ Extension ready for marketplace submission
✅ No known critical bugs
✅ Performance acceptable (100+ tasks tested)
```

---

## Component Inventory

### Webview Components (Phase 4-5)

**Board View**:
| Component | File | Purpose | Phase |
|-----------|------|---------|-------|
| Board | Board.tsx | Main container, filtering, grouping | 4 |
| BoardHeader | BoardHeader.tsx | Search, layout toggle, new task | 4 |
| LayoutToggle | LayoutToggle.tsx | Columns/swimlanes toggle | 4 |
| BoardHorizontal | BoardHorizontal.tsx | Columns layout wrapper | 4 |
| BoardSwimlane | BoardSwimlane.tsx | Swimlane layout wrapper | 4 |
| Column | Column.tsx | Stage column with drop zone | 4 |
| Swimlane | Swimlane.tsx | Project row with mini-columns | 4 |
| TaskCard | TaskCard.tsx | Draggable card (enhanced 5.1, 5.4) | 4-5 |

**Sidebar View** (Phase 3, unchanged):
| Component | File | Purpose |
|-----------|------|---------|
| Sidebar | Sidebar.tsx | Main container |
| SidebarToolbar | SidebarToolbar.tsx | Top bar with title |
| SidebarActions | SidebarActions.tsx | Action buttons |
| TaskTree | TaskTree.tsx | Hierarchical tree |
| TreeSection | TreeSection.tsx | Inbox/Projects sections |
| TreeNode | TreeNode.tsx | Project/phase node |
| TaskItem | TaskItem.tsx | Task list item |
| FilterBar | FilterBar.tsx | Project/tag filters |
| QuickFilters | QuickFilters.tsx | Stage chips |
| QuickViews | QuickViews.tsx | Preset filters |
| TaskModal | TaskModal.tsx | Create task modal |
| TaskContextMenu | TaskContextMenu.tsx | Right-click menu |
| MoveModal | MoveModal.tsx | Task move location picker |

**Shared** (Phase 3-4):
| Component | File | Purpose |
|-----------|------|---------|
| ContextMenu | ContextMenu.tsx | Reusable menu |
| EmptyState | EmptyState.tsx | No workspace state |
| Icons | Icons.tsx | Icon library |
| KeyboardHelp | KeyboardHelp.tsx | Shortcuts overlay (enhanced 5.1) |

### Hooks (Phase 3-5)

| Hook | File | Purpose | Phase |
|------|------|---------|-------|
| useTaskData | useTaskData.ts | Task loading and filtering | 3 |
| useFilters | useFilters.ts | Filter state management | 3 |
| useKeyboard | useKeyboard.ts | Keyboard navigation (enhanced 5.1) | 3-5 |
| useBoardLayout | useBoardLayout.ts | Board layout preference | 4 |

### Services (Phase 1-5, No Changes to Phase 5)

**Core Services** (Unchanged):
- archive.ts - Archive operations
- context.ts - 9-layer context loading
- copy.ts - Clipboard integration
- frontmatter.ts - YAML parsing
- prompt-builder.ts - XML assembly
- scanner.ts - Task discovery
- stage-manager.ts - Stage transitions
- task-watcher.ts - File monitoring
- template.ts - Template loading

**Phase 5 New Services**:
- logging.ts - Structured logging (Task 5.2)
- error-recovery.ts - Error handling (Task 5.2)

### Test Files

**Phase 4 (Existing)**:
- tests/webview/board.test.tsx
- tests/webview/taskcard.test.tsx
- tests/webview/column.test.tsx

**Phase 5 (New)**:
- tests/webview/keyboard.test.ts (Task 5.1)
- tests/webview/error-recovery.test.ts (Task 5.2)
- tests/e2e/core-workflows.test.ts (Task 5.6)
- tests/unit/logging.test.ts (Task 5.2)

---

## Dependency Graph

```
Phase 0 (Foundation)
  ├─ Types, constants, messaging protocol
  └─ Extension skeleton, webview setup

Phase 1 (Filesystem)
  ├─ Task parsing, stage-manager, archive
  ├─ Workspace validation
  └─ Depends on Phase 0

Phase 2 (Context System)
  ├─ 9-layer context, prompt builder, copy service
  └─ Depends on Phase 1

Phase 3 (Sidebar UI)
  ├─ Sidebar webview, task tree, filters, modal
  ├─ Keyboard navigation
  └─ Depends on Phase 0, 1, 2

Phase 4 (Board Webview) ✅
  ├─ Board webview, drag-drop, layout toggle
  ├─ Filter sync with sidebar
  ├─ Component tests (5 tests)
  └─ Depends on Phase 0, 1, 2, 3

Phase 5 (Polish and Docs) 🚧
  ├─ Task 5.0: Test infrastructure (unit, integration, E2E, CI)
  ├─ Task 5.1: Keyboard shortcuts and command palette
  ├─ Task 5.2: Error handling and logging
  ├─ Task 5.3: Dogfood on Kanban2Code
  ├─ Task 5.4: UI polish and performance
  ├─ Task 5.5: MVP validation
  ├─ Task 5.6: E2E tests
  ├─ Task 5.7: Tag taxonomy
  ├─ Task 5.8: Final sign-off
  └─ Depends on Phase 0, 1, 2, 3, 4 (all prerequisites complete)
```

---

## Known Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| E2E tests flaky due to timing | Medium | Delays CI | Use proper waits, retry logic |
| Performance degrades with 500+ tasks | Low | Release blocker | Implement virtualization (Phase 5.4) |
| Keyboard shortcuts conflict with VS Code | Low | User friction | Document conflicts, provide customization |
| Error handling masks real bugs | Medium | Debug friction | Log full stack traces to output channel |
| Accessibility fails (axe-core) | Medium | Compliance issue | Fix ARIA labels, keyboard nav early |

---

## Success Metrics (v1.0)

- **Functionality**: 100% MVP checklist complete
- **Quality**: 70%+ test coverage, 0 critical bugs
- **Performance**: <500ms load, <100ms filter, 60 FPS drag
- **Documentation**: README, user guide, architecture, contributing
- **Release**: Published to VS Code marketplace
- **User Feedback**: 4.0+ stars, <5 critical issues reported

---

## Getting Started (Phase 5 Implementation)

### Prerequisites
```bash
# From Phase 0-4
- Bun (runtime)
- TypeScript (language)
- esbuild (bundler)
- Vitest (test runner)
- React (webview framework)
- Gray-matter (frontmatter parsing)

# Phase 5 new
- @vscode/test-electron (E2E tests)
- CI (provider-specific)
```

### Development Checklist
1. **Setup**: `bun install`, `bun run compile`
2. **Test**: `bun run test` (all tests passing)
3. **Lint**: `bun run lint` (no errors)
4. **Build**: `bun run build` (extension bundle ready)
5. **Test Extension**: Run in VS Code Extension Host

### Adding a Feature
1. Read this phase-5-context.md
2. Identify task (5.0-5.8)
3. Create feature branch
4. Implement with tests
5. Update docs
6. Dogfood in .kanban2code workspace
7. PR review and merge

---

## File Tree (Phase 5 Ready)

```
src/
├── extension.ts                        # Enhanced with error handling, logging
├── commands/index.ts                   # Phase 5.1: Keyboard shortcuts registered
├── core/
│   ├── constants.ts                   # STAGES, folders (unchanged)
│   └── rules.ts                       # Transition validation (unchanged)
├── services/
│   ├── archive.ts, context.ts, ...   # All existing (unchanged)
│   ├── logging.ts                     # NEW: Phase 5.2
│   └── error-recovery.ts              # NEW: Phase 5.2
├── types/
│   └── filters.ts                     # NEW: Phase 5.7 tag taxonomy
├── webview/
│   ├── KanbanPanel.ts                # Unchanged, wired for new features
│   ├── SidebarProvider.ts            # Unchanged, wired for new features
│   ├── messaging.ts                  # Unchanged, protocol immutable
│   └── ui/
│       ├── App.tsx                   # Unchanged
│       ├── vscodeApi.ts              # Unchanged
│       ├── components/
│       │   ├── Board.tsx             # Enhanced 5.1, 5.4
│       │   ├── TaskCard.tsx          # Enhanced 5.1, 5.4 (hover, keyboard)
│       │   ├── BoardHeader.tsx       # Enhanced 5.4 (filter controls)
│       │   ├── KeyboardHelp.tsx      # Enhanced 5.1 (expanded shortcuts)
│       │   └── ... (others unchanged)
│       ├── hooks/
│       │   ├── useKeyboard.ts        # Enhanced 5.1 (global shortcuts)
│       │   └── ... (others unchanged)
│       └── styles/main.css           # Enhanced 5.4 (performance, polish)
└── workspace/
    ├── state.ts                      # Unchanged
    └── validation.ts                 # Unchanged

tests/
├── webview/
│   ├── board.test.tsx, taskcard.test.tsx, column.test.tsx  # Phase 4
│   ├── keyboard.test.ts              # NEW: Phase 5.1
│   └── error-recovery.test.ts        # NEW: Phase 5.2
├── e2e/
│   └── core-workflows.test.ts        # NEW: Phase 5.6
├── unit/
│   ├── logging.test.ts               # NEW: Phase 5.2
│   └── ... (all existing)
└── ... (all Phase 0-4 tests)

docs/
├── architecture.md                    # Updated: Phase 5.4
├── USER_GUIDE.md                     # NEW: Phase 5.4
├── CONTRIBUTING.md                   # NEW: Phase 5.4
└── design/                           # Unchanged (Phase 3 design system)

.kanban2code/                         # NEW: Phase 5.3 (dogfood workspace)
├── inbox/, projects/, _agents/       # Initialized with Phase 5 tasks
├── _templates/stages/                # Stage templates (Phase 2)
├── how-it-works.md                   # Workspace guide (Phase 5.3)
└── ... (standard structure)

package.json                          # Phase 5.1: Keywords, scripts, keybindings
CHANGELOG.md                          # NEW: Phase 5.8
ROADMAP.md                            # Updated: All phases, backlog
README.md                             # Enhanced: Phase 5.4
CI workflow (provider-specific)       # NEW: Phase 5.0 CI/CD
```

---

## References

**Previous Phase Audits**:
- Phase 0: [phase-0-foundation/phase-0-audit.md](../../phase-0-foundation/phase-0-audit.md)
- Phase 1: [phase-1-filesystem-and-tasks/phase-1-audit.md](../../phase-1-filesystem-and-tasks/phase-1-audit.md)
- Phase 2: [phase-2-context-system/phase-2-audit.md](../../phase-2-context-system/phase-2-audit.md)
- Phase 3: [phase-3-sidebar-ui/phase-3-audit.md](../../phase-3-sidebar-ui/phase-3-audit.md)
- Phase 4: [phase-4-board-webview/phase-4-audit.md](../../phase-4-board-webview/phase-4-audit.md)

**Architecture Docs**:
- [docs/architecture.md](../../docs/architecture.md) - System overview
- [roadmap/roadmap_context.md](../roadmap_context.md) - Cross-phase context

**Key Files**:
- [src/types/task.ts](../../src/types/task.ts) - Task interface
- [src/core/constants.ts](../../src/core/constants.ts) - Immutable constants
- [src/webview/messaging.ts](../../src/webview/messaging.ts) - Message protocol
- [package.json](../../package.json) - Dependencies and scripts

---

## Document Control

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2025-12-12 | 1.0 | Claude Code | Initial Phase 5 context document |

**Last Updated**: 2025-12-12
**Status**: Ready for Phase 5 Implementation
**Next Step**: Task 5.0 — Implement Test Infrastructure
