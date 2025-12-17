---
stage: audit
tags:
  - refactor
  - p1
agent: react-dev
contexts: []
---

# Update Assets and Constants

## Goal
Remove template-related constants and assets from the codebase.

## Definition of Done
- [x] `assets/templates.ts` - Remove task template constants
- [x] `constants.ts` - `TEMPLATES_FOLDER` constant removed
- [x] Template-related code removed from `task-content.ts`

## Context
This task cleans up the remaining template-related constants and assets that are scattered throughout the codebase. These are no longer needed in the agent-driven workflow.

## Audit
.kanban2code/projects/major-refactor/phase1-remove-template-system/task1.9-update-assets-and-constants.md
src/assets/templates.ts
src/core/constants.ts
src/services/context.ts
src/services/task-content.ts
src/webview/KanbanPanel.ts
src/webview/SidebarProvider.ts
src/webview/ui/components/TaskEditorModal.tsx
