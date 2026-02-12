---
stage: completed
tags:
  - feature
  - p0
  - mvp
contexts:
  - architecture
  - ai-guide
agent: opus
skills: []
mode: auditor
---

# Overhaul: Agent/Mode Split + Automated Batch Runner

## Summary

Major architectural overhaul with three interconnected changes:
1. Split the current `agent` concept into **agent** (LLM provider) + **mode** (behavior/role)
2. Build an automated **batch runner** for unattended overnight execution
3. Redesign mode instructions now that execution is automated

## 1. Agent → LLM Provider

Current `agent` field (planner, coder, auditor) becomes two fields:

```yaml
agent: opus        # WHO runs it (LLM model)
mode: coder        # HOW it behaves (role/instructions)
```

### Agent files = lightweight CLI config

Four CLIs cover all models. Each agent file defines invocation config only.

#### Claude CLI (`claude`)

| Aspect | Details |
|--------|---------|
| **Prompt input** | `-p "prompt"` flag, stdin pipe (`cat file \| claude -p "do X"`), file redirect (`claude -p < prompt.txt`) |
| **Model flag** | `--model opus`, `--model claude-opus-4-5`. Aliases: `opus`, `sonnet`, `haiku` |
| **Unattended flag** | `--dangerously-skip-permissions` |
| **Output format** | `--output-format json` → `{ is_error, result, session_id, total_cost_usd, num_turns }` |
| **Exit codes** | `0` = success, `1` = error, `2` = blocking error |
| **Safety valves** | `--max-turns N`, `--max-budget-usd N` |
| **System prompt** | `--append-system-prompt "..."` or `--system-prompt-file ./file.txt` |
| **Session resume** | `--resume SESSION_ID` |
| **Working dir** | Uses `cwd`, extendable with `--add-dir` |

**Runner invocation:**
```bash
claude -p --model opus --dangerously-skip-permissions --output-format json --max-turns 20 "prompt"
```

#### Codex CLI (`codex`)

| Aspect | Details |
|--------|---------|
| **Prompt input** | `codex exec "prompt"` (positional arg), stdin pipe (`printf "prompt" \| codex exec --json -`). Omitting `[PROMPT]` or passing `-` reads from stdin |
| **Model flag** | `--model gpt-5.3-codex` or `-m`. Reasoning: `-c model_reasoning_effort=high` (values: `minimal`, `low`, `medium`, `high`, `xhigh`) |
| **Unattended flag** | `--yolo` (no sandbox + no approvals), `--full-auto` (safer: workspace-write + auto-approve) |
| **Output format** | `--json` → JSONL event stream. `-o result.txt` writes final message to file. `--output-schema ./schema.json` for validated structured output |
| **Exit codes** | `0` = success, non-zero = failure |
| **Safety valves** | Sandbox modes (`read-only`, `workspace-write`, `danger-full-access`) |
| **Session resume** | `codex exec resume --last "continue"` or `codex exec resume SESSION_ID` |
| **Working dir** | `--cd /path` or `-C`, extendable with `--add-dir` |

**Runner invocation:**
```bash
printf "%s" "$prompt" | codex exec --yolo --model gpt-5.3-codex -c model_reasoning_effort=high --json -
```

#### KIMI CLI (`kimi`)

| Aspect | Details |
|--------|---------|
| **Prompt input** | `-p "prompt"` or `-c "prompt"` (one-shot), stdin pipe (`echo "x" \| kimi --print`), stream-json stdin for multi-turn |
| **Model flag** | `--model kimi-k2-thinking-turbo` or `-m` |
| **Unattended flag** | `--yolo` / `-y` / `--auto-approve`. **`--print` implicitly enables yolo** |
| **Output format** | `--output-format stream-json` for JSONL, `--quiet` = print + text + final-message-only |
| **Exit codes** | Not formally documented; follows standard conventions (0 = success) |
| **Safety valves** | `--max-steps-per-turn N`, `--max-retries-per-step N` |
| **Session resume** | `--continue` / `-C` (last session), `--session ID` |
| **Working dir** | `--work-dir /path` or `-w`, defaults to `cwd` |
| **Multi-provider** | Can also use Claude, GPT, Gemini as backends |

**Runner invocation:**
```bash
kimi --print --model kimi-k2-thinking-turbo -p "prompt"
```

#### Kilo CLI (`kilo`)

| Aspect | Details |
|--------|---------|
| **Prompt input** | `kilo run --auto "prompt"` (positional), stdin pipe (`echo "x" \| kilo run --auto`) |
| **Model flag** | `-m provider/model` (combined), e.g. `-m openrouter/z-ai/glm-4.7` |
| **Unattended flag** | `--auto` (autonomous, respects permission config). No separate `--yolo` flag |
| **Output format** | `--format json` for JSONL (requires `--auto`) |
| **Exit codes** | `0` = success, `1` = error, `130` = SIGINT, `143` = SIGTERM |
| **Safety valves** | Granular permission config in `~/.config/kilo/config.json` (set `"*": "allow"` for full auto) |
| **Chaining** | `--on-task-completed "follow-up prompt"` (90s timeout) |
| **Parallel** | `--parallel` creates isolated git worktree |
| **System prompt** | `--append-system-prompt "text"` or `--append-system-prompt-file path` |
| **Working dir** | `--workspace /path` or `-w`, defaults to `cwd` |

**Runner invocation:**
```bash
kilo run --auto --format json -m openrouter/z-ai/glm-4.7 "prompt"
```

### Default agent per mode

New `modeDefaults` section in the existing `.kanban2code/config.json` maps each mode to a default agent:

```json
{
  "modeDefaults": {
    "coder": "opus",
    "auditor": "opus",
    "planner": "sonnet",
    "roadmapper": "opus",
    "architect": "opus",
    "splitter": "sonnet",
    "conversational": "sonnet"
  }
}
```

- Runner uses these defaults when a task doesn't explicitly set `agent`
- **Override at task level**: individual tasks can set `agent: codex` in frontmatter to override the default
- **Override at board level**: sidebar settings area with dropdown to change the default agent for a mode without editing the config file
- Config lives in the existing `config.json` — no new config files. `ConfigService.mergeWithDefaults()` fills missing defaults

### Proposed agent file schema

```yaml
# _agents/opus.md
---
cli: claude
model: claude-opus-4-5
unattended_flags: ["--dangerously-skip-permissions"]
output_flags: ["--output-format", "json"]
prompt_style: flag           # flag = -p "prompt", positional = exec "prompt", stdin = pipe
safety:
  max_turns: 20
  max_budget_usd: 5.00
---
```

```yaml
# _agents/codex.md
---
cli: codex
subcommand: exec
model: gpt-5.3-codex
unattended_flags: ["--yolo"]
output_flags: ["--json"]
prompt_style: stdin              # pipe via stdin using `-` sentinel
config_overrides:
  model_reasoning_effort: high
---
```

```yaml
# _agents/kimi.md
---
cli: kimi
model: kimi-k2-thinking-turbo
unattended_flags: ["--print"]    # --print implicitly enables yolo
output_flags: ["--quiet"]
prompt_style: flag
---
```

```yaml
# _agents/glm.md
---
cli: kilo
subcommand: run
model: openrouter/z-ai/glm-4.7    # -m takes combined provider/model
unattended_flags: ["--auto"]
output_flags: ["--format", "json"]
prompt_style: positional
---
```

Runner assembles invocation per `prompt_style`:
- `flag`: `{cli} {subcommand?} {unattended_flags} {output_flags} --model {model} -p "prompt"`
- `positional`: `{cli} {subcommand} {unattended_flags} {output_flags} --model {model} "prompt"`
- `stdin`: `echo "prompt" | {cli} {subcommand?} {unattended_flags} {output_flags} --model {model}`

### Migration: current `_agents/` → `_agents/` + `_modes/`

Current agent files are **100% behavior/instructions** with zero CLI config. The frontmatter is just `name`, `description`, `type`, `stage`, `created`. They are already modes in disguise.

**What moves where:**

| Current file | Becomes | Action |
|---|---|---|
| `_agents/05-⚙️coder.md` | `_modes/coder.md` | Move + update frontmatter |
| `_agents/06-✅auditor.md` | `_modes/auditor.md` | Move + update frontmatter |
| `_agents/04-📋planner.md` | `_modes/planner.md` | Move + update frontmatter |
| `_agents/01-🗺️roadmapper.md` | `_modes/roadmapper.md` | Move + update frontmatter |
| `_agents/02-🏛️architect.md` | `_modes/architect.md` | Move + update frontmatter |
| `_agents/03-✂️splitter.md` | `_modes/splitter.md` | Move + update frontmatter |
| `_agents/07-💬conversational.md` | `_modes/conversational.md` | Move + update frontmatter |
| *(new)* | `_agents/opus.md` | Create with CLI config schema |
| *(new)* | `_agents/codex.md` | Create with CLI config schema |
| *(new)* | `_agents/kimi.md` | Create with CLI config schema |
| *(new)* | `_agents/glm.md` | Create with CLI config schema |

