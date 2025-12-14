# AI Guide Outline (Kanban2Code)

This document outlines the structure for `.kanban2code/_context/ai-guide.md`.

## 1. Purpose and Audience

- What Kanban2Code is (VS Code extension + filesystem-backed board)
- Who this guide is for (AI agents generating/editing task files)

## 2. Kanban Workspace Layout

- Kanban root: `.kanban2code/`
- Task locations:
  - `.kanban2code/inbox/*.md`
  - `.kanban2code/projects/<project>/**/*.md`
- Non-task folders:
  - `.kanban2code/_templates/` (task and stage templates)
  - `.kanban2code/_agents/` (agent instruction files)
  - `.kanban2code/_context/` (optional custom context files)
  - `.kanban2code/_archive/` (archived tasks)

## 3. Task File Format

- Markdown with optional YAML frontmatter (`---` … `---`)
- Title extraction rule (first `# Heading` in body)
- Project/phase inference rule (from file path)

## 4. Task Frontmatter Schema

Document each field with:
- type
- required/optional
- default behavior
- examples

Fields:
- `stage`
- `created`
- `agent`
- `tags`
- `contexts`
- `parent`
- `order`
- (Optional / passthrough) `template`

## 5. Stages and Transitions

- Stage definitions (`inbox`, `plan`, `code`, `audit`, `completed`)
- Transition rules enforced by the extension
- Practical “how to progress a task” guidance

## 6. Agents

- Source of truth: `.kanban2code/config.json` → `agents`
- How to set `agent` in frontmatter
- When to omit `agent`

## 7. Tags

- Tag taxonomy used by the extension UI (categories + recommended values)
- Tag usage guidance (1 type tag, optional priority tag, etc.)
- Custom tags (allowed but not categorized)

## 8. Context System

Explain prompt/context layering:
- Global context (`how-it-works.md`, `architecture.md`, `project-details.md`)
- Agent context (`_agents/<agent>.md`)
- Project context (`projects/<project>/_context.md`)
- Phase context (`projects/<project>/<phase>/_context.md`)
- Stage template (`_templates/stages/<stage>.md`)
- Custom contexts (`contexts:` frontmatter entries)

## 9. Task Examples (Good + Bad)

Include at least:
- One good example per “template type”:
  - bug report
  - feature
  - refactor
  - spike/research
  - documentation
  - test
  - UI component
  - security review
  - design task
  - roadmap
- A few “bad examples” showing common mistakes and how to correct them

## 10. Best Practices and Common Patterns

- Keep tasks atomic; split when too large
- Prefer explicit acceptance criteria
- Use contexts intentionally (avoid huge dumps)
- Keep tags consistent

