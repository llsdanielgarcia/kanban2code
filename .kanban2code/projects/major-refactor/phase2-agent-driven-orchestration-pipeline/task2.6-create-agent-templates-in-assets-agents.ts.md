---
stage: plan
tags: [refactor, p1]
agent: coder
contexts: []
---

# Create Agent Templates in assets/agents.ts

## Goal
Create constants in assets/agents.ts containing bundled agent content.

## Definition of Done
- [ ] `AGENT_ROADMAPPER` constant with full agent markdown
- [ ] `AGENT_ARCHITECT` constant
- [ ] `AGENT_SPLITTER` constant
- [ ] `AGENT_PLANNER`, `AGENT_CODER`, `AGENT_AUDITOR` constants
- [ ] Scaffolder uses these constants for agent creation

## Context
This task creates string constants for all agent content that can be bundled with the extension. This follows the same pattern as the existing templates.ts file but for agent content instead.