**Mode frontmatter changes:**
- Remove `type: robot` (no longer relevant)
- Keep `name`, `description`, `stage`
- Add `created` if missing

**Task frontmatter changes:**
- `agent: coder` → `agent: opus` + `mode: coder` (two fields instead of one)
- All stage transition instructions in modes update accordingly (e.g., "set `agent: auditor`" becomes "set `mode: auditor`")

**Migration atomicity (CRITICAL):**
The migration must be fully atomic. `prompt-builder.ts` (line 54) and `context.ts` (line 453) load instructions from `_agents/` by name. If `_agents/coder.md` is replaced with a YAML CLI config while old tasks still have `agent: coder`, those tasks would load CLI config YAML as "agent instructions."

**Solution — three-step atomic migration:**
1. **Copy** behavior files to `_modes/` (strip emoji prefixes, remove `type: robot`)
2. **Update all task frontmatter** in the workspace: add `mode: {old-agent-name}` and set `agent` to the default LLM provider from `modeDefaults` config
3. **Only then** replace `_agents/` behavior files with CLI config files

**Prompt-builder fallback chain** (for tasks that slip through migration):
1. If `task.mode` is set → load from `_modes/{mode}.md`
2. If `task.mode` is unset → try `_modes/{agent}.md` first (covers migrated files), then `_agents/{agent}.md` (covers pre-migration state)
3. This ensures old tasks work both before AND after migration

**Code changes required:**
- `TaskService` / frontmatter parser: recognize `agent` as LLM provider and `mode` as behavior role
- Agent file reader: parse new CLI config schema (`cli`, `model`, `prompt_style`, etc.)
- Mode file reader: load from `_modes/` instead of `_agents/`
- Prompt assembler: fallback chain as described above — `_modes/` first, `_agents/` second
- UI: agent picker shows LLM providers, add separate mode picker for behavior
- All existing references to `agent: coder/auditor/planner` in codebase must update

### Mode files = behavior/instructions

`_modes/` folder replaces the role aspect of current `_agents/`:
- `_modes/coder.md` — system prompt, coding instructions
- `_modes/auditor.md` — review criteria, rating threshold
- `_modes/planner.md` — planning instructions
- Orchestration modes: `roadmapper.md`, `architect.md`, `splitter.md`

### Mode management UI (add/edit modes)

Users need to create custom modes and edit existing ones from the UI — not just pick from a fixed list.

**Add new mode:**
- Button/action in the mode picker or a dedicated settings area to "Add Mode"
- Opens an editor (could be a webview form or direct markdown editor) with the mode template:
  ```yaml
  ---
  name: my-custom-mode
  description: What this mode does
  stage: code          # which stage this mode operates on (optional, for runner awareness)
  ---
  ```
  Followed by the markdown body with instructions (purpose, rules, workflow, output format, stage transition)
- On save → writes `_modes/{name}.md` to the filesystem
- Mode immediately appears in the mode picker dropdown

**Edit existing mode:**
- Click/action on an existing mode in the picker opens it for editing
- Same editor as "add" but pre-populated with current content
- Saves back to the same `_modes/{name}.md` file

**Delete mode:**
- Remove the file from `_modes/`
- Guard: warn if any tasks currently reference this mode

**Similarly for agents (add/edit LLM providers):**
- Same pattern: add/edit/delete `_agents/{name}.md` files
- Form fields map to the agent schema: `cli`, `model`, `prompt_style`, `unattended_flags`, `output_flags`, `safety`
- **Decision: free-text markdown editor for both modes and agents.** Modes are prose-heavy, agents are structured YAML frontmatter + optional notes — both work well as markdown files edited directly.

**Code changes required:**
- `ModeService`: CRUD operations for `_modes/` files (read, list, create, update, delete)
- `AgentService`: CRUD operations for `_agents/` files (same pattern)
- Webview UI: markdown editor panel for both modes and agents (with frontmatter validation)
- File watcher: detect external changes to `_modes/` and `_agents/` and refresh UI
- Validation: ensure required frontmatter fields are present before saving

### Prompt assembly for runner

The existing `src/services/prompt-builder.ts` already builds XML prompts (used by "Copy XML" in the UI). The runner reuses this same service to assemble the prompt sent to CLIs.

**Current flow (manual):** User clicks "Copy XML" → `prompt-builder.ts` builds XML → clipboard → user pastes into CLI

**New flow (automated):** Runner calls `prompt-builder.ts` directly → gets XML string → passes it to CLI via the agent's `prompt_style` (flag, positional, or stdin)

**Changes needed to `prompt-builder.ts`:**
- Accept `mode` parameter (currently uses `agent` which will become the LLM provider)
- Load mode instructions from `_modes/{mode}.md` instead of `_agents/{agent}.md`
- The XML output structure stays the same — it already has `<agent>`, `<metadata>`, `<context>` sections
- Rename `<agent>` section to `<mode>` in the XML output to match the new terminology

**System prompt injection (separate from XML prompt):**
- **Decision: use native CLI flags exclusively for mode enforcement.** XML body is only a compatibility fallback for CLIs that lack system prompt configuration.
- Claude: `--append-system-prompt` or `--system-prompt-file` → inject mode instructions here
- Kilo: `--append-system-prompt` or `--append-system-prompt-file` → inject mode instructions here
- KIMI: config-based system prompt → inject mode instructions via config
- Codex: `-c` overrides → inject mode instructions via config overrides
- XML `<mode>` section is the **fallback only** — used when a CLI has no native system prompt mechanism
- This keeps mode enforcement strict (system-level) rather than advisory (in-context)

## 2. Batch Runner ("Night Shift")

Hit "run" before bed, review results in the morning. Also usable for single-task execution during the day.

### State transition ownership (CRITICAL)

Current mode instructions (e.g., `06-✅auditor.md` lines 74-76, 92-98) tell the LLM to edit task frontmatter directly (`stage: completed`, `agent: coder`). This creates a conflict when the runner also manages state transitions.

**Rule: The runner owns ALL state transitions and git commits when running automated.** Mode instructions for stage transitions are for manual copy-paste workflow only.

- **Automated mode**: The LLM produces output with structured markers (`<!-- AUDIT_RATING: 8 -->`, `<!-- STAGE_TRANSITION: audit -->`). The runner parses these markers and performs all frontmatter updates, stage transitions, and git commits itself. The mode instructions must tell the LLM: *"When running under the batch runner, do NOT edit frontmatter or commit. Output structured markers only. The runner handles all state transitions."*
- **Manual mode**: The LLM edits frontmatter directly as it does today. No change to current behavior.
- **Detection**: The runner injects a flag into the system prompt or XML context: `<runner automated="true" />`. Mode instructions check for this flag and branch accordingly.

This prevents race conditions, duplicate state transitions, and incorrect commits.

### Flow

Each task runs through its **full pipeline one stage at a time** before the next task starts:

```
Task picked (top of column) → advance one stage → audit
  ├── Plan task  → run planner → Code → run coder → Audit → run auditor
  ├── Code task  → run coder → Audit → run auditor
  └── Audit task → run auditor
Then for each auditor result:
  ├── audit pass (8+) → auditor commits + updates architecture.md → Completed
  ├── audit fail (attempt 1) → back to Code → re-code → re-audit
  └── audit fail (attempt 2) → leave uncommitted changes → stop runner
```

### Execution order

1. Pick the **top task** from the column (sequential order, topmost first)
2. Run the task through its full remaining pipeline:
   - If in Plan → run planner mode → move to Code → run coder mode → move to Audit → run auditor mode
   - If in Code → run coder mode → move to Audit → run auditor mode
   - If in Audit → run auditor mode
3. **Each task must complete its audit before the next task starts** — no parallelism
4. Audit pass (rating 8+) → auditor commits changes + updates `architecture.md` → task moves to Completed
5. Audit fail → back to Code, increment `attempts` counter, re-run coder → re-audit
6. If `attempts >= 2` → **leave uncommitted changes in working tree, stop the runner entirely** (task stays in Audit stage, needs human intervention)
7. When running "all tasks" (double arrow), process each task fully before starting the next

### Attempt tracking

Add `attempts: 0` to task frontmatter. **Canonical rule: runner increments `attempts` when an audit fails and the task is sent back to code.** The first code pass runs with `attempts: 0`. If audit fails, `attempts` becomes `1` and the task re-enters code. If the second audit also fails, `attempts` becomes `2` and the runner stops. This means `attempts >= 2` is the hard-stop condition.

