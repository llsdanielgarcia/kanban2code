# End-to-End / Integration Test Results

**Date:** 2025-12-14  
**Scope:** Phase 5 integration testing (workflow-level verification)  
**Status:** Complete

## How to Run

```bash
bun run test
bun run test:e2e
```

## Coverage Map (Acceptance Criteria)

| Requirement | Coverage | Notes |
|---|---|---|
| Config loads and values are accessible | `tests/config-service.test.ts` | Verifies merge behavior and accessors |
| Missing/invalid `config.json` handled | `tests/config-service.test.ts` | Verifies fallback to `DEFAULT_CONFIG` |
| Tasks created from templates have valid frontmatter | `tests/template-service.test.ts` + command behavior | Template metadata parsing is tested; task creation currently stores `template:` in frontmatter but does not auto-apply template body |
| File watcher detects AI-created tasks | `tests/task-watcher.test.ts` | Verifies `created` events and debounce behavior |
| Context copying produces correct format | `tests/copy-service.test.ts` | Verifies `full_xml`, `task_only`, `context_only` payloads |
| Stage transitions work properly | `tests/stage-manager.test.ts` + `tests/e2e/core-workflows.test.ts` | Covers allowed transitions and full pipeline progression |

## Manual Smoke Workflow (VS Code)

1. Run `Kanban2Code: Scaffold Workspace`.
2. Create a task via the sidebar modal, set `stage`, `tags`, and `agent`.
3. Use the task context menu to move the task through stages (`Inbox → Plan → Code → Audit → Completed`).
4. Run `Kanban2Code: Copy Task Context (Full XML)` and confirm:
   - `<task>` contains title + body
   - `<context>` includes stage template + selected contexts
5. Create a new task file manually under `.kanban2code/inbox/` and confirm the sidebar refreshes.

## Results

- Unit tests (`bun run test`): ✅ pass
- E2E tests (`bun run test:e2e`): ✅ pass
