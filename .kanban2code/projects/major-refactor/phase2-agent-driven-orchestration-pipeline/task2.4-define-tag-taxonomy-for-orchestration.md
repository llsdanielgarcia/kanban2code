---
stage: completed
tags:
  - refactor
  - p1
agent: auditor
contexts: []
---

# Define Tag Taxonomy for Orchestration

## Goal
Define and implement orchestration tags for tracking pipeline state.

## Definition of Done
- [x] Orchestration tags added to `filters.ts` taxonomy
- [x] Tag validation rules for orchestration state
- [x] UI color/style for orchestration tags defined

## Context
This task defines the tag system that tracks orchestration pipeline state:
- Orchestration tags: missing-architecture, missing-decomposition, architecture-ready, decomposition-ready
- Type tags: roadmap, architecture, decomposition
- These tags coordinate the handoffs between agents in the pipeline

## Audit

src/types/filters.ts
tests/tag-taxonomy.test.ts

---

## Review

**Rating: 6/10**

**Verdict: NEEDS WORK**

### Summary
The taxonomy and tests are well-structured, but the orchestration tag set and validation rules don’t match the task specification, so it isn’t ready to be depended on by the pipeline.

### Findings

#### Blockers (must fix)
- [ ] Missing required orchestration tags `architecture-ready` and `decomposition-ready` (specified in this task) - `src/types/filters.ts:91`
- [ ] Orchestration “state tags are mutually exclusive” is documented but not enforced (and tests assert the non-exclusive behavior); either enforce exclusivity or update the rule/docs to match the intended model - `src/types/filters.ts:150`

#### High Priority
- [ ] Define and validate the full orchestration state model (e.g., allowed/forbidden combinations of `missing-*` vs `*-ready`) and add corresponding tests - `src/types/filters.ts:177`

#### Medium Priority
- [ ] Remove or use the unused `orchestrationTags` local to avoid dead code and future confusion - `src/types/filters.ts:167`
- [ ] Add tests for the missing “ready” tags and for invalid state combinations once the model is implemented - `tests/tag-taxonomy.test.ts:62`

#### Low Priority / Nits
- [ ] Consider splitting orchestration tags into separate exported arrays (e.g., `ORCHESTRATION_STATE_TAGS` vs `ORCHESTRATION_TYPE_TAGS`) to make validation and UI styling less ad-hoc - `src/types/filters.ts:78`

### Test Assessment
- Coverage: Needs improvement (tests pass, but they don’t cover the specified `*-ready` tags or a complete state-transition model)
- Missing tests: `architecture-ready`/`decomposition-ready` category + color + validation cases

### What's Good
- `TAG_TAXONOMY` and `ALL_TAGS` integration is clean and easy to extend.
- `getTagColor` provides a clear UI mapping for orchestration tags and is covered by unit tests.

### Recommendations
- Align the spec and implementation: either add the “ready” tags and model, or update the task/spec to reflect the intended “absence means ready” approach (and then adjust the docs/comments/tests accordingly).

---

## Review (Post-Fix)

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Orchestration tags now match the task spec (`*-ready` added), validation enforces a coherent state model, and unit tests cover the new tags and key invalid combinations.

### Findings

#### Blockers (must fix)
(none)

#### High Priority
(none)

#### Medium Priority
- [ ] Consider refining/renaming the “p0” warning message now that it also triggers on `*-ready` tags (not only `missing-*`) - `src/types/filters.ts:199`

#### Low Priority / Nits
(none)

### Test Assessment
- Coverage: Adequate
- Missing tests: None for this scope

### What's Good
- Clear, enforceable orchestration state constraints (no contradictory tags; `decomposition-ready` requires `architecture-ready`).
- UI color mapping distinguishes “missing” vs “ready” vs “type” tags and is tested.

### Recommendations
- If you later formalize pipeline transitions, consider exporting explicit `ORCHESTRATION_STATE_TAGS`/`ORCHESTRATION_TYPE_TAGS` to make future validation extensions simpler.
