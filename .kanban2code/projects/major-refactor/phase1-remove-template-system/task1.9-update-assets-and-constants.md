---
stage: plan
tags:
  - refactor
  - p1
agent: coder
contexts: []
---

# Update Assets and Constants

## Goal
Remove template-related constants and assets from the codebase.

## Definition of Done
- [ ] `assets/templates.ts` - Remove task template constants
- [ ] `constants.ts` - `TEMPLATES_FOLDER` constant removed or deprecated
- [ ] Template-related code removed from `task-content.ts`

## Context
This task cleans up the remaining template-related constants and assets that are scattered throughout the codebase. These are no longer needed in the agent-driven workflow.
