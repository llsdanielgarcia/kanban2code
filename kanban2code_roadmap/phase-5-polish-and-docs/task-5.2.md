---
stage: plan
title: Improve error handling and logging
tags:
  - mvp
  - polish
  - robustness
created: 2025-12-07T00:00:00Z
---

# Improve Error Handling and Logging

## Goal
Make Kanban2Code resilient and transparent when things go wrong.

## Scope
- Wrap filesystem operations with try/catch and user-facing messages:
  - Missing `.kanban2code`.
  - Invalid frontmatter.
  - Failed archive/move operations.
- Write debug logs to VS Code output channel for troubleshooting.
- Avoid blocking the entire UI on a single failing task.

## Notes
Good error messages prevent frustration and mysterious failures.

## Audit Instructions
After completing this task, please update the [Phase 5 Audit](../phase#_audit.md) with:
1. **Files Created**: List all files created in this task with their purpose
2. **Files Modified**: List any existing files that were modified and why
3. **Files Analyzed**: List any files that were examined for reference
4. **Key Changes**: Briefly describe the main changes made to support this task
5. **Tests Created**: List all test files created with Vitest for the new/modified functionality

Example format:
- **Files Created**:
  - `src/utils/errorHandler.ts` - Error handling utilities
  - `src/utils/logger.ts` - Logging utilities
- **Tests Created**:
  - `tests/utils/errorHandler.test.ts` - Vitest tests for error handling
  - `tests/utils/logger.test.ts` - Vitest tests for logging functionality

**Testing Requirements**: All created/modified files that can be tested must have corresponding Vitest test files. Run `bun test` to verify all tests pass before completing this task.