---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: []
---

# Register runner VS Code commands

## Goal
Register VS Code commands for triggering the runner.

## Definition of Done
- [x] `kanban2code.runTask` — runs single task through its remaining pipeline stages
- [x] `kanban2code.runColumn` — runs all tasks in a specified column sequentially
- [x] `kanban2code.stopRunner` — cancels running batch
- [x] `kanban2code.runNightShift` — runs all Plan+Code+Audit tasks in order (convenience for overnight)
- [x] Runner singleton managed in `extension.ts` (prevents parallel execution)
- [x] Progress shown via VS Code progress API

## Files
- `src/commands/index.ts` - modify - register four runner commands
- `src/extension.ts` - modify - runner singleton lifecycle management

## Tests
- [x] Runner singleton prevents parallel execution (second call rejected or queued)
- [x] `stopRunner` cancels in-progress run

## Context
The runner commands provide multiple entry points: single task, column, or all tasks. The runner singleton ensures only one runner instance is active at a time.

Progress is shown via VS Code progress API so users can see what's happening.

## Audit
- `src/commands/index.ts`
- `src/extension.ts`
- `tests/runner-singleton.test.ts`
- `package.json`
