---
stage: plan
title: Dogfood Kanban2Code on the Kanban2Code project
tags:
  - mvp
  - polish
  - dogfooding
created: 2025-12-07T00:00:00Z
---

# Dogfood Kanban2Code on the Kanban2Code Project

## Goal
Use Kanban2Code to manage its own development and validate the workflow.

## Scope
- Create `projects/kanban2code/_context.md` with:
  - Project goals, scope, success criteria.
- Use the tasks defined in this roadmap as real tasks:
  - Set stages, tags, and agents as you work.
- Use copy-with-context with your preferred models for:
  - Planning, coding, and auditing.
- Capture friction, missing features, and confusing flows as new tasks.

## Notes
This is where the real UX issues surface; treat them as first-class work.

## Audit Instructions
After completing this task, please update the [Phase 5 Audit](../phase#_audit.md) with:
1. **Files Created**: List all files created in this task with their purpose
2. **Files Modified**: List any existing files that were modified and why
3. **Files Analyzed**: List any files that were examined for reference
4. **Key Changes**: Briefly describe the main changes made to support this task
5. **Tests Created**: List all test files created with Vitest for the new/modified functionality

Example format:
- **Files Created**:
  - `projects/kanban2code/_context.md` - Project context for dogfooding
  - `projects/kanban2code/tasks/` - Real tasks using the system
- **Files Modified**:
  - `how-it-works.md` - Updated with dogfooding insights
- **Tests Created**:
  - `tests/integration/dogfooding.test.ts` - Integration tests for dogfooding workflow

**Testing Requirements**: All created/modified files that can be tested must have corresponding Vitest test files. Run `bun test` to verify all tests pass before completing this task.