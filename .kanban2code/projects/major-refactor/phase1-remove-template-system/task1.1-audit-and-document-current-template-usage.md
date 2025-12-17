---
stage: complete
tags:
  - chore
  - p1
agent: sonnet
contexts: []
---

# Phase 1: Complete Template System Removal - Comprehensive Audit and Documentation

## Phase 1 Overview
This is the master documentation for Phase 1 of the Major Refactor project. The goal is to remove the entire template system and transition to an agent-driven workflow. This phase consists of 12 sequential tasks that systematically remove all template-related functionality.

## Phase 1 Task Sequence
1. **Task 1.1** - Audit and Document Current Template Usage (THIS TASK)
2. **Task 1.2** - Remove Template Service
3. **Task 1.3** - Remove Template UI Components
4. **Task 1.4** - Update TaskModal and TaskEditorModal
5. **Task 1.5** - Remove Template Messaging
6. **Task 1.6** - Remove Template Command
7. **Task 1.7** - Update Scaffolder
8. **Task 1.8** - Handle Stage Templates Migration
9. **Task 1.9** - Update Assets and Constants
10. **Task 1.10** - Update Tests
11. **Task 1.11** - Update Documentation
12. **Task 1.12** - Cleanup Workspace Template Files

## Complete File Inventory by Task Impact

### Task 1.1: Audit and Document Current Template Usage
**FILES TO MODIFY/DOCUMENT:**
- `.kanban2code/projects/major-refactor/phase1-remove-template-system/task1.1-audit-and-document-current-template-usage.md` (THIS FILE)

### Task 1.2: Remove Template Service
**FILES TO DELETE:**
- `src/services/template.ts` - Main template service
- `tests/template-service.test.ts` - Template service tests

**FILES TO MODIFY (Remove Imports):**
- `src/webview/SidebarProvider.ts` - Remove `loadTaskTemplates, createTaskTemplate, updateTaskTemplate, type TaskTemplate`
- `src/webview/KanbanPanel.ts` - Remove `loadTaskTemplates, createTaskTemplate, updateTaskTemplate`
- `src/webview/ui/hooks/useTaskData.ts` - Remove `templates` state/type plumbing
- `src/services/task-content.ts` - Remove unused `metadata.template` plumbing (no persistence today)

### Task 1.3: Remove Template UI Components
**FILES TO DELETE:**
- `src/webview/ui/components/TemplatePicker.tsx` - Template selection component
- `src/webview/ui/components/TemplateModal.tsx` - Template creation/editing modal

**FILES TO MODIFY:**
- `src/webview/ui/components/index.ts` - Remove TemplatePicker and TemplateModal exports
- `src/webview/ui/components/Icons.tsx` - Remove TemplateIcon if not used elsewhere
- `src/webview/ui/styles/main.css` - Remove template-related CSS classes

### Task 1.4: Update TaskModal and TaskEditorModal
**FILES TO MODIFY:**
- `src/webview/ui/components/TaskModal.tsx` - Remove TemplatePicker import and usage
- `src/webview/ui/components/TaskEditorModal.tsx` - Remove template loading, warnings, and TemplatePicker

### Task 1.5: Remove Template Messaging
**FILES TO MODIFY:**
- `src/webview/messaging.ts` - Remove message types:
  - `TemplatesLoaded`, `TemplateContentLoaded`, `TemplateContentLoadFailed`
  - `CreateTemplate`, `UpdateTemplate`, `RequestTemplates`, `RequestTemplateContent`
- `src/webview/SidebarProvider.ts` - Remove template message handlers and state
- `src/webview/KanbanPanel.ts` - Remove template message handlers and state

### Task 1.6: Remove Template Command
**FILES TO MODIFY:**
- `src/commands/index.ts` - Remove `kanban2code.newTemplate` command registration
- `src/webview/SidebarProvider.ts` - Remove fallback `executeCommand('kanban2code.newTemplate')` path (CreateTemplate with empty payload)

**NOTES:**
- `package.json` does not contribute `kanban2code.newTemplate` today (no command/keybinding entries), so no manifest changes are required for removal.

