# Phase 1 Audit: Filesystem and Tasks

## Checklist (Tasks 1.1–1.9)
- [x] 1.1 Task parsing and serialization implemented in `src/services/frontmatter.ts`; defaults to inbox, infers project/phase, preserves unknown fields when original content is provided.
- [x] 1.2 Recursive task loading implemented in `src/services/scanner.ts`; scans inbox/projects, ignores `_context.md`, tolerates missing folders.
- [x] 1.3 Stage update guards implemented via `src/services/stage-manager.ts` and `src/core/rules.ts`; forward-only transitions with helper to reload by ID.
- [ ] 1.4 Archive behavior partially done: services in `src/services/archive.ts` move completed tasks/projects safely, but no VS Code archive commands are registered in `src/commands/index.ts`.
- [ ] 1.5 Extended workspace validation partial: `src/workspace/validation.ts` returns `valid/missing/invalid` and includes safe-path guards, but never surfaces `forbidden` and messaging is minimal.
- [x] 1.6 Frontmatter unit tests present in `tests/frontmatter.test.ts` (defaults, invalid YAML, unknown-field preservation, round-trips).
- [x] 1.7 Task loading integration tests present in `tests/task-loading.test.ts` (empty workspace, inbox/projects/phase inference, malformed frontmatter, `_context` exclusion).
- [ ] 1.8 File watcher only partially delivered: `src/services/task-watcher.ts` and `tests/task-watcher.test.ts` cover debounce and move detection, but it is not wired into the extension or loader refresh logic.
- [ ] 1.9 Webview architecture largely missing: `src/webview/messaging.ts` has a versioned envelope, but there are no Zustand stores or component library, message coverage is minimal, and `src/webview/ui/App.tsx` still uses placeholder UI and imports a non-existent `createMessage`.

## Findings by Task
- **1.1 Frontmatter:** Parses with `gray-matter`, defaults `stage` to `inbox`, infers project/phase from paths, and preserves unknown fields when serializing with original content. Invalid YAML logs a warning instead of throwing. Tags/contexts are normalized to arrays; `phase` is `undefined` when absent (spec calls for null).
- **1.2 Task loading:** `findAllTaskFiles` uses fast-glob over inbox/projects and excludes `_context.md`; `_archive` is not traversed. Parse errors are logged and skipped. Phase inference relies on the helper in `src/services/frontmatter.ts`.
- **1.3 Stage transitions:** `isTransitionAllowed` allows only forward moves (plus same-stage no-op). `updateTaskStage` reloads from disk before writing and preserves existing frontmatter fields. No UI wiring yet.
- **1.4 Archiving:** `archiveTask` enforces `stage === 'completed'`, mirrors folder shape under `_archive/`, and uses `ensureSafePath`. `archiveProject` renames the whole project folder. Missing VS Code commands (`Archive Task`, `Archive Completed in Project`, `Archive Project`) and no guard against archiving already-archived items.
- **1.5 Validation:** `validateKanbanStructure` checks `.kanban2code` plus inbox/projects, and safe-path helpers exist. There is no path to emit `forbidden` for permission errors, and messages are generic.
- **1.6–1.7 Tests:** Vitest suites exercise frontmatter parsing/serialization and task loading (empty, inbox/projects/phase, malformed frontmatter, context exclusion). Tests accept `phase` as `undefined`.
- **1.8 Watcher:** Debounced create/update/delete/move events ignoring `_context.md` are implemented and tested with a fake watcher. Not connected to the extension host to trigger reloads.
- **1.9 Webview:** Envelope validation with zod is present and unit-tested. React UI remains a placeholder without Zustand stores or shared components; message types are minimal and inconsistent (`App.tsx` imports `createMessage`, which is not exported), so host/webview communication would fail.

## Behavior Summary
- Tasks parse from Markdown with `stage` defaulting to `inbox`, title inferred from the first `#`, and project/phase inferred from paths under `projects/`.
- Task loading scans `.kanban2code/inbox` and `.kanban2code/projects/**`, excluding `_context.md`, and ignores `_archive`.
- Stage transitions are forward-only (`inbox → plan → code → audit → completed`); completed tasks are terminal unless archived.
- Archiving services mirror original paths under `_archive/` and validate paths stay inside the Kanban root.

## Testing Summary
- `bun test` on 2025-12-10: all suites pass (frontmatter, task loading, stage manager, archive, watcher, validation, messaging, scaffolder). Invalid frontmatter warnings appear during tests by design.

## Gaps / Risks
- Archive and watcher features are not exposed to VS Code commands or integrated with task reloads.
- Webview architecture (stores, components, real message contracts) is missing; the current UI would fail to send messages due to missing exports.
- Validation lacks a `forbidden` status path and more descriptive messages; `phase` inference returns `undefined` instead of the `null` noted in the spec.

Checked by: Codex (2025-12-10)
