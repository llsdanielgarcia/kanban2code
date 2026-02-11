---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Structured output parser

## Goal
Create parser for extracting structured markers from LLM output.

## Definition of Done
- [ ] `parseStageTransition(output)` — extracts `<!-- STAGE_TRANSITION: X -->` and returns Stage
- [ ] `parseAuditRating(output)` — extracts `<!-- AUDIT_RATING: N -->` and returns number
- [ ] `parseAuditVerdict(output)` — extracts `ACCEPTED` or `NEEDS_WORK`
- [ ] `parseFilesChanged(output)` — extracts file list from `<!-- FILES_CHANGED: ... -->`
- [ ] Fallback: regex on prose text (e.g. "Rating: 8/10", "**Rating: 9/10**")

## Files
- `src/runner/output-parser.ts` - create - structured marker extraction

## Tests
- [ ] Parse `<!-- AUDIT_RATING: 8 -->` returns `8`
- [ ] Parse `<!-- STAGE_TRANSITION: audit -->` returns `'audit'`
- [ ] Fallback parses "Rating: 9/10" returns `9`
- [ ] Missing markers return `undefined`
- [ ] Parse `<!-- FILES_CHANGED: a.ts, b.ts -->` returns `['a.ts', 'b.ts']`

## Context
The runner needs to parse structured output from LLM responses to determine stage transitions, audit ratings, and files changed. These markers are embedded in HTML comments for easy parsing.

Fallback regex parsing handles cases where LLM doesn't use the exact marker format but still provides the information in prose.
