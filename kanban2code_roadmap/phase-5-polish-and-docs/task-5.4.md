---
stage: plan
title: Polish how-it-works and project documentation
tags:
  - mvp
  - docs
  - polish
created: 2025-12-07T00:00:00Z
---

# Polish How-It-Works and Project Documentation

## Goal
Make it easy for both you and AI agents to understand the Kanban2Code system.

## Scope
- Refine `how-it-works.md`:
  - Emphasize Inbox-first philosophy.
  - Describe stage semantics.
  - Explain tags-as-type convention (`bug`, `idea`, `roadmap`, etc.).
- Update `architecture.md` to reflect actual extension architecture.
- Update `project-details.md` with:
  - Clear problem statement.
  - Users (solo devs with multi-agent workflows).
  - Success criteria.

## Notes
These docs become core context for AI agents and future you.

## Audit Instructions
After completing this task, please update the [Phase 5 Audit](../phase#_audit.md) with:
1. **Files Created**: List all files created in this task with their purpose
2. **Files Modified**: List any existing files that were modified and why
3. **Files Analyzed**: List any files that were examined for reference
4. **Key Changes**: Briefly describe the main changes made to support this task
5. **Tests Created**: List all test files created with Vitest for the new/modified functionality

Example format:
- **Files Created**:
  - `how-it-works.md` - Updated with improved documentation
  - `architecture.md` - Updated with current architecture
  - `project-details.md` - Updated with project information
- **Tests Created**:
  - `tests/docs/how-it-works.test.md` - Vitest tests for documentation validation

**Testing Requirements**: All created/modified files that can be tested must have corresponding Vitest test files. Run `bun test` to verify all tests pass before completing this task.