---
stage: code
tags: [feature, p1]
agent: coder
contexts: [skills/skill-typescript-config]
---

# Update messaging protocol for modes and runner

## Goal
Add new message types for mode management and runner state.

## Definition of Done
- [ ] New `HostToWebviewMessageTypes`: `ModesLoaded`, `RunnerStateChanged`
- [ ] New `WebviewToHostMessageTypes`: `RequestModes`, `CreateMode`, `UpdateMode`, `DeleteMode`, `RunTask`, `RunColumn`, `StopRunner`
- [ ] Runner state payload type: `{ isRunning: boolean; activeTaskId?: string; activeStage?: Stage; progress?: number }`

## Files
- `src/webview/messaging.ts` - modify - add new message types to both arrays

## Tests
- [ ] New message types validate through `EnvelopeSchema`
- [ ] Existing messaging tests pass unchanged

## Context
The messaging protocol needs new types for mode CRUD operations and runner state updates. The runner state payload tracks whether runner is active, which task is running, which stage, and progress percentage.
