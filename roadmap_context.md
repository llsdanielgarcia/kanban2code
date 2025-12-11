# Kanban2Code Roadmap Context

## Project Mission Statement

Kanban2Code is a VS Code extension that brings Kanban board functionality directly into the editor, integrating AI agents and rich task context. The project streamlines task management for developers by providing a visual workflow system that seamlessly integrates with the coding environment using filesystem-based task storage with markdown frontmatter.

## Canonical File Tree

```
.kanban2code/                          # Kanban root (immutable location)
├── inbox/                             # Inbox stage tasks (*.md)
├── projects/                          # Project containers
│   ├── {project}/                    # Project directory
│   │   ├── _context.md               # Project-level context (Layer 3)
│   │   ├── {phase}/                  # Phase directory (optional)
│   │   │   ├── _context.md           # Phase-level context (Layer 4)
│   │   │   └── *.md                  # Phase tasks
│   │   └── *.md                      # Direct project tasks
├── _agents/                           # Agent definitions (Layer 2)
│   ├── opus.md
│   ├── sonnet.md
│   └── codex.md
├── _templates/                        # Template system
│   ├── stages/                        # Stage templates (Layer 5)
│   │   ├── inbox.md
│   │   ├── plan.md
│   │   ├── code.md
│   │   ├── audit.md
│   │   └── completed.md
│   └── tasks/                         # Task templates
│       ├── bug.md
│       ├── feature.md
│       └── spike.md
├── _archive/                          # Archived items (immutable structure)
│   ├── inbox/
│   └── projects/
├── how-it-works.md                    # Global workflow (Layer 1)
├── architecture.md                    # System architecture (Layer 1)
└── project-details.md                 # Project details (Layer 1)

src/                                   # Source code (immutable structure)
├── extension.ts                       # Main entry point
├── assets/templates.ts               # Template definitions
├── commands/index.ts                 # Command registration
├── core/
│   ├── constants.ts                  # STAGES, folder constants
│   └── rules.ts                      # Business rules
├── services/                         # Core services
│   ├── archive.ts                    # Archive operations
│   ├── context.ts                    # 9-layer context loading
│   ├── copy.ts                       # Clipboard integration
│   ├── frontmatter.ts                # Task parsing/serialization
│   ├── prompt-builder.ts             # XML prompt assembly
│   ├── scanner.ts                    # Task discovery
│   ├── stage-manager.ts              # Stage transitions
│   └── task-watcher.ts               # Filesystem monitoring
├── types/
│   ├── copy.ts                       # CopyMode enum
│   ├── task.ts                       # Core Task interface
│   └── context.ts                    # Context interfaces
├── utils/text.ts                     # Text utilities
├── webview/                          # Webview system
│   ├── KanbanPanel.ts               # Board webview
│   ├── SidebarProvider.ts           # Sidebar webview
│   ├── messaging.ts                 # Message protocol
│   └── ui/                          # React components
└── workspace/
    ├── state.ts                     # Workspace state
    └── validation.ts                # Path validation

tests/                               # Test suite (comprehensive coverage)
├── *.test.ts                        # Unit tests for all modules
```

## Phase 0: Foundation (COMPLETE ✅)

### Core Infrastructure
- **Runtime**: Bun + TypeScript + esbuild + Vitest
- **Extension**: VS Code extension skeleton with command registration
- **Webview**: React shell with CSP and message wiring
- **Validation**: Workspace detection and path safety

### Immutable Constants
```typescript
export const STAGES: Stage[] = ['inbox', 'plan', 'code', 'audit', 'completed'];
export const KANBAN_FOLDER = '.kanban2code';
export const INBOX_FOLDER = 'inbox';
export const PROJECTS_FOLDER = 'projects';
export const ARCHIVE_FOLDER = '_archive';
```

### Task Type Contract
```typescript
interface Task {
  id: string;           // File basename without .md
  filePath: string;     // Absolute path
  title: string;        // From # heading or filename
  stage: Stage;         // One of STAGES, defaults to 'inbox'
  project?: string;     // Inferred from path, never stored in frontmatter
  phase?: string;       // Inferred from path, never stored in frontmatter
  agent?: string;       // Agent assignment
  parent?: string;      // Parent task ID
  tags?: string[];      // Array of tags
  contexts?: string[];  // Custom context references
  order?: number;       // Display order
  created?: string;     // ISO date string
  content: string;      // Markdown body
}
```

