---
name: Kanban2Code AI Guide
description: How AI agents should create and edit tasks, tags, and contexts in a Kanban2Code workspace.
scope: global
created: 2025-12-14
---

# Kanban2Code AI Guide

This guide defines the on-disk conventions Kanban2Code expects so AI agents can reliably create, edit, and progress tasks.

## 1) Kanban workspace layout

Kanban2Code stores the board in the filesystem under `.kanban2code/`.

### Task file locations

- Inbox tasks: `.kanban2code/inbox/*.md`
- Project tasks (optionally phased): `.kanban2code/projects/<project>/**/*.md`

Notes:
- Project name and phase are inferred from the file path; do not write `project` or `phase` to frontmatter.
- Any file named `_context.md` is ignored by task scanning (it is reserved for project/phase context).

### Non-task folders

- `.kanban2code/_agents/` — agent instruction files (markdown)
- `.kanban2code/_context/` — custom context files (markdown), referenced via `contexts:`
- `.kanban2code/_archive/` — archived tasks
- `.kanban2code/config.json` — configuration (agents, tags, stages, preferences)

## 2) Task file format

### Basic shape

Task files are Markdown with optional YAML frontmatter:

```md
---
stage: inbox
created: 2025-12-14T00:00:00.000Z
agent: codex
tags: [feature, p1]
contexts: [ai-guide]
---

# Task title

Body text...
```

### Title rule

The first Markdown H1 (`# ...`) in the body is treated as the task title. If there is no H1, the filename (without `.md`) is used.

## 3) Task frontmatter fields

All fields are optional unless you want non-default behavior.

### `stage` (string)

One of: `inbox`, `plan`, `code`, `audit`, `completed`.

If missing or invalid, the extension defaults it to `inbox`.

### `created` (string)

ISO timestamp recommended (e.g. `2025-12-14T03:00:00.000Z`).

### `agent` (string)

Assigns responsibility to an agent identifier. The agent value should match the `name` field in one of the agent definition files at `.kanban2code/_agents/`.

**Execution agents** (stage-specific):
- `planner` - works tasks in `stage: plan`
- `coder` - works tasks in `stage: code`
- `auditor` - works tasks in `stage: audit`

**Orchestration agents** (for creating/shaping work):
- `roadmapper` - creates vision documents
- `architect` - adds technical design to roadmaps
- `splitter` - generates task files from roadmaps
- `conversational` - brainstorming and prompt refinement

**IMPORTANT**: Use the agent `name` (e.g., `planner`, `coder`, `auditor`), NOT the filename (e.g., NOT `04-📋planner.md`).

### `tags` (array of strings)

Tags are free-form strings. The UI recognizes a taxonomy of common tags; see “Tags” below.

### `contexts` (array of strings)

Each entry references a context file to include when building the “Copy Task Context (Full XML)” prompt.

Resolution rules:
- If the entry contains `/` or `\\`, it is treated as a path relative to `.kanban2code/` (example: `_context/security.md`).
- Otherwise, the loader first tries `.kanban2code/_context/<name>.md`, then `.kanban2code/<name>.md`.

### `parent` (string)

Parent task ID (typically the parent filename without `.md`).

### `order` (number)

Optional ordering value for custom sorting (if/when used by the UI).


## 4) Stages and transitions

### Stages

- `inbox`: triage and clarify
- `plan`: break down, specify acceptance criteria
- `code`: implement
- `audit`: review and validate
- `completed`: done

### Transitions (enforced when using stage-change actions)

The extension enforces allowed transitions:

- `inbox` → `plan`
- `plan` → `inbox` | `code`
- `code` → `plan` | `audit`
- `audit` → `code` | `completed`
- `completed` → (no transitions)

Practical guidance:
- If you need to complete a task, move it to `audit` first, then to `completed`.

## 5) Tags (taxonomy + conventions)

Tags are not strictly validated at load time, but consistent tagging improves filtering and automation.

### Recommended categories

Use at most one **type** tag:
- `feature`, `bug`, `spike`, `refactor`, `docs`, `test`, `chore`

Optional **priority** tag (pick one):
- `p0`/`critical`, `p1`/`high`, `p2`/`medium`, `p3`/`low`

Optional **status** tags:
- `blocked`, `in-progress`, `review`, `approved`, `shipped`

