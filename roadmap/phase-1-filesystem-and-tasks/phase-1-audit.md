# Phase 1 Audit: Filesystem and Tasks

## Checklist (Tasks 1.1–1.9)
- [x] 1.1 Task parsing and serialization implemented with gray-matter, defaults, and unknown-field preservation.
- [x] 1.2 Recursive task loading over inbox/projects with path inference.
- [x] 1.3 Stage update guards enforce forward-only transitions and file-only updates.
- [x] 1.4 Archive behavior moves completed items and projects into `_archive/` structure with safety checks.
- [x] 1.5 Workspace validation returns status enums and safe-path guards.
- [x] 1.6 Frontmatter unit tests cover defaults, invalid YAML handling, and round-trips.
- [x] 1.7 Task loading integration tests cover empty/malformed/context exclusions.
- [x] 1.8 File watcher emits debounced task events (create/update/delete/move) ignoring `_context`.
- [x] 1.9 Webview messaging uses versioned envelopes with runtime validation and typed message kinds.

## Behavior Summary
- Tasks parse from Markdown with default `stage: inbox`, inferred `project/phase` from path, and preserved unknown fields on stringify.
- Loading scans `.kanban2code/inbox` and `projects/**` (excluding `_context.md`) and tolerates missing folders.
- Stage transitions are forward-only (`inbox → plan → code → audit → completed`); completed items are terminal until archived.
- Archiving keeps folder shape under `_archive/`, guarded by path validation.

## Testing Summary
- Unit: frontmatter parsing/serialization, stage update guards, validation helpers, watcher debounce/move detection, messaging envelopes.
- Integration: task loading over inbox/projects structures with malformed file handling.

## Notes / Edge Cases
- Move detection pairs fast delete→create as a `moved` event; slower moves emit separate delete/create events.
- Validation exposes generic error copy via `formatValidationMessage`; extend in UI as needed.

Checked by: Codex (2025-01-15)
