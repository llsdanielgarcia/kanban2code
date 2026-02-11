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
