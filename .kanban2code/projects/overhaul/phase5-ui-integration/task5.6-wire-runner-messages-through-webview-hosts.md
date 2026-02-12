---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: [skills/react-core-skills]
---

# Wire runner messages through webview hosts

## Goal
Connect runner commands and state updates to webview messaging.

## Definition of Done
- [x] `KanbanPanel.ts` handles `RunTask`, `RunColumn`, `StopRunner` messages → dispatches to runner commands
- [x] `SidebarProvider.ts` handles `RequestModes`, `CreateMode` + runner messages
- [x] Both forward `RunnerStateChanged` events from runner engine to webview
- [x] `useTaskData.ts` hook exposes `modes`, `isRunnerActive`, `activeRunnerTaskId` in return value

## Files
- `src/webview/KanbanPanel.ts` - modify - add runner message handlers
- `src/webview/SidebarProvider.ts` - modify - add mode + runner message handlers
- `src/webview/ui/hooks/useTaskData.ts` - modify - track modes and runner state

## Tests
- [x] `RunTask` message triggers runner command execution
- [x] Runner state change propagates to webview via `RunnerStateChanged`
- [x] `useTaskData` exposes modes array and runner state

## Context
The webview hosts need to handle runner-related messages. KanbanPanel handles board runner actions (RunTask, RunColumn, StopRunner). SidebarProvider handles mode CRUD operations.

Both hosts forward `RunnerStateChanged` events from the runner engine to the webview so UI can update in real-time.

## Audit
src/runner/runner-state.ts
src/extension.ts
src/webview/KanbanPanel.ts
src/webview/SidebarProvider.ts
src/webview/ui/hooks/useTaskData.ts
tests/webview-host-runner.test.ts
tests/webview/useTaskData.runner.test.tsx
