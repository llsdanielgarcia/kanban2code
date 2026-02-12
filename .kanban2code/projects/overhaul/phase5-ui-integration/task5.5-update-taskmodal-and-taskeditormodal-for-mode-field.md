---
stage: completed
tags:
  - feature
  - p1
agent: auditor
contexts:
  - architecture
skills:
  - react-core-skills
---

# Update TaskModal and TaskEditorModal for mode field

## Goal
Add ModePicker to both task modals.

## Definition of Done
- [x] `TaskModal`: ModePicker below AgentPicker, both optional
- [x] `TaskEditorModal`: metadata panel includes both mode and agent pickers
- [x] Save payload includes both `mode` and `agent` fields in `SaveTaskWithMetadata` message

## Files
- `src/webview/ui/components/TaskModal.tsx` - modify - add ModePicker
- `src/webview/ui/components/TaskEditorModal.tsx` - modify - add ModePicker to metadata panel

## Tests
- [x] Both modals render mode and agent pickers
- [x] Save sends both fields in payload
- [x] Missing mode saves as null (backward compat)

## Context
Both task creation and editing modals need ModePicker alongside AgentPicker. The save payload must include both `mode` and `agent` fields.

Missing mode saves as null for backward compatibility with existing tasks.

## Audit
src/webview/ui/components/TaskModal.tsx
src/webview/ui/components/TaskEditorModal.tsx
src/webview/ui/components/Sidebar.tsx
src/webview/ui/components/Board.tsx
src/webview/ui/hooks/useTaskData.ts
src/webview/SidebarProvider.ts
src/webview/KanbanPanel.ts
src/commands/index.ts
tests/webview/task-modal-create-project.test.tsx
tests/webview/task-editor-modal.test.tsx

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Clean, well-integrated implementation that adds ModePicker to both TaskModal and TaskEditorModal with full end-to-end data flow from backend providers through to save payloads. All definition-of-done criteria are met with solid test coverage.

### Findings

#### Blockers
(none)

#### High Priority
(none)

#### Medium Priority
- [ ] `onCreateNew={() => {}}` is a no-op in both modals - `TaskModal.tsx:296`, `TaskEditorModal.tsx:397`. The "Create new mode" link renders but does nothing. This is acceptable as a placeholder but should be wired in a future task.

#### Low Priority / Nits
- [ ] `TaskFormData.mode` in TaskModal uses `string | null` but submit converts to `undefined` via `formData.mode || undefined` (`TaskModal.tsx:169`). This is consistent with how `agent` is handled, but the type could be `string | undefined` to match the output shape.

### Test Assessment
- Coverage: Adequate — 11 tests across 2 test files covering both modals
- Tests verify: rendering of both pickers, CreateTask payload with mode+agent, SaveTaskWithMetadata payload with mode+agent, null mode backward compatibility, dirty indicator on metadata change, tag management, location syncing, project creation
- Missing tests: none significant — the key flows are all covered

### What's Good
- Full data flow: `useTaskData` exposes `modes`, `Sidebar`/`Board` thread them to `TaskModal`, `SidebarProvider`/`KanbanPanel` load modes via `listAvailableModes` and send them in both `InitState` and `FullTaskDataLoaded`
- `TaskEditorModal` properly includes `mode` in dirty checking via `isMetadataDirty` memo
- `saveTaskWithMetadata` in `task-content.ts` correctly handles `mode: string | null` and maps `null` to `undefined` for the Task object
- `newTask` command in `commands/index.ts` writes `mode` to frontmatter when provided
- Consistent pattern: ModePicker placed immediately below AgentPicker in both modals under the "Assignment" section in the editor

### Recommendations
- Wire the `onCreateNew` callback to open a mode creation flow when that feature is implemented
