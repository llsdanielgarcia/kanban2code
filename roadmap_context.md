# Kanban2Code Phase 6 Implementation Context

## Executive Summary

**Project Status**: Phase 5 complete, MVP ready for v1.0.0 release  
**Current State**: 128 tests passing, 70%+ coverage, comprehensive error handling and logging implemented  
**Phase 6 Scope**: Critical bug fixes and feature completion for production readiness  

## Architecture Overview

### Core Technology Stack
- **Runtime**: Bun (package manager + test runner)
- **Language**: TypeScript with strict mode
- **Build**: esbuild for bundling
- **UI**: React 19 + Tailwind CSS + shadcn/ui components
- **Testing**: Vitest + React Testing Library + @vscode/test-electron
- **Validation**: Zod for runtime message validation

### Extension Architecture
```
┌─ VS Code Host (Node.js) ──────────────────────┐
│ • Extension activation & lifecycle           │
│ • Command registration (10 commands)         │
│ • File system operations (vscode.fs API)     │
│ • Webview providers (Sidebar + Board)        │
│ • Task services (scanner, stage-manager)     │
│ • Context system (9-layer XML builder)       │
│ • Error recovery & logging                   │
└──────────────┬────────────────────────────────┘
               │ Message Protocol (JSON + Zod)
┌─ Webviews (React) ───────────────────────────┐
│ • Shared React bundle (App.tsx router)       │
│ • Sidebar: Tree navigation + filters         │
│ • Board: Kanban columns/swimlanes            │
│ • Modals: Task creation + context menus      │
│ • Keyboard navigation + shortcuts            │
└──────────────────────────────────────────────┘
```

### Data Model
```typescript
interface Task {
  id: string;                    // Unique identifier
  filePath: string;             // Absolute filesystem path
  title: string;                // Task title
  stage: Stage;                 // 'inbox' | 'plan' | 'code' | 'audit' | 'completed'
  project?: string;             // Project folder name
  phase?: string;               // Phase subfolder name
  agent?: string;               // Agent name from _agents/
  parent?: string;              // Parent task ID for dependencies
  tags?: string[];              // Validated tag taxonomy
  contexts?: string[];          // Context file references
  order?: number;               // Display ordering
  created?: string;             // ISO timestamp
  content: string;              // Markdown body
}
```

### File System Structure
```
.kanban2code/
├── inbox/                      # Unsorted tasks
├── projects/                   # Project-organized tasks
│   └── {project}/
│       ├── _context.md         # Project context
│       └── {phase}/            # Optional phase folders
├── _agents/                    # AI agent definitions
├── _templates/                 # Task/stage templates
│   ├── stages/                 # Stage-specific templates
│   └── tasks/                  # Task type templates
├── _context/                   # Context files for AI prompts
├── _archive/                   # Archived completed tasks
└── how-it-works.md            # Project documentation
```

## Phase 6 Implementation Requirements

### Task 6.0: Fix Delete Button in Board View [CRITICAL]
**Status**: Bug exists - delete button non-functional  
**Root Cause**: DeleteTask message handling incomplete in KanbanPanel  
**Implementation Required**:
- ✅ DeleteTask message type exists in messaging.ts
- ✅ TaskCard.tsx has onDelete callback wired
- ✅ Board.tsx calls handleDeleteTask → postMessage('DeleteTask')
- ✅ KanbanPanel.ts has DeleteTask handler (lines 193-201)
- ✅ delete-task.ts service exists with confirmation dialog
- **Issue**: Need to verify the complete flow works end-to-end

**Files to Verify**:
- [`src/webview/KanbanPanel.ts`](src/webview/KanbanPanel.ts:193-201) - Handler implementation
- [`src/services/delete-task.ts`](src/services/delete-task.ts:14-46) - Service logic
- [`src/webview/ui/components/TaskCard.tsx`](src/webview/ui/components/TaskCard.tsx:86-95) - UI trigger

### Task 6.1: Implement Fixed Color Palette [UI]
**Design**: Navy Night Gradient theme from variables.css  
**Scope**: Replace VS Code theme dependencies with fixed palette

**Color System**:
```css
/* Core gradient background */
--vscode-editor-background: linear-gradient(180deg, #0d111c 0%, #101524 45%, #121829 100%);

/* Stage colors */
--stage-inbox: #3b82f6;      /* Blue */
--stage-plan: #5d6b85;       /* Slate */
--stage-code: #22c55e;       /* Green */
--stage-audit: #facc15;      /* Yellow */
--stage-completed: #5d6b85;  /* Slate */

/* Tag colors */
--tag-bug: #ef4444;
--tag-feature: #3b82f6;
--tag-mvp: #60a5fa;
--tag-urgent: #facc15;
```

**Implementation Required**:
- Update all component styles to use fixed variables
- Ensure glassmorphic effects work with gradient backgrounds
- Test across different VS Code themes

### Task 6.2: Fix Swimlane Layout [UI]
**Current Issue**: Swimlane layout incorrect orientation  
**Required Design**: Rows = Stages, Columns = Projects  

**Implementation Required**:
- Update [`BoardSwimlane.tsx`](src/webview/ui/components/BoardSwimlane.tsx) component
- Restructure data grouping: group by project, then stage
- Update drag-and-drop to handle project changes
- Add sticky stage labels during horizontal scroll

### Task 6.3: Add Context Selection to Task Modal [FEATURE]
**Design Reference**: [`docs/design/forms/task.html`](docs/design/forms/task.html:336-376)  
**Scope**: Multi-select context file picker in Task Modal

