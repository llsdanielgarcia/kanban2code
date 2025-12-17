---
stage: completed
tags:
  - feature
  - p1
agent: auditor
contexts: []
---

# Create Execution Agent Files

## Goal
Create three execution agent files that handle the 5-stage workflow for tasks.

## Definition of Done
- [x] `.kanban2code/_agents/planner.md` created (stage: plan)
- [x] `.kanban2code/_agents/coder.md` created (stage: code)
- [x] `.kanban2code/_agents/auditor.md` created (stage: audit)
- [x] Each agent has: role, stage, quality criteria, output format

## Context
This task creates execution agents that work on tasks in specific stages:
- Planner: Refines tasks and gathers context (stage: plan)
- Coder: Implements code and features (stage: code)
- Auditor: Reviews code and assigns quality ratings (stage: audit)

## Audit

.kanban2code/_agents/planner.md
.kanban2code/_agents/coder.md
.kanban2code/_agents/auditor.md

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Strong, well-structured execution agent prompts with clear roles, stage ownership, and practical templates/checklists. Minor ambiguity around `agent:` handling during stage transitions could cause orchestration drift.

### Findings

#### Blockers (must fix)
(none)

#### High Priority
(none)

#### Medium Priority
- [ ] Stage transition should explicitly update `agent:` (or explicitly state stage-only routing) to prevent tasks staying assigned to the wrong agent - `.kanban2code/_agents/planner.md:140`
- [ ] Planner example shows `stage: plan` with `agent: coder`, which may confuse stage-vs-agent routing; either update the example or add a rule explaining which field is authoritative - `.kanban2code/_agents/planner.md:189`
- [ ] Coder “Output”/“Task File Updates” should explicitly mention whether to change `agent:` to `auditor` when moving to `stage: audit` (or state that it must not change) - `.kanban2code/_agents/coder.md:49`

#### Low Priority / Nits
- [ ] Consider adding a short “Do not edit earlier sections; append only” rule for Planner/Auditor to reduce accidental rewrites of task content - `.kanban2code/_agents/planner.md:50`

### Test Assessment
- Coverage: Adequate (docs-only change; no automated tests expected)
- Missing tests: None

### What's Good
- Clear separation of responsibilities across stages with explicit handoff expectations.
- Copy/paste-ready output formats and quality checklists that reduce variance and missed steps.

### Recommendations
- Define and document a single canonical rule for routing (by `stage`, by `agent`, or both), then encode it consistently in all three execution agent prompts.
