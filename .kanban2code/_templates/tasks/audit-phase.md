---
name: "Meta: Audit Phase"
description: Audit a phase’s implementation, update audit context file, and propose fixes.
icon: "\U0001F50D"
default_stage: audit
default_tags: [chore, p1, review]
---

# <TITLE>

## META_TASK
audit-phase

## RECOMMENDED_AGENT
codex

## REQUIRED_REFERENCE
- Follow `.kanban2code/_context/ai-guide.md` for task file format and frontmatter rules.

## REQUIRED_INPUT
- phase_number: <1..N>
- phase_scope: <what was supposed to be delivered>
- files_changed: <list or "unknown">
- tests_run: <commands + results or "not run">

## EVALUATION_CRITERIA
- audit_specific: findings map to files and behaviors
- audit_actionable: follow-ups are concrete tasks
- audit_honest: unknowns explicitly stated

## REQUIRED_OUTPUT_FORMAT

### A) Audit context update
- Update/create: `.kanban2code/_context/audit-phase<phase_number>.md`
- Include:
  - summary
  - requirements coverage
  - mismatches vs implementation
  - risks
  - rating 0-10
  - actionable follow-ups

### B) Follow-up tasks (if needed)
- Create tasks in `.kanban2code/inbox/` for any gaps found.
- Use strict, machine-parseable frontmatter + H1 title.
