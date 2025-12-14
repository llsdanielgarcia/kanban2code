---
stage: inbox
tags: [templates, agents, config]
agent: opus
contexts: []
---

# Task 3.2: Create Agent Personality Definitions

## Goal

Add agent personality definitions to config.json to help users understand when and how to use each agent.

## Background

Users need guidance on which agent to use for different types of tasks. Personality definitions provide clear descriptions of each agent's strengths and typical use cases.

## Scope

Define 6 agent personalities:
1. Architect (Opus) - System design focus
2. Frontend Developer (Opus/Gemini) - UI/UX focus
3. Backend Developer (Codex) - Logic/data focus
4. Auditor (Codex/Opus) - Code review focus
5. Planner (Opus) - Task breakdown focus
6. Context Builder (Sonnet/GLM) - Context creation focus

## Files to Modify

- `.kanban2code/config.json` - Add personalities section

## Acceptance Criteria

- [ ] All 6 personalities are defined
- [ ] Each includes description of when to use
- [ ] Suggested prompts/instructions are included
- [ ] Strengths and limitations are documented
- [ ] Personalities reference appropriate agents
- [ ] Config remains valid JSON

## Testing Requirements

Validate the updated config.json loads correctly and personalities are accessible.

## Notes

These personality definitions will be shown in the agent selection modal to help users make informed choices.