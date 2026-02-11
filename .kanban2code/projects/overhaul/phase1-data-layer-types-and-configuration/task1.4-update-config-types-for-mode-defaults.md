---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: [skills/skill-typescript-config]
---

# Update config types for mode defaults

## Goal
Add `modeDefaults` section to the config type to map each mode to a default LLM provider.

## Definition of Done
- [x] `Kanban2CodeConfig` in `src/types/config.ts` gains `modeDefaults?: Record<string, string>` (maps mode name → default agent name, e.g. `coder → opus`)
- [x] Default config includes mode defaults matching current pipeline roles
- [x] `ConfigService.mergeWithDefaults()` handles new section

## Files
- `src/types/config.ts` - modify - add `modeDefaults` section to config type
- `src/services/config.ts` - modify - merge defaults for new section

## Tests
- [x] Loading config without `modeDefaults` fills in defaults
- [x] Existing config tests pass unchanged

## Context
The `modeDefaults` configuration maps each behavioral mode to its default LLM provider. For example:
- `coder` → `opus`
- `auditor` → `opus`
- `planner` → `sonnet`

This allows the runner to automatically select the appropriate agent when a task doesn't explicitly specify one. Users can override these defaults at the task level or via the sidebar settings UI.

## Audit
src/types/config.ts
src/services/config.ts
tests/config-service.test.ts

---

## Review

**Rating: 7/10**

**Verdict: NEEDS WORK**

### Summary
The `modeDefaults` type/defaults/merge wiring is implemented correctly, but the task is not fully complete because the required `modeDefaults` test coverage is missing. Existing config tests pass, but they do not validate the new behavior.

### Findings

#### Blockers
- [ ] None

#### High Priority
- [x] Missing DoD-required test for `modeDefaults` default fill behavior: task claims this is covered, but no test asserts loading config without `modeDefaults` results in merged mode defaults. - `tests/config-service.test.ts:23`

#### Medium Priority
- [x] Missing focused assertion that partial `modeDefaults` overrides merge with defaults (preserve unspecified modes). This is the key regression risk in `mergeWithDefaults`. - `src/services/config.ts:91`

#### Low Priority / Nits
- [ ] None

### Test Assessment
- Coverage: Needs improvement
- Missing tests: explicit `modeDefaults` default-fill test; partial override merge test for `modeDefaults`

### What's Good
- `Kanban2CodeConfig` now includes `modeDefaults` and defaults align with the documented pipeline roles. - `src/types/config.ts:61`
- `mergeWithDefaults()` correctly merges loaded `modeDefaults` onto defaults. - `src/services/config.ts:91`

### Recommendations
- Add two focused tests in `tests/config-service.test.ts`: one for missing `modeDefaults` fallback to defaults, and one for partial overrides preserving default entries.