### Task 1.7: Update Scaffolder
**FILES TO MODIFY:**
- `src/services/scaffolder.ts` - Remove template directory creation and seeding
- `tests/e2e/core-workflows.test.ts` - Update workspace structure assertions (currently expects `_templates/`)
- `tests/e2e/setup.ts` - Update workspace fixture creation (currently creates `_templates/`)

### Task 1.8: Handle Stage Templates Migration
**FILES TO MODIFY:**
- `src/services/context.ts` - Update or remove `loadStageTemplate()` function
- `src/services/prompt-builder.ts` - Update stage template layer in prompt building
- Decision point: Either embed stage context in agent instructions OR keep `_templates/stages/`

### Task 1.9: Update Assets and Constants
**FILES TO MODIFY:**
- `src/assets/templates.ts` - Remove task template constants (TASK_TEMPLATE_BUG, etc.)
- `src/core/constants.ts` - Remove or deprecate `TEMPLATES_FOLDER` constant
- `src/services/task-content.ts` - Remove unused `metadata.template` plumbing

### Task 1.10: Update Tests
**FILES TO DELETE:**
- `tests/template-service.test.ts` - Already covered in Task 1.2

**FILES TO MODIFY:**
- `tests/webview/task-editor-modal.test.tsx` - Remove template-content application tests
- `tests/scaffolder.test.ts` - Update template directory tests
- `tests/context-service.test.ts` - Update stage template tests
- `tests/prompt-builder.test.ts` - Update/remove stage template layer tests
- `tests/copy-service.test.ts` - Update if stage template copying changes

### Task 1.11: Update Documentation
**FILES TO MODIFY:**
- `docs/architecture.md` - Remove template system references
- `.kanban2code/_context/ai-guide.md` - Remove template section, emphasize agent-generated content
- `docs/user_guide.md` - Remove template usage documentation
- `README.md` - Update if templates are mentioned

### Task 1.12: Cleanup Workspace Template Files
**FILES TO DOCUMENT/CLEANUP:**
- `.kanban2code/_templates/tasks/` - Document existing task templates for migration
- `.kanban2code/_templates/stages/` - Document existing stage templates
- `.kanban2code/_templates/context/` - Evaluate/cleanup (not used by runtime code)
- Create migration instructions for existing users

## Complete Phase 1 Dependency Graph

```
PHASE 1: TEMPLATE SYSTEM REMOVAL
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION ORDER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                             │
│  1.1 AUDIT (CURRENT TASK)                                   │
│     ↓                                                        │
│  1.2 REMOVE CORE SERVICE                                     │
│     ↓                                                        │
│  1.3 REMOVE UI COMPONENTS                                     │
│     ↓                                                        │
│  1.4 UPDATE MODALS                                           │
│     ↓                                                        │
│  1.5 REMOVE MESSAGING                                        │
│     ↓                                                        │
│  1.6 REMOVE COMMAND                                          │
│     ↓                                                        │
│  1.7 UPDATE SCAFFOLDER                                         │
│     ↓                                                        │
│  1.8 HANDLE STAGE TEMPLATES                                   │
│     ↓                                                        │
│  1.9 UPDATE ASSETS/CONSTANTS                                   │
│     ↓                                                        │
│  1.10 UPDATE TESTS                                            │
│     ↓                                                        │
│  1.11 UPDATE DOCUMENTATION                                      │
│     ↓                                                        │
│  1.12 CLEANUP WORKSPACE FILES                                  │
│                                                             │
└─────────────────────────────────────────────────────────────────┘

CRITICAL PATH DEPENDENCIES:
• 1.2 (Service) → 1.3 (UI) → 1.4 (Modals) → 1.5 (Messaging)
• 1.7 (Scaffolder) → 1.8 (Stage Templates) → 1.9 (Assets)
• 1.10 (Tests) depends on all previous code changes
• 1.11 (Docs) depends on final system state
• 1.12 (Cleanup) depends on all removals complete
```

## Risk Assessment by Task

### HIGH RISK TASKS
- **1.8 Handle Stage Templates Migration**: Critical decision point affecting agent workflow
- **1.4 Update TaskModal and TaskEditorModal**: Core user interaction changes

