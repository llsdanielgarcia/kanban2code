---
stage: plan
tags:
  - refactor
  - p1
agent: coder
contexts: []
---

# Remove Template Messaging

## Goal
Remove all template-related message types and handlers from the messaging system.

## Definition of Done
- [ ] `messaging.ts` - Remove template message types:
  - `TemplatesLoaded`, `TemplateContentLoaded`, `TemplateContentLoadFailed`
  - `CreateTemplate`, `UpdateTemplate`, `RequestTemplates`, `RequestTemplateContent`
- [ ] `SidebarProvider.ts` - Remove template message handlers
- [ ] `KanbanPanel.ts` - Remove template message handlers

## Context
This task cleans up the messaging system by removing all template-related communication between the webview and extension. This includes message types and their corresponding handlers.
