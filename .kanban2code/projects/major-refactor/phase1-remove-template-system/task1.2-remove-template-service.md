---
stage: audit
tags:
  - refactor
  - p0
agent: coder
contexts: []
---

# Remove Template Service

## Goal
Delete the core template service and all its references throughout the codebase.

## Definition of Done
- [x] `src/services/template.ts` deleted
- [x] All imports of template service removed from other files
- [x] `tests/template-service.test.ts` deleted
- [x] Build passes without template service

## Context
This task removes the central template service that handles template loading, parsing, and management. This is a critical step in removing the template system entirely.
