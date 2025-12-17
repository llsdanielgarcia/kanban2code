---
stage: plan
tags: [refactor, p1]
agent: coder
contexts: []
---

# Update Scaffolder for Agent Bundling

## Goal
Update the scaffolder to bundle and copy agent files to new workspaces.

## Definition of Done
- [ ] Agent markdown files embedded in extension build
- [ ] `scaffolder.ts` copies bundled agents to new workspaces
- [ ] Existing agents preserved if already present (no overwrite)
- [ ] `tests/scaffolder.test.ts` verifies agent scaffolding

## Context
This task updates the scaffolder to create `_agents/` directories in new workspaces and populate them with the bundled agent files. This ensures all workspaces have access to the standard agent definitions.