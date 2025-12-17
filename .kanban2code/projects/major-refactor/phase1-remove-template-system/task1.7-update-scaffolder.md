---
stage: audit
tags:
  - refactor
  - p1
agent: react-dev
contexts: []
---

# Update Scaffolder

## Goal
Update the scaffolder to stop creating template folders and remove template seeding logic.

## Definition of Done
- [x] `scaffolder.ts` - Remove `_templates/tasks/` creation
- [x] `scaffolder.ts` - Remove `_templates/stages/` creation
- [x] `scaffolder.ts` - Remove template seeding logic
- [x] `tests/scaffolder.test.ts` - Update tests for new behavior

## Context
This task updates the workspace scaffolder to no longer create template-related directories when initializing new Kanban2Code workspaces. The scaffolder will be updated later in Phase 2 to create agent directories instead.

## Audit
.kanban2code/projects/major-refactor/phase1-remove-template-system/task1.7-update-scaffolder.md
src/services/scaffolder.ts
tests/scaffolder.test.ts
