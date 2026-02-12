---
name: Kanban2Code AI Guide
description: Operational guide for AI agents and modes in a Kanban2Code workspace.
scope: global
created: 2025-12-14
updated: 2026-02-12
---

# Kanban2Code AI Guide

This guide defines how to create, edit, and progress task files in Kanban2Code.

## 1) Core Concepts

- `stage`: where the task is in the lifecycle (`inbox`, `plan`, `code`, `audit`, `completed`)
- `mode`: behavioral role/instructions (`planner`, `coder`, `auditor`, etc.)
- `agent`: LLM provider runtime config (CLI + model + flags)

Rule of thumb:
- Mode controls **how** the assistant behaves.
- Agent controls **what runtime** executes the prompt.

## 2) Workspace Layout

Kanban2Code stores data under `.kanban2code/`:

- `inbox/` and `projects/**`: task files
- `_modes/`: mode instruction files
- `_agents/`: agent CLI config files
- `_context/`: shared context docs
- `_archive/`: completed tasks
- `config.json`: config and `modeDefaults`

## 3) Task File Format

Task files are markdown with optional YAML frontmatter.

```md
---
stage: plan
mode: planner
agent: sonnet
tags: [feature, p1]
contexts: [ai-guide]
attempts: 0
---

# Improve runner retry handling

## Goal
Make retry behavior clearer and safer.
```

Fields commonly used:
- `stage`: `inbox | plan | code | audit | completed`
- `mode`: behavior role (optional but recommended)
- `agent`: provider/runtime identifier (optional)
- `attempts`: integer retry count for runner workflow
- `tags`, `contexts`, `parent`, `order`, `created`

## 4) Stage Progression

Default execution path:
- `inbox -> plan -> code -> audit -> completed`

Audit outcomes:
- accepted audit -> `completed`
- failed audit -> `code` with incremented `attempts`
- failed audit with `attempts >= 2` -> runner hard stop for human review

## 5) Context Assembly

Prompt context is assembled in layers:

1. global: `.kanban2code/how-it-works.md`, `.kanban2code/architecture.md`, `.kanban2code/project-details.md`
2. mode/agent instructions: from `_modes/` first, then `_agents/` fallback
3. project context: `.kanban2code/projects/<project>/_context.md`
4. phase context: `.kanban2code/projects/<project>/<phase>/_context.md`
5. custom contexts: from `contexts:`

When runner mode is active, prompt context includes:
- `<runner automated="true" />`

## 6) Dual-Mode Behavior (Manual vs Automated)

Mode files must support two execution environments.

### Manual mode (default)
- Assistant can edit task frontmatter directly for stage handoff.
- Assistant can follow legacy manual workflow actions.

### Automated mode (runner flag present)
- Assistant must **not** edit frontmatter.
- Assistant must **not** commit.
- Assistant outputs structured markers only.
- Runner applies all transitions and commit operations.

## 7) Structured Output Markers

Use HTML comment markers so runner parser can detect outcomes.

- Stage transition:
  - `<!-- STAGE_TRANSITION: code -->`
  - `<!-- STAGE_TRANSITION: audit -->`
  - `<!-- STAGE_TRANSITION: completed -->`
- Changed files:
  - `<!-- FILES_CHANGED: src/a.ts, src/b.ts -->`
- Audit result:
  - `<!-- AUDIT_RATING: 8 -->`
  - `<!-- AUDIT_VERDICT: ACCEPTED -->`
  - `<!-- AUDIT_VERDICT: NEEDS_WORK -->`

## 8) Planner/Coder/Auditor Expectations

- Planner:
  - Produce implementation-ready plan and clear tests
  - Transition to code (manual edit or stage marker depending on mode)

- Coder:
  - Implement requested changes and tests
  - In automated mode output both stage transition and files changed markers

- Auditor:
  - Prioritize correctness, regressions, and missing tests
  - Use `.kanban2code/architecture.md` (root-level) for architecture updates
  - In automated mode output `AUDIT_RATING` + `AUDIT_VERDICT`
  - Retry-awareness in automated mode: be slightly more lenient on attempt 2+, while keeping standards

## 9) Practical Examples

Manual planner handoff (frontmatter edited directly):

```md
---
stage: code
mode: coder
agent: opus
tags: [feature, p1]
---

# Add stage-aware mode picker

## Goal
Implement UI mode picker behavior for plan/code/audit tasks.
```

Automated coder output snippet:

```md
Implemented mode picker and tests.

<!-- STAGE_TRANSITION: audit -->
<!-- FILES_CHANGED: src/webview/ui/components/ModePicker.tsx, tests/webview/components/ModePicker.test.tsx -->
```

Automated auditor output snippet:

```md
No blocking issues found.

<!-- AUDIT_RATING: 9 -->
<!-- AUDIT_VERDICT: ACCEPTED -->
```

## 10) Common Mistakes To Avoid

- Treating `agent` as behavior role instead of provider config
- Editing frontmatter in automated mode
- Omitting structured markers in automated mode
- Writing architecture notes to `_context/architecture.md` instead of `.kanban2code/architecture.md`
- Marking a task complete without confirming tests/build expectations