### MEDIUM RISK TASKS
- **1.2 Remove Template Service**: Core service removal with many dependencies
- **1.5 Remove Template Messaging**: Complex webview communication changes
- **1.10 Update Tests**: Test suite stability during major changes

### LOW RISK TASKS
- **1.1 Audit**: Documentation only
- **1.3 Remove UI Components**: Isolated component removal
- **1.6 Remove Command**: Simple command removal
- **1.7 Update Scaffolder**: Straightforward scaffolding changes
- **1.9 Update Assets/Constants**: Simple constant removal
- **1.11 Update Documentation**: Documentation updates only
- **1.12 Cleanup Workspace**: File cleanup only

## Phase 1 Success Criteria

### Technical Success
- [ ] All template-related code removed without breaking core functionality
- [ ] Build passes after all Phase 1 tasks complete
- [ ] Test suite passes with template removal
- [ ] Extension loads and functions without template system
- [ ] No template-related errors in production

### User Experience Success
- [ ] Task creation workflow remains functional without templates
- [ ] Task editing workflow remains functional without templates
- [ ] Existing workspaces continue to work after migration
- [ ] Documentation accurately reflects new agent-driven workflow
- [ ] User feedback indicates successful transition

### Migration Success
- [ ] Existing template content preserved or migrated appropriately
- [ ] Clear migration path provided for existing users
- [ ] Stage context available to agents through new mechanism
- [ ] Workspace cleanup completes without data loss

## Rollback Strategy

If Phase 1 needs to be rolled back:
1. **Restore Core Files**: Revert `src/services/template.ts` and related imports
2. **Restore UI Components**: Revert TemplateModal and TemplatePicker deletion
3. **Restore Messaging**: Revert messaging.ts changes
4. **Restore Command**: Revert command registration
5. **Test Rollback**: Ensure template system functions again
6. **Document Rollback**: Update documentation with rollback notes

## Next Phase Preparation

Phase 1 completion prepares for:
- **Phase 2**: Agent-driven content generation
- **Phase 3**: Enhanced agent orchestration
- **Phase 4**: UI refinements for agent workflow
- **Phase 5**: Performance optimizations
- **Phase 6**: Final integration and testing

---

# Audit and Document Current Template Usage (Task 1.1)

## Goal
Document all template references and runtime behaviors so Phase 1 can remove templates without breaking core workflows.

## Definition of Done
- [x] All files with in-repo template references documented (excluding generated artifacts)
- [x] Runtime dependency graph clarified (task templates vs stage templates)
- [x] Migration notes for existing workspaces drafted (what changes, what becomes unused)

## Audit Snapshot (2025-12-17)

**Method**
- `rg --files-with-matches -i "template" .` excluding: `dist/`, `coverage/`, `node_modules/`, `.git/`

**Counts**
- Total files matching `/template/i`: **69**
- Breakdown: `src/` (25), `tests/` (10), `docs/` (11), `archive/` (19), `prompts/` (2), plus `README.md` (1) and `major-refactor-roadmap.md` (1)

**Workspace template directories present in this repo**
- `.kanban2code/_templates/tasks/`:
  - `audit-phase.md`, `bug-report.md`, `create-roadmap.md`, `design-task.md`, `documentation.md`, `feature.md`, `refactor.md`, `roadmap.md`, `security-review.md`, `spike-research.md`, `split-phase.md`, `test.md`, `ui-component.md`
- `.kanban2code/_templates/stages/`: `.gitkeep` only (stage templates are generated by scaffolding in a user workspace)
- `.kanban2code/_templates/context/`: `audit-phase.md`, `phase-context.md` (not referenced by runtime code)

## What “Templates” Currently Means (3 distinct concepts)

1. **Task templates (file-based, user-editable)**  
   Markdown files under `.kanban2code/_templates/tasks/*.md`, parsed with `gray-matter`, used for listing and optional content injection.

2. **Stage templates (file-based, user-editable, used in agent prompts)**  
   Markdown files under `.kanban2code/_templates/stages/<stage>.md`, loaded as the `stage_template` layer in `buildXMLPrompt()` / `buildContextOnlyPrompt()`.

