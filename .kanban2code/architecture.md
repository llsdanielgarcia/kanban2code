# Architecture

## Overview
Kanban2Code is a VS Code extension that stores task state directly in the filesystem under `.kanban2code/`. The extension supports both manual AI workflows and an automated batch runner.

Core design split:
- `agent` = behavioral role/instructions (planner/coder/auditor/etc.)
- `provider` = LLM provider/runtime config (CLI + model + flags)

## Workspace Structure
- `.kanban2code/inbox/` and `.kanban2code/projects/**`:
  - Task markdown files with frontmatter (`stage`, `agent`, `provider`, `attempts`, `tags`, `contexts`, ...)
- `.kanban2code/_agents/`:
  - Agent instruction files (behavior prompts by role)
- `.kanban2code/_providers/`:
  - Provider CLI config files (runtime settings)
- `.kanban2code/_context/`:
  - Context documents injected into prompts (including `ai-guide.md`)
- `.kanban2code/architecture.md`, `.kanban2code/how-it-works.md`, `.kanban2code/project-details.md`:
  - Global context files loaded for prompts

## Data Model
Task shape is defined in `src/types/task.ts`:
- `stage`: `inbox | plan | code | audit | completed`
- `agent?`: behavioral role identifier
- `provider?`: provider/runtime identifier
- `attempts?`: audit retry count used by runner

Configuration is defined in `src/types/config.ts`:
- `providerDefaults?: Record<string, string>` maps agent -> default provider

Provider schema is defined in `src/types/provider.ts`:
- `cli`, `model`, `unattended_flags`, `output_flags`, `prompt_style`, optional `safety`, etc.

## Service Layer
- `src/services/prompt-builder.ts`:
  - Builds XML prompts
  - Loads agent instructions from `_agents/{task.agent}.md`
  - `buildRunnerPrompt(...)` injects `<runner automated="true" />` and returns both XML + raw agent instructions
- `src/services/provider-service.ts`:
  - CRUD/list/load + schema parsing for `_providers/`
- `src/services/stage-manager.ts`:
  - Stage transitions with agent + provider defaulting (`getDefaultAgentForStage`, `getDefaultProviderForAgent`)

## Runner Architecture
Runner engine files:
- `src/runner/runner-engine.ts`
- `src/runner/adapters/*` + `src/runner/adapter-factory.ts`
- `src/runner/output-parser.ts`
- `src/runner/git-ops.ts`
- `src/runner/runner-log.ts`

Execution behavior:
1. Runner selects task(s) by stage and deterministic ordering.
2. For each stage (`plan`, `code`, `audit`), runner sets task `stage/agent/provider`.
3. Runner builds prompt with automated flag and executes the configured provider CLI adapter.
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

## Manual vs Automated Execution
Agent files in `_agents/` support dual behavior:
- Manual flow:
  - AI can edit frontmatter directly for stage handoff.
- Automated flow (`<runner automated="true" />` present):
  - AI outputs structured markers only.
  - AI must not edit frontmatter or commit.
  - Runner performs transitions/commits.

## Build and Bundling
`build.ts` bundles workspace templates into `src/assets/*`:
- `src/assets/agents.ts` from `.kanban2code/_agents/`
- `src/assets/providers.ts` from `.kanban2code/_providers/`
- `src/assets/contexts.ts` from `.kanban2code/_context/`

Scaffolding (`src/services/scaffolder.ts`) creates/syncs these templates into new workspaces.
