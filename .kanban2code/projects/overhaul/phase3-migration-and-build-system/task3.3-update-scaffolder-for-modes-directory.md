---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Update scaffolder for `_modes/` directory

## Goal
Update scaffolder to create and sync the `_modes/` directory.

## Definition of Done
- [ ] `scaffoldWorkspace` creates `_modes/` directory alongside `_agents/`
- [ ] Writes `BUNDLED_MODES` files to `_modes/` on scaffold
- [ ] `syncWorkspace` syncs both `_modes/` and `_agents/` directories

## Files
- `src/services/scaffolder.ts` - modify - add `_modes/` to scaffold and sync

## Tests
- [ ] Scaffold creates `_modes/` directory with mode files
- [ ] Sync writes missing mode files without overwriting existing ones

## Context
The scaffolder initializes a new Kanban2Code workspace. It currently creates `_agents/` directory and writes bundled agent files. This task extends it to also create `_modes/` directory and write bundled mode files.

The `syncWorkspace` function updates existing workspaces with missing bundled files. It should now sync both `_modes/` and `_agents/` directories.
