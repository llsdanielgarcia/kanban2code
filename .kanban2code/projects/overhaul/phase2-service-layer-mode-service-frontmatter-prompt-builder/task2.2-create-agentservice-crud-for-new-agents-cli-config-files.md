---
stage: code
tags: [feature, p1]
agent: coder
contexts: [skills/skill-typescript-config]
---

# Create AgentService (CRUD for new `_agents/` CLI config files)

## Goal
Create a service for CRUD operations on agent CLI configuration files in `_agents/` directory.

## Definition of Done
- [ ] `listAvailableAgentConfigs(root)` — reads new `_agents/*.md` CLI config files, parses YAML into `AgentCliConfig[]`
- [ ] `resolveAgentConfig(root, agentName)` — returns parsed `AgentCliConfig` object
- [ ] `createAgentConfigFile(root, data)` / `updateAgentConfigFile` / `deleteAgentConfigFile`
- [ ] Existing `listAvailableAgents()` in `context.ts` remains functional for backward compat during transition

## Files
- `src/services/agent-service.ts` - create - full CRUD service for CLI config schema

## Tests
- [ ] Parses opus.md with cli/model/prompt_style fields into `AgentCliConfig`
- [ ] Invalid frontmatter (missing `cli`) handled gracefully (returns undefined or throws)
- [ ] Empty `_agents/` directory returns empty list

## Context
The AgentService handles the new CLI configuration schema for LLM providers (opus, codex, kimi, glm). Each agent file contains YAML frontmatter with CLI invocation details (cli name, model, flags, prompt style, etc.).

This is separate from the old agent files (which are behavioral instructions and will be moved to `_modes/` during migration). The old `listAvailableAgents()` in `context.ts` remains for backward compatibility during the transition period.
