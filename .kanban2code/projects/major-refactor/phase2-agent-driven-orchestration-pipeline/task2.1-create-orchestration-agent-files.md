---
stage: completed
tags:
  - feature
  - p1
agent: auditor
contexts: []
---

# Create Orchestration Agent Files

## Goal
Create the three orchestration agent files that handle the meta-workflow from idea to task generation.

## Definition of Done
- [x] `.kanban2code/_agents/roadmapper.md` created with full instructions
- [x] `.kanban2code/_agents/architect.md` created with full instructions
- [x] `.kanban2code/_agents/splitter.md` created with full instructions
- [x] Each agent has: role, responsibilities, input/output format, handoff protocol

## Context
This task creates the orchestration agents that form the meta-workflow:
- Roadmapper: Creates vision documents from ideas
- Architect: Adds technical design and phases/tasks to roadmaps
- Splitter: Generates individual task files from roadmaps

## Audit

.kanban2code/_agents/roadmapper.md
.kanban2code/_agents/architect.md
.kanban2code/_agents/splitter.md

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
All three orchestration agent prompts are complete, clearly structured, and internally consistent with the roadmap → architecture → task-splitting workflow. Minor clarity tweaks would further reduce ambiguity for the Splitter and improve cross-agent handoffs.

### Findings

#### Blockers (must fix)
(none)

#### High Priority
(none)

#### Medium Priority
- [ ] Add an explicit filename convention for spawned Architect/Splitter task files to prevent inconsistent naming across projects - `.kanban2code/_agents/roadmapper.md:88`
- [ ] Clarify “no commentary” vs required final summary output so the Splitter’s output expectations are unambiguous - `.kanban2code/_agents/splitter.md:249`
- [ ] Make “Remove tag and complete” explicit (e.g., remove `missing-decomposition`, set stage) to avoid partial handoffs - `.kanban2code/_agents/splitter.md:114`

#### Low Priority / Nits
- [ ] Standardize placeholder notation (`<project-name>` vs `{project-name}`) for consistency and easier templating - `.kanban2code/_agents/splitter.md:108`

### Test Assessment
- Coverage: Adequate (docs-only change; no automated tests expected)
- Missing tests: None

### What's Good
- Clear role boundaries and handoff protocols across Roadmapper → Architect → Splitter.
- Strong, copy/paste-ready templates with checklists that reduce drift and hallucinated structure.

### Recommendations
- Align spawned task filenames and stage/tag edits with a single canonical convention to make the pipeline more deterministic and searchable.
