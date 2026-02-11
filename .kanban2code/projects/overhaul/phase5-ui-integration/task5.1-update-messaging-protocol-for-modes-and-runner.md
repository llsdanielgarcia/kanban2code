---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: [skills/skill-typescript-config]
---

# Update messaging protocol for modes and runner

## Goal

Add new message types for mode management and runner state.

## Definition of Done

- [x] New `HostToWebviewMessageTypes`: `ModesLoaded`, `RunnerStateChanged`
- [x] New `WebviewToHostMessageTypes`: `RequestModes`, `CreateMode`, `UpdateMode`, `DeleteMode`, `RunTask`, `RunColumn`, `StopRunner`
- [x] Runner state payload type: `{ isRunning: boolean; activeTaskId?: string; activeStage?: Stage; progress?: number }`

## Files

- `src/webview/messaging.ts` - modify - add new message types to both arrays

## Tests

- [x] New message types validate through `EnvelopeSchema`
- [x] Existing messaging tests pass unchanged

## Context

The messaging protocol needs new types for mode CRUD operations and runner state updates. The runner state payload tracks whether runner is active, which task is running, which stage, and progress percentage.

## Audit

- src/webview/messaging.ts
- tests/webview.test.ts

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
The messaging protocol updates are implemented correctly and match the definition of done. New message types and runner-state parsing are in place with targeted validation tests that pass.

### Findings

#### Blockers
- None.

#### High Priority
- None.

#### Medium Priority
- None.

#### Low Priority / Nits
- None.

### Test Assessment
- Coverage: Adequate
- Missing tests: No critical gaps for this task scope.

### What's Good
- `RunnerState` has both compile-time (`Stage`) and runtime (`RunnerStateSchema`) validation, and all newly introduced message types are explicitly exercised in tests.

### Recommendations
- Optionally add an integration-level test in a later task that verifies these message types are wired through host/webview handlers end-to-end.
