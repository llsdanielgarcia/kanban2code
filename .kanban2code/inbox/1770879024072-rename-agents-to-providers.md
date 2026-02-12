---
stage: code
tags:
  - refactor
  - p0
  - mvp
contexts:
  - architecture
  - ai-guide
agent: 05-⚙️coder
skills: []
mode: coder
---

# Rename Agent-as-LLM to Provider + Restore Agents as Behavior

## Summary

The agent/mode split refactor went wrong. The original `_agents/` files (behavior/instructions like planner, coder, auditor) must stay as-is. The new CLI configuration concept (opus, codex, kimi, glm) should be called **providers** and live in `_providers/`. The `_modes/` directory and entire "mode" concept is now redundant with agents and must be removed.

**New mental model:**
- **Agent** = behavioral role/instructions (planner, coder, auditor, etc.) — lives in `_agents/`, UNCHANGED from original
- **Provider** = LLM CLI configuration (opus, codex, kimi, glm) — lives in `_providers/`, NEW concept
- **Mode** = REMOVED, redundant with agents

**Task frontmatter after fix:**
```yaml
agent: coder          # behavioral role (unchanged)
provider: opus        # LLM CLI config (renamed from the broken "agent-as-LLM" concept)
attempts: 1           # stays, used by runner
# mode: REMOVED
```

---

## Root Cause Analysis

The partial refactor introduced a `mode` concept that duplicates what `agent` already does (behavioral instructions). Simultaneously, `AgentPicker` was redesigned to show LLM providers but is fed agent (behavior) data because no LLM provider files exist. The `_modes/` directory has only 3 of 7 expected files, and `_agents/` still contains the original behavior files.

**Current broken state:**
- `_agents/` → 7 behavior files (correct, keep as-is)
- `_modes/` → 3 redundant files (auditor, coder, planner) — duplicating agents
- `AgentPicker.tsx` → expects LLM providers, receives behavior names
- `ModePicker.tsx` → shows 3 modes, redundant with agent picker
- `AgentCliConfig` type → defines CLI config schema but called "Agent"
- `agent-service.ts` → reads `_agents/` expecting CLI configs, finds behavior files
- Task frontmatter has both `agent` and `mode` fields — only `agent` + `provider` needed
- Runner references `mode` throughout for behavior resolution

---

## Changes Required

### Category 1: DELETE — Remove Mode Concept Entirely

These files/concepts exist only because of the mode abstraction and are now redundant:

| File | Action |
|---|---|
| `src/types/mode.ts` | **DELETE** — `ModeConfig` / `ModeConfigSchema` no longer needed |
| `src/services/mode-service.ts` | **DELETE** — all CRUD for `_modes/` (listAvailableModes, resolveModePath, loadModeContext, createModeFile, updateModeFile, deleteModeFile) |
| `src/assets/modes.ts` | **DELETE** — auto-generated bundled modes |
| `src/webview/ui/components/ModePicker.tsx` | **DELETE** — mode dropdown UI |
| `src/webview/ui/components/ModeModal.tsx` | **DELETE** — mode create/edit modal |
| `.kanban2code/_modes/` directory | **DELETE** — all 3 files (auditor.md, coder.md, planner.md) |
| `tests/mode-service.test.ts` | **DELETE** |
| `tests/webview/components/ModePicker.test.tsx` | **DELETE** |
| `tests/webview/components/ModeModal.test.tsx` | **DELETE** |

### Category 2: RENAME — AgentCliConfig → ProviderConfig

The CLI configuration type system needs renaming from "Agent" to "Provider":

| File | Changes |
|---|---|
| `src/types/agent.ts` | **RENAME TO** `src/types/provider.ts` — rename `AgentCliConfig` → `ProviderConfig`, `AgentCliConfigSchema` → `ProviderConfigSchema`, `AgentSafety` → `ProviderSafety`, `AgentSafetySchema` → `ProviderSafetySchema`. Update JSDoc to reference `_providers/` |
| `src/services/agent-service.ts` | **RENAME TO** `src/services/provider-service.ts` — rename `AgentConfigFile` → `ProviderConfigFile`, `listAvailableAgentConfigs` → `listAvailableProviders`, `resolveAgentConfig` → `resolveProviderConfig`, `resolveAgentConfigFile` → `resolveProviderConfigFile`, `createAgentConfigFile` → `createProviderConfigFile`, `updateAgentConfigFile` → `updateProviderConfigFile`, `deleteAgentConfigFile` → `deleteProviderConfigFile`, `loadAgentConfigContent` → `loadProviderConfigContent`. Change folder constant from `AGENTS_FOLDER` to `PROVIDERS_FOLDER` |
| `tests/agent-service.test.ts` | **RENAME TO** `tests/provider-service.test.ts` — update all references |
| `tests/agent-mode-schemas.test.ts` | **RENAME TO** `tests/agent-provider-schemas.test.ts` — update schema references, remove mode schema tests |

