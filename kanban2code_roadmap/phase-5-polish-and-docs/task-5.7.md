---
stage: plan
title: Define formal tag taxonomy and conventions
tags:
  - mvp
  - docs
  - taxonomy
created: 2025-12-07T00:00:00Z
---

# Define Formal Tag Taxonomy and Conventions

## Goal
Establish clear, consistent tagging system for tasks to improve organization and filtering.

## Scope
- Create tag taxonomy documentation in `how-it-works.md`:
  - **Scope**: mvp, post-v1
  - **Type**: bug, feature, spike, idea, roadmap
  - **Domain**: infra, ui, context, board, filesystem
  - **Priority**: urgent (optional)
- Update task creation UI to:
  - Provide tag suggestions based on taxonomy
  - Allow free-text entry with autocomplete
  - Visual distinction between tag categories
- Update filtering system to support tag categories:
  - Filter by scope (MVP vs post-v1)
  - Filter by type (bugs only, features only)
  - Filter by domain (infra tasks, UI tasks)

## Notes
Tags should be an input field for users to type if that helps their workflow, but taxonomy provides structure and consistency.

## Audit Instructions
After completing this task, please update the [Phase 5 Audit](../phase#_audit.md) with:
1. **Files Created**: List all files created in this task with their purpose
2. **Files Modified**: List any existing files that were modified and why
3. **Files Analyzed**: List any files that were examined for reference
4. **Key Changes**: Briefly describe the main changes made to support this task
5. **Tests Created**: List all test files created with Vitest for the new/modified functionality

Example format:
- **Files Created**:
  - `docs/tag-taxonomy.md` - Tag taxonomy documentation
- **Tests Created**:
  - `tests/docs/tagTaxonomy.test.md` - Vitest tests for tag taxonomy validation

**Testing Requirements**: All created/modified files that can be tested must have corresponding Vitest test files. Run `bun test` to verify all tests pass before completing this task.