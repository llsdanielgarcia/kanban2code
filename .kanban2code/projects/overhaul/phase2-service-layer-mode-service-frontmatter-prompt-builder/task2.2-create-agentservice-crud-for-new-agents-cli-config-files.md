---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: [skills/skill-typescript-config]
---

# Create AgentService (CRUD for new `_agents/` CLI config files)

## Goal

Create a service for CRUD operations on agent CLI configuration files in `_agents/` directory.

## Definition of Done

- [x] `listAvailableAgentConfigs(root)` — reads new `_agents/*.md` CLI config files, parses YAML into `AgentCliConfig[]`
- [x] `resolveAgentConfig(root, agentName)` — returns parsed `AgentCliConfig` object
- [x] `createAgentConfigFile(root, data)` / `updateAgentConfigFile` / `deleteAgentConfigFile`
- [x] Existing `listAvailableAgents()` in `context.ts` remains functional for backward compat during transition

## Files

- `src/services/agent-service.ts` - create - full CRUD service for CLI config schema

## Tests

- [x] Parses opus.md with cli/model/prompt_style fields into `AgentCliConfig`
- [x] Invalid frontmatter (missing `cli`) handled gracefully (returns undefined or throws)
- [x] Empty `_agents/` directory returns empty list

## Context

The AgentService handles the new CLI configuration schema for LLM providers (opus, codex, kimi, glm). Each agent file contains YAML frontmatter with CLI invocation details (cli name, model, flags, prompt style, etc.).

This is separate from the old agent files (which are behavioral instructions and will be moved to `_modes/` during migration). The old `listAvailableAgents()` in `context.ts` remains for backward compatibility during the transition period.

## Audit

- src/services/agent-service.ts
- tests/agent-service.test.ts

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Solid, well-structured CRUD service with clean separation from the legacy `context.ts` agent handling. All 21 tests pass. The implementation fulfills every item in the Definition of Done.

### Findings

#### Blockers
_(none)_

#### High Priority
_(none)_

#### Medium Priority
- [ ] `resolveAgentConfig` re-lists all agents to find one: `resolveAgentConfig` and `resolveAgentConfigFile` both call `listAvailableAgentConfigs`, which reads and parses every file in `_agents/`. For a small number of agents this is fine, but consider a direct file lookup path for performance if the agent count grows. - `src/services/agent-service.ts:77-83`
- [ ] `createAgentConfigFile` spreads `data.config` into frontmatter, which flattens nested objects like `safety` to top-level keys alongside `name`/`created`: This works because `gray-matter` serializes nested objects fine, but it makes the produced YAML ordering non-deterministic. Consider explicitly constructing the frontmatter object to control key order. - `src/services/agent-service.ts:110-114`

#### Low Priority / Nits
- [ ] Opus test doesn't assert on `safety` or `provider` fields: The opus.md fixture includes `safety` and `provider` in its frontmatter, but the test doesn't verify those are parsed into the `AgentCliConfig`. Adding `expect(agents[0].config?.safety).toEqual({ max_turns: 10, max_budget_usd: 5, timeout: 300 })` and `expect(agents[0].config?.provider).toBe('anthropic')` would strengthen coverage. - `tests/agent-service.test.ts:71-76`
- [ ] `updateAgentConfigFile` silently swallows file-read errors: The `try/catch` at line 140-146 means if the existing file has a permissions error (not ENOENT), the update proceeds with empty content rather than surfacing the error. - `src/services/agent-service.ts:140-146`
- [ ] Unused `normalizeSlashes` could be extracted: The same `normalizeSlashes` lambda appears in both `listAvailableAgentConfigs` and the legacy `listAvailableAgents` in `context.ts`. Consider extracting to a shared utility to reduce duplication. - `src/services/agent-service.ts:21`

### Test Assessment
- Coverage: **Adequate** — 21 tests cover all CRUD operations, edge cases (empty dir, missing dir, invalid frontmatter), and helper functions (`loadAgentConfigContent`, `resolveAgentConfigFile`).
- Missing tests:
  - `safety` and `provider` field parsing assertions on the opus fixture
  - Subdirectory agent files (the `walk` function supports recursion, but no test exercises nested dirs)
  - `createAgentConfigFile` when a file already exists at the target path (overwrite vs. error behavior)

### What's Good
- Clean Zod schema (`AgentCliConfigSchema`) with optional fields (`safety`, `provider`, `config_overrides`) — well-designed for extensibility
- Graceful degradation: invalid/missing frontmatter yields `config: undefined` rather than throwing, so the listing always completes
- Path safety via `ensureSafePath` on every write/delete operation
- `formatAgentName` is a nice touch for human-readable fallback names
- Legacy `listAvailableAgents()` in `context.ts` is completely untouched — backward compat preserved

### Recommendations
- Consider adding a `getAgentConfigByPath(root, relativePath)` for direct lookup without listing all agents
- The `walk` function is duplicated between `agent-service.ts` and `context.ts` — extract to a shared `walkMarkdownFiles` utility when convenient