Optional **domain** tags:
- `mvp`, `accessibility`, `performance`, `security`, `ci`

Optional **component** tags:
- `sidebar`, `board`, `messaging`, `keyboard`, `filters`, `context`, `copy`, `archive`, `test`

Custom tags are allowed, but prefer known tags when possible.

## 6) Agent-Generated Content

Kanban2Code emphasizes AI agent-driven content generation:

### Agent Specialization

Each AI agent has specialized knowledge and capabilities:
- Agents are defined in `.kanban2code/_agents/<agent>.md` with role descriptions and guidelines
- Agents generate contextually appropriate task content based on their expertise
- Different agents excel at different types of work (e.g., react-dev for React components, code-reviewer for audits)

### Content Generation Workflow

1. **Task Assignment**: When creating a task, assign an appropriate agent based on the work type
2. **Context Awareness**: Agents use the 5-layer context system to understand project requirements
3. **Content Creation**: Agents generate task content, acceptance criteria, and implementation notes
4. **Quality Assurance**: Agents ensure their output follows project conventions and best practices

### Benefits of Agent-Generated Content

- **Contextual Relevance**: Content is generated with full awareness of project context
- **Expertise Matching**: Tasks are handled by agents with appropriate domain knowledge
- **Consistency**: Agents maintain consistent formatting and structure
- **Adaptability**: Content adapts to project-specific requirements and constraints

### 6.2 Orchestration workflow (agent-driven pipeline)

This repo uses a **manual orchestration pipeline** to turn a raw idea into executable tasks and then execute them through the 5-stage workflow.

There are two layers:
- **Orchestration meta-tasks** (create/shape work): `roadmapper` → `architect` → `splitter`
- **Execution tasks** (build + verify): `planner` → `coder` → `auditor`

#### Orchestration agents (meta-tasks)

Source files (scaffolded into workspaces):
- `.kanban2code/_agents/roadmapper.md`
- `.kanban2code/_agents/architect.md`
- `.kanban2code/_agents/splitter.md`

High-level flow:
1. **Roadmapper** writes a vision/roadmap document under `.kanban2code/projects/<project>/`.
2. **Architect** edits that same roadmap file to add technical design, phases, and task specs.
3. **Splitter** generates phase folders and individual task files from the roadmap (no new decisions).

#### Execution agents (per-task)

Source files (scaffolded into workspaces):
- `.kanban2code/_agents/planner.md` (works tasks in `stage: plan`)
- `.kanban2code/_agents/coder.md` (works tasks in `stage: code`)
- `.kanban2code/_agents/auditor.md` (works tasks in `stage: audit`)

Per-task flow:
1. **Planner** refines the task and gathers code/test context, then moves it `plan → code`.
2. **Coder** implements and adds/updates tests, then moves it `code → audit`.
3. **Auditor** reviews and rates; `audit → completed` if rating ≥ 8, otherwise `audit → code` with feedback.

#### Handoff protocol (how agents spawn the next step)

Handoffs are performed by **creating a new task file** (or files) and linking it back via `parent:`.

**Roadmapper → Architect**
- Roadmapper creates the roadmap doc: `.kanban2code/projects/<project>/<roadmap-name>.md`
- Roadmapper creates an Architect task in: `.kanban2code/projects/<project>/`

```md
---
stage: inbox
tags: [architecture, p0, missing-architecture, missing-decomposition]
agent: architect
contexts: []
parent: <roadmapper-task-id>
---

# Architecture: <Vision Title>

## Goal
Add technical design, phases, and tasks to the roadmap.

## Input
Roadmap: `.kanban2code/projects/<project>/<roadmap-name>.md`
```

**Architect → Splitter**
- Architect edits the roadmap file to include phases/tasks/tests/files/context.
- Architect removes `missing-architecture` from the Architect task.
- Architect creates a Splitter task in: `.kanban2code/projects/<project>/`

```md
---
stage: inbox
tags: [decomposition, p0, missing-decomposition]
agent: splitter
contexts: []
parent: <architect-task-id>
---

# Split: <Vision Title>

## Goal
Generate individual task files from the roadmap.

## Input
Roadmap: `.kanban2code/projects/<project>/<roadmap-name>.md`
```

**Splitter → Execution tasks**
- Splitter creates phase folders:
  - `.kanban2code/projects/<project>/phase1-<name>/`
  - `.kanban2code/projects/<project>/phase2-<name>/`
  - …
