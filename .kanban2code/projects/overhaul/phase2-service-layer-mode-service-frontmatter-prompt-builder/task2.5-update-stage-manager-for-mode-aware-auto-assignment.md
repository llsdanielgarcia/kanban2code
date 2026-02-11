---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Update stage-manager for mode-aware auto-assignment

## Goal
Add mode-aware auto-assignment to stage transitions alongside existing agent auto-assignment.

## Definition of Done
- [ ] New `getDefaultModeForStage(root, stage)` — reads `_modes/` files and returns first whose frontmatter `stage` matches
- [ ] New `getDefaultAgentForMode(root, modeName)` — reads `modeDefaults` from config
- [ ] On stage transition via `updateTaskStage`: auto-sets both `mode` and `agent` using defaults
- [ ] Manually-set mode is NOT overwritten (same logic as current `shouldAutoUpdateAgent` pattern)
- [ ] Existing `getDefaultAgentForStage` continues to work for backward compat

## Files
- `src/services/stage-manager.ts` - modify - add mode-aware auto-assignment alongside existing agent logic

## Tests
- [ ] Moving task to `code` stage auto-sets `mode: coder` + `agent: opus` (from defaults)
- [ ] Moving task to `audit` stage auto-sets `mode: auditor` + `agent: opus`
- [ ] Manually set mode preserved on stage change (not overwritten)
- [ ] Existing stage-manager tests pass with minor updates for new fields

## Context
When a task moves to a new stage, the stage-manager should automatically assign both the mode (behavioral role) and agent (LLM provider) based on defaults. This mirrors the existing `shouldAutoUpdateAgent` logic but extends it to handle the new `mode` field.

The `getDefaultModeForStage` function scans `_modes/` files to find the first mode whose `stage` frontmatter matches the target stage. The `getDefaultAgentForMode` function looks up the default agent for that mode from the `modeDefaults` config.
