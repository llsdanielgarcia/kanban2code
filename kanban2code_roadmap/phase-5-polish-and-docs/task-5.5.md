---
stage: plan
title: Validate MVP feature checklist and define post-v1 backlog
tags:
  - mvp
  - roadmap
  - planning
created: 2025-12-07T00:00:00Z
---

# Validate MVP Feature Checklist and Define Post-v1 Backlog

## Goal
Confirm that v1.0 matches the approved spec and identify post-MVP work.

## Scope
- Cross-check implemented features against the MVP list:
  - Filesystem, stages, archive, context system, sidebar, board, copy-with-context, etc.
- Mark anything missing or partial as new tasks tagged `post-v1`.
- Create a separate roadmap or project for:
  - Project templates.
  - Agent presets.
  - Batch operations.
  - Task dependencies.
  - Time tracking.
  - Exports.
  - Migration tools for other task management systems.
- Optionally create a `projects/kanban2code-post-v1/` project to hold these.

## Notes
This keeps v1 focused while giving you a place to park future ideas.

## Audit Instructions
After completing this task, please update the [Phase 5 Audit](../phase#_audit.md) with:
1. **Files Created**: List all files created in this task with their purpose
2. **Files Modified**: List any existing files that were modified and why
3. **Files Analyzed**: List any files that were examined for reference
4. **Key Changes**: Briefly describe the main changes made to support this task
5. **Tests Created**: List all test files created with Vitest for the new/modified functionality

Example format:
- **Files Created**:
  - `tests/e2e/workflow.test.ts` - E2E workflow tests
  - `tests/fixtures/` - Test data for E2E scenarios
- **Tests Created**:
  - All test files are created as part of this task

**Testing Requirements**: All created/modified files that can be tested must have corresponding Vitest test files. Run `bun test` to verify all tests pass before completing this task.