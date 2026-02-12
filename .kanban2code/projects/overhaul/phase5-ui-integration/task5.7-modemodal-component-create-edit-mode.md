---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: [skills/react-core-skills]
---

# ModeModal component (create/edit mode)

## Goal
Create modal for creating and editing mode files.

## Definition of Done
- [x] Free-text markdown editor modal following same glassmorphic pattern as `AgentModal`
- [x] Fields: name (required), description (required), stage (optional dropdown), instructions (textarea, large)
- [x] Submit sends `CreateMode` or `UpdateMode` message depending on context
- [x] Can be opened in edit mode with pre-populated content from existing mode file

## Files
- `src/webview/ui/components/ModeModal.tsx` - create - mode create/edit modal

## Tests
- [x] Renders all form fields (name, description, stage, instructions)
- [x] Validates required fields before submit
- [x] Edit mode pre-populates fields from existing mode

## Context
The ModeModal allows users to create custom modes or edit existing ones. It follows the same glassmorphic pattern as AgentModal for visual consistency.

Fields include name, description, stage (optional), and instructions (large textarea for markdown content).

## Audit
src/webview/ui/components/ModeModal.tsx
src/webview/ui/components/index.ts
src/webview/ui/styles/main.css
tests/webview/components/ModeModal.test.tsx