### Message Protocol
```typescript
interface MessageEnvelope<T> {
  version: 1;
  type: MessageType;    // 'TaskUpdated' | 'TaskSelected' | 'FilterChanged' | 'InitState' | 'CreateTask' | 'MoveTask' | 'CopyContext' | 'ALERT'
  payload: T;
}
```

## Phase 1: Filesystem and Tasks (PARTIAL ⚠️)

### Task Parsing and Serialization
```typescript
// src/services/frontmatter.ts
async function parseTaskFile(filePath: string): Promise<Task>
function stringifyTaskFile(task: Task, originalContent?: string): string
```

**Key Behaviors**:
- Uses gray-matter for frontmatter parsing
- Defaults stage to 'inbox' if missing
- Infers project/phase from file path, ignores frontmatter values
- Preserves unknown frontmatter fields
- Handles invalid YAML gracefully with warnings

### Task Loading
```typescript
// src/services/scanner.ts
async function loadAllTasks(kanbanRoot: string): Promise<Task[]>
async function findTaskById(kanbanRoot: string, taskId: string): Promise<Task | undefined>
```

**Key Behaviors**:
- Scans `inbox/*.md` and `projects/**/*.md`
- Excludes `_context.md` files
- Handles missing folders gracefully
- Parallel parsing with error collection

### Stage Management
```typescript
// src/core/rules.ts
function isTransitionAllowed(from: Stage, to: Stage): boolean
// Forward-only: inbox → plan → code → audit → completed

// src/services/stage-manager.ts
async function updateTaskStage(taskId: string, newStage: Stage): Promise<void>
```

### Archive System
```typescript
// src/services/archive.ts
async function archiveTask(task: Task, root: string): Promise<void>
async function archiveProject(root: string, projectName: string): Promise<void>
```

**Gaps Identified**:
- ❌ No VS Code commands registered for archive operations
- ❌ File watcher implemented but not wired to extension host
- ❌ Webview architecture missing Zustand stores and component library

## Phase 2: Context System (COMPLETE ✅)

### 9-Layer Context Architecture

**Layer Order** (immutable sequence):
1. Global Context: `how-it-works.md` → `architecture.md` → `project-details.md`
2. Agent Context: `_agents/{agent}.md`
3. Project Context: `projects/{project}/_context.md`
4. Phase Context: `projects/{project}/{phase}/_context.md`
5. Stage Template: `_templates/stages/{stage}.md`
6. Custom Contexts: From `task.contexts[]`
7. Task Metadata: All frontmatter properties
8. Task Content: Markdown body
9. System Wrapper: XML structure

### Context Service Interface
```typescript
// src/services/context.ts
async function loadGlobalContext(root: string): Promise<string>
async function loadAgentContext(root: string, agentName?: string): Promise<string>
async function loadProjectContext(root: string, projectName?: string): Promise<string>
async function loadPhaseContext(root: string, projectName?: string, phaseName?: string): Promise<string>
async function loadCustomContexts(root: string, contextNames?: string[]): Promise<string>
async function loadStageTemplate(root: string, stage: Stage): Promise<string>
```

### XML Prompt Builder
```typescript
// src/services/prompt-builder.ts
async function buildXMLPrompt(task: Task, root: string): Promise<string>
async function buildContextOnlyPrompt(task: Task, root: string): Promise<string>
function buildTaskOnlyPrompt(task: Task): string
```

**XML Structure**:
```xml
<system>
  <context>
    <section name="global">...</section>
    <section name="agent">...</section>
    <section name="project">...</section>
    <section name="phase">...</section>
    <section name="stage_template">...</section>
    <section name="custom">...</section>
  </context>
  <task>
    <metadata>
      <id>...</id>
      <filePath>...</filePath>
      <title>...</title>
      <stage>...</stage>
      <project>...</project>
      <phase>...</phase>
      <agent>...</agent>
      <parent>...</parent>
      <order>...</order>
      <created>...</created>
      <tags>...</tags>
      <contexts>...</contexts>
    </metadata>
    <content>...</content>
  </task>
</system>
```

### Copy System
```typescript
// src/types/copy.ts
export type CopyMode = 'full_xml' | 'task_only' | 'context_only';

// src/services/copy.ts
async function buildCopyPayload(task: Task, mode: CopyMode = 'full_xml', root?: string): Promise<string>
async function copyToClipboard(content: string): Promise<void>
```

### VS Code Integration
```json
// package.json
{
  "commands": [
    {
      "command": "kanban2code.copyTaskContext",
      "title": "Kanban2Code: Copy Task Context"
    }
  ]
}
```

