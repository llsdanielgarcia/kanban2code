---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: [skills/react-core-skills]
---

# Runner controls on Column headers

## Goal
Add runner control buttons to Plan, Code, and Audit column headers.

## Definition of Done
- [x] Plan, Code, Audit columns get three action buttons in header: play (▶ run top task), play-all (▶▶ run column), stop (⏹)
- [x] Inbox and Completed columns: no runner controls
- [x] Stop button only visible when runner is active
- [x] Play buttons disabled when runner is active

## Files
- `src/webview/ui/components/Column.tsx` - modify - add runner button props and rendering

## Tests
- [x] Runner buttons render for plan/code/audit columns only
- [x] Runner buttons NOT rendered for inbox/completed
- [x] Stop visible only when `isRunnerActive` is true
- [x] Play disabled when `isRunnerActive` is true
- [x] Clicking play fires `onRunTopTask` callback with correct stage

## Context
Column headers get runner controls for Plan, Code, and Audit columns only. Inbox and Completed columns have no runner controls since tasks there don't need automated execution.

The stop button only appears when runner is active. Play buttons are disabled during active runs.

## Audit
src/webview/ui/components/Column.tsx
src/webview/ui/components/BoardHorizontal.tsx
src/webview/ui/styles/main.css
tests/webview/column.test.tsx