3. **“Template” UI presets (NOT the same system)**  
   `src/webview/ui/components/AgentModal.tsx` uses “agent templates” that are hardcoded presets for creating agent files; they do not use `.kanban2code/_templates/*`.

## Runtime Behavior (Important Details / Quirks)

### Task templates
- **Source of truth**: `.kanban2code/_templates/tasks/*.md`
- **Read/list**: `src/services/template.ts` (`loadTaskTemplates()`)
- **Create/update**: `src/services/template.ts` (`createTaskTemplate()` / `updateTaskTemplate()`)
- **Apply to a task**: only in the **task editor**:
  - `src/webview/ui/components/TaskEditorModal.tsx` posts `RequestTemplateContent` and overwrites editor content with the template body on `TemplateContentLoaded`.
  - A warning is shown before overwriting non-empty content.
- **Not applied at task creation**:
  - `src/webview/ui/components/TaskModal.tsx` collects a template id and includes it in `CreateTask`.
  - `src/commands/index.ts` writes `template: <id>` into the new task frontmatter, but **no runtime code consumes this field** (task parsing/metadata does not track it).
- **Template choice is not persisted in editor metadata**:
  - `FullTaskDataLoaded` sets `template: null` and `saveTaskWithMetadata()` ignores `metadata.template` (it is passed through but not serialized).

### Stage templates
- **Source of truth**: `.kanban2code/_templates/stages/<stage>.md`
- **Load**: `src/services/context.ts` (`loadStageTemplate()`)
  - If missing/empty, it returns a fallback: `## Stage: <stage>\nNo stage template was found for this stage.`
- **Use**: `src/services/prompt-builder.ts` injects the stage template as the `stage_template` layer in context XML.

## Concrete Code Touchpoints (Files that implement templates)

### Core filesystem + parsing
- `src/services/template.ts`: CRUD + parsing for task templates (`_templates/tasks`)
- `src/services/scaffolder.ts`: creates `_templates/{tasks,stages}` and seeds templates (currently seeds `bug.md` and stage templates)
- `src/services/context.ts`: `loadStageTemplate()` reads `_templates/stages/<stage>.md` with fallback
- `src/services/prompt-builder.ts`: includes stage templates in the `stage_template` layer
- `src/core/constants.ts`: `TEMPLATES_FOLDER = '_templates'`
- `src/assets/templates.ts`: string templates used during scaffolding (`TASK_TEMPLATE_BUG`, `STAGE_TEMPLATE`, and `_templates` mention in HOW_IT_WORKS)
- `src/types/errors.ts`: `TemplateError` for template-related failures
- `src/commands/index.ts`: registers `kanban2code.newTemplate` and writes `template:` frontmatter for `kanban2code.newTask`

### Webview host (extension side)
- `src/webview/SidebarProvider.ts`, `src/webview/KanbanPanel.ts`:
  - Load templates into `InitState` / `FullTaskDataLoaded`
  - Handle `CreateTemplate`, `UpdateTemplate`, `RequestTemplateContent`
  - Fallback path calls `vscode.commands.executeCommand('kanban2code.newTemplate')` when `CreateTemplate` has no `name`
- `src/webview/messaging.ts`:
  - Active template messages: `CreateTemplate`, `UpdateTemplate`, `RequestTemplateContent`, `TemplateContentLoaded`, `TemplateContentLoadFailed`
  - **Dead/unused** today: `RequestTemplates`, `TemplatesLoaded` (templates are provided via `InitState` / `FullTaskDataLoaded`)

### Webview UI (React)
- `src/webview/ui/components/TemplatePicker.tsx`: dropdown + “Create new template” link (also has a hardcoded fallback list)
- `src/webview/ui/components/TemplateModal.tsx`: create/edit template modal (posts `CreateTemplate` / `UpdateTemplate`)
- `src/webview/ui/components/TaskModal.tsx`: collects `template` for new tasks (does not apply template body)
- `src/webview/ui/components/TaskEditorModal.tsx`: applies template body to editor via `RequestTemplateContent` flow
- `src/webview/ui/components/SidebarActions.tsx`, `src/webview/ui/components/Sidebar.tsx`, `src/webview/ui/components/Board.tsx`: “New Template” entry point / modal wiring
- `src/webview/ui/components/Icons.tsx`: `TemplateIcon` used in sidebar actions
- `src/webview/ui/hooks/useTaskData.ts`: carries `templates` array in initial state
- `src/webview/ui/styles/main.css`: `.template-*` styling (picker + warning UI)

