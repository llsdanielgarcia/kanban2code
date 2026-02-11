---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: []
---

# Update stage-manager for mode-aware auto-assignment

## Goal

Add mode-aware auto-assignment to stage transitions alongside existing agent auto-assignment.

## Definition of Done

- [x] New `getDefaultModeForStage(root, stage)` — reads `_modes/` files and returns first whose frontmatter `stage` matches
- [x] New `getDefaultAgentForMode(root, modeName)` — reads `modeDefaults` from config
- [x] On stage transition via `updateTaskStage`: auto-sets both `mode` and `agent` using defaults
- [x] Manually-set mode is NOT overwritten (same logic as current `shouldAutoUpdateAgent` pattern)
- [x] Existing `getDefaultAgentForStage` continues to work for backward compat

## Files

- `src/services/stage-manager.ts` - modify - add mode-aware auto-assignment alongside existing agent logic

## Tests

- [x] Moving task to `code` stage auto-sets `mode: coder` + `agent: opus` (from defaults)
- [x] Moving task to `audit` stage auto-sets `mode: auditor` + `agent: opus`
- [x] Manually set mode preserved on stage change (not overwritten)
- [x] Existing stage-manager tests pass with minor updates for new fields

## Context

When a task moves to a new stage, the stage-manager should automatically assign both the mode (behavioral role) and agent (LLM provider) based on defaults. This mirrors the existing `shouldAutoUpdateAgent` logic but extends it to handle the new `mode` field.

The `getDefaultModeForStage` function scans `_modes/` files to find the first mode whose `stage` frontmatter matches the target stage. The `getDefaultAgentForMode` function looks up the default agent for that mode from the `modeDefaults` config.

## Audit

- src/services/stage-manager.ts
- tests/stage-manager.test.ts

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Clean, well-structured implementation that correctly extends the existing agent auto-assignment pattern to support mode-aware assignment. All 21 tests pass including 5 new tests covering the mode-aware functionality.

### Findings

#### Blockers
_None._

#### High Priority
_None._

#### Medium Priority
_None._

#### Low Priority / Nits
- [ ] Duplicated agent fallback branch: The `shouldAutoUpdateAgent` → `getDefaultAgentForStage` fallback logic is duplicated in both the `shouldUpdateMode=true && !newMode` branch (L196–203) and the `shouldUpdateMode=false` branch (L205–213) of `updateTaskStage`. Could be extracted into a helper to reduce duplication. - `src/services/stage-manager.ts:196-213`
- [ ] `listModesWithStage` and `listAgentsWithStage` are structurally identical — consider a shared generic `listFilesWithStage` helper in a future refactor. - `src/services/stage-manager.ts:22-51,77-106`

### Test Assessment
- Coverage: **Adequate** — 5 new mode-aware tests cover the key scenarios: `getDefaultModeForStage` matching, `getDefaultAgentForMode` from config, auto-set mode+agent on `code` stage, auto-set on `audit` stage, and manual mode preservation.
- Missing tests: No critical gaps. Could optionally add a test for the backward-compat branch where no modes exist but agents do (to verify the fallback to `getDefaultAgentForStage`), but the existing `updateTaskStage auto-assigns agent when transitioning stages` test covers this path since that test has no `_modes/` directory.

### What's Good
- `shouldAutoUpdateMode` mirrors the `shouldAutoUpdateAgent` pattern perfectly — easy to reason about.
- Clean fallback hierarchy: mode-based agent assignment takes priority, then falls back to stage-based agent assignment for backward compatibility.
- `ModeInfo` interface parallels `AgentInfo` for consistency.
- `getDefaultModeForStage` correctly returns `undefined` for `inbox` and `completed` stages, matching `getDefaultAgentForStage` behavior.
- `getDefaultAgentForMode` cleanly delegates to `configService.getModeDefault()` — no unnecessary abstraction.
- Test setup uses `configService.initialize(kanbanRoot)` to ensure `modeDefaults` are available.

### Recommendations
- Consider extracting the duplicated agent-fallback block into a private helper like `tryAutoUpdateAgent(root, freshTask, oldStage, newStage)` to DRY up the `updateTaskStage` function.
