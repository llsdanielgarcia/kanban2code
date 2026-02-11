---
stage: audit
tags: [feature, p0]
agent: auditor
contexts: []
---

# Create migration service (`_agents/` → `_modes/` + new `_agents/`)

## Goal
Create an atomic migration service that moves behavior files to `_modes/` and creates new CLI config files in `_agents/`.

## Definition of Done
- [x] `migrateAgentsToModes(root)` — idempotent, three-step atomic migration:
  1. **Copy** behavior files to `_modes/{clean-name}.md` (strip emoji prefix via `/^\d+-[^\w]*/`, remove `type: robot` from frontmatter)
  2. **Scan all task files** in workspace and update frontmatter: add `mode: {old-agent-name}`, set `agent` to default LLM provider via `modeDefaults` config. Also fix auditor mode instructions: `_context/architecture.md` → `architecture.md`
  3. **Replace** old behavior files in `_agents/` with CLI config files (opus.md, codex.md, kimi.md, glm.md). Only delete old files after steps 1-2 succeed
- [x] Returns report: `{ movedModes: string[], createdAgents: string[], updatedTasks: string[], skipped: string[] }`
- [x] Rollback on partial failure: clean up `_modes/` if task update fails, restore `_agents/` from backup
- [x] Update `.kanban2code/.gitignore` to add `_logs/` entry

## Files
- `src/services/migration.ts` - create - migration functions

## Tests
- [x] Migration creates `_modes/` directory with correct files
- [x] Emoji prefixes stripped: `05-⚙️coder.md` → `coder.md`
- [x] `type: robot` removed from mode frontmatter, `name`/`description`/`stage`/`created` preserved
- [x] All task files in workspace updated with `mode` field
- [x] New agent CLI config files have correct YAML schema
- [x] Old behavior files in `_agents/` removed only after `_modes/` + tasks updated
- [x] Idempotent: running twice does not duplicate files
- [x] Rollback: `_modes/` cleaned up if step 2 fails

## Context
This is a critical atomic migration. The three-step process ensures that old tasks never load CLI config YAML as "agent instructions." If step 2 (task update) fails, the service must clean up `_modes/` and restore `_agents/` from backup to prevent partial migration state.

The migration also fixes the auditor mode instructions to target `.kanban2code/architecture.md` (root-level, loaded by `loadGlobalContext`) instead of `_context/architecture.md`.

## Audit
src/services/migration.ts
tests/migration.test.ts
.kanban2code/.gitignore