### Category 3: NEW FILES — Provider Infrastructure

| File | Action |
|---|---|
| `src/core/constants.ts` | **EDIT** — add `PROVIDERS_FOLDER = '_providers'`, remove `MODES_FOLDER`. Keep `LOGS_FOLDER` |
| `.kanban2code/_providers/` directory | **CREATE** — with 4 CLI config files: `opus.md`, `codex.md`, `kimi.md`, `glm.md` (content from migration.ts lines 264-310) |

### Category 4: EDIT — Remove `mode` field, add `provider` field

| File | What changes |
|---|---|
| `src/types/task.ts` | Remove `mode?: string`, add `provider?: string`. Keep `attempts` |
| `src/types/config.ts` | Rename `modeDefaults` → `providerDefaults` (maps agent name → default provider). Update `DEFAULT_CONFIG` accordingly. Also review `AgentConfig` interface — it has `primaryUse`/`secondaryUse` which are used by config.json but NOT by `_agents/` files |
| `src/services/frontmatter.ts` | Line 83: change `mode` parsing to `provider` parsing. Line 126: serialize `provider` instead of `mode` |
| `src/services/task-content.ts` | Line 85: change `mode: string \| null` to `provider: string \| null` in metadata interface. Line 131: write `provider` instead of `mode` |

### Category 5: EDIT — Prompt Builder (Critical Path)

| File | What changes |
|---|---|
| `src/services/prompt-builder.ts` | **Major rewrite of `loadModeInstructions`** → rename to `loadAgentInstructions`. The three-step fallback chain changes: (1) load from `_agents/{task.agent}.md` (behavior instructions) — this is the ONLY source now. Remove the `_modes/` fallback steps entirely. Section name always `agent`. Remove `sectionName: 'mode'` logic. `buildRunnerPrompt` returns `{ xmlPrompt, agentInstructions }` (rename from `modeInstructions`). Keep `<runner automated="true" />` injection. |
| `tests/prompt-builder.test.ts` | Update all mode-related test cases to agent-based loading |

### Category 6: EDIT — Stage Manager

| File | What changes |
|---|---|
| `src/services/stage-manager.ts` | Remove `getDefaultModeForStage()` (line 108+). Rename `getDefaultAgentForMode()` to `getDefaultProviderForAgent()` — reads `providerDefaults` config. Remove `shouldAutoUpdateMode()`. `updateTaskStage()`: remove mode auto-assignment (line 187-191), add provider auto-assignment instead. Keep existing `getDefaultAgentForStage()` logic which reads `_agents/` frontmatter `stage` field to find default agent per stage |
| `tests/stage-manager.test.ts` | Update mode-related tests to provider-based |

### Category 7: EDIT — Migration Service

