---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: [skills/skill-typescript-config]
---

# Define AgentCliConfig and ModeConfig types with Zod schemas

## Goal

Create TypeScript interfaces and Zod schemas for the new agent CLI configuration and mode configuration types.

## Definition of Done

- [x] `AgentCliConfig` interface with fields: `cli`, `model`, `subcommand?`, `unattended_flags`, `output_flags`, `prompt_style` (flag|positional|stdin), `safety?` (max_turns, max_budget_usd, timeout), `provider?`, `config_overrides?`
- [x] `ModeConfig` interface with fields: `id`, `name`, `description`, `stage?`, `path`, `content?`
- [x] Zod schemas for runtime validation of both types
- [x] `PromptStyle` literal union type: `'flag' | 'positional' | 'stdin'`

## Files

- `src/types/agent.ts` - create - `AgentCliConfig` interface + Zod schema
- `src/types/mode.ts` - create - `ModeConfig` interface + Zod schema

## Tests

- [x] Zod validates a valid opus agent config object
- [x] Zod rejects missing required fields (cli, model)
- [x] `ModeConfig` schema validates with and without optional `stage`

## Context

The `AgentCliConfig` type represents the new CLI configuration schema for LLM providers (opus, codex, kimi, glm). Each agent file in `_agents/` will contain YAML frontmatter with these fields.

The `ModeConfig` type represents behavioral instruction files in `_modes/` (coder, auditor, planner, etc.). These contain the system prompts and behavior rules.

Zod schemas provide runtime validation when loading these files from the filesystem.

---

## Review

**Rating: 10/10**

**Verdict: ACCEPTED**

### Summary

Excellent implementation of TypeScript interfaces and Zod schemas for the new agent CLI configuration and mode configuration types. The schemas are well-structured, comprehensive, and tested.

### Findings

#### What's Good

- Clear, well-documented TypeScript interfaces with Zod schema validation
- Complete coverage of all required fields from the definition of done
- Comprehensive test suite with 12 tests covering all scenarios
- Proper handling of optional fields with appropriate validation rules
- Schema definitions follow best practices for readability and maintainability

### Test Assessment

- Coverage: Adequate - all fields and validation rules are tested
- Missing tests: None - all scenarios are covered

### Recommendations

None - implementation is complete and correct

---

## Audit

src/types/agent.ts
src/types/mode.ts
tests/agent-mode-schemas.test.ts
