---
stage: plan
title: Implement E2E tests for core workflows
tags:
  - mvp
  - testing
  - e2e
  - workflows
created: 2025-12-07T00:00:00Z
---

# Implement E2E Tests for Core Workflows

## Goal
Verify critical user workflows work end-to-end in real VS Code environment.

## Scope
- Create `tests/e2e/` using @vscode/test-electron:
  - Test workspace scaffolding workflow
  - Test task creation from sidebar
  - Test task creation from board
  - Test stage changes via drag-and-drop
  - Test copy XML context functionality
  - Test archive workflow
  - Test filter synchronization
- Set up test workspace fixtures
- Configure test data cleanup

## Notes
E2E tests catch integration issues that unit tests might miss, especially around VS Code APIs.

## Audit Instructions
After completing this task, please update the [Phase 5 Audit](../phase#_audit.md) with:
1. **Files Created**: List all files created in this task with their purpose
2. **Files Modified**: List any existing files that were modified and why
3. **Files Analyzed**: List any files that were examined for reference
4. **Key Changes**: Briefly describe the main changes made to support this task
5. **Tests Created**: List all test files created with Vitest for the new/modified functionality

Example format:
- **Files Created**:
  - `docs/tag-taxonomy.md` - Documentation for tag system
  - `src/webview/components/TagSuggestion.tsx` - Tag suggestion component
- **Tests Created**:
  - `tests/webview/components/TagSuggestion.test.tsx` - Vitest tests for tag functionality

**Testing Requirements**: All created/modified files that can be tested must have corresponding Vitest test files. Run `bun test` to verify all tests pass before completing this task.