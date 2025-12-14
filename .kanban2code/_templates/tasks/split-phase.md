---
name: "Meta: Split Phase"
description: Split a phase/milestone into concrete executable tasks with tests and ordering.
icon: "\u2702\uFE0F"
default_stage: plan
default_tags: [chore, p2]
---

# <TITLE>

## META_TASK
split-phase

## RECOMMENDED_AGENT
opus

## REQUIRED_REFERENCE
- Follow `.kanban2code/_context/ai-guide.md` for task file format and frontmatter rules.

## REQUIRED_INPUT
- project: <name>
- phase: <name>
- phase_goal: <what is shipped at end>
- constraints: <time|scope|tech>
- definition_of_done: <criteria>

## EVALUATION_CRITERIA
- tasks_small: most tasks <= 1-2 days
- tasks_complete: cover definition_of_done
- tests_present: tests specified where applicable

## OUTPUT_RULES
- Output MUST be tasks only (no prose outside task files).
- For each task:
  - location: `.kanban2code/projects/<project>/<phase>/`
  - stage: `inbox` or `plan` (default `plan` if design required)
  - tags: include exactly one type tag + optional priority tag
  - agent: pick from config agents (`codex|opus|sonnet|glm|gemini`)
  - include explicit tests section when applicable
- Keep tasks small (1-2 days each unless specified otherwise).

## REQUIRED_OUTPUT_FORMAT
- `FILE: <path>`
- `CONTENT:` (full markdown task content)
