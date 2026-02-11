---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: []
---

# Update prompt-builder for mode-aware context loading

## Goal

Update prompt-builder to load mode instructions from `_modes/` with a fallback chain for backward compatibility.

## Definition of Done

- [x] `buildContextSection` uses three-step fallback chain for loading behavior instructions:
  1. If `task.mode` is set → load from `_modes/{mode}.md`
  2. If `task.mode` is unset → try `_modes/{agent}.md` (covers post-migration state where files moved but task frontmatter not yet updated)
  3. Final fallback → `_agents/{agent}.md` (covers pre-migration state)
- [x] XML section name: `<section name="mode">` when mode present, `<section name="agent">` otherwise
- [x] New export: `buildRunnerPrompt(task, root)` returns `{ xmlPrompt: string; modeInstructions: string }` — runner needs raw mode instructions separately for CLI system prompt injection
- [x] When runner is active, injects `<runner automated="true" />` into the XML context (runner passes a flag to `buildRunnerPrompt`)

## Files

- `src/services/prompt-builder.ts` - modify - add mode-aware loading with fallback chain + `buildRunnerPrompt` export

## Tests

- [x] Task with `mode: 'coder'` loads instructions from `_modes/coder.md`
- [x] Task without `mode` but with `agent: 'coder'` falls through to `_modes/coder.md` if it exists
- [x] Task without `mode` and no matching `_modes/` file falls back to `_agents/coder.md`
- [x] `buildRunnerPrompt` returns both `xmlPrompt` and `modeInstructions` as separate strings
- [x] Runner prompt includes `<runner automated="true" />` flag
- [x] Existing prompt-builder tests pass unchanged

## Context

The fallback chain ensures backward compatibility across all migration states:

- Pre-migration: tasks have `agent: coder`, files in `_agents/`
- Mid-migration: files moved to `_modes/`, tasks not yet updated
- Post-migration: tasks have `mode: coder`, files in `_modes/`

The `buildRunnerPrompt` export provides both the full XML prompt (for CLIs that need it) and raw mode instructions (for CLI system prompt injection via native flags).

## Audit

src/services/prompt-builder.ts
src/services/context.ts
tests/prompt-builder.test.ts

---

## Review

**Rating: 8/10**

**Verdict: ACCEPTED**

### Summary
Solid implementation of mode-aware context loading with a well-structured three-step fallback chain. All 10 tests pass including 5 new tests covering all specified scenarios.

### Findings

#### Blockers
_(none)_

#### High Priority
_(none)_

#### Medium Priority
- [ ] Duplicate `loadModeInstructions` call: `buildRunnerPrompt` calls `loadModeInstructions` on line 140 and then `buildContextSection` calls it again internally on line 92 — `prompt-builder.ts:136-148`. This results in redundant filesystem I/O (up to 3 extra `readFile` calls per invocation). Consider refactoring `buildContextSection` to accept a pre-resolved mode result, or extracting a shared helper that builds the context with a provided mode result.

#### Low Priority / Nits
_(none)_

### Test Assessment
- Coverage: Adequate — all six definition-of-done test scenarios are covered
- Missing tests: None required; edge cases (no mode, no agent, fallback chain) are thoroughly exercised

### What's Good
- `loadModeInstructions` is cleanly separated as its own function with a clear, readable fallback chain
- Correct use of `readFileIfExists` (which validates paths via `ensureSafePath`) prevents path traversal
- `Promise.all` in `buildContextSection` parallelizes all context loading for good performance
- XML section name (`mode` vs `agent`) is dynamically set based on which fallback path was taken — nice attention to the spec
- `<runner automated="true" />` injection is cleanly gated behind the `isRunner` option
- Tests are well-isolated with proper temp directory setup/teardown

### Recommendations
- Consider refactoring `buildRunnerPrompt` to avoid the double `loadModeInstructions` call. One approach: make `buildContextSection` accept an optional pre-loaded mode result parameter, so `buildRunnerPrompt` can load it once and pass it through.
