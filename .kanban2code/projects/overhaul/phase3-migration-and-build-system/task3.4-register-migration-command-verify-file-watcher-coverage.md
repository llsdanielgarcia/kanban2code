---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Register migration command + verify file watcher coverage

## Goal
Register the migration command and ensure file watcher properly excludes `_modes/` and `_agents/` from task events.

## Definition of Done
- [ ] `kanban2code.migrateAgentsModes` command registered in `commands/index.ts`
- [ ] Shows VS Code progress notification and summary of migration results
- [ ] Verify `task-watcher.ts` already covers `_modes/` — it watches `**/*.md` under `.kanban2code` (line 35/75) and `isTaskFile` only excludes `_context.md`. No new watcher needed, but `_modes/` files should NOT trigger task-refresh events (they are config, not tasks). Add `_modes/` and `_agents/` to the `handleEvent` exclusion filter if needed

## Files
- `src/commands/index.ts` - modify - register migration command
- `src/services/task-watcher.ts` - modify (if needed) - exclude `_modes/` and `_agents/` from task events

## Tests
- [ ] Command executes without error on pre-migration workspace
- [ ] Command is idempotent on already-migrated workspace
- [ ] Changes to `_modes/*.md` do NOT trigger spurious task-refresh events
- [ ] Changes to `_agents/*.md` do NOT trigger spurious task-refresh events

## Context
The migration command should be opt-in (triggered by user, not automatic on extension load). It shows progress via VS Code progress API and displays a summary of what was migrated.

The task watcher watches all `.md` files under `.kanban2code` for changes. Since `_modes/` and `_agents/` are configuration files (not tasks), changes to them should not trigger task-refresh events. Add them to the exclusion filter if needed.
