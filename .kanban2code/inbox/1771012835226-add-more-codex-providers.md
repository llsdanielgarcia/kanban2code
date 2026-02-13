---
stage: completed
agent: 06-✅auditor
provider: codex
tags: []
contexts:
  - architecture
  - ai-guide
skills:
  - skills/skill-typescript-config
attempts: 2
---

# Add more codex providers

I only have a single codex provider, I'm missing Low, High and extra high. 

I'm Planner Agent, I do not code, I only refine the prompt and gather context.

## Refined Prompt
Objective: Add Codex provider variants for `low`, `high`, and `xhigh` reasoning effort while keeping the current `codex` provider as `medium`.

Implementation approach:
1. Add three new provider files in `.kanban2code/_providers/` using the existing `codex.md` structure, changing only provider identity fields (`model_reasoning_effort`, and optional display `name` if used).
2. Regenerate bundled provider assets so new provider files are included in `src/assets/providers.ts`, then run focused tests that validate provider discovery and scaffolding behavior.

Key decisions:
- Keep `codex.md` unchanged at `medium`: preserves backward compatibility for tasks already using `provider: codex`.
- Use `xhigh` for "extra high": codex reasoning effort values explicitly include `xhigh` (not `extra_high`), so provider config must match CLI-accepted values.
- Use filename-based IDs for selection: provider IDs are derived from file names, so add distinct files (for example `codex-low.md`, `codex-high.md`, `codex-xhigh.md`) to expose separate selectable providers.

Edge cases:
- Invalid reasoning effort strings in frontmatter can still parse as config but fail at runtime CLI invocation; keep values to the documented set.
- If only `.kanban2code/_providers/*.md` is changed without regenerating assets, newly scaffolded workspaces will not receive the new providers.
- Provider list order is alphabetical by display name, so choose naming that keeps variants easy to find in UI dropdowns.

## Context
### Relevant Code
- `.kanban2code/_providers/codex.md:1` - Canonical codex provider schema and current `model_reasoning_effort: medium` baseline.
- `.kanban2code/projects/overhaul/overhaul-agents-modes-runner.md:61` - Documents valid codex reasoning effort values (`minimal`, `low`, `medium`, `high`, `xhigh`).
- `src/types/provider.ts:24` - `ProviderConfigSchema` accepted fields for provider frontmatter.
- `src/services/provider-service.ts:15` - Provider discovery/parsing logic and filename-derived IDs.
- `src/services/provider-service.ts:72` - Provider list sorting behavior (`name.localeCompare`).
- `build.ts:31` - Bundles `.kanban2code/_providers` into `src/assets/providers.ts`.
- `src/services/scaffolder.ts:60` - Scaffolder writes `BUNDLED_PROVIDERS` into new workspaces.
- `tests/provider-service.test.ts:30` - Existing patterns for provider parsing/discovery tests.
- `tests/scaffolder.test.ts:169` - Existing patterns that assert bundled provider files are scaffolded.

### Patterns to Follow
Use provider markdown files with YAML frontmatter matching existing `_providers/*.md` shape (`cli`, `subcommand` optional, `model`, `unattended_flags`, `output_flags`, `prompt_style`, `provider`, `config_overrides` optional). Keep newline and quoting style consistent with existing provider files.

### Test Patterns
Follow `tests/provider-service.test.ts` for provider listing and config parsing expectations. Follow `tests/scaffolder.test.ts` bundled-provider assertions to confirm new files are included after asset regeneration.

### Dependencies
- `gray-matter`: Parses YAML frontmatter from provider markdown files via `provider-service`.
- `zod` (`ProviderConfigSchema`): Validates provider config shape.
- Build pipeline (`bun run build.ts`): Regenerates `src/assets/providers.ts` from `.kanban2code/_providers/`.

### Gotchas
- `src/assets/providers.ts` is auto-generated: do not hand-edit it; regenerate through build script.
- Provider ID comes from filename (`path.basename(.md)`): renaming files changes IDs and may break existing task frontmatter references.
- `prompt_style` for codex must remain `stdin` so adapter behavior continues to match `CodexAdapter` command building.

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Implementation matches the refined prompt: Codex low/high/xhigh provider variants were added while preserving the existing medium default, and bundled-provider/scaffolding coverage is in place.

### Findings

#### Blockers
- [ ] None.

#### High Priority
- [ ] None.

#### Medium Priority
- [ ] None.

#### Low Priority / Nits
- [ ] Consider adding explicit `name` fields in the new provider frontmatter for more user-friendly labels in provider pickers.

### Test Assessment
- Coverage: Adequate
- Missing tests: None identified for this scope; focused provider parsing and scaffolding tests cover the new variants.

### What's Good
- Backward compatibility is preserved by keeping `codex.md` at `model_reasoning_effort: medium`.
- `xhigh` uses the correct CLI-facing value, and `src/assets/providers.ts` includes all new files.