### Error handling

**Hard stop on crash:** If a CLI process crashes (non-zero exit code that isn't an audit failure), the entire runner stops immediately. No further tasks are processed.
- Rationale: a crash likely indicates an environment issue (CLI not installed, auth expired, disk full) that would affect all subsequent tasks
- Runner log captures the error details for morning review
- Tasks that haven't started yet remain in their current stage untouched

**Hard stop on double audit failure:** If a task fails audit twice (`attempts >= 2`), the runner stops entirely.
- Uncommitted changes are **left as-is** in the working tree — no stash, no discard, no branch
- Rationale: the human needs to see exactly what the runner produced and decide how to proceed
- The next task cannot run on a dirty working tree, so stopping is the only safe option
- Runner log marks this task and reports the stop reason

### Runner log/report format

Runner generates a log file (e.g., `.kanban2code/_logs/run-{timestamp}.md`) for morning review:

```markdown
# Night Shift Report — 2026-02-11 02:30

## Summary
- Tasks processed: 5
- Completed: 3
- Failed (sent to inbox): 1
- Crashed (runner stopped): 1
- Total time: 47m 23s

## Tasks

### task-name-1
- Status: Completed
- Mode: coder → auditor
- Agent: opus
- Tokens: 12,450 in / 3,200 out
- Time: 8m 12s
- Attempts: 1
- Commit: abc1234

### task-name-2
- Status: Failed → left in Audit (uncommitted changes in working tree)
- Mode: coder → auditor → coder → auditor
- Agent: opus
- Tokens: 24,100 in / 8,400 out
- Time: 15m 03s
- Attempts: 2
- Error: Audit rating 5/10 — "missing test coverage"
- **Runner stopped here — human intervention required**

### task-name-3
- Status: CRASHED — runner stopped
- Mode: coder
- Agent: codex
- Error: Exit code 1 — "ENOENT: codex command not found"
- Time: 0m 02s
```

### Git commit strategy

Runner commits after each **successful audit** (rating 8+). The auditor mode instructions should include a step to stage and commit the changes.

**Flow:**
1. Coder runs → makes code changes (uncommitted)
2. Auditor runs → reviews the changes
3. If audit passes (8+) → auditor updates `architecture.md` to reflect what was built → commits all changes with message: `feat(runner): {task-title} [auto]`
4. If audit fails → changes remain uncommitted, coder re-runs on next attempt
5. If max attempts reached → uncommitted changes left as-is, runner stops entirely (human intervention required)

**Auditor mode instruction addition:**
```
When rating >= 8 (ACCEPTED):
1. Update .kanban2code/architecture.md to reflect the changes made by this task
   (NOTE: this is the root-level seed file loaded by loadGlobalContext, NOT _context/architecture.md)
2. Stage all changed files: git add -A
3. Commit with message: "feat(runner): {task-title} [auto]"
4. Set stage to completed
```

**architecture.md path fix (DECIDED):** The current auditor (`06-✅auditor.md` lines 77, 82) references `.kanban2code/_context/architecture.md`, but `scaffolder.ts` (line 50) writes to `.kanban2code/architecture.md` and `context.ts:loadGlobalContext` (line 425) reads from the root-level path. The migration must fix auditor mode instructions to target `.kanban2code/architecture.md` — the file that actually gets injected into every prompt.

This keeps each task's changes in a discrete commit for easy review/revert in the morning. The architecture doc stays in sync automatically.

### Implementation

- New **runner service** using `child_process` to invoke CLIs
- Per-CLI adapter to handle different invocation styles (piped stdin vs positional args)
- Runner log/report for morning review

### Runner UI (DECIDED)

**Three trigger surfaces:**

1. **CLI-level:** Command to run the batch runner from terminal (for night shift / cron usage)
2. **Card-level:** Run button on individual task cards (run this one task through its next stage)
3. **Column header controls** (Plan, Code, and Audit columns only — NOT Inbox or Completed):
   - **Single arrow (▶):** Run the top task in this column through its full pipeline
   - **Double arrow (▶▶):** Run all tasks in this column sequentially, each through full pipeline
   - **Stop sign (⏹):** Cancel the running batch

**Task selection order:** Sequential, topmost task in the column runs first (based on `order` field / position in column).

**Progress:** Show running state on the active task card + column header indicates runner is active.

## 3. Redesign Modes for Automation

With execution automated, mode instructions need to account for:
- **Planner:** produce machine-parseable output confirming stage transition to Code (planner is now automated too)
- **Coder:** explicit "move to audit when done" instruction
- **Auditor:** "if attempts >= 2, stop" instruction + update `architecture.md` on successful audit (8+)
- **All modes:** structured output so runner can parse success/failure

## CLI Research Findings

### Completed Investigation

- [x] How each CLI handles prompt input → documented per-CLI above
- [x] Exact invocation syntax per CLI + model → runner invocation examples above
- [x] Whether kilo `--auto` + global permissions is sufficient → **Yes**, `--auto --yolo` or `--auto` + `"*": "allow"` in config both work
- [x] How to detect task completion from CLI output → exit codes + JSON parsing (Kilo best documented, Claude cleanest JSON)

### Critical Findings

1. **Codex stdin (RESOLVED):** Stdin works — omit `[PROMPT]` or pass `-` sentinel. Runner pipes prompts via stdin for all CLIs that support it (Codex, Kilo, KIMI). No ARG_MAX concern.
2. **Output parsing varies:** Claude returns single JSON object (`is_error`, `result`). Codex/Kilo emit JSONL event streams. KIMI has `--quiet` for just final text. Runner needs per-CLI response parsers.
3. **System prompt injection:** Claude and Kilo support `--append-system-prompt` (ideal for injecting mode instructions). KIMI uses config. Codex uses `-c` overrides. This is how mode behavior gets injected at runtime.
4. **Kilo is most automation-friendly:** `--timeout`, `--parallel` (git worktree isolation), `--on-task-completed`, clean exit codes. Best suited for CI/runner patterns.
5. **KIMI multi-provider:** Can use Claude/GPT/Gemini as backends — potential simplification if one CLI could cover multiple providers.

### Remaining Investigation (implementation tasks — all decisions resolved)

- [ ] Redesign mode file content for automated execution (planner, coder, auditor all need automation-aware instructions)
- [ ] UI changes: agent picker → agent + mode pickers
- [ ] Mode management UI: free-text markdown editor for add/edit/delete modes
- [ ] Agent management UI: free-text markdown editor for add/edit/delete LLM providers
- [x] Rename `_agents/` folder or split into `_agents/` + `_modes/` → migration plan documented above
- [ ] Update ai-guide.md, architecture.md with new concepts
- [ ] Design runner adapter interface (per-CLI invocation + response parsing)
- [x] Design runner log/report format for morning review → documented above (per-task: name, tokens, status, time, commit)
- [x] Determine git commit strategy → commit after each successful audit, auditor handles commit + architecture.md update
- [ ] Default agent-per-mode config file + sidebar dropdown override UI
- [ ] Prompt assembly: update `prompt-builder.ts` to use modes instead of agents, native CLI flags for system prompt
- [x] Runner UI → CLI-level + column header buttons (▶/▶▶/⏹ on Plan, Code, Audit) + card-level run buttons
- [x] Handle Codex prompt input → stdin pipe via `-` sentinel, no ARG_MAX concern
- [x] System prompt injection strategy → native CLI flags, XML as compatibility fallback only
- [x] Audit-fail uncommitted changes → leave as-is + stop runner, human intervention required
- [x] Board-level agent override → sidebar settings dropdown
- [x] Mode/agent editor style → free-text markdown editor for both

## What Stays the Same

- 5-stage pipeline (Inbox → Plan → Code → Audit → Completed)
- Manual orchestration (roadmapper, architect, splitter) during the day
- Filesystem-based tasks with frontmatter
- Sidebar + Board UI (extended with runner controls on Plan/Code/Audit columns)
- Context system, tag taxonomy
- Stage transition rules

## All Decisions Summary

| Decision | Resolution |
|----------|-----------|
| System prompt injection | Native CLI flags exclusively; XML body as compatibility fallback only |
| Codex prompt input | Stdin pipe via `-` sentinel — no ARG_MAX concern |
| Kilo CLI flags | `--format json` (not `--json`), `--auto` (no `--yolo`), `-m provider/model` (combined) |
| Runner UI | CLI + card buttons + column headers (▶/▶▶/⏹ on Plan/Code/Audit only) |
| Board-level agent override | Sidebar settings dropdown |
| Mode/agent editor | Free-text markdown editor for both |
| Config source-of-truth | `config.json` only — `modeDefaults` section added, no separate `defaults.yaml` |
| Audit-fail uncommitted changes | Leave as-is in audit stage + stop runner entirely |
| Execution model | 1 task at a time, full pipeline per task, sequential (sorted by `order` + filename) |
| Plan column automation | Yes — planner mode included in runner pipeline |
| State transition ownership | Runner owns all frontmatter updates + commits when automated. LLM outputs markers only. Manual mode unchanged |
| Auditor architecture.md | Updates `.kanban2code/architecture.md` (root-level, loaded by `loadGlobalContext`) — NOT `_context/architecture.md` |
| Migration atomicity | Three-step: copy to `_modes/` → update all task frontmatter → replace `_agents/`. Rollback on failure |
| Attempt semantics | Increment on audit fail. First pass = 0, first fail → 1, second fail → 2 → hard stop |
| `_logs/` gitignore | Added to `.kanban2code/.gitignore` during migration |

---

## Technical Architecture

### Overview

Three interconnected changes to the extension's data model, service layer, and UI:

1. **Data model split**: Task frontmatter gains `mode` (behavioral role) and `attempts` (audit retry counter); the existing `agent` field becomes an LLM provider identifier
2. **New services**: `ModeService` (CRUD for `_modes/`), `AgentService` (CRUD for CLI-config `_agents/` files), Runner engine with per-CLI adapters
3. **UI updates**: Mode picker, agent picker (now shows LLM providers), runner controls on column headers and task cards

No new npm dependencies — uses `child_process` (built-in), `gray-matter` (already used), `zod` (already used).

### Components

- **`_modes/` directory**: Behavioral instruction files (migrated from current `_agents/`). Frontmatter: `name`, `description`, `stage`, `created`. Body: purpose, rules, workflow, stage transition instructions
- **`_agents/` directory** (new schema): CLI config files. Frontmatter: `cli`, `model`, `subcommand`, `prompt_style` (flag|positional|stdin), `unattended_flags`, `output_flags`, `safety`, `provider`, `config_overrides`
- **`ModeService`** (`src/services/mode-service.ts`): CRUD for `_modes/` files — mirrors `listAvailableAgents()` pattern from `context.ts`
- **`AgentService`** (`src/services/agent-service.ts`): CRUD for new `_agents/` CLI config files — parse YAML frontmatter into `AgentCliConfig`
- **Runner engine** (`src/runner/runner-engine.ts`): Orchestrates sequential task execution through pipeline stages using CLI adapters
- **CLI adapters** (`src/runner/adapters/`): Per-CLI invocation builders + response parsers for Claude, Codex, KIMI, Kilo
- **Output parser** (`src/runner/output-parser.ts`): Extracts structured markers from LLM output (`<!-- AUDIT_RATING: 8 -->`, `<!-- STAGE_TRANSITION: code -->`)
- **Runner log** (`src/runner/runner-log.ts`): Generates markdown reports in `.kanban2code/_logs/`
- **Git ops** (`src/runner/git-ops.ts`): Commit after successful audit — `feat(runner): {task-title} [auto]`
- **Migration service** (`src/services/migration.ts`): One-time migration from old `_agents/` to `_modes/` + new `_agents/`

### Data Flow

```
User triggers runner (UI button / VS Code command)
  → Runner picks top task from column (by order field)
  → Resolves mode (from task.mode or stage default via _modes/)
  → Resolves agent (from task.agent or modeDefaults config via _agents/)
  → prompt-builder.ts builds XML prompt (loads mode instructions from _modes/)
  → CLI adapter builds shell command from agent config (_agents/)
  → child_process.spawn executes CLI
  → CLI adapter parses response (Claude: JSON, Codex/Kilo: JSONL, KIMI: text)
  → Output parser extracts structured markers (rating, stage transition, files changed)
  → Runner updates task frontmatter (stage, mode, agent, attempts)
  → On audit pass (8+): git-ops commits, task → completed
  → On audit fail: increment attempts, loop back to code (max 2 then hard stop)
  → Runner log records result
  → Next task (or stop)
```

### Dependencies

- `child_process` (Node.js built-in): CLI invocation via `spawn`
- `gray-matter` (already in package.json): Frontmatter parsing in new services
- `zod` (already in package.json): Runtime validation of `AgentCliConfig` schema
- No new npm packages required

### Constraints

- **Backward compatibility**: Tasks without `mode` field must still work — prompt-builder fallback chain: `_modes/{mode}` → `_modes/{agent}` → `_agents/{agent}`. Migration must be atomic (copy to `_modes/`, update all task frontmatter, then replace `_agents/` content)
- **Migration is opt-in**: Triggered via command, not automatic on extension load. Idempotent (safe to run repeatedly)
- **Sequential execution**: Runner processes one task at a time — no parallel CLI invocations
- **Build system**: Must bundle both `_modes/` and `_agents/` into extension assets
- **State transition ownership**: Runner owns all frontmatter updates and git commits when running automated. Mode instructions for stage transitions are manual-only. Runner injects `<runner automated="true" />` flag for detection
- **Task ordering**: `scanner.ts` loads tasks in parallel without sorting. Runner requires deterministic ordering — must sort by `order` field (then filename as tiebreaker) before execution
- **architecture.md path**: Auditor updates `.kanban2code/architecture.md` (root-level, loaded by `loadGlobalContext`), NOT `_context/architecture.md`
- **_logs/ gitignore**: Runner logs in `.kanban2code/_logs/` must be added to `.gitignore` to avoid polluting git

---

## Phases

### Phase 1: Data Layer — Types and Configuration

Establish the new type system. After this phase, `mode` and revised `agent` types exist alongside the old ones. No runtime behavior changes.

#### Task 1.1: Add `mode` and `attempts` fields to Task interface

**Definition of Done:**
- [ ] `Task` interface in `src/types/task.ts` gains `mode?: string` and `attempts?: number`
- [ ] Existing tests pass unchanged (fields are optional)

**Files:**
- `src/types/task.ts` — modify — add `mode?: string` and `attempts?: number` fields

**Tests:**
- [ ] TypeScript compiles with new optional fields
- [ ] Existing task tests pass unchanged

**Skills:**
- `skills/skill-typescript-config` — TypeScript interface extension

#### Task 1.2: Define AgentCliConfig and ModeConfig types with Zod schemas

**Definition of Done:**
- [ ] `AgentCliConfig` interface with fields: `cli`, `model`, `subcommand?`, `unattended_flags`, `output_flags`, `prompt_style` (flag|positional|stdin), `safety?` (max_turns, max_budget_usd, timeout), `provider?`, `config_overrides?`
- [ ] `ModeConfig` interface with fields: `id`, `name`, `description`, `stage?`, `path`, `content?`
- [ ] Zod schemas for runtime validation of both types
- [ ] `PromptStyle` literal union type: `'flag' | 'positional' | 'stdin'`

**Files:**
- `src/types/agent.ts` — create — `AgentCliConfig` interface + Zod schema
- `src/types/mode.ts` — create — `ModeConfig` interface + Zod schema

**Tests:**
- [ ] Zod validates a valid opus agent config object
- [ ] Zod rejects missing required fields (cli, model)
- [ ] `ModeConfig` schema validates with and without optional `stage`

**Skills:**
- `skills/skill-typescript-config` — Zod schema patterns

#### Task 1.3: Add MODES_FOLDER and LOGS_FOLDER constants

**Definition of Done:**
- [ ] `MODES_FOLDER = '_modes'` added to `src/core/constants.ts`
- [ ] `LOGS_FOLDER = '_logs'` added to `src/core/constants.ts`

**Files:**
- `src/core/constants.ts` — modify — add two new folder constants

**Tests:**
- [ ] Constants exported and match expected string values

#### Task 1.4: Update config types for mode defaults

**Definition of Done:**
- [ ] `Kanban2CodeConfig` in `src/types/config.ts` gains `modeDefaults?: Record<string, string>` (maps mode name → default agent name, e.g. `coder → opus`)
- [ ] Default config includes mode defaults matching current pipeline roles
- [ ] `ConfigService.mergeWithDefaults()` handles new section

**Files:**
- `src/types/config.ts` — modify — add `modeDefaults` section to config type
- `src/services/config.ts` — modify — merge defaults for new section

**Tests:**
- [ ] Loading config without `modeDefaults` fills in defaults
- [ ] Existing config tests pass unchanged

**Skills:**
- `skills/skill-typescript-config` — Config type extension

---

### Phase 2: Service Layer — Mode Service, Frontmatter, Prompt Builder

New services read/write `_modes/` and `_agents/` (new schema) files. Existing `context.ts` functions still work for backward compatibility but are augmented with mode-aware equivalents.

#### Task 2.1: Create ModeService (CRUD for `_modes/`)

**Definition of Done:**
- [ ] `listAvailableModes(root)` — reads `_modes/*.md`, parses frontmatter, returns `ModeConfig[]`
- [ ] `resolveModePath(root, identifier)` — finds by filename or frontmatter `name`
- [ ] `loadModeContext(root, modeName)` — returns full file content as string
- [ ] `createModeFile(root, data)` — writes new mode file with frontmatter + body
- [ ] `updateModeFile(root, modeId, data)` — overwrites existing mode file
- [ ] `deleteModeFile(root, modeId)` — deletes with guard (warn if tasks reference it)
- [ ] Pattern mirrors `listAvailableAgents` / `createAgentFile` in `src/services/context.ts`

**Files:**
- `src/services/mode-service.ts` — create — full CRUD service

**Tests:**
- [ ] `listAvailableModes` returns empty array when `_modes/` does not exist
- [ ] `listAvailableModes` parses frontmatter correctly (name, description, stage)
- [ ] `resolveModePath` finds by filename and by frontmatter name
- [ ] `createModeFile` writes correct frontmatter + body
- [ ] Round-trip: create → list → verify content matches

**Skills:**
- `skills/skill-typescript-config` — Service patterns

#### Task 2.2: Create AgentService (CRUD for new `_agents/` CLI config files)

**Definition of Done:**
- [ ] `listAvailableAgentConfigs(root)` — reads new `_agents/*.md` CLI config files, parses YAML into `AgentCliConfig[]`
- [ ] `resolveAgentConfig(root, agentName)` — returns parsed `AgentCliConfig` object
- [ ] `createAgentConfigFile(root, data)` / `updateAgentConfigFile` / `deleteAgentConfigFile`
- [ ] Existing `listAvailableAgents()` in `context.ts` remains functional for backward compat during transition

**Files:**
- `src/services/agent-service.ts` — create — full CRUD service for CLI config schema

**Tests:**
- [ ] Parses opus.md with cli/model/prompt_style fields into `AgentCliConfig`
- [ ] Invalid frontmatter (missing `cli`) handled gracefully (returns undefined or throws)
- [ ] Empty `_agents/` directory returns empty list

**Skills:**
- `skills/skill-typescript-config` — Service patterns

#### Task 2.3: Update frontmatter parser for `mode` and `attempts`

**Definition of Done:**
- [ ] `parseTaskContent` in `src/services/frontmatter.ts` extracts `mode` (string, optional) and `attempts` (number, optional, defaults to undefined)
- [ ] `stringifyTaskFile` serializes `mode` and `attempts` fields in YAML frontmatter
- [ ] `saveTaskWithMetadata` in `src/services/task-content.ts` accepts `mode` in its metadata interface

**Files:**
- `src/services/frontmatter.ts` — modify — parse/serialize `mode` and `attempts`
- `src/services/task-content.ts` — modify — metadata interface gains `mode`

**Tests:**
- [ ] Parse task with `mode: coder` → `task.mode === 'coder'`
- [ ] Parse task without `mode` → `task.mode === undefined`
- [ ] Parse task with `attempts: 1` → `task.attempts === 1`
- [ ] Round-trip: parse → modify mode → stringify → parse → verify
- [ ] Existing frontmatter tests pass unchanged

#### Task 2.4: Update prompt-builder for mode-aware context loading

**Definition of Done:**
- [ ] `buildContextSection` uses three-step fallback chain for loading behavior instructions:
  1. If `task.mode` is set → load from `_modes/{mode}.md`
  2. If `task.mode` is unset → try `_modes/{agent}.md` (covers post-migration state where files moved but task frontmatter not yet updated)
  3. Final fallback → `_agents/{agent}.md` (covers pre-migration state)
- [ ] XML section name: `<section name="mode">` when mode present, `<section name="agent">` otherwise
- [ ] New export: `buildRunnerPrompt(task, root)` returns `{ xmlPrompt: string; modeInstructions: string }` — runner needs raw mode instructions separately for CLI system prompt injection
- [ ] When runner is active, injects `<runner automated="true" />` into the XML context (runner passes a flag to `buildRunnerPrompt`)

**Files:**
- `src/services/prompt-builder.ts` — modify — add mode-aware loading with fallback chain + `buildRunnerPrompt` export

**Tests:**
- [ ] Task with `mode: 'coder'` loads instructions from `_modes/coder.md`
- [ ] Task without `mode` but with `agent: 'coder'` falls through to `_modes/coder.md` if it exists
- [ ] Task without `mode` and no matching `_modes/` file falls back to `_agents/coder.md`
- [ ] `buildRunnerPrompt` returns both `xmlPrompt` and `modeInstructions` as separate strings
- [ ] Runner prompt includes `<runner automated="true" />` flag
- [ ] Existing prompt-builder tests pass unchanged

#### Task 2.5: Update stage-manager for mode-aware auto-assignment

**Definition of Done:**
- [ ] New `getDefaultModeForStage(root, stage)` — reads `_modes/` files and returns first whose frontmatter `stage` matches
- [ ] New `getDefaultAgentForMode(root, modeName)` — reads `modeDefaults` from config
- [ ] On stage transition via `updateTaskStage`: auto-sets both `mode` and `agent` using defaults
- [ ] Manually-set mode is NOT overwritten (same logic as current `shouldAutoUpdateAgent` pattern)
- [ ] Existing `getDefaultAgentForStage` continues to work for backward compat

**Files:**
- `src/services/stage-manager.ts` — modify — add mode-aware auto-assignment alongside existing agent logic

**Tests:**
- [ ] Moving task to `code` stage auto-sets `mode: coder` + `agent: opus` (from defaults)
- [ ] Moving task to `audit` stage auto-sets `mode: auditor` + `agent: opus`
- [ ] Manually set mode preserved on stage change (not overwritten)
- [ ] Existing stage-manager tests pass with minor updates for new fields

---

### Phase 3: Migration and Build System

Move existing agent files to modes, create new agent CLI config files, update build system and scaffolder. Ensures migration path works for existing tasks.

#### Task 3.1: Create migration service (`_agents/` → `_modes/` + new `_agents/`)

**Definition of Done:**
- [ ] `migrateAgentsToModes(root)` — idempotent, three-step atomic migration:
  1. **Copy** behavior files to `_modes/{clean-name}.md` (strip emoji prefix via `/^\d+-[^\w]*/`, remove `type: robot` from frontmatter)
  2. **Scan all task files** in workspace and update frontmatter: add `mode: {old-agent-name}`, set `agent` to default LLM provider via `modeDefaults` config. Also fix auditor mode instructions: `_context/architecture.md` → `architecture.md`
  3. **Replace** old behavior files in `_agents/` with CLI config files (opus.md, codex.md, kimi.md, glm.md). Only delete old files after steps 1-2 succeed
- [ ] Returns report: `{ movedModes: string[], createdAgents: string[], updatedTasks: string[], skipped: string[] }`
- [ ] Rollback on partial failure: clean up `_modes/` if task update fails, restore `_agents/` from backup
- [ ] Update `.kanban2code/.gitignore` to add `_logs/` entry

**Files:**
- `src/services/migration.ts` — create — migration functions

**Tests:**
- [ ] Migration creates `_modes/` directory with correct files
- [ ] Emoji prefixes stripped: `05-⚙️coder.md` → `coder.md`
- [ ] `type: robot` removed from mode frontmatter, `name`/`description`/`stage`/`created` preserved
- [ ] All task files in workspace updated with `mode` field
- [ ] New agent CLI config files have correct YAML schema
- [ ] Old behavior files in `_agents/` removed only after `_modes/` + tasks updated
- [ ] Idempotent: running twice does not duplicate files
- [ ] Rollback: `_modes/` cleaned up if step 2 fails

#### Task 3.2: Update build script to bundle `_modes/`

**Definition of Done:**
- [ ] `generateBundledContent()` in `build.ts` also reads `.kanban2code/_modes/` directory
- [ ] Generates `src/assets/modes.ts` with `BUNDLED_MODES: Record<string, string>`
- [ ] `BUNDLED_AGENTS` continues to be generated (now with CLI config files after migration)

**Files:**
- `build.ts` — modify — add `_modes/` reading to `generateBundledContent()`
- `src/assets/modes.ts` — create (auto-generated by build)

**Tests:**
- [ ] Build completes without errors
- [ ] `BUNDLED_MODES` contains expected mode files (coder.md, auditor.md, planner.md, etc.)

#### Task 3.3: Update scaffolder for `_modes/` directory

**Definition of Done:**
- [ ] `scaffoldWorkspace` creates `_modes/` directory alongside `_agents/`
- [ ] Writes `BUNDLED_MODES` files to `_modes/` on scaffold
- [ ] `syncWorkspace` syncs both `_modes/` and `_agents/` directories

**Files:**
- `src/services/scaffolder.ts` — modify — add `_modes/` to scaffold and sync

**Tests:**
- [ ] Scaffold creates `_modes/` directory with mode files
- [ ] Sync writes missing mode files without overwriting existing ones

#### Task 3.4: Register migration command + verify file watcher coverage

**Definition of Done:**
- [ ] `kanban2code.migrateAgentsModes` command registered in `commands/index.ts`
- [ ] Shows VS Code progress notification and summary of migration results
- [ ] Verify `task-watcher.ts` already covers `_modes/` — it watches `**/*.md` under `.kanban2code` (line 35/75) and `isTaskFile` only excludes `_context.md`. No new watcher needed, but `_modes/` files should NOT trigger task-refresh events (they are config, not tasks). Add `_modes/` and `_agents/` to the `handleEvent` exclusion filter if needed

**Files:**
- `src/commands/index.ts` — modify — register migration command
- `src/services/task-watcher.ts` — modify (if needed) — exclude `_modes/` and `_agents/` from task events

**Tests:**
- [ ] Command executes without error on pre-migration workspace
- [ ] Command is idempotent on already-migrated workspace
- [ ] Changes to `_modes/*.md` do NOT trigger spurious task-refresh events
- [ ] Changes to `_agents/*.md` do NOT trigger spurious task-refresh events

---

### Phase 4: Batch Runner Engine

Build the automated batch runner. No UI yet — purely the engine, testable via VS Code commands.

#### Task 4.0: Deterministic task ordering in scanner

**Definition of Done:**
- [ ] `loadAllTasks` in `src/services/scanner.ts` returns tasks sorted deterministically: by `order` field ascending (undefined last), then by filename as tiebreaker
- [ ] New export: `getOrderedTasksForStage(tasks, stage)` — filters by stage and returns in deterministic order for runner consumption
- [ ] Runner can rely on "topmost task" being stable across calls

**Files:**
- `src/services/scanner.ts` — modify — add sort after parallel load

**Tests:**
- [ ] Tasks with explicit `order` values sort correctly (1, 2, 3)
- [ ] Tasks without `order` sort after those with `order`, by filename
- [ ] `getOrderedTasksForStage` filters and sorts correctly

#### Task 4.1: CLI adapter interface + Claude adapter

**Definition of Done:**
- [ ] `CliAdapter` interface: `buildCommand(config, prompt, options?) → { command, args, stdin? }` and `parseResponse(stdout, exitCode) → CliResponse`
- [ ] `CliResponse` type: `success`, `result`, `error?`, `sessionId?`, `cost?`, `turns?`
- [ ] Claude adapter: `-p` flag, `--model`, `--dangerously-skip-permissions`, `--output-format json`, `--max-turns`, `--append-system-prompt`
- [ ] Parses single JSON object (`is_error`, `result`, `session_id`, `total_cost_usd`, `num_turns`)

**Files:**
- `src/runner/cli-adapter.ts` — create — interface + shared types
- `src/runner/adapters/claude-adapter.ts` — create — Claude CLI adapter

**Tests:**
- [ ] `buildCommand` produces correct argv array for opus config
- [ ] `buildCommand` includes `--append-system-prompt` flag when system prompt provided
- [ ] `parseResponse` extracts result from valid JSON
- [ ] `parseResponse` handles `is_error: true` correctly
- [ ] `parseResponse` handles non-JSON output gracefully (crash scenario)

#### Task 4.2: Codex, KIMI, and Kilo CLI adapters + adapter factory

**Definition of Done:**
- [ ] Codex adapter: stdin prompt style (pipe via `-` sentinel), `--yolo`, `--json`, JSONL response parser
- [ ] KIMI adapter: `-p` flag style, `--print`, `--quiet` text response parser
- [ ] Kilo adapter: positional, `--auto` (no `--yolo`), `--format json` (not `--json`), `-m provider/model` (combined flag), `--append-system-prompt`, JSONL parser
- [ ] Factory function: `getAdapterForCli(cli: string) → CliAdapter`

**Files:**
- `src/runner/adapters/codex-adapter.ts` — create
- `src/runner/adapters/kimi-adapter.ts` — create
- `src/runner/adapters/kilo-adapter.ts` — create
- `src/runner/adapter-factory.ts` — create — factory function

**Tests:**
- [ ] Codex adapter pipes prompt via stdin using `-` sentinel
- [ ] KIMI adapter uses `-p` flag style correctly
- [ ] Kilo adapter uses `--format json` (not `--json`) and `-m provider/model` (combined)
- [ ] JSONL parser extracts final message from multi-line event stream
- [ ] Factory returns correct adapter for each CLI name

#### Task 4.3: Structured output parser

**Definition of Done:**
- [ ] `parseStageTransition(output)` — extracts `<!-- STAGE_TRANSITION: X -->` and returns Stage
- [ ] `parseAuditRating(output)` — extracts `<!-- AUDIT_RATING: N -->` and returns number
- [ ] `parseAuditVerdict(output)` — extracts `ACCEPTED` or `NEEDS_WORK`
- [ ] `parseFilesChanged(output)` — extracts file list from `<!-- FILES_CHANGED: ... -->`
- [ ] Fallback: regex on prose text (e.g. "Rating: 8/10", "**Rating: 9/10**")

**Files:**
- `src/runner/output-parser.ts` — create — structured marker extraction

**Tests:**
- [ ] Parse `<!-- AUDIT_RATING: 8 -->` returns `8`
- [ ] Parse `<!-- STAGE_TRANSITION: audit -->` returns `'audit'`
- [ ] Fallback parses "Rating: 9/10" returns `9`
- [ ] Missing markers return `undefined`
- [ ] Parse `<!-- FILES_CHANGED: a.ts, b.ts -->` returns `['a.ts', 'b.ts']`

#### Task 4.4: Runner execution engine

**Definition of Done:**
- [ ] `RunnerEngine` class with `runTask(task)`, `runColumn(stage)`, `stop()`
- [ ] Pipeline logic: determines remaining stages from current stage, runs each via mode+agent+CLI
- [ ] Audit logic: rating 8+ → completed, <8 → increment `attempts` then back to code, `attempts >= 2` → hard stop (leave uncommitted changes)
- [ ] Hard stop on CLI crash (non-zero exit code that isn't an audit failure)
- [ ] **Runner owns all state transitions**: updates task frontmatter (`stage`, `mode`, `agent`, `attempts`) directly — LLM output parsed for structured markers only, LLM does NOT edit frontmatter
- [ ] Passes `automated: true` flag to `buildRunnerPrompt` so mode instructions tell LLM to output markers instead of editing frontmatter
- [ ] Pre-flight check: refuses to start if git working tree is dirty (uncommitted changes from previous failed run)
- [ ] Emits events: `taskStarted`, `stageStarted`, `stageCompleted`, `taskCompleted`, `taskFailed`, `runnerStopped`
- [ ] Uses `child_process.spawn` for CLI invocation

**Files:**
- `src/runner/runner-engine.ts` — create — core orchestration engine

**Tests:**
- [ ] Code-stage task runs coder mode then auditor mode
- [ ] Plan-stage task runs planner, coder, auditor in sequence
- [ ] Audit pass (8+) marks task completed
- [ ] Audit fail (attempt 1) sends task back to code stage
- [ ] Audit fail (attempt 2) stops runner entirely, leaves task in audit
- [ ] CLI crash (exit code 1) stops runner immediately
- [ ] `stop()` cancels execution before next stage

#### Task 4.5: Git operations for runner

**Definition of Done:**
- [ ] `commitRunnerChanges(taskTitle)` — runs `git add -A && git commit -m "feat(runner): {taskTitle} [auto]"`, returns commit hash
- [ ] `isWorkingTreeClean()` — checks for uncommitted changes
- [ ] `hasUncommittedChanges()` — inverse of above

**Files:**
- `src/runner/git-ops.ts` — create — git helper functions

**Tests:**
- [ ] Commit message follows format `feat(runner): {title} [auto]`
- [ ] `isWorkingTreeClean` returns true when no pending changes
- [ ] Returns commit hash string on success

#### Task 4.6: Runner log/report generator

**Definition of Done:**
- [ ] `RunnerLog` class: `startRun()`, `recordTask(result)`, `finishRun(reason)`, `toMarkdown()`, `save(root)`
- [ ] Markdown matches spec: summary table (tasks processed, completed, failed, crashed, total time) + per-task details (mode, agent, tokens, time, commit, attempts, error)
- [ ] Writes to `.kanban2code/_logs/run-{timestamp}.md`, creates `_logs/` if missing

**Files:**
- `src/runner/runner-log.ts` — create — log generation and persistence

**Tests:**
- [ ] `toMarkdown()` generates valid markdown with correct headers
- [ ] Summary counts match (completed, failed, crashed totals)
- [ ] Per-task section includes all required fields
- [ ] Handles zero-task run gracefully

#### Task 4.7: Register runner VS Code commands

**Definition of Done:**
- [ ] `kanban2code.runTask` — runs single task through its remaining pipeline stages
- [ ] `kanban2code.runColumn` — runs all tasks in a specified column sequentially
- [ ] `kanban2code.stopRunner` — cancels running batch
- [ ] `kanban2code.runNightShift` — runs all Plan+Code+Audit tasks in order (convenience for overnight)
- [ ] Runner singleton managed in `extension.ts` (prevents parallel execution)
- [ ] Progress shown via VS Code progress API

**Files:**
- `src/commands/index.ts` — modify — register four runner commands
- `src/extension.ts` — modify — runner singleton lifecycle management

**Tests:**
- [ ] Runner singleton prevents parallel execution (second call rejected or queued)
- [ ] `stopRunner` cancels in-progress run

---

### Phase 5: UI Integration

Update all webview components for the agent/mode split and add runner controls.

#### Task 5.1: Update messaging protocol for modes and runner

**Definition of Done:**
- [ ] New `HostToWebviewMessageTypes`: `ModesLoaded`, `RunnerStateChanged`
- [ ] New `WebviewToHostMessageTypes`: `RequestModes`, `CreateMode`, `UpdateMode`, `DeleteMode`, `RunTask`, `RunColumn`, `StopRunner`
- [ ] Runner state payload type: `{ isRunning: boolean; activeTaskId?: string; activeStage?: Stage; progress?: number }`

**Files:**
- `src/webview/messaging.ts` — modify — add new message types to both arrays

**Tests:**
- [ ] New message types validate through `EnvelopeSchema`
- [ ] Existing messaging tests pass unchanged

**Skills:**
- `skills/skill-typescript-config` — Type definitions

#### Task 5.2: ModePicker component + update AgentPicker

**Definition of Done:**
- [ ] `ModePicker.tsx` — dropdown of available modes, shows name+description, "Create new mode" link at bottom
- [ ] `AgentPicker.tsx` — now shows LLM providers (opus, codex, kimi, glm) instead of behavior roles, label changed to "Agent (LLM Provider)"
- [ ] Both follow existing picker visual patterns

**Files:**
- `src/webview/ui/components/ModePicker.tsx` — create — mode selection dropdown
- `src/webview/ui/components/AgentPicker.tsx` — modify — show LLM providers

**Tests:**
- [ ] ModePicker renders mode list and fires `onChange` callback
- [ ] AgentPicker shows LLM provider descriptions
- [ ] Both pickers include "No selection" option

**Skills:**
- `skills/react-core-skills` — React component patterns

#### Task 5.3: Runner controls on Column headers

**Definition of Done:**
- [ ] Plan, Code, Audit columns get three action buttons in header: play (▶ run top task), play-all (▶▶ run column), stop (⏹)
- [ ] Inbox and Completed columns: no runner controls
- [ ] Stop button only visible when runner is active
- [ ] Play buttons disabled when runner is active

**Files:**
- `src/webview/ui/components/Column.tsx` — modify — add runner button props and rendering

**Tests:**
- [ ] Runner buttons render for plan/code/audit columns only
- [ ] Runner buttons NOT rendered for inbox/completed
- [ ] Stop visible only when `isRunnerActive` is true
- [ ] Play disabled when `isRunnerActive` is true
- [ ] Clicking play fires `onRunTopTask` callback with correct stage

**Skills:**
- `skills/react-core-skills` — React component patterns

#### Task 5.4: Update TaskCard for mode + runner status

**Definition of Done:**
- [ ] Card footer shows both mode and agent: `coder | opus`
- [ ] Fallback: shows agent only when mode is unset (backward compat)
- [ ] Card-level run button (play icon) visible on Plan/Code/Audit task cards
- [ ] Progress indicator (spinner/pulsing border) when runner is active on this specific task

**Files:**
- `src/webview/ui/components/TaskCard.tsx` — modify — add mode display + runner controls

**Tests:**
- [ ] Card shows mode name when set
- [ ] Run button visible on plan/code/audit cards, not inbox/completed
- [ ] Progress indicator shown when runner active on this task

**Skills:**
- `skills/react-core-skills` — React component patterns

#### Task 5.5: Update TaskModal and TaskEditorModal for mode field

**Definition of Done:**
- [ ] `TaskModal`: ModePicker below AgentPicker, both optional
- [ ] `TaskEditorModal`: metadata panel includes both mode and agent pickers
- [ ] Save payload includes both `mode` and `agent` fields in `SaveTaskWithMetadata` message

**Files:**
- `src/webview/ui/components/TaskModal.tsx` — modify — add ModePicker
- `src/webview/ui/components/TaskEditorModal.tsx` — modify — add ModePicker to metadata panel

**Tests:**
- [ ] Both modals render mode and agent pickers
- [ ] Save sends both fields in payload
- [ ] Missing mode saves as null (backward compat)

**Skills:**
- `skills/react-core-skills` — React component patterns

#### Task 5.6: Wire runner messages through webview hosts

**Definition of Done:**
- [ ] `KanbanPanel.ts` handles `RunTask`, `RunColumn`, `StopRunner` messages → dispatches to runner commands
- [ ] `SidebarProvider.ts` handles `RequestModes`, `CreateMode` + runner messages
- [ ] Both forward `RunnerStateChanged` events from runner engine to webview
- [ ] `useTaskData.ts` hook exposes `modes`, `isRunnerActive`, `activeRunnerTaskId` in return value

**Files:**
- `src/webview/KanbanPanel.ts` — modify — add runner message handlers
- `src/webview/SidebarProvider.ts` — modify — add mode + runner message handlers
- `src/webview/ui/hooks/useTaskData.ts` — modify — track modes and runner state

**Tests:**
- [ ] `RunTask` message triggers runner command execution
- [ ] Runner state change propagates to webview via `RunnerStateChanged`
- [ ] `useTaskData` exposes modes array and runner state

**Skills:**
- `skills/react-core-skills` — React hooks

#### Task 5.7: ModeModal component (create/edit mode)

**Definition of Done:**
- [ ] Free-text markdown editor modal following same glassmorphic pattern as `AgentModal`
- [ ] Fields: name (required), description (required), stage (optional dropdown), instructions (textarea, large)
- [ ] Submit sends `CreateMode` or `UpdateMode` message depending on context
- [ ] Can be opened in edit mode with pre-populated content from existing mode file

**Files:**
- `src/webview/ui/components/ModeModal.tsx` — create — mode create/edit modal

**Tests:**
- [ ] Renders all form fields (name, description, stage, instructions)
- [ ] Validates required fields before submit
- [ ] Edit mode pre-populates fields from existing mode

**Skills:**
- `skills/react-core-skills` — React component patterns

#### Task 5.8: Update context menu for mode and runner actions

**Definition of Done:**
- [ ] "Run Task" action added — disabled if runner is active or task is inbox/completed
- [ ] "Change Mode" submenu listing available modes (same pattern as existing "Change Stage" submenu)
- [ ] "Change Agent" submenu for changing LLM provider

**Files:**
- `src/webview/ui/components/TaskContextMenu.tsx` — modify — add runner and mode/agent actions

**Tests:**
- [ ] "Run Task" appears for plan/code/audit tasks
- [ ] "Run Task" disabled when runner is active
- [ ] "Change Mode" submenu lists all available modes
- [ ] "Change Agent" submenu lists all available LLM providers

**Skills:**
- `skills/react-core-skills` — React component patterns

---

### Phase 6: Mode Content Redesign + Documentation

Update mode instruction files for automation-aware behavior and update all documentation.

#### Task 6.1: Redesign planner mode for structured output

**Definition of Done:**
- [ ] `_modes/planner.md` has dual-mode instructions:
  - **Manual mode** (default): edit frontmatter directly as today (`stage: code`, `agent: coder`)
  - **Automated mode** (when `<runner automated="true" />` present in context): output `<!-- STAGE_TRANSITION: code -->` marker, do NOT edit frontmatter
- [ ] Both modes produce the same planning output quality

**Files:**
- `.kanban2code/_modes/planner.md` — modify (created in Phase 3 migration)

**Tests:**
- [ ] Runner parses planner structured output correctly
- [ ] Planner mode still works for manual copy-paste workflow (edits frontmatter)

#### Task 6.2: Redesign coder mode for structured output

**Definition of Done:**
- [ ] `_modes/coder.md` has dual-mode instructions:
  - **Manual mode**: edit frontmatter (`stage: audit`, `agent: auditor`) as today
  - **Automated mode**: output `<!-- STAGE_TRANSITION: audit -->` and `<!-- FILES_CHANGED: file1.ts, file2.ts -->`, do NOT edit frontmatter, do NOT commit
- [ ] Explicit instruction in automated mode to NOT commit changes (runner handles commits after audit)

**Files:**
- `.kanban2code/_modes/coder.md` — modify

**Tests:**
- [ ] Runner parses coder structured output correctly
- [ ] Coder does not commit changes in automated mode

#### Task 6.3: Redesign auditor mode for automation

**Definition of Done:**
- [ ] `_modes/auditor.md` has dual-mode instructions:
  - **Manual mode**: edit frontmatter, update `.kanban2code/architecture.md`, commit as today
  - **Automated mode**: output `<!-- AUDIT_RATING: N -->` and `<!-- AUDIT_VERDICT: ACCEPTED|NEEDS_WORK -->`, do NOT edit frontmatter, do NOT commit. Runner handles all state transitions and commits
- [ ] Fix architecture.md path: `.kanban2code/architecture.md` (root-level, loaded by `loadGlobalContext`), NOT `_context/architecture.md`
- [ ] Attempt awareness in automated mode: "Current attempt: {attempts}. If this is attempt 2 or higher, be more lenient but maintain standards."

**Files:**
- `.kanban2code/_modes/auditor.md` — modify

**Tests:**
- [ ] Runner parses `AUDIT_RATING` from auditor output
- [ ] Runner parses `AUDIT_VERDICT` (ACCEPTED / NEEDS_WORK)
- [ ] Automated mode does NOT edit frontmatter or commit
- [ ] Manual mode still edits frontmatter and commits as before

#### Task 6.4: Update documentation

**Definition of Done:**
- [ ] `.kanban2code/architecture.md` (root-level seed file) updated with: `_modes/` directory, new `_agents/` schema, runner architecture, new service files
- [ ] `how-it-works.md` updated with agent/mode split terminology
- [ ] `_context/ai-guide.md` updated with runner workflow, structured output markers, and dual-mode (manual vs automated) instructions

**Files:**
- `.kanban2code/architecture.md` — modify (root-level seed file, loaded by `loadGlobalContext`)
- `.kanban2code/how-it-works.md` — modify
- `.kanban2code/_context/ai-guide.md` — modify

**Tests:**
- [ ] Documentation accurately reflects implemented architecture
- [ ] Bundled contexts include updated docs after build

---

## Context

### Relevant Patterns

- **Service CRUD pattern**: `listAvailableModes()` should mirror `listAvailableAgents()` in `src/services/context.ts:196-252` — same `walk()` directory traversal, `gray-matter` frontmatter parsing, error handling with fallback defaults
- **File creation pattern**: `createModeFile()` should mirror `createAgentFile()` in `src/services/context.ts:303-328` — `ensureSafePath()`, `matter.stringify()`, `fs.writeFile()`
- **Frontmatter parsing**: `gray-matter` library throughout, same pattern as `src/services/frontmatter.ts:37-89` — try/catch parse, extract typed fields with fallbacks
- **Build bundling**: `generateBundledContent()` in `build.ts:31-79` — `readFilesRecursively()` then JSON.stringify into TypeScript const. Extend for `_modes/` using identical pattern
- **Message protocol**: Additive changes to const arrays in `src/webview/messaging.ts:5-56` — zod validation via `EnvelopeSchema`
- **Stage auto-assignment**: `shouldAutoUpdateAgent()` in `src/services/stage-manager.ts:73-82` — extend for mode using identical "don't overwrite manual" logic
- **UI modal pattern**: `AgentModal.tsx` glassmorphic modal — reuse for `ModeModal.tsx`
- **UI picker pattern**: `AgentPicker.tsx` select dropdown — reuse for `ModePicker.tsx`
- **Agent resolution**: `resolveAgentPath()` in `src/services/context.ts:436-451` — try direct file path first, then scan by frontmatter name. Same pattern for mode resolution

### Related Files

- `src/types/task.ts` — Core Task interface, must gain `mode` and `attempts` fields
- `src/core/constants.ts` — Folder constants, add `MODES_FOLDER` and `LOGS_FOLDER`
- `src/services/context.ts` — Agent loading/resolution, patterns to mirror for modes
- `src/services/frontmatter.ts` — Frontmatter parse/serialize, must handle new fields
- `src/services/prompt-builder.ts` — XML prompt assembly, must become mode-aware
- `src/services/stage-manager.ts` — Stage transitions with auto-assignment, must include mode
- `src/services/scaffolder.ts` — Workspace initialization, must create `_modes/`
- `src/webview/messaging.ts` — Message types, must add mode + runner messages
- `src/webview/KanbanPanel.ts` — Board webview host, must handle runner messages
- `src/webview/SidebarProvider.ts` — Sidebar webview host, must handle mode + runner messages
- `src/webview/ui/components/Column.tsx` — Column headers, must add runner controls
- `src/webview/ui/components/TaskCard.tsx` — Card display, must show mode + runner status
- `src/webview/ui/components/AgentPicker.tsx` — Agent dropdown, must show LLM providers
- `src/webview/ui/hooks/useTaskData.ts` — Data hook, must expose modes and runner state
- `src/assets/agents.ts` — Bundled agents (auto-generated), continue generating
- `build.ts` — Build script, must generate `src/assets/modes.ts`

### Gotchas

- **Backward compat fallback chain**: Old tasks have `agent: coder` (behavior name). Prompt-builder uses three-step fallback: `_modes/{mode}` → `_modes/{agent}` → `_agents/{agent}`. This covers pre-migration, mid-migration, and post-migration states
- **Migration must be atomic**: Copy to `_modes/`, update ALL task frontmatter, THEN replace `_agents/`. If `_agents/coder.md` becomes CLI config YAML while old tasks still reference it, `loadAgentContext` returns YAML config as "instructions"
- **Emoji prefixes in filenames**: Current agent files use `05-⚙️coder.md` naming. Migration must strip both the number prefix and emoji to get clean `coder.md` mode filenames. Use regex like `/^\d+-[^\w]*/` to strip
- **Build order dependency**: `src/assets/modes.ts` must exist before the extension bundle compiles. The build script runs `generateBundledContent()` before `runEsbuild()` so this works, but the `_modes/` directory must exist at build time (empty is fine)
- **Message version**: Keep `MESSAGE_VERSION = 1` — new message types are additive to the existing arrays and don't require a version bump
- **Runner singleton**: Only one runner instance can be active. If the user triggers a second run while one is active, reject with a user-friendly notification rather than queuing
- **Git dirty check**: Before starting a task, runner should verify the working tree is clean. If dirty from a previous failed run, the runner must refuse to start (user needs to handle uncommitted changes first)
- **State transition ownership**: Mode instructions currently tell the LLM to edit frontmatter directly (`06-✅auditor.md` lines 74, 92). Runner also updates frontmatter. This creates race conditions. Solution: runner injects `<runner automated="true" />` flag, mode instructions branch on it — automated mode outputs markers only, manual mode edits frontmatter directly
- **Scanner ordering is nondeterministic**: `scanner.ts` loads tasks via parallel `Promise.all` without sorting. Runner execution order would be unpredictable. Task 4.0 adds deterministic sort by `order` field + filename tiebreaker
- **architecture.md path mismatch**: Scaffolder writes `.kanban2code/architecture.md` (root-level), `loadGlobalContext` reads from root-level. But auditor instructions (`06-✅auditor.md` lines 77, 82) point to `_context/architecture.md`. Migration must fix auditor mode to target root-level path
- **Agent creation UI incompatible with new schema**: Current `createAgentFile()` in `context.ts:303` produces prose files (instructions). After migration, `_agents/` should contain CLI configs. The "Create Agent" button must become "Create Mode" (prose) + "Create Agent" (CLI config) — two separate flows
- **`_logs/` must be gitignored**: Current `.gitignore` only covers `_archive/` (`scaffolder.ts:71`). Migration must add `_logs/` to `.gitignore` to prevent runner reports from polluting git
- **Attempt semantics**: `attempts` increments on audit fail (NOT before code pass). First pass = `attempts: 0`, first fail → `attempts: 1`, second fail → `attempts: 2` → hard stop. Off-by-one here would cause premature or delayed stopping
