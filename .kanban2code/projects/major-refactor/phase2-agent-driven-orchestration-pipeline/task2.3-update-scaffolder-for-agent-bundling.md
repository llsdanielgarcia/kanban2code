---
stage: completed
tags:
  - refactor
  - p1
agent: auditor
contexts: []
---

# Update Scaffolder for Agent Bundling

## Goal
Update the scaffolder to bundle and copy agent files to new workspaces.

## Definition of Done
- [x] Agent markdown files embedded in extension build
- [x] `scaffolder.ts` copies bundled agents to new workspaces
- [x] Existing agents preserved if already present (no overwrite)
- [x] `tests/scaffolder.test.ts` verifies agent scaffolding

## Context
This task updates the scaffolder to create `_agents/` directories in new workspaces and populate them with the bundled agent files. This ensures all workspaces have access to the standard agent definitions.

## Audit

src/assets/seed-content.ts
src/services/scaffolder.ts
tests/scaffolder.test.ts

---

## Review

**Rating: 7/10**

**Verdict: NEEDS WORK**

### Summary
The overall approach (bundled agents → scaffold + sync) is solid and tests cover the main happy paths, but the “no overwrite” guarantee is not fully upheld under non-ENOENT filesystem errors.

### Findings

#### Blockers (must fix)
- [ ] `syncBundledAgents` treats any `fs.access` error as “missing”, which can violate “no overwrite” semantics (e.g., `EACCES`, transient IO errors) and can mask real problems - `src/services/scaffolder.ts:74`

#### High Priority
- [ ] Consider guarding `syncBundledAgents` so it doesn’t silently create `.kanban2code/` in an uninitialized workspace (or document that behavior clearly) - `src/services/scaffolder.ts:66`

#### Medium Priority
- [ ] `syncBundledAgents` currently skips existing paths without checking they’re files (a directory at the same name will be “preserved” but likely breaks expectations) - `src/services/scaffolder.ts:73`

#### Low Priority / Nits
- [ ] Test name typo: `scaffolderWorkspace` → `scaffoldWorkspace` for clarity - `tests/scaffolder.test.ts:10`
- [ ] Shared `TEST_DIR` constant can be brittle if the runner ever parallelizes within-file; consider per-test temp dirs - `tests/scaffolder.test.ts:8`

### Test Assessment
- Coverage: Adequate for creation + “no overwrite” happy path
- Missing tests: Error-path coverage for `syncBundledAgents` when `fs.access` fails with non-`ENOENT` (should not overwrite and should surface the error)

### What's Good
- Bundled-agent scaffolding is explicit and easy to follow (`BUNDLED_AGENTS` loop) - `src/services/scaffolder.ts:48`
- Tests verify both presence of all bundled agents and preservation of a user-modified agent - `tests/scaffolder.test.ts:53`

### Recommendations
- Tighten the `syncBundledAgents` existence check to only treat `ENOENT` as “missing” and rethrow other errors; add a focused test for that behavior.

---

## Review (Follow-up)

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
`syncBundledAgents` now only writes on true “missing file” (`ENOENT`), surfaces non-`ENOENT` filesystem errors, and validates that existing agent paths are files. Tests cover the key error paths and preservation behavior.
