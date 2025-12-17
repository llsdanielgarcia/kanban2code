---
stage: audit
tags:
  - chore
  - p2
agent: react-dev
contexts:
  - architecture
  - ai-guide
---

# Cleanup Workspace Template Files

## Goal
Document and provide migration path for existing workspace template files.

## Definition of Done
- [x] `.kanban2code/_templates/tasks/` contents documented for migration
- [x] `.kanban2code/_templates/stages/` contents documented
- [x] Migration script or instructions for existing users created (optional)

## Context
This task addresses existing workspaces that may have template files. We need to document what exists and provide guidance for users upgrading to the new agent-driven workflow.

## Notes
- New workspaces no longer create or use `.kanban2code/_templates/` (legacy templates).
- Migration guidance lives in `docs/user_guide.md` under “Legacy `_templates/` folder (migration)”.

## Audit
docs/user_guide.md
.kanban2code/projects/major-refactor/phase1-remove-template-system/task1.12-cleanup-workspace-template-files.md
