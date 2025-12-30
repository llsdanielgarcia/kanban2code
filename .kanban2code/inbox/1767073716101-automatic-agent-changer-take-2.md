---
stage: audit
agent: 06-✅auditor
tags: []
contexts: []
---

# automatic agent changer take 2

# Autoamtic agent change

I want the ai to move the tasks around, planner should move tasks to coder, coder should move task to audit, and audit should move tasks to completed. 

But also agents, 

04-📋planner.md should move to 05-⚙️coder.md. not coder because coder doesn't exist now it has a different name. 

Also change how the name show in the kanban modal view. where it only shows as planner coder regardles of the name of the file. 

## Refined Prompt
Objective: Automatically update a task’s `agent` when its `stage` changes, and display canonical agent names (planner/coder/auditor) in the Kanban UI even when agent filenames include prefixes/emojis.

Implementation approach:
1. Update stage transitions in `src/services/stage-manager.ts` to set `task.agent` to the default `_agents/` file for the target stage (plan/code/audit), using agent frontmatter (`stage`) when available; keep behavior safe when a default agent cannot be resolved.
2. Update the Kanban UI card display to show the agent’s human name (from `_agents` frontmatter) instead of the raw agent id/filename; update associated webview tests.

Key decisions:
- Agent IDs remain the `_agents` filenames (e.g. `05-⚙️coder`): prompt-building loads agent context via `_agents/<agent>.md` based on `task.agent` (`src/services/context.ts:333`).
- Stage-to-agent resolution prefers reading `_agents` frontmatter (`stage`) over hardcoding filenames: supports renaming agent files without breaking automation.
- Stage changes should not clobber a user-chosen custom agent: only auto-set `agent` when unset, or when the current agent matches the default agent for the current stage.

Edge cases:
- No matching agent for a stage: keep existing `task.agent` and still update `stage`.
- Multiple agents declare the same `stage`: choose deterministically (e.g. first by `id` sort) and document behavior.
- `audit -> completed`: update `stage` to `completed` without changing `agent` by default (keeps ownership/audit trail).

## Context
### Relevant Code
- `src/services/stage-manager.ts:18` - `updateTaskStage()` updates `stage` only; extend to also update `agent` during stage transitions.
- `src/services/context.ts:333` - `loadAgentContext()` resolves agent context by filename using `task.agent`, not the agent frontmatter `name`.
- `src/services/context.ts:97` - `listAvailableAgents()` derives `id` from filename but exposes `name` from frontmatter; use this to map id → display name in the UI and to resolve defaults.
- `src/webview/ui/components/TaskCard.tsx:132` - currently renders raw `task.agent`; change to render the resolved agent display name.
- `src/core/rules.ts:3` - allowed transitions include `audit -> completed`; agent update logic should account for `completed`.

### Patterns to Follow
- Back-end file reads should stay within the kanban root and reuse `ensureSafePath()` patterns already present in `src/services/context.ts`.
- Webview UI should use the `agents` list already provided in `InitState` (from `listAvailableAgents()`), rather than introducing new file reads inside the webview.

### Test Patterns
- `tests/stage-manager.test.ts:32` - stage-manager unit tests verify both returned `Task` values and on-disk frontmatter updates.
- `tests/webview/taskcard.test.tsx:88` - TaskCard is covered with React Testing Library; add/adjust assertions so agent display comes from the `agents` lookup when provided.

### Dependencies
- `gray-matter`: used to parse `_agents` frontmatter in `src/services/context.ts` (can be reused for stage-to-agent resolution).
- `vitest` / `@testing-library/react`: existing unit and webview test stack for verifying behavior.

### Gotchas
- Changing stored `task.agent` values to canonical names like `coder` will break agent context loading unless `loadAgentContext()` is updated to resolve by frontmatter `name` instead of filename (`src/services/context.ts:333`).
- Context “skills” live under `_context/skills/`; `loadCustomContexts()` only auto-resolves non-slashed names from `_context/`, so skill entries should be explicit paths like `_context/skills/react-core-skills` (`src/services/context.ts:355`).

## Skills System

### What are skills?
Skills are reusable context files in `_context/skills/` that provide framework-specific conventions and best practices.

### Selected skills for this task
- `_context/skills/react-core-skills` - touches React/TSX webview components (Task card display).
- `_context/skills/skill-vitest-playwright-testing` - updates and extends Vitest tests for stage manager and webview UI.

## Audit

### Files Modified
- src/services/stage-manager.ts
- src/webview/ui/components/TaskCard.tsx
- src/webview/ui/components/Column.tsx
- src/webview/ui/components/BoardHorizontal.tsx
- src/webview/ui/components/BoardSwimlane.tsx
- src/webview/ui/components/Board.tsx
- tests/stage-manager.test.ts
- tests/webview/taskcard.test.tsx

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Stage transitions now auto-assign the stage’s default agent (without clobbering manual assignments), and the UI displays canonical agent names using the existing `agents` lookup.

### Findings

#### Blockers
- [ ] None

#### High Priority
- [ ] None

#### Medium Priority
- [ ] Default agent resolution only scans top-level `_agents` (unlike `listAvailableAgents()` which is recursive); consider aligning if nested agents are supported - `src/services/stage-manager.ts:21`

#### Low Priority / Nits
- [ ] `listAgentsWithStage()` duplicates agent parsing logic from `src/services/context.ts`; consider reusing/shared helper to reduce drift - `src/services/stage-manager.ts:21`

### Test Assessment
- Coverage: Adequate
- Missing tests: None for the stated scope

### What's Good
- Uses agent frontmatter `stage` for default resolution and preserves custom `task.agent` assignments as intended - `src/services/stage-manager.ts:57`
- UI keeps agent IDs stable for context loading while displaying canonical names via `agents` lookup - `src/webview/ui/components/TaskCard.tsx:32`

### Recommendations
- If you ever introduce agent subfolders, update `listAgentsWithStage()` to walk directories (or reuse `listAvailableAgents()` and add `stage` to its return type).