## Tests Impacted by Template Removal
- `tests/template-service.test.ts`: validates task template parsing/loading behavior
- `tests/context-service.test.ts`: validates `loadStageTemplate()` and its fallback behavior
- `tests/prompt-builder.test.ts`: asserts stage template is present in the context XML layering
- `tests/e2e/core-workflows.test.ts`: asserts `_templates/` exists in scaffolded workspace structure
- `tests/e2e/setup.ts`: creates `_templates/` folders in the E2E fixture
- `tests/webview/task-editor-modal.test.tsx`: asserts `RequestTemplateContent` flow / warning behavior

## Migration Notes (Existing Workspaces)

### What becomes unused/breaking when templates are removed
- `.kanban2code/_templates/tasks/*`: no longer read/listed, and “apply template” UI disappears
- `.kanban2code/_templates/stages/*`: stage-specific guidance stops being injected into prompts unless replaced (Task 1.8 decision)
- `template:` in task frontmatter: already effectively unused; can remain as inert legacy metadata or be stripped in a later migration

### Important decision point (Task 1.8)
Stage templates are part of prompt building today (`stage_template` layer). If templates are removed, pick one:
- **Embed stage guidance in agent/system instructions** (static, no workspace files)
- **Move stage guidance into `_context/` (or another non-template mechanism)** and keep it user-editable
- **Keep stage templates but rename/re-home** (if “templates” are being removed mainly for task templates)

## Appendix A — Exhaustive File List (Matches `/template/i`, excluding generated artifacts)

```
README.md
archive/roadmap/phase-0-foundation/phase-0-audit.md
archive/roadmap/phase-0-foundation/task0.3_implement-kanban2code-workspace-scaffolder.md
archive/roadmap/phase-1-filesystem-and-tasks/phase1-context.md
archive/roadmap/phase-2-context-system/phase-2-audit.md
archive/roadmap/phase-2-context-system/phase2-context.md
archive/roadmap/phase-2-context-system/task2.2_implement-xml-prompt-builder-9-layer-context.md
archive/roadmap/phase-2-context-system/task2.3_implement-stage-template-resolution.md
archive/roadmap/phase-3-sidebar-ui/phase-3-audit.md
archive/roadmap/phase-3-sidebar-ui/phase3-context.md
archive/roadmap/phase-3-sidebar-ui/task3.4_implement-new-task-modal.md
archive/roadmap/phase-4-board-webview/phase-4-audit.md
archive/roadmap/phase-4-board-webview/phase4-context.md
archive/roadmap/phase-5-polish-and-docs/phase-5-audit.md
archive/roadmap/phase-5-polish-and-docs/phase-5-context.md
archive/roadmap/phase-6-bugs-and-features/phase6-context.md
archive/roadmap/phase-6-bugs-and-features/task6.3_add-context-selection-to-task-modal.md
archive/roadmap/phase-6-bugs-and-features/task6.5_implement-agent-selection-and-modal.md
archive/roadmap/phase-6-bugs-and-features/task6.6_implement-template-modal.md
archive/roadmap/phase-6-bugs-and-features/task6.8_phase-6-audit-and-sign-off.md
docs/ai-guide-outline.md
docs/architecture.md
docs/design/components/modals.html
docs/design/forms/agent.html
docs/design/forms/context.html
docs/design/forms/task-editor-enhanced.html
docs/design/forms/task.html
docs/design/index.html
docs/design/sidebar.html
docs/e2e-test-results.md
docs/user_guide.md
major-refactor-roadmap.md
prompts/context-gatherer-agent.md
prompts/glm-roadmap-to-tasks.md
src/assets/templates.ts
src/commands/index.ts
src/core/constants.ts
src/services/context.ts
src/services/prompt-builder.ts
src/services/scaffolder.ts
src/services/task-content.ts
src/services/template.ts
src/types/context.ts
src/types/errors.ts
src/webview/KanbanPanel.ts
src/webview/SidebarProvider.ts
src/webview/messaging.ts
src/webview/ui/components/AgentModal.tsx
src/webview/ui/components/Board.tsx
src/webview/ui/components/Icons.tsx
src/webview/ui/components/Sidebar.tsx
src/webview/ui/components/SidebarActions.tsx
src/webview/ui/components/TaskEditorModal.tsx
src/webview/ui/components/TaskModal.tsx
src/webview/ui/components/TemplateModal.tsx
src/webview/ui/components/TemplatePicker.tsx
src/webview/ui/components/index.ts
src/webview/ui/hooks/useTaskData.ts
src/webview/ui/styles/main.css
tests/context-service.test.ts
tests/copy-service.test.ts
tests/e2e/core-workflows.test.ts
tests/e2e/setup.ts
tests/errors.test.ts
tests/prompt-builder.test.ts
tests/template-service.test.ts
tests/webview/board.test.tsx
tests/webview/task-editor-modal.test.tsx
tests/webview/task-modal-create-project.test.tsx
```

