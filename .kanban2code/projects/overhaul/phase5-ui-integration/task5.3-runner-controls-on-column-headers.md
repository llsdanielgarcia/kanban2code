---
stage: code
tags: [feature, p1]
agent: coder
contexts: [skills/react-core-skills]
---

# Runner controls on Column headers

## Goal
Add runner control buttons to Plan, Code, and Audit column headers.

## Definition of Done
- [ ] Plan, Code, Audit columns get three action buttons in header: play (▶ run top task), play-all (▶▶ run column), stop (⏹)
- [ ] Inbox and Completed columns: no runner controls
- [ ] Stop button only visible when runner is active
- [ ] Play buttons disabled when runner is active

## Files
- `src/webview/ui/components/Column.tsx` - modify - add runner button props and rendering

## Tests
- [ ] Runner buttons render for plan/code/audit columns only
- [ ] Runner buttons NOT rendered for inbox/completed
- [ ] Stop visible only when `isRunnerActive` is true
- [ ] Play disabled when `isRunnerActive` is true
- [ ] Clicking play fires `onRunTopTask` callback with correct stage

## Context
Column headers get runner controls for Plan, Code, and Audit columns only. Inbox and Completed columns have no runner controls since tasks there don't need automated execution.

The stop button only appears when runner is active. Play buttons are disabled during active runs.