**Implementation Required**:
- Context discovery service to find available context files
- ContextPicker component with checkboxes
- Integration with TaskModal component
- Save selected contexts to task frontmatter

### Task 6.4: Implement Context Creation Modal [FEATURE]
**Design Reference**: [`docs/design/forms/context.html`](docs/design/forms/context.html)  
**Scope**: Full context file creation workflow

**Implementation Required**:
- ContextModal component with form fields
- File references picker with add/remove functionality
- Metadata preview section
- Host-side handler for context file creation

### Task 6.5: Implement Agent Selection and Creation Modal [FEATURE]
**Design Reference**: [`docs/design/forms/agent.html`](docs/design/forms/agent.html)  
**Scope**: Agent selection in Task Modal + Agent creation modal

**Implementation Required**:
- Agent discovery service
- AgentPicker dropdown component
- AgentModal with quick templates grid
- Template-based agent creation with pre-filled instructions

### Task 6.6: Implement Template Creation/Editing Modal [FEATURE]
**Scope**: Modal for creating/editing task templates

**Implementation Required**:
- TemplateModal component
- Support for create and edit modes
- Default values and placeholder support
- Preview section for template output

### Task 6.7: Implement Monaco Editor for Task Editing [FEATURE]
**Scope**: In-place task editing without opening external files

**Implementation Required**:
- Install @monaco-editor/react package
- TaskEditorModal component
- Monaco configuration with markdown language support
- Save/cancel handling with dirty state tracking

## Current Implementation State

### ✅ Completed Infrastructure
- **Test Infrastructure**: 128 tests, 70%+ coverage, CI-ready
- **Error Handling**: Typed errors, recovery system, logging
- **Keyboard Shortcuts**: 8+ shortcuts, command palette integration
- **Tag Taxonomy**: 35+ predefined tags with validation
- **Messaging Protocol**: Versioned envelopes with Zod validation
- **File System Services**: Scanner, stage-manager, archive, copy
- **Context System**: 9-layer XML prompt builder
- **Webview Architecture**: Shared React bundle with routing

### ✅ Working Features
- Task creation with templates and location selection
- Drag-and-drop stage transitions with validation
- Multi-dimensional filtering (stage, project, tags)
- Copy-to-clipboard (3 modes: full_xml, task_only, context_only)
- Archive workflow for completed tasks
- Keyboard navigation and shortcuts
- Real-time file watching and UI updates

### 🔧 Known Issues (Phase 6 Targets)
1. **Delete button non-functional** - Priority P0
2. **Swimlane layout incorrect** - Rows/Columns swapped
3. **Missing context selection** - Task modal incomplete
4. **Missing modals** - Context, Agent, Template creation
5. **No in-place editing** - Requires external file opening

## Cross-Phase Dependencies

### Phase 0-5 Deliverables Impact
- **Phase 0**: Foundation complete - no blockers
- **Phase 1**: File system layer stable - services ready
- **Phase 2**: Context system ready - enables Task 6.3-6.5
- **Phase 3**: Sidebar complete - no changes needed
- **Phase 4**: Board infrastructure ready - Tasks 6.0-6.2 target
- **Phase 5**: Polish complete - infrastructure ready

### External Dependencies
- **Monaco Editor**: Required for Task 6.7
- **VS Code API**: Stable, no version conflicts expected
- **React 19**: Latest version, no compatibility issues

## Testing Strategy

### Unit Tests Required
- Context selection validation (Task 6.3)
- Agent template application (Task 6.5)
- Template creation/editing logic (Task 6.6)
- Monaco editor integration (Task 6.7)

### Integration Tests Required
- Complete delete workflow (Task 6.0)
- Context file creation and linking (Task 6.4)
- Agent creation and selection (Task 6.5)

### E2E Tests Required
- Full task creation with context selection
- Context and agent creation workflows
- In-place task editing with Monaco

## Risk Assessment

### High Risk (P0)
- **Delete button fix**: Critical for user workflow
- **Swimlane layout**: Core board functionality

### Medium Risk (P1)
- **Context system**: Complex file references
- **Agent system**: Template integration
- **Monaco editor**: External dependency

### Low Risk (P2)
- **Template modal**: Standard form implementation
- **Color palette**: CSS variable updates

## Implementation Order

1. **Task 6.0** - Fix delete button (critical bug)
2. **Task 6.2** - Fix swimlane layout (core UI)
3. **Task 6.1** - Implement color palette (UI foundation)
4. **Task 6.3** - Context selection (extends existing modal)
5. **Task 6.4** - Context creation modal (new feature)
6. **Task 6.5** - Agent system (new feature)
7. **Task 6.6** - Template modal (new feature)
8. **Task 6.7** - Monaco editor (advanced feature)

## Token Optimization Notes

This document is designed for immediate AI context loading with:
- **Complete architecture overview** - No need to scan file structure
- **Detailed implementation state** - All current code paths documented
- **Clear dependency mapping** - Cross-phase relationships identified
- **Risk assessment** - Implementation priorities established
- **Testing strategy** - Quality assurance approach defined

**Total size**: ~2,500 tokens - optimized for large context windows while containing all essential information for Phase 6 implementation.

## Final Status

**Phase 6 Ready**: All infrastructure complete, bug fixes and feature completion can proceed immediately with comprehensive context available for AI implementation assistance.