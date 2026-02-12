# Architecture

## Overview
Kanban2Code is a VS Code extension that stores task state directly in the filesystem under `.kanban2code/`. The extension supports both manual AI workflows and an automated batch runner.

Core design split:
- `agent` = LLM provider/runtime config (CLI + model + flags)
- `mode` = behavioral role/instructions (planner/coder/auditor/etc.)

## Workspace Structure
- `.kanban2code/inbox/` and `.kanban2code/projects/**`:
  - Task markdown files with frontmatter (`stage`, `agent`, `mode`, `attempts`, `tags`, `contexts`, ...)
- `.kanban2code/_modes/`:
  - Mode instruction files (behavior prompts by role)
- `.kanban2code/_agents/`:
  - Agent CLI config files (provider/runtime settings)
- `.kanban2code/_context/`:
  - Context documents injected into prompts (including `ai-guide.md`)
- `.kanban2code/architecture.md`, `.kanban2code/how-it-works.md`, `.kanban2code/project-details.md`:
  - Global context files loaded for prompts

## Data Model
Task shape is defined in `src/types/task.ts`:
- `stage`: `inbox | plan | code | audit | completed`
- `agent?`: LLM provider identifier
- `mode?`: behavioral role identifier
- `attempts?`: audit retry count used by runner

Configuration is defined in `src/types/config.ts`:
- `modeDefaults?: Record<string, string>` maps mode -> default agent

Agent CLI schema is defined in `src/types/agent.ts`:
- `cli`, `model`, `unattended_flags`, `output_flags`, `prompt_style`, optional `safety`, etc.

## Service Layer
- `src/services/prompt-builder.ts`:
  - Builds XML prompts
  - Mode-aware loading chain:
    1. `_modes/{task.mode}.md`
    2. `_modes/{task.agent}.md` (migration fallback)
    3. `_agents/{task.agent}.md` (legacy fallback)
  - `buildRunnerPrompt(...)` injects `<runner automated="true" />` and returns both XML + raw mode instructions
- `src/services/mode-service.ts`:
  - CRUD/list/load for `_modes/`
- `src/services/agent-service.ts`:
  - CRUD/list/load + schema parsing for `_agents/`
- `src/services/stage-manager.ts`:
  - Stage transitions with mode+agent defaulting (`getDefaultModeForStage`, `getDefaultAgentForMode`)

## Runner Architecture
Runner engine files:
- `src/runner/runner-engine.ts`
- `src/runner/adapters/*` + `src/runner/adapter-factory.ts`
- `src/runner/output-parser.ts`
- `src/runner/git-ops.ts`
- `src/runner/runner-log.ts`

Execution behavior:
1. Runner selects task(s) by stage and deterministic ordering.
2. For each stage (`plan`, `code`, `audit`), runner sets task `stage/mode/agent`.
3. Runner builds prompt with automated flag and executes configured CLI adapter.
4. Runner parses structured markers from model output:
   - `<!-- STAGE_TRANSITION: ... -->`
   - `<!-- FILES_CHANGED: ... -->`
   - `<!-- AUDIT_RATING: N -->`
   - `<!-- AUDIT_VERDICT: ACCEPTED|NEEDS_WORK -->`
5. Runner owns all frontmatter transitions in automated mode.
6. Audit pass/fail logic:
   - pass (`rating >= 8` or verdict accepted) -> `completed`
   - fail -> increment `attempts`, return to `code`
   - fail at `attempts >= 2` -> hard stop

## Manual vs Automated Modes
Mode files in `_modes/` now include dual-mode instructions:
- Manual mode:
  - AI edits frontmatter directly for stage handoff
- Automated mode (`<runner automated="true" />` present):
  - AI outputs structured markers only
  - AI must not edit frontmatter or commit
  - Runner performs transitions/commits

## Build and Bundling
`build.ts` bundles workspace templates into `src/assets/*`:
- `src/assets/agents.ts` from `.kanban2code/_agents/`
- `src/assets/modes.ts` from `.kanban2code/_modes/`
- `src/assets/contexts.ts` from `.kanban2code/_context/`

Scaffolding (`src/services/scaffolder.ts`) creates/syncs these templates into new workspaces.
