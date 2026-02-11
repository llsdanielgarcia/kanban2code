---
name: Architecture
description: Codebase and project description
scope: global
created: '2025-12-17'
file_references:
  - docs/architecture.md
---

# Architecture Context

This context file links to the main architecture documentation. When the auditor accepts a task (rating 8+), they should update this file or the linked documentation to reflect any new files created.

See: [docs/architecture.md](docs/architecture.md) for the full architecture documentation including directory structure.

## Accepted Task Updates

- date: 2026-02-11
- task: `task1.1-add-mode-and-attempts-fields-to-task-interface`
- files-updated:
  - `src/types/task.ts` (`Task` now includes optional `mode?: string` and `attempts?: number`)
  - `src/services/frontmatter.ts` (parse + stringify support for `mode` and `attempts`)
- new-files-created: none

- date: 2026-02-11
  - task: `task1.2-define-agentcliconfig-and-modeconfig-types-with-zod-schemas`
  - files-updated: none
  - new-files-created:
    - `src/types/agent.ts` - Defines `AgentCliConfig` interface and Zod schema for CLI configuration
    - `src/types/mode.ts` - Defines `ModeConfig` interface and Zod schema for mode configuration
    - `tests/agent-mode-schemas.test.ts` - Tests for the agent and mode schema validation

- date: 2026-02-11
  - task: `task1.3-add-modes-folder-and-logs-folder-constants`
  - files-updated:
    - `src/core/constants.ts` (added `MODES_FOLDER = '_modes'` and `LOGS_FOLDER = '_logs'`)
  - new-files-created: none

- date: 2026-02-11
  - task: `task2.1-create-modeservice-crud-for-modes`
  - files-updated:
    - `docs/architecture.md` (added `mode-service.ts` to service list)
  - new-files-created:
    - `src/services/mode-service.ts` - Service for CRUD operations on mode files
    - `tests/mode-service.test.ts` - Tests for mode files CRUD operations

- date: 2026-02-11
  - task: `task2.2-create-agentservice-crud-for-new-agents-cli-config-files`
  - files-updated: none
  - new-files-created:
    - `src/services/agent-service.ts` - CRUD service for agent CLI configuration files in `_agents/`
    - `tests/agent-service.test.ts` - Tests for agent CLI config CRUD operations (21 tests)

- date: 2026-02-11
  - task: `task2.3-update-frontmatter-parser-for-mode-and-attempts`
  - files-updated:
    - `src/services/frontmatter.ts` (parse/serialize `mode` and `attempts` fields)
    - `src/services/task-content.ts` (`saveTaskWithMetadata` metadata interface now includes `mode`)
    - `src/webview/KanbanPanel.ts` (threads `mode` through `FullTaskDataLoaded` and `SaveTaskWithMetadata`)
    - `src/webview/SidebarProvider.ts` (threads `mode` through `FullTaskDataLoaded` and `SaveTaskWithMetadata`)
    - `src/webview/ui/components/TaskEditorModal.tsx` (manages `mode` state, dirty checking, save)
    - `tests/frontmatter.test.ts` (4 new tests for mode/attempts parsing, serialization, round-trip)
  - new-files-created: none

- date: 2026-02-11
  - task: `task2.4-update-prompt-builder-for-mode-aware-context-loading`
  - files-updated:
    - `src/services/prompt-builder.ts` (added `loadModeInstructions` with 3-step fallback chain, `buildRunnerPrompt` export, runner `<runner automated="true" />` injection)
  - new-files-created: none
  - tests-added:
    - `tests/prompt-builder.test.ts` (5 new tests: mode loading, agent-to-mode fallback, agent fallback, runner prompt shape, runner automated flag)

- date: 2026-02-11
  - task: `task2.5-update-stage-manager-for-mode-aware-auto-assignment`
  - files-updated:
    - `src/services/stage-manager.ts` (added `ModeInfo`, `listModesWithStage`, `getDefaultModeForStage`, `getDefaultAgentForMode`, `shouldAutoUpdateMode`; updated `updateTaskStage` to auto-set `mode` and `agent` from mode defaults with fallback to stage-based agent assignment)
  - new-files-created: none
  - tests-added:
    - `tests/stage-manager.test.ts` (5 new tests: mode-for-stage lookup, agent-for-mode config lookup, auto-set mode+agent on code/audit stages, manual mode preservation)

- date: 2026-02-11
  - task: `task3.1-create-migration-service-agents-to-modes-new-agents`
  - files-updated:
    - `.kanban2code/.gitignore` (added `_logs/` entry)
  - new-files-created:
    - `src/services/migration.ts` - Atomic migration service for agents → modes transition
    - `tests/migration.test.ts` - Tests for migration service functionality
  - tests-added:
    - 4 tests: migration success, idempotence, rollback, gitignore update

- date: 2026-02-11
  - task: `task3.2-update-build-script-to-bundle-modes`
  - files-updated:
    - `build.ts` (added `_modes/` directory reading to `generateBundledContent()`)
  - new-files-created:
    - `src/assets/modes.ts` - Auto-generated file containing bundled mode files

- date: 2026-02-11
  - task: `task3.3-update-scaffolder-for-modes-directory`
  - files-updated:
    - `src/services/scaffolder.ts` (added `_modes/` to scaffold and sync functions)
    - `tests/scaffolder.test.ts` (added tests for mode scaffolding)
  - new-files-created: none
  - tests-added:
    - 2 tests: scaffold creates modes, sync preserves existing modes

- date: 2026-02-11
  - task: `task3.4-register-migration-command-verify-file-watcher-coverage`
  - files-updated:
    - `src/commands/index.ts` (registered `kanban2code.migrateAgentsModes` command with VS Code progress notification)
    - `src/services/task-watcher.ts` (added `_modes/` and `_agents/` exclusion in `isTaskFile()`)
    - `package.json` (added command declaration and activation event)
  - new-files-created: none
  - tests-added:
    - 2 tests in `tests/task-watcher.test.ts`: `_modes/` and `_agents/` exclusion from task events

- date: 2026-02-11
  - task: `task4.0-deterministic-task-ordering-in-scanner`
  - files-updated:
    - `src/services/scanner.ts` (added `sortTasks` and `getOrderedTasksForStage` exports; `loadAllTasks` now returns sorted results)
    - `tests/scanner.test.ts` (added 10 tests for deterministic ordering)
  - new-files-created: none
  - tests-added:
    - 10 tests: order field sorting, undefined order handling, filename tiebreaker, stage filtering, immutability
