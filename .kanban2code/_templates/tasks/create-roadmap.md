---
name: "Meta: Create Roadmap"
description: Generate a roadmap and the follow-up tasks needed to execute it.
icon: "\U0001F9ED"
default_stage: plan
default_tags: [chore, p2, mvp]
---

# <TITLE>

## META_TASK
create-roadmap

## RECOMMENDED_AGENT
opus

## REQUIRED_REFERENCE
- Follow `.kanban2code/_context/ai-guide.md` for task file format and frontmatter rules.

## INPUT_QUESTIONS (MUST_ANSWER_BEFORE_OUTPUT)
1. What is the project name and repository (if any)?
2. What is the target outcome (v1.0 definition of done)?
3. What are the major constraints (time, team size, tech)?
4. What are the highest risks/unknowns?
5. What phases make sense (0..N), and what does each phase ship?

## EVALUATION_CRITERIA
- roadmap_complete: phases + dependencies + risks present
- tasks_parseable: every task has valid frontmatter + H1 title
- coverage: tasks cover all roadmap deliverables

## REQUIRED_OUTPUT_FORMAT

### A) Roadmap artifact
- Create/Update: `ROADMAP.md` (or a project-specific roadmap file if specified).
- Include: phases, deliverables, dependencies, risks, and acceptance checkpoints.

### B) Task generation
- Create task markdown files under `.kanban2code/inbox/` (or project folder if specified).
- Each generated task MUST:
  - have YAML frontmatter with `stage`, `created`, `agent`, `tags`
  - include a `# <title>` H1 in body
  - include explicit acceptance criteria
- Use these template types as appropriate:
  - `feature`, `bug-report`, `refactor`, `spike-research`, `documentation`, `test`, `ui-component`, `security-review`, `design-task`

### C) Output listing
- Return a machine-readable list of files to create/edit:
  - `FILE: <path>`
  - `CONTENT:` (full file content)
