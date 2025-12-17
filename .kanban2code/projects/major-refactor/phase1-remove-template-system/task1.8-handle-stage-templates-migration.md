---
stage: plan
tags:
  - refactor
  - p1
agent: coder
contexts: []
---

# Handle Stage Templates Migration

## Goal
Decide on and implement the fate of stage templates in the new agent-driven workflow.

## Definition of Done
- [ ] Decision made: embed stage context in agent instructions OR keep `_templates/stages/`
- [ ] `context.ts` - `loadStageTemplate()` updated or removed
- [ ] `prompt-builder.ts` - Stage template layer updated
- [ ] Stage context available to agents via alternative mechanism

## Context
This task addresses a critical decision point: what to do with stage templates that are currently loaded by the prompt builder. The decision impacts how agents will receive stage-specific context in the new workflow.
