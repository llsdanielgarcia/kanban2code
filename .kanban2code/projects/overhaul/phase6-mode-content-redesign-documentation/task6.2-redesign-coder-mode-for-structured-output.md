---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: []
---

# Redesign coder mode for structured output

## Goal
Update coder mode instructions for automated execution with structured output.

## Definition of Done
- [x] `_modes/coder.md` has dual-mode instructions:
  - **Manual mode**: edit frontmatter (`stage: audit`, `agent: auditor`) as today
  - **Automated mode**: output `<!-- STAGE_TRANSITION: audit -->` and `<!-- FILES_CHANGED: file1.ts, file2.ts -->`, do NOT edit frontmatter, do NOT commit
- [x] Explicit instruction in automated mode to NOT commit changes (runner handles commits after audit)

## Files
- `.kanban2code/_modes/coder.md` - modify

## Tests
- [x] Runner parses coder structured output correctly
- [x] Coder does not commit changes in automated mode

## Context
The coder mode needs dual-mode instructions. In manual mode, it edits frontmatter directly. In automated mode, it outputs structured markers for stage transition and files changed, but does NOT edit frontmatter or commit.

The runner handles all state transitions and commits after successful audit.

## Audit
.kanban2code/_modes/coder.md
.kanban2code/projects/overhaul/phase6-mode-content-redesign-documentation/task6.2-redesign-coder-mode-for-structured-output.md

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Clean, well-structured dual-mode implementation for coder.md that is fully consistent with the planner and auditor mode patterns. All definition of done items are satisfied and tests pass.

### Findings

#### Blockers
(none)

#### High Priority
(none)

#### Medium Priority
(none)

#### Low Priority / Nits
- [ ] The `type: robot` field present in the auditor mode frontmatter is absent from coder.md frontmatter. This is a pre-existing inconsistency and not introduced by this task.

### Test Assessment
- Coverage: Adequate
- Missing tests: None. `output-parser.test.ts` (8 tests) covers STAGE_TRANSITION and FILES_CHANGED parsing including edge cases. `runner-engine.test.ts` (6 tests) covers full pipeline integration with marker extraction.

### What's Good
- Mode Detection section uses the same `<runner automated="true" />` flag across all three modes, creating a consistent pattern
- Automated mode clearly separates what the coder outputs from what it must not do (no frontmatter edits, no commits)
- The "Preserve implementation quality in both modes. Only transition mechanics differ." rule is a smart guardrail
- Workflow step 5 cleanly enumerates mode-specific behavior in a scannable format

### Recommendations
- Consider adding the `type: robot` field to coder.md frontmatter in a future housekeeping pass for consistency with auditor.md
