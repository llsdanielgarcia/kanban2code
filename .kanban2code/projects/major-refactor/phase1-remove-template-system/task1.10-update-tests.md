---
stage: plan
tags:
  - test
  - p2
agent: coder
contexts: []
---

# Update Tests

## Goal
Remove template-related tests and update existing tests to work without templates.
When you're done update stage: code to stage: audit

## Definition of Done
- [x] `template-service.test.ts` deleted
- [x] `task-editor-modal.test.tsx` - Template tests removed
- [x] `scaffolder.test.ts` - No template assertions (no changes needed)
- [x] `context-service.test.ts` - Stage template tests updated
- [ ] All remaining tests pass

## Context
This task cleans up the test suite by removing tests for template functionality and updating tests that may have dependencies on the template system.
