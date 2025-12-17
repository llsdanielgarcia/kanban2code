---
stage: plan
tags:
  - refactor
  - p1
agent: coder
contexts: []
---

# Update TaskModal and TaskEditorModal

## Goal
Remove template-related functionality from task creation and editing modals.

## Definition of Done
- [ ] `TaskModal.tsx` - Template picker section removed
- [ ] `TaskEditorModal.tsx` - Template picker and loading removed
- [ ] Template warning dialog removed from TaskEditorModal
- [ ] Both modals render correctly without templates

## Context
This task updates the main task creation and editing modals to work without the template system. The modals should still function for creating and editing tasks, but without any template-related UI.
