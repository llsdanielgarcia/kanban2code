# Phase 2 Context System Audit

## Checklist (Tasks 2.1–2.6)
- [x] 2.1 Implement context file loaders
- [x] 2.2 Implement XML prompt builder (9-layer context)
- [x] 2.3 Implement stage template resolution
- [x] 2.4 Implement copy modes and payload builder
- [x] 2.5 Integrate copy with VS Code clipboard
- [x] 2.6 Implement unit tests for context system

## XML Prompt Structure
- Wrapper: `<system>` root containing `<context>` and optional `<task>`.
- Context layers (ordered): global (how-it-works → architecture → project-details), agent, project, phase, stage template, custom contexts.
- Task payload: `<metadata>` (id, filePath, title, stage, project, phase, agent, parent, order, created, tags, contexts) + `<content>` with escaped markdown body.
- Missing context files degrade to empty sections; stage template uses a readable fallback when absent.

## Testing Summary
- Added: `tests/context-service.test.ts`, `tests/prompt-builder.test.ts`, `tests/copy-service.test.ts`.
- Coverage: path safety, missing-file fallbacks, 9-layer ordering, context-only/task-only modes, clipboard write behavior.
- Command: `bun run test` (Vitest) — all tests passing.

## Notes and Outstanding Risks
- Clipboard integration depends on VS Code host API at runtime; mocked in tests.
- Performance is bounded by file reads; consider caching in future phases if context sizes grow.
- Context names are resolved relative to kanban root with `.md` auto-extension; keep names sanitized to avoid surprises.