- Splitter creates task files under each phase folder with `stage: plan` (enter execution pipeline).
- Splitter removes `missing-decomposition` from the Splitter task and completes it.

Example execution task (generated by Splitter):
```md
---
stage: plan
tags: [feature, p1]
agent: planner
contexts: []
parent: <splitter-task-id>
---

# <Task Title>

## Goal
<What this task accomplishes>

## Definition of Done
- [ ] <Checkpoint 1>
- [ ] <Checkpoint 2>
```

#### Tag transition rules (pipeline state)

These tags track orchestration state across meta-tasks:

- Roadmapper spawns Architect meta-task:
  - start: `tags: [architecture, p0, missing-architecture, missing-decomposition]`
  - end: Architect removes `missing-architecture` (keep `missing-decomposition` until Splitter finishes)

- Architect spawns Splitter meta-task:
  - start: `tags: [decomposition, p0, missing-decomposition]`
  - end: Splitter removes `missing-decomposition` when task files exist

- `missing-architecture`
  - Present on: Architect meta-task (created by Roadmapper)
  - Remove when: architecture sections have been added to the roadmap and approved

- `missing-decomposition`
  - Present on: Architect meta-task (created by Roadmapper) and Splitter meta-task (created by Architect)
  - Remove when: Splitter has generated all phase/task files from the roadmap

Recommended invariants:
- If a project has `missing-architecture`, do not start decomposition or execution tasks.
- If a project has `missing-decomposition`, do not start execution tasks (there is nothing stable to execute yet).

#### Full pipeline example (end-to-end)

Given a new feature idea:
1. Roadmapper produces: `.kanban2code/projects/dark-mode/dark-mode.md`
2. Roadmapper creates: Architect meta-task (`tags: [architecture, p0, missing-architecture, missing-decomposition]`)
3. Architect edits the roadmap, removes `missing-architecture`, creates: Splitter meta-task (`tags: [decomposition, p0, missing-decomposition]`)
4. Splitter generates:
   - `.kanban2code/projects/dark-mode/phase1-foundation/task1.1-...md` (`stage: plan`)
   - `.kanban2code/projects/dark-mode/phase1-foundation/task1.2-...md` (`stage: plan`)
   - …
5. Planner/Coder/Auditor advance each generated task through `plan → code → audit → completed`.

## 7) Context system (what gets injected)

When generating a prompt payload (full XML or context-only), Kanban2Code builds context in layers:

1. **Global context** (if present): `.kanban2code/how-it-works.md`, `.kanban2code/architecture.md`, `.kanban2code/project-details.md`
2. **Agent context** (if `agent` set): `.kanban2code/_agents/<agent>.md`
3. **Project context** (if task under a project): `.kanban2code/projects/<project>/_context.md`
4. **Phase context** (if task under a phase): `.kanban2code/projects/<project>/<phase>/_context.md`
5. **Custom contexts** (if `contexts` set): files referenced by `contexts:` (see rules above)

### 7.1 Context update workflow (rules for AIs)

Goal: keep context files *minimal, current, and decision-oriented* so future tasks do not re-discover the same constraints.

#### What to update (and when)

- `.kanban2code/architecture.md` (global)
  - Update when you introduce or change: stack choices, repo layout, cross-cutting conventions, or a lasting architectural decision.
  - Do not use for day-to-day progress notes; that belongs in phase context.

- `.kanban2code/projects/<project>/_context.md` (project)
  - Update when a project-specific invariant/contract changes (APIs, data model, rules) or when you add a project-level dependency.

- `.kanban2code/projects/<project>/<phase>/_context.md` (phase)
  - Update after completing a task *if* it materially changes the current state, adds a decision, or resolves/adds a blocker.
  - Keep it short: objectives, current state, decisions, “what next tasks should assume”.

- `.kanban2code/_context/audit-phase<N>.md` (audit)
  - Create/update during an audit pass (end of phase or at a quality gate).
  - Capture: tasks reviewed, score (0–10), test status, issues + follow-ups, sign-off checklist.


#### How to update (format rules)

- Prefer additive edits:
  - append new decisions and set prior ones to `deprecated` instead of deleting history
  - append completed-task bullets with date + 1-line outcome
