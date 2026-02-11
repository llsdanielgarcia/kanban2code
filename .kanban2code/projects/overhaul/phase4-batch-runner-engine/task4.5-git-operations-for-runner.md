---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: []
---

# Git operations for runner

## Goal
Create git helper functions for runner to commit changes after successful audits.

## Definition of Done
- [x] `commitRunnerChanges(taskTitle)` — runs `git add -A && git commit -m "feat(runner): {taskTitle} [auto]"`, returns commit hash
- [x] `isWorkingTreeClean()` — checks for uncommitted changes
- [x] `hasUncommittedChanges()` — inverse of above

## Files
- `src/runner/git-ops.ts` - create - git helper functions

## Tests
- [x] Commit message follows format `feat(runner): {title} [auto]`
- [x] `isWorkingTreeClean` returns true when no pending changes
- [x] Returns commit hash string on success

## Context
The runner commits after each successful audit (rating 8+). The auditor mode instructions include a step to stage and commit the changes, but in automated mode the runner handles this directly.

The commit format `feat(runner): {taskTitle} [auto]` makes it easy to identify runner-generated commits in git history.

## Audit
- `src/runner/git-ops.ts`
- `tests/git-ops.test.ts`
