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

- date: 2026-02-11
  - task: `task4.1-cli-adapter-interface-claude-adapter`
  - files-updated: none
  - new-files-created:
    - `src/runner/cli-adapter.ts` - `CliAdapter` interface, `CliResponse`, `CliCommandResult`, `CliAdapterOptions` types
    - `src/runner/adapters/claude-adapter.ts` - Claude CLI adapter implementation
    - `tests/claude-adapter.test.ts` - Tests for Claude adapter

- date: 2026-02-11
  - task: `task4.2-codex-kimi-and-kilo-cli-adapters-adapter-factory`
  - files-updated: none
  - new-files-created:
    - `src/runner/adapters/codex-adapter.ts` - Codex CLI adapter (stdin prompt, JSONL output)
    - `src/runner/adapters/kimi-adapter.ts` - KIMI CLI adapter (-p flag, plain text output)
    - `src/runner/adapters/kilo-adapter.ts` - Kilo CLI adapter (positional prompt, JSONL output)
    - `src/runner/adapter-factory.ts` - Factory function `getAdapterForCli(cli) → CliAdapter`
    - `tests/other-cli-adapters.test.ts` - Tests for Codex, KIMI, Kilo adapters and factory

- date: 2026-02-11
  - task: `task4.3-structured-output-parser`
  - files-updated: none
  - new-files-created:
    - `src/runner/output-parser.ts` - Structured marker extraction for LLM output
    - `tests/output-parser.test.ts` - Tests for output-parser
  - tests-added:
    - 8 tests: stage transitions, audit ratings, verdicts, file lists, and fallbacks

- date: 2026-02-11
  - task: `task4.5-git-operations-for-runner`
  - files-updated: none
  - new-files-created:
    - `src/runner/git-ops.ts` - Git helper functions for runner (`isWorkingTreeClean`, `hasUncommittedChanges`, `commitRunnerChanges`)
    - `tests/git-ops.test.ts` - Tests for git operations (3 tests)

- date: 2026-02-11
  - task: `task4.4-runner-execution-engine`
  - files-updated: none
  - new-files-created:
    - `src/runner/runner-engine.ts` - Core runner execution engine with sequential pipeline logic
    - `tests/runner-engine.test.ts` - Tests for RunnerEngine
  - tests-added:
    - 6 tests: pipeline execution, audit failure loops, CLI crash handling, dirty git check

- date: 2026-02-11
  - task: `task4.6-runner-log-report-generator`
  - files-updated: none
  - new-files-created:
    - `src/runner/runner-log.ts` - `RunnerLog` class for generating markdown run reports
    - `tests/runner-log.test.ts` - Tests for runner log generation and persistence
  - tests-added:
    - 4 tests: markdown headers, summary counts, per-task fields, zero-task handling

- date: 2026-02-11
  - task: `task4.7-register-runner-vs-code-commands`
  - files-updated:
    - `src/commands/index.ts` (registered runner commands)
    - `src/extension.ts` (runner singleton lifecycle, progress API)
    - `package.json` (added runner commands)
  - new-files-created:
    - `tests/runner-singleton.test.ts` - Tests for runner singleton and cancellation

- date: 2026-02-11
  - task: `task5.1-update-messaging-protocol-for-modes-and-runner`
  - files-updated:
    - `src/webview/messaging.ts` (added mode-management and runner-control message types; added `RunnerState` type/schema/parser)
    - `tests/webview.test.ts` (added EnvelopeSchema coverage for new message types and RunnerState validation tests)
  - new-files-created: none

- date: 2026-02-11
  - task: `task5.2-modepicker-component-update-agentpicker`
  - files-updated:
    - `src/webview/ui/components/AgentPicker.tsx` (Agent picker now targets LLM providers, updates label to "Agent (LLM Provider)", and keeps provider description hint behavior)
    - `src/webview/ui/components/TaskEditorModal.tsx` (uses provider-based AgentPicker wiring)
    - `src/webview/ui/components/TaskModal.tsx` (uses provider-based AgentPicker wiring)
    - `tests/webview/components/AgentPicker.test.tsx` (covers provider rendering, label text, no-selection behavior, and canonical name resolution)
  - new-files-created:
    - `src/webview/ui/components/ModePicker.tsx` - Mode dropdown component with mode description hint and "Create new mode" action
    - `tests/webview/components/ModePicker.test.tsx` - ModePicker component tests for rendering, selection, callbacks, and no-selection behavior

- date: 2026-02-11
  - task: `task5.3-runner-controls-on-column-headers`
  - files-updated:
    - `src/webview/ui/components/Column.tsx` (added runner control buttons: play, play-all, stop; visibility logic based on `isRunnerActive` and `stage`)
    - `src/webview/ui/components/BoardHorizontal.tsx` (passed down runner control props to Column)
    - `src/webview/ui/styles/main.css` (styles for runner controls and buttons)
    - `tests/webview/column.test.tsx` (added 6 tests for runner control visibility, behavior, and callbacks)
  - new-files-created: none
