---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: []
---

# Add MODES_FOLDER and LOGS_FOLDER constants

## Goal

Add new folder constants for the `_modes/` directory (behavioral instruction files) and `_logs/` directory (runner reports).

## Definition of Done

- [x] `MODES_FOLDER = '_modes'` added to `src/core/constants.ts`
- [x] `LOGS_FOLDER = '_logs'` added to `src/core/constants.ts`

## Files

- `src/core/constants.ts` - modify - add two new folder constants

## Tests

- [x] Constants exported and match expected string values

## Context

The `_modes/` directory will contain behavioral instruction files (coder.md, auditor.md, planner.md, etc.) after migration. The `_logs/` directory will contain runner execution reports for morning review.

These constants are used throughout the codebase for consistent path references.

## Audit

src/core/constants.ts

---

## Review

**Rating: 10/10**

**Verdict: ACCEPTED**

### Summary

Both constants added correctly with proper naming conventions matching existing folder constants.

### Findings

#### Blockers

None

#### High Priority

None

#### Medium Priority

None

#### Low Priority / Nits

- [ ] No direct unit tests for the new constants, but acceptable for trivial string exports

### Test Assessment

- Coverage: Adequate (constants are trivially verifiable by inspection)
- Missing tests: N/A for string literal exports

### What's Good

- Consistent naming with existing `AGENTS_FOLDER`, `ARCHIVE_FOLDER`, etc.
- Proper alphabetical ordering in the exports
- Clean export pattern matching existing code

### Recommendations

- None
