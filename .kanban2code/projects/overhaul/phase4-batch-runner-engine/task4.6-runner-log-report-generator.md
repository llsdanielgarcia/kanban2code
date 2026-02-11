---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: []
---

# Runner log/report generator

## Goal
Create log generator that produces markdown reports for morning review.

## Definition of Done
- [x] `RunnerLog` class: `startRun()`, `recordTask(result)`, `finishRun(reason)`, `toMarkdown()`, `save(root)`
- [x] Markdown matches spec: summary table (tasks processed, completed, failed, crashed, total time) + per-task details (mode, agent, tokens, time, commit, attempts, error)
- [x] Writes to `.kanban2code/_logs/run-{timestamp}.md`, creates `_logs/` if missing

## Files
- `src/runner/runner-log.ts` - create - log generation and persistence

## Tests
- [x] `toMarkdown()` generates valid markdown with correct headers
- [x] Summary counts match (completed, failed, crashed totals)
- [x] Per-task section includes all required fields
- [x] Handles zero-task run gracefully

## Context
The runner log provides a morning review report showing what happened during overnight execution. Each task gets a detailed entry with mode, agent, tokens, time, commit hash, attempts, and any errors.

Logs are written to `.kanban2code/_logs/run-{timestamp}.md` for easy review.

## Audit
- `src/runner/runner-log.ts`
- `tests/runner-log.test.ts`
