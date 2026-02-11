---
stage: code
tags: [feature, p1]
agent: coder
contexts: [skills/react-core-skills]
---

# Update TaskCard for mode + runner status

## Goal
Display mode and agent on task cards, add runner status indicator.

## Definition of Done
- [ ] Card footer shows both mode and agent: `coder | opus`
- [ ] Fallback: shows agent only when mode is unset (backward compat)
- [ ] Card-level run button (play icon) visible on Plan/Code/Audit task cards
- [ ] Progress indicator (spinner/pulsing border) when runner is active on this specific task

## Files
- `src/webview/ui/components/TaskCard.tsx` - modify - add mode display + runner controls

## Tests
- [ ] Card shows mode name when set
- [ ] Run button visible on plan/code/audit cards, not inbox/completed
- [ ] Progress indicator shown when runner active on this task

## Context
Task cards need to show both mode (behavioral role) and agent (LLM provider) in the footer. A run button appears on Plan/Code/Audit cards for single-task execution.

When runner is active on a specific task, show a progress indicator (spinner or pulsing border).