## Cross-Phase Dependencies and Contracts

### Immutable Interfaces
- [`Task`](src/types/task.ts:3) type system (all phases)
- [`STAGES`](src/core/constants.ts:3) ordering (all phases)
- [`MessageEnvelope`](src/webview/messaging.ts:24) protocol (all phases)
- [`isSafePath`](src/workspace/validation.ts:61) validation (all phases)

### Extension Points
- Context layers can be added to 9-layer system
- Copy modes can be extended beyond three
- Message types can be added without breaking existing
- XML structure can be versioned

## Forward Compatibility Matrix

### What Must Remain Immutable
```bash
# Core type contracts
/src/types/task.ts                    # Task interface structure
/src/core/constants.ts                # STAGES array and folder names
/src/webview/messaging.ts             # Message envelope structure

# Filesystem structure
.kanban2code/inbox/                   # Inbox task location
.kanban2code/projects/                # Project structure
.kanban2code/_archive/                # Archive location

# Context layer order (Layers 1-9 sequence)
# XML wrapper structure (<system><context><task>)
```

### What May Be Extended
```bash
# Service implementations
/src/services/*.ts                    # Internal logic can evolve
/src/commands/index.ts                # New commands can be added

# Context content
.kanban2code/*.md                     # Content can change
.kanban2code/_agents/*.md             # Agent definitions can evolve
.kanban2code/_templates/**/*.md       # Templates can be updated

# Message types
# New message types can be added to existing enums
```

### What Will Be Replaced
```bash
# Placeholder UI components
/src/webview/ui/App.tsx               # Will be replaced with real UI
# Current placeholder messaging imports

# Partial implementations
# File watcher integration (currently unwired)
# Archive command registration (currently missing)
```

## Auto-Refactor Commands

### If Task Interface Changes
```bash
# Update all Task references
sed -i 's/interface Task {/interface Task {/' src/types/task.ts
find src/ -name "*.ts" -exec sed -i 's/task\./task./g' {} \;

# Update frontmatter serialization
sed -i 's/project:.*project/project: undefined/' src/services/frontmatter.ts
sed -i 's/phase:.*phase/phase: undefined/' src/services/frontmatter.ts
```

### If Context Layer Order Changes
```bash
# Update prompt builder sequence
sed -i 's/Layer [1-9]:.*/# New layer order/' src/services/prompt-builder.ts
# Update XML structure
sed -i 's/<section name="[^"]*">/<section name="new_name">/g' src/services/prompt-builder.ts
```

## Deterministic Sync Seal

```bash
#!/bin/bash
# roadmap_sync.sh - Run this to verify repo state matches roadmap_context.md

# Calculate checksum of critical files
find src/types/task.ts src/types/copy.ts src/types/context.ts src/core/constants.ts src/core/rules.ts src/services/context.ts src/services/prompt-builder.ts src/services/copy.ts src/services/frontmatter.ts src/services/scanner.ts src/services/stage-manager.ts src/services/archive.ts src/services/task-watcher.ts src/webview/messaging.ts src/workspace/validation.ts src/workspace/state.ts package.json tsconfig.json eslint.config.mjs build.ts -type f -exec sha256sum {} \; | sort | sha256sum | cut -d' ' -f1

# Compare with golden hash: 9f069c5fbdc889d0b8a44cb92ff1d68e6882f575cba4dafb92c674706f60018c
```

**Build Integration**:
```json
// package.json
{
  "scripts": {
    "compile": "./roadmap_sync.sh && bun run build.ts",
    "test": "./roadmap_sync.sh && vitest run"
  }
}
```

## Current Implementation Status

| Phase | Status | Tests | Gaps |
|-------|--------|--------|------|
| Phase 0: Foundation | ✅ COMPLETE | 30 passing | None |
| Phase 1: Filesystem | ⚠️ PARTIAL | All passing | Archive commands, file watcher wiring, webview stores |
| Phase 2: Context | ✅ COMPLETE | All passing | None |
| Phase 3: Sidebar UI | 🚧 PLANNED | - | Not started |
| Phase 4: Board Webview | 🚧 PLANNED | - | Not started |
| Phase 5: Polish | 🚧 PLANNED | - | Not started |

**Last Updated**: 2025-12-11T03:58:42.877Z
**Repository State**: Phase 2 complete, sync seal active, ready for Phase 3 UI implementation
**Golden Hash**: 9f069c5fbdc889d0b8a44cb92ff1d68e6882f575cba4dafb92c674706f60018c