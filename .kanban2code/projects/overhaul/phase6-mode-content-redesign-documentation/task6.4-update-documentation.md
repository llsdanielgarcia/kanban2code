---
stage: completed
tags:
  - docs
  - p2
agent: auditor
contexts: []
skills: []
---

# Update documentation

## Goal
Update all documentation to reflect the new agent/mode split and runner architecture.

## Definition of Done
- [x] `.kanban2code/architecture.md` (root-level seed file) updated with: `_modes/` directory, new `_agents/` schema, runner architecture, new service files
- [x] `how-it-works.md` updated with agent/mode split terminology
- [x] `_context/ai-guide.md` updated with runner workflow, structured output markers, and dual-mode (manual vs automated) instructions

## Files
- `.kanban2code/architecture.md` - modify (root-level seed file, loaded by `loadGlobalContext`)
- `.kanban2code/how-it-works.md` - modify
- `.kanban2code/_context/ai-guide.md` - modify

## Tests
- [x] Documentation accurately reflects implemented architecture
- [x] Bundled contexts include updated docs after build

## Context
All documentation needs to be updated to reflect the new architecture:
- Agent/mode split (agent = LLM provider, mode = behavioral role)
- Runner architecture and workflow
- Structured output markers for automated execution
- Dual-mode instructions (manual vs automated)
- New service files (ModeService, AgentService, runner engine, etc.)

## Audit
.kanban2code/architecture.md
.kanban2code/how-it-works.md
.kanban2code/_context/ai-guide.md
src/assets/contexts.ts
src/assets/modes.ts
.kanban2code/projects/overhaul/phase6-mode-content-redesign-documentation/task6.4-update-documentation.md
