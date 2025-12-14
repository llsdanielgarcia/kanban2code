---
name: Phase Context
description: Per-phase continuity file: objectives, current state, decisions, and next-task context.
icon: "\ud83e\udded"
---

# Phase Context: <PROJECT> / <PHASE>

## PHASE_OBJECTIVES
- objective_1: <...>
- objective_2: <...>
- done_definition: <what “complete” means>

## COMPLETED_TASKS
- <task_id_or_path>: <1-line outcome> | date: <YYYY-MM-DD>

## CURRENT_STATE
- shipped_behavior: <what works now>
- implementation_notes:
  - <key module/file>: <what it does / constraints>
- known_debt:
  - <debt item> (why it exists, acceptable until when)

## PENDING_DECISIONS
- <decision>: options: <A/B/C> | chosen: <?> | rationale: <...> | owner: <...>

## RISKS_AND_BLOCKERS
- <risk/blocker>: impact: <low|med|high> | mitigation: <...>

## CONTEXT_FOR_NEXT_TASKS
- next_tasks_should_assume:
  - <invariant or rule>
- do_not_repeat:
  - <already tried / rejected approach>
- quick_links:
  - <file/path>: <why>

## UPDATE_INSTRUCTIONS
- After finishing a task, append a bullet to `COMPLETED_TASKS` and update `CURRENT_STATE` only if it materially changed.
- Keep entries short and factual; remove stale blockers; keep decisions explicit.

