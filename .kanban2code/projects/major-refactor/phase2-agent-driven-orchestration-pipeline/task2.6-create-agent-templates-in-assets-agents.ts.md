---
stage: completed
tags:
  - refactor
  - p1
agent: auditor
contexts: []
---

# Create Agent Templates in assets/agents.ts

## Goal
Create constants in assets/agents.ts containing bundled agent content.

## Definition of Done
- [x] `AGENT_ROADMAPPER` constant with full agent markdown
- [x] `AGENT_ARCHITECT` constant
- [x] `AGENT_SPLITTER` constant
- [x] `AGENT_PLANNER`, `AGENT_CODER`, `AGENT_AUDITOR` constants
- [x] Scaffolder uses these constants for agent creation

## Context
This task creates string constants for all agent content that can be bundled with the extension. This follows the same pattern as the existing templates.ts file but for agent content instead.

## Audit

src/assets/agents.ts
src/assets/seed-content.ts
src/services/scaffolder.ts
tests/scaffolder.test.ts

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Bundled agent templates are correctly defined and wired into scaffolding, and the test suite meaningfully verifies both initial scaffolding and non-destructive sync behavior.

### Findings

#### Blockers (must fix)
(none)

#### High Priority
(none)

#### Medium Priority
(none)

#### Low Priority / Nits
- [ ] `src/assets/agents.ts` is hard to review/maintain as giant escaped single-line strings; consider generating it from source `.md` files during build (or using template literals) to improve readability and diff quality - `src/assets/agents.ts:1`

### Test Assessment
- Coverage: Adequate
- Missing tests: None obvious for this change; current cases cover creation, sync add-only semantics, and error paths - `tests/scaffolder.test.ts:1`

### What's Good
- `BUNDLED_AGENTS` provides a single source of truth for filenames and content - `src/assets/agents.ts:1`
- `syncBundledAgents` preserves user customizations by only writing missing files, and has explicit error handling for non-file paths - `src/services/scaffolder.ts:38`

### Recommendations
- Consider adding a lightweight generator (or documenting the generation source) so agent edits don’t require manual escape handling in `src/assets/agents.ts` - `src/assets/agents.ts:1`
