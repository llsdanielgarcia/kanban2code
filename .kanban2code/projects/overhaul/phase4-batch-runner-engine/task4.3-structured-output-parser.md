---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: []
---

# Structured output parser

## Goal
Create parser for extracting structured markers from LLM output.

## Definition of Done
- [x] `parseStageTransition(output)` — extracts `<!-- STAGE_TRANSITION: X -->` and returns Stage
- [x] `parseAuditRating(output)` — extracts `<!-- AUDIT_RATING: N -->` and returns number
- [x] `parseAuditVerdict(output)` — extracts `ACCEPTED` or `NEEDS_WORK`
- [x] `parseFilesChanged(output)` — extracts file list from `<!-- FILES_CHANGED: ... -->`
- [x] Fallback: regex on prose text (e.g. "Rating: 8/10", "**Rating: 9/10**")

## Files
- `src/runner/output-parser.ts` - create - structured marker extraction

## Tests
- [x] Parse `<!-- AUDIT_RATING: 8 -->` returns `8`
- [x] Parse `<!-- STAGE_TRANSITION: audit -->` returns `'audit'`
- [x] Fallback parses "Rating: 9/10" returns `9`
- [x] Missing markers return `undefined`
- [x] Parse `<!-- FILES_CHANGED: a.ts, b.ts -->` returns `['a.ts', 'b.ts']`

## Context
The runner needs to parse structured output from LLM responses to determine stage transitions, audit ratings, and files changed. These markers are embedded in HTML comments for easy parsing.

Fallback regex parsing handles cases where LLM doesn't use the exact marker format but still provides the information in prose.

## Audit
- `src/runner/output-parser.ts`
- `tests/output-parser.test.ts`

## Review

**Rating: 10/10**

**Verdict: ACCEPTED**

### Summary
The `output-parser` implementation correctly handles all specified markers (`STAGE_TRANSITION`, `AUDIT_RATING`, `AUDIT_VERDICT`, `FILES_CHANGED`) and includes robust fallback mechanisms for prose text. The code is clean, well-typed, and covered by comprehensive tests.

### Findings

#### Blockers
- [ ] None

#### High Priority
- [ ] None

#### Medium Priority
- [ ] None

#### Low Priority / Nits
- [ ] None

### Test Assessment
- Coverage: Adequate. Cover all marker types and fallback scenarios.
- Missing tests: None.

### What's Good
- Clean separation of parsing logic.
- Robust regex for markers.
- Good handling of edge cases (missing markers, invalid numbers).
- Comprehensive tests.

### Recommendations
- None.
