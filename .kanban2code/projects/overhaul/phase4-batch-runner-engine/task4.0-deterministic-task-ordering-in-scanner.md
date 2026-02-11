---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: []
---

# Deterministic task ordering in scanner

## Goal

Add deterministic sorting to task loading so runner can rely on stable "topmost task" ordering.

## Definition of Done

- [x] `loadAllTasks` in `src/services/scanner.ts` returns tasks sorted deterministically: by `order` field ascending (undefined last), then by filename as tiebreaker
- [x] New export: `getOrderedTasksForStage(tasks, stage)` — filters by stage and returns in deterministic order for runner consumption
- [x] Runner can rely on "topmost task" being stable across calls

## Files

- `src/services/scanner.ts` - modify - add sort after parallel load

## Tests

- [x] Tasks with explicit `order` values sort correctly (1, 2, 3)
- [x] Tasks without `order` sort after those with `order`, by filename
- [x] `getOrderedTasksForStage` filters and sorts correctly

## Context

The scanner currently loads tasks via parallel `Promise.all` without sorting. Runner execution order would be unpredictable. This task adds deterministic sort by `order` field + filename tiebreaker so the runner can reliably pick the "topmost task" from each column.

## Audit

- `src/services/scanner.ts`
- `tests/scanner.test.ts`

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary

Clean, well-implemented deterministic sorting with comprehensive test coverage. All DoD items satisfied.

### Findings

#### Blockers

- None

#### High Priority

- None

#### Medium Priority

- None

#### Low Priority / Nits

- None

### Test Assessment

- Coverage: Excellent - 10 tests covering all edge cases
- Missing tests: None identified

### What's Good

- Immutability: `sortTasks` returns new array without mutating input
- Good edge case handling: empty arrays, same order values, all undefined orders
- Clear documentation via JSDoc comments
- Proper use of `Infinity` for undefined order values

### Recommendations

- Consider adding a test for very large `order` values to ensure `Infinity` fallback works correctly
