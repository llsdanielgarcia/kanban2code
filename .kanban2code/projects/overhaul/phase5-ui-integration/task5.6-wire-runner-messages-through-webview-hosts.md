---
stage: completed
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

---

## Review

**Rating: 8/10**

**Verdict: ACCEPTED**

### Summary
All four Definition of Done items are fully met. Runner messages (`RunTask`, `RunColumn`, `StopRunner`) are handled in both webview hosts, mode CRUD (`RequestModes`, `CreateMode`) is handled in SidebarProvider, `RunnerStateChanged` events propagate from the runner engine to both webviews, and `useTaskData` exposes `modes`, `isRunnerActive`, and `activeRunnerTaskId`.

### Findings

#### High Priority
- (none)

#### Medium Priority
- [ ] `RunTask` test uses bare `{}` as `this` context when calling `_handleWebviewMessage` directly — this works but is fragile and doesn't validate the actual class wiring - `tests/webview-host-runner.test.ts:17`
- [ ] No tests for `RunColumn` or `StopRunner` message handling in either host - `tests/webview-host-runner.test.ts`

#### Low Priority / Nits
- [ ] Redundant runner state posting: both hosts include `isRunnerActive`/`activeRunnerTaskId` in `InitState` payload AND immediately call `postRunnerState(getRunnerState())` after `_sendInitialState()` — harmless but redundant - `KanbanPanel.ts:583-587`, `SidebarProvider.ts:576-582`
- [ ] No test for KanbanPanel's `onRunnerStateChanged` subscription (only SidebarProvider's forwarding is tested)

### Test Assessment
- Coverage: Adequate — core flows (RunTask dispatch, state forwarding, hook state tracking) are tested
- Missing tests: `RunColumn` handler, `StopRunner` handler, KanbanPanel runner state subscription

### What's Good
- `runner-state.ts` is a clean, minimal event emitter with proper copy semantics (spreads state on get/set)
- Both hosts properly subscribe on init and unsubscribe on dispose, preventing memory leaks
- `useTaskData` uses `parseRunnerState` from the messaging module for defensive validation with graceful error handling
- Stage validation in `RunColumn` handlers correctly restricts to `plan`/`code`/`audit`
- `useTaskData.runner.test.tsx` verifies the full lifecycle: InitState → RunnerStateChanged → hook state update

### Recommendations
- Consider consolidating runner state delivery to avoid the dual `InitState` + `RunnerStateChanged` pattern on initial load
- Add a `RunColumn` test case to complete runner message coverage
