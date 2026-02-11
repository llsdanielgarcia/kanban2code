---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Redesign planner mode for structured output

## Goal
Update planner mode instructions for automated execution with structured output.

## Definition of Done
- [ ] `_modes/planner.md` has dual-mode instructions:
  - **Manual mode** (default): edit frontmatter directly as today (`stage: code`, `agent: coder`)
  - **Automated mode** (when `<runner automated="true" />` present in context): output `<!-- STAGE_TRANSITION: code -->` marker, do NOT edit frontmatter
- [ ] Both modes produce the same planning output quality

## Files
- `.kanban2code/_modes/planner.md` - modify (created in Phase 3 migration)

## Tests
- [ ] Runner parses planner structured output correctly
- [ ] Planner mode still works for manual copy-paste workflow (edits frontmatter)

## Context
The planner mode needs dual-mode instructions. In manual mode (default), it edits frontmatter directly as today. In automated mode (when runner flag is present), it outputs structured markers only.

The runner parses these markers and handles all state transitions itself.