## Appendix B — Template Analysis

### Task Template Structure Analysis
Examining the existing task templates in `.kanban2code/_templates/tasks/`:

1. **Common Frontmatter Fields**:
   - `name`: Human-readable display name
   - `description`: Brief explanation of when to use
   - `icon`: Emoji for visual identification
   - `default_stage`: Suggested starting stage
   - `default_tags`: Pre-populated tags

2. **Common Content Patterns**:
   - Structured sections like `TASK_KIND`, `RECOMMENDED_AGENT`, `REQUIRED_INPUT`
   - Standardized sections like `SCOPE`, `ACCEPTANCE_CRITERIA`, `OUTPUT_FORMAT`
   - Placeholders like `<TITLE>`, `<...>` for user substitution

3. **Template Types Identified**:
   - **Bug Report**: Reproduction steps, expected vs actual behavior
   - **Feature**: User goals, constraints, design considerations
   - **Documentation**: Content structure, audience considerations
   - **Research/Spikes**: Exploration goals, success criteria
   - **Refactoring**: Current issues, improvement goals
   - **Testing**: Test scenarios, coverage requirements
   - **Security**: Threat modeling, review criteria
   - **UI Components**: Design specs, interaction patterns

### Stage Template Analysis
Currently, stage templates are minimal with just a `.gitkeep` file. The scaffolder creates basic stage templates with the format:
```markdown
---
stage: <stage_name>
---
Tasks in this stage are being <stage_name>.
```

This minimal approach suggests stage templates are not heavily utilized in their current form.

### Template Usage Patterns
1. **Task Creation**: Templates are selected but not applied at creation time
2. **Task Editing**: Templates can be applied to overwrite content with warning
3. **Agent Prompts**: Stage templates are included in context XML for agents
4. **UI Integration**: Templates are listed in pickers with create/edit capabilities

### Critical Dependencies
1. **Frontend UI**: Multiple components depend on template state and actions
2. **Messaging System**: Template-related messages flow between webview and extension
3. **File System**: Template files are read/written directly from workspace
4. **Agent Context**: Stage templates are part of the prompt building system

## Appendix C — Template Removal Impact Analysis

### High-Impact Areas
1. **Task Creation Flow**: Removing templates will simplify the new task modal
2. **Task Editor**: Will lose template application functionality
3. **Agent Prompts**: Stage templates provide context to agents
4. **Workspace Structure**: `_templates/` directory will become unused

### Low-Impact Areas
1. **Task Storage**: Template metadata in frontmatter is already unused
2. **Core Task Operations**: Most task operations don't depend on templates
3. **File Watching**: Template changes trigger refreshes but aren't critical

### Migration Considerations
1. **User Workflows**: Users who rely on templates will need new workflows
2. **Agent Instructions**: Stage guidance needs an alternative delivery mechanism
3. **Workspace Cleanup**: Existing template files should be preserved during transition
4. **Documentation**: User guides need updates for template-free workflow
