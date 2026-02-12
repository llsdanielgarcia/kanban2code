---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: [skills/react-core-skills]
---

# Update TaskCard for mode + runner status

## Goal
Display mode and agent on task cards, add runner status indicator.

## Definition of Done
- [x] Card footer shows both mode and agent: `coder | opus`
- [x] Fallback: shows agent only when mode is unset (backward compat)
- [x] Card-level run button (play icon) visible on Plan/Code/Audit task cards
- [x] Progress indicator (spinner/pulsing border) when runner is active on this specific task

## Files
- `src/webview/ui/components/TaskCard.tsx` - modify - add mode display + runner controls

## Tests
- [x] Card shows mode name when set
- [x] Run button visible on plan/code/audit cards, not inbox/completed
- [x] Progress indicator shown when runner active on this task

## Context
Task cards need to show both mode (behavioral role) and agent (LLM provider) in the footer. A run button appears on Plan/Code/Audit cards for single-task execution.

When runner is active on a specific task, show a progress indicator (spinner or pulsing border).

## Audit
- `src/webview/ui/components/TaskCard.tsx`
- `src/webview/ui/components/Icons.tsx`
- `src/webview/ui/components/Column.tsx`
- `src/webview/ui/components/BoardHorizontal.tsx`
- `src/webview/ui/styles/main.css`
- `tests/webview/taskcard.test.tsx`

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
TaskCard now correctly shows `mode | agent`, preserves backward compatibility when `mode` is missing, and exposes per-card runner state/controls for Plan/Code/Audit with passing component tests.

### Findings

#### Blockers
- [ ] None.

#### High Priority
- [ ] None.

#### Medium Priority
- [ ] None.

#### Low Priority / Nits
- [ ] Add a TaskCard test that clicks the new `Run task` button and asserts `onRunTask(task)` is called (current tests cover visibility/state but not callback wiring) - `tests/webview/taskcard.test.tsx`

### Test Assessment
- Coverage: Adequate
- Missing tests: `Run task` button callback invocation from TaskCard

### What's Good
- Runner state plumbing is cleanly threaded (`BoardHorizontal` -> `Column` -> `TaskCard`) and scoped correctly to the active task via `runningTaskId`.
- Styling and accessibility are sensible (`aria-label` on spinner and action button, disabled state styling for run action).

### Recommendations
- Add the callback test above to lock in behavior and prevent future regressions in button wiring.
