---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Redesign auditor mode for automation

## Goal
Update auditor mode instructions for automated execution with structured output.

## Definition of Done
- [ ] `_modes/auditor.md` has dual-mode instructions:
  - **Manual mode**: edit frontmatter, update `.kanban2code/architecture.md`, commit as today
  - **Automated mode**: output `<!-- AUDIT_RATING: N -->` and `<!-- AUDIT_VERDICT: ACCEPTED|NEEDS_WORK -->`, do NOT edit frontmatter, do NOT commit. Runner handles all state transitions and commits
- [ ] Fix architecture.md path: `.kanban2code/architecture.md` (root-level, loaded by `loadGlobalContext`), NOT `_context/architecture.md`
- [ ] Attempt awareness in automated mode: "Current attempt: {attempts}. If this is attempt 2 or higher, be more lenient but maintain standards."

## Files
- `.kanban2code/_modes/auditor.md` - modify

## Tests
- [ ] Runner parses `AUDIT_RATING` from auditor output
- [ ] Runner parses `AUDIT_VERDICT` (ACCEPTED / NEEDS_WORK)
- [ ] Automated mode does NOT edit frontmatter or commit
- [ ] Manual mode still edits frontmatter and commits as before

## Context
The auditor mode needs dual-mode instructions. In manual mode, it edits frontmatter, updates architecture.md, and commits. In automated mode, it outputs structured markers only.

The architecture.md path must be fixed to `.kanban2code/architecture.md` (root-level, loaded by `loadGlobalContext`), not `_context/architecture.md`.

Attempt awareness helps the auditor be more lenient on retry attempts while maintaining standards.
