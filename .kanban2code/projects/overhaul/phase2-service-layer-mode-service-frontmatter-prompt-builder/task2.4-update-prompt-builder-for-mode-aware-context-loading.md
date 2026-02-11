---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Update prompt-builder for mode-aware context loading

## Goal
Update prompt-builder to load mode instructions from `_modes/` with a fallback chain for backward compatibility.

## Definition of Done
- [ ] `buildContextSection` uses three-step fallback chain for loading behavior instructions:
  1. If `task.mode` is set → load from `_modes/{mode}.md`
  2. If `task.mode` is unset → try `_modes/{agent}.md` (covers post-migration state where files moved but task frontmatter not yet updated)
  3. Final fallback → `_agents/{agent}.md` (covers pre-migration state)
- [ ] XML section name: `<section name="mode">` when mode present, `<section name="agent">` otherwise
- [ ] New export: `buildRunnerPrompt(task, root)` returns `{ xmlPrompt: string; modeInstructions: string }` — runner needs raw mode instructions separately for CLI system prompt injection
- [ ] When runner is active, injects `<runner automated="true" />` into the XML context (runner passes a flag to `buildRunnerPrompt`)

## Files
- `src/services/prompt-builder.ts` - modify - add mode-aware loading with fallback chain + `buildRunnerPrompt` export

## Tests
- [ ] Task with `mode: 'coder'` loads instructions from `_modes/coder.md`
- [ ] Task without `mode` but with `agent: 'coder'` falls through to `_modes/coder.md` if it exists
- [ ] Task without `mode` and no matching `_modes/` file falls back to `_agents/coder.md`
- [ ] `buildRunnerPrompt` returns both `xmlPrompt` and `modeInstructions` as separate strings
- [ ] Runner prompt includes `<runner automated="true" />` flag
- [ ] Existing prompt-builder tests pass unchanged

## Context
The fallback chain ensures backward compatibility across all migration states:
- Pre-migration: tasks have `agent: coder`, files in `_agents/`
- Mid-migration: files moved to `_modes/`, tasks not yet updated
- Post-migration: tasks have `mode: coder`, files in `_modes/`

The `buildRunnerPrompt` export provides both the full XML prompt (for CLIs that need it) and raw mode instructions (for CLI system prompt injection via native flags).