| File | What changes |
|---|---|
| `src/services/migration.ts` | **Major rewrite**. Current migration copies agents→modes. New migration should: (1) create `_providers/` with CLI config files, (2) scan all task files and rename `mode` field to nothing (remove it), add `provider` from `providerDefaults`, (3) delete `_modes/` directory if it exists. Remove `copyLegacyAgentsToModes`, `fixAuditorArchitecturePath` (auditor mode file won't exist). Keep `_logs/` gitignore addition. Keep agent CLI config content (opus/codex/kimi/glm definitions at lines 264-310) but write to `_providers/` instead of `_agents/` |
| `tests/migration.test.ts` | Rewrite for new migration behavior |

### Category 8: EDIT — Build System & Scaffolder

| File | What changes |
|---|---|
| `build.ts` | Lines 35, 83-99: Change `_modes` reading to `_providers` reading. Output `src/assets/providers.ts` with `BUNDLED_PROVIDERS` instead of `src/assets/modes.ts` with `BUNDLED_MODES`. Keep `_agents` reading as-is |
| `src/assets/modes.ts` | **DELETE** (replaced by `src/assets/providers.ts`, auto-generated) |
| `src/services/scaffolder.ts` | Lines 5, 41, 60-62, 105, 126: Change `BUNDLED_MODES` → `BUNDLED_PROVIDERS`, `_modes` → `_providers`. Import from `../assets/providers` instead of `../assets/modes`. **All three functions must be updated**: (1) `scaffoldWorkspace` — create `_providers/` dir (line 41) + write `BUNDLED_PROVIDERS` files (lines 60-63), remove `_modes` from dirs array. (2) `syncWorkspace` — ensure `_providers/` dir exists (line 105), write missing provider templates (lines 125-127), remove `_modes` from dirs array. This is the function called by the **"Kanban2Code: Sync" command** — it must push bundled provider files to existing workspaces. (3) `syncBundledAgents` — keep as-is (syncs `_agents/` behavior files). Consider adding a matching `syncBundledProviders` function or have `syncWorkspace` cover it |
| `tests/scaffolder.test.ts` | Update mode references to provider |

### Category 9: EDIT — Messaging Protocol

| File | What changes |
|---|---|
| `src/webview/messaging.ts` | Remove from HostToWebview: `ModesLoaded`. Remove from WebviewToHost: `RequestModes`, `CreateMode`, `UpdateMode`, `DeleteMode`. Add to HostToWebview: `ProvidersLoaded`. Add to WebviewToHost: `RequestProviders`, `CreateProvider`, `UpdateProvider`, `DeleteProvider`. Keep all existing agent and runner message types |
| `tests/webview.test.ts` | Update message type tests |

### Category 10: EDIT — Webview Hosts (SidebarProvider + KanbanPanel)

| File | What changes |
|---|---|
| `src/webview/SidebarProvider.ts` | Lines 37, 175, 188, 196, 216, 236-237, 333-364, 530-572: Replace all `listAvailableModes` calls with `listAvailableProviders` (from provider-service). Replace `modes` in InitState payload with `providers`. Handle `RequestProviders`/`CreateProvider` instead of `RequestModes`/`CreateMode`. Send `ProvidersLoaded` instead of `ModesLoaded`. Mode-related handlers (CreateMode, UpdateMode, DeleteMode) → become provider handlers |
| `src/webview/KanbanPanel.ts` | Lines 22, 215-216, 288, 301, 309, 329, 537-578: Same changes as SidebarProvider — replace mode loading with provider loading, update InitState payload |

### Category 11: EDIT — React Hooks

| File | What changes |
|---|---|
| `src/webview/ui/hooks/useTaskData.ts` | Lines 22-34, 52-53, 60, 76, 101, 130-132, 172: Remove `Mode` interface. Add `Provider` interface (`{ id, name, description, path, config? }`). Replace `modes` state with `providers` state. Handle `ProvidersLoaded` instead of `ModesLoaded`. Return `providers` instead of `modes` |
| `tests/webview/useTaskData.runner.test.ts` | Update mode references |

### Category 12: EDIT — UI Components

| File | What changes |
|---|---|
| `src/webview/ui/components/AgentPicker.tsx` | **Revert to showing agents (behavior names)**. Rename `LlmProvider` → `Agent` (or just use `{ id, name, description }`). Rename `providers` prop → `agents`. Change label from "Agent (LLM Provider)" back to "Agent". Remove `primaryUse`/`secondaryUse` fields from interface (those belong to config.json, not `_agents/` files) |
| `src/webview/ui/components/TaskModal.tsx` | Lines 8, 24, 39, 59, 78, 98, 169, 286-295: Remove ModePicker import/usage. Remove `mode` from formData. Add provider picker (can reuse a renamed component or create `ProviderPicker.tsx`). Pass `agents` correctly (not as `providers`). Add `provider` to formData and CreateTask payload |
| `src/webview/ui/components/TaskEditorModal.tsx` | Lines 11, 43, 77, 90, 101, 107, 130, 165, 174, 212, 220, 230, 238, 257, 281, 389-396: Remove ModePicker. Remove `mode` state and `availableModes`. Add `provider` state and `availableProviders`. Update metadata load/save to use `provider` instead of `mode` |
| `src/webview/ui/components/TaskCard.tsx` | Lines 51-57: Change `task.mode \| task.agent` display to `task.agent \| task.provider` (show `agent \| provider` or just agent if no provider) |
| `src/webview/ui/components/TaskContextMenu.tsx` | Lines 6, 16, 38, 47, 57, 67, 95-124, 115-124, 210: Remove `modes` prop. Remove "Change Mode" submenu. Add "Change Provider" submenu listing available providers. Keep "Change Agent" submenu for changing behavior agents |
| `src/webview/ui/components/index.ts` | Line 8: Remove `ModeModal` export |
| `tests/webview/task-editor-modal.test.tsx` | Update mode → provider references |
| `tests/webview/task-modal-create-project.test.tsx` | Update mode references |
| `tests/webview/taskcard.test.tsx` | Update mode references |
| `tests/webview/components/TaskContextMenu.test.tsx` | Update mode → provider references |
| `tests/webview/components/AgentPicker.test.tsx` | Update LlmProvider → Agent references |

### Category 13: EDIT — Runner Engine

| File | What changes |
|---|---|
| `src/runner/runner-engine.ts` | Lines 11, 88, 198, 201, 205, 219, 281-292, 305: Replace `getDefaultModeForStage` with `getDefaultAgentForStage` (already exists). Replace `getDefaultAgentForMode` with `getDefaultProviderForAgent`. Replace `getFallbackModeForStage` with `getFallbackAgentForStage`. In `setTaskStageModeAgent` (rename to `setTaskStageAgentProvider`): set `task.agent` and `task.provider` instead of `task.mode` and `task.agent`. `buildRunnerPrompt` now uses agent instructions. `persistTask` updates: replace `mode` with `provider` in partial type |
| `src/runner/cli-adapter.ts` | No changes needed — already uses `AgentCliConfig` type which just needs renaming to `ProviderConfig`. Import path changes only |
| `src/runner/adapters/claude-adapter.ts` | Import path changes: `AgentCliConfig` → `ProviderConfig` |
| `src/runner/adapters/codex-adapter.ts` | Import path changes: `AgentCliConfig` → `ProviderConfig` |
| `src/runner/adapters/kimi-adapter.ts` | Import path changes: `AgentCliConfig` → `ProviderConfig` |
| `src/runner/adapters/kilo-adapter.ts` | Import path changes: `AgentCliConfig` → `ProviderConfig` |
| `src/runner/adapter-factory.ts` (if exists) | Update imports |
| `tests/runner-engine.test.ts` | Update mode → provider references |
| `tests/claude-adapter.test.ts` | Update AgentCliConfig → ProviderConfig |
| `tests/other-cli-adapters.test.ts` | Update AgentCliConfig → ProviderConfig |

### Category 14: EDIT — Commands & Extension

| File | What changes |
|---|---|
| `src/commands/index.ts` | Lines 21, 474-498: Rename `kanban2code.migrateAgentsModes` → `kanban2code.migrateProviders` (or similar). Update migration call and progress text. Remove mode-related copy command logic if any |
| `src/services/task-watcher.ts` | Verify `_providers/` directory changes are excluded from task events (same as `_modes/` was) |

### Category 15: EDIT — Agent Behavior Files (Merge Automation Instructions from `_modes/`)

The 3 `_modes/` files (planner, coder, auditor) were rewritten with dual-mode runner instructions that the original `_agents/` files lack. Before deleting `_modes/`, these automation-aware changes must be merged INTO the corresponding `_agents/` files. The other 4 agents (roadmapper, architect, splitter, conversational) are orchestration-only and don't need runner automation.

**Planner** — `_agents/04-📋planner.md`:

| What `_modes/planner.md` adds | What `_agents/` original has instead |
|---|---|
| `## Mode Detection` section — checks for `<runner automated="true" />`, branches manual vs automated | No runner awareness at all |
| Rules item 4: "Manual Mode: MUST edit frontmatter / Automated Mode: MUST NOT, use structured markers" | Only manual flow assumed |
| Workflow step 4 branches: Manual → edit frontmatter / Automated → output `<!-- STAGE_TRANSITION: code -->` marker only | Steps 6-7: always edit frontmatter directly with `## CRITICAL: Stage Transition` section |
| Simplified output template (Implementation Plan + Proposed Changes) | Detailed Refined Prompt + Context sections with sub-templates (Relevant Code, Patterns, Test Patterns, Dependencies, Gotchas) |
| No Skills System section | Full Skills System section (What are skills, Available skills, When/How to add) |
| No First Contact protocol | First Contact: "I'm Planner Agent, I do not code..." |
| Description: "Task planning and refinement" | Description: "Refines prompts and gathers implementation context" |

**Action**: Merge `_modes/planner.md` runner detection + dual-mode transition INTO `_agents/04-📋planner.md`, keeping the original's richer content (Skills System, First Contact, Refined Prompt template, detailed Context sections). Remove `type: robot` from frontmatter. Rename `## CRITICAL: Stage Transition` to use the dual-mode branching pattern.

**Coder** — `_agents/05-⚙️coder.md`:

| What `_modes/coder.md` adds | What `_agents/` original has instead |
|---|---|
| `## Mode Detection` section — checks for `<runner automated="true" />` | No runner awareness |
| Output section branches: Manual → edit frontmatter / Automated → output `<!-- STAGE_TRANSITION: audit -->` + `<!-- FILES_CHANGED: ... -->`, do NOT commit | Output: always edit frontmatter |
| Workflow step 5 branches manual vs automated | Step 5: always update frontmatter |
| Rule: "Preserve implementation quality in both modes. Only transition mechanics differ." | No mention of dual modes |
| No `## Task File Updates` section (merged into Output) | Separate `## Task File Updates` + `## CRITICAL: Stage Transition` + `## Blockers` sections |

**Action**: Merge `_modes/coder.md` runner detection + dual-mode transition INTO `_agents/05-⚙️coder.md`, keeping the original's `## Task File Updates`, `## Blockers` sections. Remove `type: robot`. Replace `## CRITICAL: Stage Transition` with dual-mode branching.

**Auditor** — `_agents/06-✅auditor.md`:

| What `_modes/auditor.md` adds | What `_agents/` original has instead |
|---|---|
| `## Mode Detection` section — checks for `<runner automated="true" />` | No runner awareness |
| Output branches: Manual → edit frontmatter + update architecture + commit / Automated → output `<!-- AUDIT_RATING: N -->` + `<!-- AUDIT_VERDICT: ACCEPTED\|NEEDS_WORK -->`, do NOT edit frontmatter, do NOT commit | Only manual flow: always edit frontmatter |
| `## Attempt Awareness (Automated Mode)` — "Current attempt: {attempts}. If attempt 2+, be more lenient" | No attempt awareness |
| Rule: correct architecture path `.kanban2code/architecture.md` (root-level) | **BUG**: references `.kanban2code/_context/architecture.md` (wrong path, lines 77, 83) |
| Condensed workflow (4 steps) | Detailed workflow (6 steps) with full Review output template (Rating, Verdict, Findings by severity, Test Assessment, What's Good, Recommendations) |
| No `## Review Focus` section | Has `## Review Focus` (correctness, quality, tests, security, performance) |
| No `## Architecture Updates` section (folded into Output manual-mode) | Has detailed `## Architecture Updates (On Acceptance)` with step-by-step instructions |

**Action**: Merge `_modes/auditor.md` runner detection + dual-mode transition + attempt awareness INTO `_agents/06-✅auditor.md`, keeping the original's detailed Review template, Review Focus, and Architecture Updates sections. **Fix the architecture.md path bug**: change `.kanban2code/_context/architecture.md` → `.kanban2code/architecture.md` on lines 77 and 83. Remove `type: robot`. Replace `## CRITICAL: Stage Transition` with dual-mode branching.

**Summary table:**

| Agent file | What to merge from `_modes/` | What to fix | What to keep from original |
|---|---|---|---|
| `04-📋planner.md` | Runner detection, dual-mode transition (markers vs frontmatter) | Remove `type: robot` | Skills System, First Contact, Refined Prompt template, Context sections |
| `05-⚙️coder.md` | Runner detection, dual-mode transition + `FILES_CHANGED` marker, "do not commit" rule | Remove `type: robot` | Task File Updates, Blockers section |
| `06-✅auditor.md` | Runner detection, dual-mode transition + `AUDIT_RATING`/`AUDIT_VERDICT` markers, Attempt Awareness | Remove `type: robot`, **fix architecture.md path** (`_context/architecture.md` → `architecture.md`) | Review output template, Review Focus, Architecture Updates (On Acceptance) |
| `01-🗺️roadmapper.md` | None (orchestration-only, not in runner pipeline) | Remove `type: robot` | Everything |
| `02-🏛️architect.md` | None (orchestration-only) | Remove `type: robot` | Everything |
| `03-✂️splitter.md` | None (orchestration-only) | Remove `type: robot` | Everything |
| `07-💬conversational.md` | None (not in runner pipeline) | No `type: robot` to remove | Everything |

### Category 16: EDIT — Documentation & Context

| File | What changes |
|---|---|
| `.kanban2code/how-it-works.md` | Replace mode terminology with provider |
| `.kanban2code/architecture.md` (root-level) | Update data model section, service layer, runner architecture |
| `.kanban2code/_context/ai-guide.md` | Replace mode references with provider, update agent/provider split explanation |
| `docs/architecture.md` | Update throughout — mode → remove, agent stays, provider is new |
| `src/assets/contexts.ts` | Will be auto-regenerated by build |

---

## Execution Order (Phases)

### Phase 1: Types & Constants
1. Rename `src/types/agent.ts` → `src/types/provider.ts` (AgentCliConfig → ProviderConfig)
2. Edit `src/types/task.ts` — remove `mode`, add `provider`
3. Edit `src/types/config.ts` — `modeDefaults` → `providerDefaults`
4. Edit `src/core/constants.ts` — add `PROVIDERS_FOLDER`, remove `MODES_FOLDER`
5. Delete `src/types/mode.ts`

### Phase 2: Services
6. Rename `src/services/agent-service.ts` → `src/services/provider-service.ts`
7. Edit `src/services/frontmatter.ts` — `mode` → `provider`
8. Edit `src/services/task-content.ts` — `mode` → `provider`
9. Edit `src/services/prompt-builder.ts` — remove mode fallback, load from `_agents/` only
10. Edit `src/services/stage-manager.ts` — remove mode logic, add provider defaulting
11. Delete `src/services/mode-service.ts`

### Phase 3: Build & Scaffold
12. Edit `build.ts` — `_modes` → `_providers`, output `providers.ts`
13. Edit `src/services/scaffolder.ts` — `_modes` → `_providers`
14. Create `.kanban2code/_providers/` with 4 CLI config files
15. Delete `.kanban2code/_modes/` directory
16. Delete `src/assets/modes.ts`

### Phase 4: Messaging & Webview Hosts
17. Edit `src/webview/messaging.ts` — swap mode messages for provider messages
18. Edit `src/webview/SidebarProvider.ts` — modes → providers
19. Edit `src/webview/KanbanPanel.ts` — modes → providers

### Phase 5: React UI
20. Edit `src/webview/ui/hooks/useTaskData.ts` — modes → providers
21. Edit `src/webview/ui/components/AgentPicker.tsx` — revert to showing agents
22. Edit `src/webview/ui/components/TaskModal.tsx` — remove ModePicker, add provider
23. Edit `src/webview/ui/components/TaskEditorModal.tsx` — remove mode, add provider
24. Edit `src/webview/ui/components/TaskCard.tsx` — mode|agent → agent|provider
25. Edit `src/webview/ui/components/TaskContextMenu.tsx` — mode → provider submenus
26. Edit `src/webview/ui/components/index.ts` — remove ModeModal export
27. Delete `src/webview/ui/components/ModePicker.tsx`
28. Delete `src/webview/ui/components/ModeModal.tsx`

### Phase 6: Runner
29. Edit `src/runner/runner-engine.ts` — mode → provider throughout
30. Edit `src/runner/cli-adapter.ts` — AgentCliConfig → ProviderConfig import
31. Edit all `src/runner/adapters/*.ts` — update imports
32. Edit migration service for new behavior

### Phase 7: Agent Behavior Files (Merge Automation from `_modes/`)
33. Merge runner detection + dual-mode transitions from `_modes/planner.md` into `_agents/04-📋planner.md` (keep original's Skills System, First Contact, Refined Prompt template)
34. Merge runner detection + dual-mode transitions + FILES_CHANGED marker from `_modes/coder.md` into `_agents/05-⚙️coder.md` (keep original's Task File Updates, Blockers)
35. Merge runner detection + dual-mode transitions + AUDIT_RATING/VERDICT markers + Attempt Awareness from `_modes/auditor.md` into `_agents/06-✅auditor.md` (keep original's Review template, Review Focus, Architecture Updates). **Fix architecture.md path bug** (`_context/architecture.md` → `architecture.md`)
36. Remove `type: robot` from frontmatter in all 6 agent files that have it (01-07, except 07 which doesn't have it)

### Phase 8: Commands & Docs
37. Edit `src/commands/index.ts` — migration command rename
38. Update all documentation (how-it-works, architecture, ai-guide, docs/architecture)

### Phase 9: Tests
39. Delete mode-related test files (3 files)
40. Rename agent-service/schema test files
41. Update all remaining test files (~20 files) with mode→provider renames
42. Run full test suite, fix breakages

---

## File Count Summary

- **Files to DELETE**: 9 (3 source + 3 test + 1 asset + 1 directory + contents)
- **Files to RENAME**: 4 (2 source + 2 test)
- **Files to CREATE**: 5 (4 provider configs + 1 auto-generated asset)
- **Files to EDIT**: ~40 (services, UI, runner, hosts, hooks, commands, tests, docs)
- **Total files touched**: ~58
