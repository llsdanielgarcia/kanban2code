---
stage: plan
tags:
  - refactor
  - p1
agent: coder
contexts: []
---

# Update Scaffolder

## Goal
Update the scaffolder to stop creating template folders and remove template seeding logic.

## Definition of Done
- [ ] `scaffolder.ts` - Remove `_templates/tasks/` creation
- [ ] `scaffolder.ts` - Remove `_templates/stages/` creation
- [ ] `scaffolder.ts` - Remove template seeding logic
- [ ] `tests/scaffolder.test.ts` - Update tests for new behavior

## Context
This task updates the workspace scaffolder to no longer create template-related directories when initializing new Kanban2Code workspaces. The scaffolder will be updated later in Phase 2 to create agent directories instead.
