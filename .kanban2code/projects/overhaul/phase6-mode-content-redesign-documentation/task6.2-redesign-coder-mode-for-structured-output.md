---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Redesign coder mode for structured output

## Goal
Update coder mode instructions for automated execution with structured output.

## Definition of Done
- [ ] `_modes/coder.md` has dual-mode instructions:
  - **Manual mode**: edit frontmatter (`stage: audit`, `agent: auditor`) as today
  - **Automated mode**: output `<!-- STAGE_TRANSITION: audit -->` and `<!-- FILES_CHANGED: file1.ts, file2.ts -->`, do NOT edit frontmatter, do NOT commit
- [ ] Explicit instruction in automated mode to NOT commit changes (runner handles commits after audit)

## Files
- `.kanban2code/_modes/coder.md` - modify

## Tests
- [ ] Runner parses coder structured output correctly
- [ ] Coder does not commit changes in automated mode

## Context
The coder mode needs dual-mode instructions. In manual mode, it edits frontmatter directly. In automated mode, it outputs structured markers for stage transition and files changed, but does NOT edit frontmatter or commit.

The runner handles all state transitions and commits after successful audit.
