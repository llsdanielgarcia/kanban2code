---
stage: code
tags: [feature, p1]
agent: coder
contexts: [skills/react-core-skills]
---

# Wire runner messages through webview hosts

## Goal
Connect runner commands and state updates to webview messaging.

## Definition of Done
- [ ] `KanbanPanel.ts` handles `RunTask`, `RunColumn`, `StopRunner` messages → dispatches to runner commands
- [ ] `SidebarProvider.ts` handles `RequestModes`, `CreateMode` + runner messages
- [ ] Both forward `RunnerStateChanged` events from runner engine to webview
- [ ] `useTaskData.ts` hook exposes `modes`, `isRunnerActive`, `activeRunnerTaskId` in return value

## Files
- `src/webview/KanbanPanel.ts` - modify - add runner message handlers
- `src/webview/SidebarProvider.ts` - modify - add mode + runner message handlers
- `src/webview/ui/hooks/useTaskData.ts` - modify - track modes and runner state

## Tests
- [ ] `RunTask` message triggers runner command execution
- [ ] Runner state change propagates to webview via `RunnerStateChanged`
- [ ] `useTaskData` exposes modes array and runner state

## Context
The webview hosts need to handle runner-related messages. KanbanPanel handles board runner actions (RunTask, RunColumn, StopRunner). SidebarProvider handles mode CRUD operations.

Both hosts forward `RunnerStateChanged` events from the runner engine to the webview so UI can update in real-time.
