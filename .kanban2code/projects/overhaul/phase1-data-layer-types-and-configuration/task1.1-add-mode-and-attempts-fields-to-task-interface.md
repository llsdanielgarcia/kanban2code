---
stage: completed
tags:
  - feature
  - p1
agent: auditor
contexts:
  - ai-guide
skills:
  - skill-typescript-config
---

# Add `mode` and `attempts` fields to Task interface

## Goal

Extend the Task interface to support the new agent/mode split architecture by adding `mode` (behavioral role) and `attempts` (audit retry counter) fields.

## Definition of Done

- [x] `Task` interface in `src/types/task.ts` gains `mode?: string` and `attempts?: number`
- [x] Existing tests pass unchanged (fields are optional)

## Files

- `src/types/task.ts` - modify - add `mode?: string` and `attempts?: number` fields
- `src/services/frontmatter.ts` - modify - add parsing and serialization for new fields

## Tests

- [x] TypeScript compiles with new optional fields
- [x] Existing task tests pass unchanged

## Context

This is the first task in Phase 1 of the Agent/Mode Split + Automated Batch Runner overhaul. The `mode` field will store the behavioral role (e.g., "coder", "auditor", "planner") while the existing `agent` field will be repurposed to store the LLM provider (e.g., "opus", "codex", "kimi"). The `attempts` field tracks how many times a task has failed audit and been sent back to code.

Both fields are optional to maintain backward compatibility with existing tasks that don't have these fields yet.

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Implementation satisfies the task goal and definition of done. `mode` and `attempts` were added to the core `Task` type and are handled in both frontmatter parsing and serialization without breaking existing behavior.

### Findings

#### Blockers
- [ ] None.

#### High Priority
- [ ] None.

#### Medium Priority
- [ ] None.

#### Low Priority / Nits
- [ ] Add explicit round-trip tests for `mode` and `attempts` to guard against future parser/serializer regressions - `tests/frontmatter.test.ts:1`

### Test Assessment
- Coverage: Adequate
- Missing tests: Dedicated assertions for `mode`/`attempts` parse + stringify behavior

### What's Good
- `Task` now includes optional `mode` and `attempts` fields as required - `src/types/task.ts:11`
- Frontmatter parsing reads both fields safely with type checks - `src/services/frontmatter.ts:83`
- Frontmatter serialization persists both fields and omits undefined values - `src/services/frontmatter.ts:126`
- Validation checks passed: `npm run typecheck` and full `npm test` (31 files, 206 tests)

### Recommendations
- Add one focused unit test that parses frontmatter containing `mode`/`attempts` and verifies round-trip serialization.
