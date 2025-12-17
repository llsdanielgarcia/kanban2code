---
stage: plan
tags:
  - refactor
  - p1
agent: coder
contexts: []
---

# Remove Template Command

## Goal
Remove the template creation command from the extension.

## Definition of Done
- [ ] `kanban2code.newTemplate` command removed from `commands/index.ts`
- [ ] Command removed from `package.json` contributions
- [ ] Keybinding removed if exists

## Context
This task removes the command that allows users to create new templates. This command is no longer needed in the agent-driven workflow.
