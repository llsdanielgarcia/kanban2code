---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: []
---

# Update frontmatter parser for `mode` and `attempts`

## Goal

Update the frontmatter parser to handle the new `mode` and `attempts` fields in task files.

## Definition of Done

- [x] `parseTaskContent` in `src/services/frontmatter.ts` extracts `mode` (string, optional) and `attempts` (number, optional, defaults to undefined)
- [x] `stringifyTaskFile` serializes `mode` and `attempts` fields in YAML frontmatter
- [x] `saveTaskWithMetadata` in `src/services/task-content.ts` accepts `mode` in its metadata interface

## Files

- `src/services/frontmatter.ts` - modify - parse/serialize `mode` and `attempts`
- `src/services/task-content.ts` - modify - metadata interface gains `mode`

## Tests

- [x] Parse task with `mode: coder` → `task.mode === 'coder'`
- [x] Parse task without `mode` → `task.mode === undefined`
- [x] Parse task with `attempts: 1` → `task.attempts === 1`
- [x] Round-trip: parse → modify mode → stringify → parse → verify
- [x] Existing frontmatter tests pass unchanged

## Context

The frontmatter parser needs to handle the new fields added to the Task interface in Task 1.1. Both `mode` and `attempts` are optional to maintain backward compatibility with existing tasks.

The `attempts` field tracks how many times a task has failed audit and been sent back to code. The runner increments this counter on each audit failure.

## Audit

- src/services/frontmatter.ts
- src/services/task-content.ts
- src/webview/KanbanPanel.ts
- src/webview/SidebarProvider.ts
- src/webview/ui/components/TaskEditorModal.tsx
- tests/frontmatter.test.ts
