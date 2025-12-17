---
stage: plan
tags:
  - refactor
  - p0
agent: coder
contexts: []
---

# Remove Template UI Components

## Goal
Delete all UI components related to template selection and management.

## Definition of Done
- [ ] `src/webview/ui/components/TemplatePicker.tsx` deleted
- [ ] `src/webview/ui/components/TemplateModal.tsx` deleted
- [ ] Template imports removed from `index.ts`
- [ ] TemplateIcon removed from Icons.tsx (or kept if used elsewhere)

## Context
This task removes the UI components that allow users to select and manage templates. These components will no longer be needed in the agent-driven workflow.
