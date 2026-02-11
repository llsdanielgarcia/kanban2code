---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: [skills/skill-typescript-config]
---

# Create ModeService (CRUD for `_modes/`)

## Goal
Create a service for CRUD operations on mode files in the `_modes/` directory.

## Definition of Done
- [x] `listAvailableModes(root)` — reads `_modes/*.md`, parses frontmatter, returns `ModeConfig[]`
- [x] `resolveModePath(root, identifier)` — finds by filename or frontmatter `name`
- [x] `loadModeContext(root, modeName)` — returns full file content as string
- [x] `createModeFile(root, data)` — writes new mode file with frontmatter + body
- [x] `updateModeFile(root, modeId, data)` — overwrites existing mode file
- [x] `deleteModeFile(root, modeId)` — deletes with guard (warn if tasks reference it)
- [x] Pattern mirrors `listAvailableAgents` / `createAgentFile` in `src/services/context.ts`

## Files
- `src/services/mode-service.ts` - create - full CRUD service

## Tests
- [x] `listAvailableModes` returns empty array when `_modes/` does not exist
- [x] `listAvailableModes` parses frontmatter correctly (name, description, stage)
- [x] `resolveModePath` finds by filename and by frontmatter name
- [x] `createModeFile` writes correct frontmatter + body
- [x] Round-trip: create → list → verify content matches

## Context
The ModeService mirrors the existing agent loading patterns in `context.ts`. It reads mode files from `_modes/`, parses YAML frontmatter, and provides CRUD operations for the UI to create/edit/delete custom modes.

Mode files contain behavioral instructions (system prompts, rules, workflow) that define how the LLM should behave in a given role (coder, auditor, planner, etc.).

## Audit
- src/services/mode-service.ts
- tests/mode-service.test.ts
