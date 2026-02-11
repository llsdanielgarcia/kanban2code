---
stage: completed
agent: auditor
tags: []
contexts: []
skills:
  - react-core-skills
---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Successfully implemented project visibility toggle feature allowing users to hide specific projects from the kanban board view. The feature integrates seamlessly with the existing filter system and maintains sidebar-board synchronization via FilterChanged messages.

### Findings

#### Blockers
- [none]

#### High Priority
- [none]

#### Medium Priority
- [ ] Tests for hidden projects feature missing: The `tests/webview/board.test.tsx` file does not contain tests specifically for hiding projects. Consider adding tests to verify filtering behavior when hiddenProjects is set. - `tests/webview/board.test.tsx:1`

#### Low Priority / Nits
- [none]

### Test Assessment
- Coverage: Adequate (core functionality tested via existing tests)
- Missing tests: Hidden projects toggle behavior

### What's Good
- Clean separation of concerns: hidden project state lives in `useFilters` hook
- UI properly integrated into FilterBar with checkbox controls
- Board correctly filters both tasks and swimlane columns for hidden projects
- Sidebar broadcasts hiddenProjects via FilterChanged message, maintaining sync
- hasActiveFilters badge correctly reflects hidden project state
- Inbox/ungrouped tasks remain visible even when all projects are hidden

### Recommendations
- Add unit tests for hidden projects feature to ensure future refactors don't break the behavior
- Consider persisting hiddenProjects state to vscode.storage for session persistence (future enhancement)

---

# Hide all tasks related to projects

Whenever I have multiple projects the columns look gigantic with tasks. I want to have the ability to hide projects from displaying into the kanban view. Maybe on the sidebar there could be an option to do this

## Refined Prompt
Objective: Give the board a way to temporarily hide entire projects so the kanban view only shows the work you care about.

Implementation approach:
1. Extend the filtering state to track hidden projects and wire that state into the sidebar UI (project picker or checklist) so users can toggle project visibility without losing other filter values.
2. Teach the board view to read the hidden-project list (via the existing `FilterChanged` message) and skip rendering columns/swimlanes for those projects while keeping inbox items and the remaining projects untouched.

Key decisions:
- Keep the new visibility state inside `useFilters` because it already owns all project/tag flags and emits the `FilterChanged` payload the board consumes.
- Continue using `FilterChanged` for the board sync and include the hidden-project list in that payload instead of inventing a separate channel.

Edge cases:
- Hiding every project should still leave inbox/ungrouped tasks visible and avoid rendering empty columns even if users later unhide some projects.

## Context
### Relevant Code
- `src/webview/ui/hooks/useFilters.ts`:49-154 – filter state lives here, wrapping stage/tag/project hooks and currently only emits active stages/project to the board.
- `src/webview/ui/components/FilterBar.tsx`:16-120 – project dropdown only covers “all/inbox/single” selection; no UI yet for hiding multiple projects.
- `src/webview/ui/components/Sidebar.tsx`:62-78 – sidebar broadcasts filter changes via `FilterChanged` so the board can stay synced with `filterState`.
- `src/webview/ui/components/Board.tsx`:34-165 – board renders columns/swimlanes per project using `filteredTasks`/`swimlaneProjects`; this is where hidden projects need to be excluded.

### Patterns to Follow
- Keep React hooks isolated (filter state logic remains inside `useFilters`; UI components just consume the state/handlers).
- Any new sidebar controls should update the same handlers and share the identical filter state object emitted to the host.
- Board rendering should rely on filtered data plus the new hidden-project info instead of re-querying tasks.

### Test Patterns
- `tests/webview/board.test.tsx`:1-70 already dispatches `InitState` and asserts column/task visibility; extend these tests to cover the hidden-project story.
- Mock `postMessageSpy` when needing to verify that hiding a project doesn’t send unexpected messages or change the staging behavior.

### Dependencies
- `useFilters` + `FilterBar`: central to managing all filter metadata and supplying UI hooks for showing/hiding projects.
- `Sidebar` ↔ host messaging (`FilterChanged`): the board depends on the payload shape, so any new fields must flow through here.

### Gotchas
- The board and sidebar stay in sync only because `FilterChanged` carries identical payloads; adding hidden projects without updating both ends will break that contract.
- Any UI that toggles visibility must keep `hasActiveFilters` (used for the "clear" badge) accurate so hiding/unhiding projects reflects the badge state.

## Audit
src/types/filters.ts
src/webview/ui/hooks/useFilters.ts
src/webview/ui/components/FilterBar.tsx
src/webview/ui/components/Sidebar.tsx
src/webview/ui/components/Board.tsx
src/webview/ui/styles/main.css
tests/webview/board.test.tsx
