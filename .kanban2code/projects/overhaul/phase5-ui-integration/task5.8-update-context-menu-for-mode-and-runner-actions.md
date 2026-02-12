---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: [skills/react-core-skills]
---

# Update context menu for mode and runner actions

## Goal
Add runner and mode/agent actions to task context menu.

## Definition of Done
- [x] "Run Task" action added — disabled if runner is active or task is inbox/completed
- [x] "Change Mode" submenu listing available modes (same pattern as existing "Change Stage" submenu)
- [x] "Change Agent" submenu for changing LLM provider

## Files
- `src/webview/ui/components/TaskContextMenu.tsx` - modify - add runner and mode/agent actions

## Tests
- [x] "Run Task" appears for plan/code/audit tasks
- [x] "Run Task" disabled when runner is active
- [x] "Change Mode" submenu lists all available modes
- [x] "Change Agent" submenu lists all available LLM providers

## Context
The task context menu needs new actions for runner and mode/agent management. "Run Task" is disabled when runner is already active.

"Change Mode" and "Change Agent" submenus follow the same pattern as existing "Change Stage" submenu.

## Audit
src/webview/ui/components/TaskContextMenu.tsx
src/webview/ui/components/Sidebar.tsx
src/webview/ui/components/Board.tsx
tests/webview/components/TaskContextMenu.test.tsx

---

## Review

**Rating: 8/10**

**Verdict: ACCEPTED**

### Summary
Clean implementation that adds "Run Task", "Change Mode", and "Change Agent" actions to the context menu following existing submenu patterns. All 4 tests pass, both Sidebar and Board correctly integrate the new props.

### Findings

#### Blockers
(none)

#### High Priority
(none)

#### Medium Priority
- [ ] Missing test for "Run Task" disabled on inbox/completed stages — the DoD specifies this behavior and the code implements it correctly (`canRunTask` only allows plan/code/audit), but no test verifies it - `tests/webview/components/TaskContextMenu.test.tsx`
- [ ] Missing test for successful "Run Task" click — no test verifies that clicking an enabled "Run Task" sends the `RunTask` message - `tests/webview/components/TaskContextMenu.test.tsx`

#### Low Priority / Nits
- [ ] Missing tests for mode/agent selection posting `SaveTaskWithMetadata` message — verifying the submenu items render is good but doesn't confirm the action works - `tests/webview/components/TaskContextMenu.test.tsx`
- [ ] Inconsistent divider IDs: `div0`, `div1`, `div15` — functional but the numbering gap is odd - `TaskContextMenu.tsx:90,107,138`

### Test Assessment
- Coverage: Adequate for core scenarios
- Missing tests: "Run Task" disabled for inbox/completed; "Run Task" click handler; mode/agent selection handler

### What's Good
- Follows existing "Change Stage" submenu pattern consistently
- `updateTaskMetadata` helper cleanly preserves all metadata fields and overrides only the changed field
- Current mode/agent filtered out of submenu options — prevents no-op selections
- Graceful fallback when no modes/agents available ("No modes available" / "No providers available")
- Both Sidebar and Board correctly pass `modes`, `agents`, `isRunnerActive` from `useTaskData()`
- `SaveTaskWithMetadata` message is handled in both `SidebarProvider.ts` and `KanbanPanel.ts`

### Recommendations
- Consider adding the missing test cases for stronger regression coverage in future work