- Keep entries machine-parseable:
  - use stable headings
  - use short bullets, not paragraphs
  - avoid prose narratives and “we think” language; write facts and constraints
- Always include “why” for decisions (1 sentence or less).

#### Examples (good)

Architecture decision (append-only):
```md
- authz-model: row-level policies in Postgres (because least-privilege + auditability) | status: accepted
```

Phase completion entry:
```md
- task2.3_implement-context-resolution: added context file lookup | date: 2025-12-14
```

## 8) Task examples (good patterns)

All examples below are valid task files (Markdown + YAML frontmatter). Adjust fields as needed.

### 8.1 Bug report

```md
---
stage: inbox
created: 2025-12-14T03:00:00.000Z
agent: planner
tags: [bug, p0, blocked, board]
contexts: [ai-guide]
---

# Fix crash when moving task to completed

## Problem
Moving a task from `audit` to `completed` crashes with an exception.

## Repro
1. Open board
2. Move any task to `audit`
3. Move it to `completed`

## Expected
No crash; task stage updates and UI refreshes.

## Notes
Include a brief stack trace or log excerpt if available.
```

### 8.2 Feature

```md
---
stage: plan
created: 2025-12-14T03:00:00.000Z
agent: planner
tags: [feature, p2, filters]
contexts: [ai-guide]
---

# Add saved filter presets

## Goal
Allow users to save/load named filter presets in the board UI.

## Acceptance criteria
- [ ] Save current filters under a name
- [ ] Load a saved preset
- [ ] Delete a preset
```

### 8.3 Refactor

```md
---
stage: plan
created: 2025-12-14T03:00:00.000Z
agent: planner
tags: [refactor, p3, performance]
---

# Refactor task loading to reduce redundant disk reads

## Scope
- Reduce repeated reads for unchanged tasks
- Preserve behavior and tests
```

### 8.4 Spike / research

```md
---
stage: inbox
created: 2025-12-14T03:00:00.000Z
agent: planner
tags: [spike, p2, performance]
---

# Evaluate zod-based config validation

## Questions
- Where should schema live?
- How should validation errors be reported?
```

### 8.5 Documentation

```md
---
stage: code
created: 2025-12-14T03:00:00.000Z
agent: coder
tags: [docs, p2]
---

# Document how context layering works

## Acceptance criteria
- [ ] Explain the 6 context layers
- [ ] Add at least one concrete `contexts:` example
```

### 8.6 Test

```md
---
stage: code
created: 2025-12-14T03:00:00.000Z
agent: coder
tags: [test, p1, ci]
---

# Add tests for config fallback behavior

## Acceptance criteria
- [ ] Missing config uses defaults
- [ ] Invalid JSON uses defaults and warns
```

### 8.7 UI component

```md
---
stage: plan
created: 2025-12-14T03:00:00.000Z
agent: planner
tags: [feature, p2, sidebar]
---

# Add compact task card layout option

## Acceptance criteria
- [ ] Toggle between normal/compact
- [ ] Preference persisted
```

### 8.8 Security review

```md
---
stage: audit
created: 2025-12-14T03:00:00.000Z
agent: auditor
tags: [chore, p1, security]
contexts: [_context/security-notes.md]
---

# Review path handling for context loading

## Checklist
- [ ] Ensure no path traversal
- [ ] Ensure safe default behavior on errors
```

### 8.9 Design task

```md
---
stage: plan
created: 2025-12-14T03:00:00.000Z
agent: planner
tags: [feature, p3, accessibility]
---

# Improve keyboard navigation for board columns

## Acceptance criteria
- [ ] All actions accessible without mouse
- [ ] Focus states visible
```

### 8.10 Roadmap

```md
---
stage: plan
created: 2025-12-14T03:00:00.000Z
agent: architect
tags: [chore, p2, mvp]
---

# Draft Phase 6 roadmap

## Output
- Milestones
- Dependencies
- Risks
```

## 9) Common mistakes (bad examples)

### Bad: invalid frontmatter type

```md
---
stage: coding
tags: feature
---

# This will not parse as intended
```

Why it’s bad:
- `stage: coding` is not a valid stage, so the extension will default the stage to `inbox`.
- `tags: feature` should be a YAML list.

Corrected:

```md
---
stage: code
tags: [feature]
---

# This will parse correctly
```
