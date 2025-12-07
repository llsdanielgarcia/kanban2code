---
stage: plan
title: Implement Add Follow-up in Inbox from board
tags:
  - mvp
  - ui
  - board
  - inbox
created: 2025-12-07T00:00:00Z
---

# Implement "Add Follow-up in Inbox" from Board

## Goal
Let the user create follow-up/dependency tasks in Inbox directly from a card.

## Scope
- On card `[…]` menu, add `Add Follow-up in Inbox`.
- Show mini modal:
  - Parent task title (read-only).
  - Fields: Title, Tags (prefilled if appropriate), Stage (locked to `inbox`), Agent (optional).
- On submit:
  - Create a new inbox task with `parent` reference in frontmatter.
- Display a small indicator on the original card (e.g. "↗ 1 follow-up").

## Notes
This directly supports your "I see I need backend schema → capture it without losing flow" use case.

## Audit Instructions
After completing this task, please update the [Phase 4 Audit](../phase#_audit.md) with:
1. **Files Created**: List all files created in this task with their purpose
2. **Files Modified**: List any existing files that were modified and why
3. **Files Analyzed**: List any files that were examined for reference
4. **Key Changes**: Briefly describe the main changes made to support this task
5. **Tests Created**: List all test files created with Vitest for the new/modified functionality

Example format:
- **Files Created**:
  - `src/webview/components/FollowUpModal.tsx` - Follow-up task creation modal
  - `src/webview/hooks/useFollowUp.ts` - Hook for follow-up functionality
- **Tests Created**:
  - `tests/webview/components/FollowUpModal.test.tsx` - Vitest tests for follow-up modal
  - `tests/webview/hooks/useFollowUp.test.ts` - Vitest tests for follow-up logic

**Testing Requirements**: All created/modified files that can be tested must have corresponding Vitest test files. Run `bun test` to verify all tests pass before completing this task.