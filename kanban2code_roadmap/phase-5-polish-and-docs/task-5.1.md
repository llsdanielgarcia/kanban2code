---
stage: plan
title: Implement keyboard shortcuts and command palette entries (global bindings)
tags:
  - mvp
  - polish
  - shortcuts
created: 2025-12-07T00:00:00Z
---

# Implement Keyboard Shortcuts and Command Palette Entries

## Goal
Make common actions fast via keyboard and easily discoverable at the VS Code level, building on in-webview navigation from task 3.6.

## Scope
- Define VS Code-level keybindings, for example:
  - Toggle board.
  - Focus Kanban2Code sidebar.
  - New task.
  - Copy XML for current task.
  - Mark implementation done.
- Ensure all actions are also available via the command palette:
  - `Kanban2Code: New Task`
  - `Kanban2Code: Copy XML for Current Task`
  - `Kanban2Code: Mark Implementation Done`
  - etc.
- Keep in-webview focus rules and ARIA behavior in task 3.6; avoid duplicating that work here.

## Notes
This supports your desire to "execute without touching the UI" once tasks are queued. Coordinate with task 3.6 so global shortcuts cooperate with in-webview navigation.


## Audit Instructions
After completing this task, please update the [Phase 5 Audit](../phase#_audit.md) with:
1. **Files Created**: List all files created in this task with their purpose
2. **Files Modified**: List any existing files that were modified and why
3. **Files Analyzed**: List any files that were examined for reference
4. **Key Changes**: Briefly describe the main changes made to support this task
5. **Tests Created**: List all test files created with Vitest for the new/modified functionality

Example format:
- **Files Created**:
  - `package.json` - Updated with keyboard shortcuts and commands
  - `src/commands/keyboardShortcuts.ts` - Global keyboard shortcut handlers
- **Tests Created**:
  - `tests/commands/keyboardShortcuts.test.ts` - Vitest tests for keyboard shortcuts

**Testing Requirements**: All created/modified files that can be tested must have corresponding Vitest test files. Run `bun test` to verify all tests pass before completing this task.
