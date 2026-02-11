---
stage: code
tags: [feature, p1]
agent: coder
contexts: [skills/react-core-skills]
---

# Update TaskModal and TaskEditorModal for mode field

## Goal
Add ModePicker to both task modals.

## Definition of Done
- [ ] `TaskModal`: ModePicker below AgentPicker, both optional
- [ ] `TaskEditorModal`: metadata panel includes both mode and agent pickers
- [ ] Save payload includes both `mode` and `agent` fields in `SaveTaskWithMetadata` message

## Files
- `src/webview/ui/components/TaskModal.tsx` - modify - add ModePicker
- `src/webview/ui/components/TaskEditorModal.tsx` - modify - add ModePicker to metadata panel

## Tests
- [ ] Both modals render mode and agent pickers
- [ ] Save sends both fields in payload
- [ ] Missing mode saves as null (backward compat)

## Context
Both task creation and editing modals need ModePicker alongside AgentPicker. The save payload must include both `mode` and `agent` fields.

Missing mode saves as null for backward compatibility with existing tasks.
