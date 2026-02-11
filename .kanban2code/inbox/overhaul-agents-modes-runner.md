---
stage: inbox
created: 2026-02-10T06:00:00.000Z
tags: [feature, p0, mvp]
contexts: [ai-guide]
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
| **Prompt input** | `codex exec "prompt"` (positional arg). **No stdin pipe support** (open issue #1123). Workaround: `codex exec "$(cat file)"` but fails on large files due to ARG_MAX |
| **Model flag** | `--model gpt-5.3-codex` or `-m`. Reasoning: `-c model_reasoning_effort=high` (values: `minimal`, `low`, `medium`, `high`, `xhigh`) |
| **Unattended flag** | `--yolo` (no sandbox + no approvals), `--full-auto` (safer: workspace-write + auto-approve) |
| **Output format** | `--json` → JSONL event stream. `-o result.txt` writes final message to file. `--output-schema ./schema.json` for validated structured output |
| **Exit codes** | `0` = success, non-zero = failure |
| **Safety valves** | Sandbox modes (`read-only`, `workspace-write`, `danger-full-access`) |
| **Session resume** | `codex exec resume --last "continue"` or `codex exec resume SESSION_ID` |
| **Working dir** | `--cd /path` or `-C`, extendable with `--add-dir` |

**Runner invocation:**
```bash
codex exec --yolo --model gpt-5.3-codex -c model_reasoning_effort=high --json "prompt"
```

**CAVEAT:** No stdin pipe means full XML prompt must fit as shell argument (~2MB ARG_MAX on Linux). May need prompt truncation strategy for large contexts.

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
| **Model flag** | `--provider openrouter --model "z-ai/glm-4.7"` or `-P` / `-M` |
| **Unattended flag** | `--auto` (autonomous, respects permission config) + `--yolo` (approve everything) |
| **Output format** | `--json` for JSONL (requires `--auto`), `--json-io` for bidirectional |
| **Exit codes** | `0` = success, `1` = error, `124` = timeout, `130` = SIGINT, `143` = SIGTERM (best documented) |
| **Safety valves** | `--timeout N` (seconds), granular permission config in `~/.config/kilo/config.json` |
| **Chaining** | `--on-task-completed "follow-up prompt"` (90s timeout) |
| **Parallel** | `--parallel` creates isolated git worktree |
| **System prompt** | `--append-system-prompt "text"` or `--append-system-prompt-file path` |
| **Working dir** | `--workspace /path` or `-w`, defaults to `cwd` |

**Runner invocation:**
```bash
kilo run --auto --yolo --json --timeout 300 --provider openrouter --model "z-ai/glm-4.7" "prompt"
```

### Default agent per mode

Config file (e.g., `.kanban2code/_config/defaults.yaml` or within project settings) maps each mode to a default agent:

```yaml
# Default agent assignments per mode
defaults:
  coder: opus
  auditor: opus
  planner: sonnet
  roadmapper: opus
  architect: opus
  splitter: sonnet
  conversational: sonnet
```

- Runner uses these defaults when a task doesn't explicitly set `agent`
- **Override at task level**: individual tasks can set `agent: codex` in frontmatter to override the default
- **Override at board level**: kanban view should have a way to change the default agent for a mode without editing the config file (dropdown or settings panel)
- Config is project-scoped (lives in `.kanban2code/`) so different projects can use different defaults

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
prompt_style: positional
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
model: z-ai/glm-4.7
provider: openrouter
unattended_flags: ["--auto", "--yolo"]
output_flags: ["--json"]
prompt_style: positional
safety:
  timeout: 300
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

**Code changes required:**
- `TaskService` / frontmatter parser: recognize `agent` as LLM provider and `mode` as behavior role
- Agent file reader: parse new CLI config schema (`cli`, `model`, `prompt_style`, etc.)
- Mode file reader: load from `_modes/` instead of `_agents/`
- UI: agent picker shows LLM providers, add separate mode picker for behavior
- Prompt assembler: combine mode instructions + task content into CLI prompt
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
- Could be a structured form (preferred for agents since the schema is rigid) vs. free-text editor (preferred for modes since they're mostly prose)

**Code changes required:**
- `ModeService`: CRUD operations for `_modes/` files (read, list, create, update, delete)
- `AgentService`: CRUD operations for `_agents/` files (same pattern)
- Webview UI: mode management panel (add/edit form or markdown editor)
- Webview UI: agent management panel (structured form)
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
- Mode instructions can also be injected via CLI's `--append-system-prompt` flag (Claude, Kilo) or equivalent
- Decision: inject mode as system prompt AND include in XML, or just one? System prompt is cleaner for CLIs that support it, XML is the universal fallback

## 2. Batch Runner ("Night Shift")

Hit "run" before bed, review results in the morning.

### Flow

```
Code column tasks → run sequentially → each gets audited
  ├── audit pass → Completed
  ├── audit fail (attempt 1) → back to Code → re-code → re-audit
  └── audit fail (attempt 2) → Inbox (bail out, needs human)
```

### Execution order

1. Drain all Code column tasks sequentially (each runs coder mode)
2. Each task moves to Audit after coding
3. Run auditor on all newly audited tasks
4. Audit pass → Completed
5. Audit fail → back to Code, increment `attempts` counter
6. Re-run coder, then re-audit
7. If `attempts >= 2` → move to Inbox (bail out)

### Attempt tracking

Add `attempts: 0` to task frontmatter. Runner increments before each code pass.

### Error handling

**Hard stop on crash:** If a CLI process crashes (non-zero exit code that isn't an audit failure), the entire runner stops immediately. No further tasks are processed.
- Rationale: a crash likely indicates an environment issue (CLI not installed, auth expired, disk full) that would affect all subsequent tasks
- Runner log captures the error details for morning review
- Tasks that haven't started yet remain in their current stage untouched

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
- Status: Failed → moved to Inbox
- Mode: coder → auditor → coder → auditor
- Agent: opus
- Tokens: 24,100 in / 8,400 out
- Time: 15m 03s
- Attempts: 2
- Error: Audit rating 5/10 — "missing test coverage"

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
3. If audit passes (8+) → auditor commits with message: `feat(runner): {task-title} [auto]`
4. If audit fails → changes remain uncommitted, coder re-runs on next attempt
5. If max attempts reached → uncommitted changes are stashed or discarded, task moves to inbox

**Auditor mode instruction addition:**
```
When rating >= 8 (ACCEPTED):
1. Stage all changed files: git add -A
2. Commit with message: "feat(runner): {task-title} [auto]"
3. Set stage to completed
```

This keeps each task's changes in a discrete commit for easy review/revert in the morning.

### Implementation

- New **runner service** using `child_process` to invoke CLIs
- Per-CLI adapter to handle different invocation styles (piped stdin vs positional args)
- Runner log/report for morning review
- Runner UI: separate conversation needed (triggers, progress display, cancel)

## 3. Redesign Modes for Automation

With execution automated, mode instructions need to account for:
- Auditor: "if attempts >= 2, move to inbox" instruction
- Coder: explicit "move to audit when done" instruction
- All modes: structured output so runner can parse success/failure

## CLI Research Findings

### Completed Investigation

- [x] How each CLI handles prompt input → documented per-CLI above
- [x] Exact invocation syntax per CLI + model → runner invocation examples above
- [x] Whether kilo `--auto` + global permissions is sufficient → **Yes**, `--auto --yolo` or `--auto` + `"*": "allow"` in config both work
- [x] How to detect task completion from CLI output → exit codes + JSON parsing (Kilo best documented, Claude cleanest JSON)

### Critical Findings

1. **Codex stdin limitation:** No stdin pipe support. Full XML prompt must fit as shell argument (~2MB ARG_MAX). May need prompt truncation or temp file workaround for large contexts.
2. **Output parsing varies:** Claude returns single JSON object (`is_error`, `result`). Codex/Kilo emit JSONL event streams. KIMI has `--quiet` for just final text. Runner needs per-CLI response parsers.
3. **System prompt injection:** Claude and Kilo support `--append-system-prompt` (ideal for injecting mode instructions). KIMI uses config. Codex uses `-c` overrides. This is how mode behavior gets injected at runtime.
4. **Kilo is most automation-friendly:** `--timeout`, `--parallel` (git worktree isolation), `--on-task-completed`, clean exit codes. Best suited for CI/runner patterns.
5. **KIMI multi-provider:** Can use Claude/GPT/Gemini as backends — potential simplification if one CLI could cover multiple providers.

### Remaining Investigation

- [ ] Redesign mode file content for automated execution
- [ ] UI changes: agent picker → agent + mode pickers
- [ ] Mode management UI: add/edit/delete modes from the UI
- [ ] Agent management UI: add/edit/delete LLM providers from the UI
- [x] Rename `_agents/` folder or split into `_agents/` + `_modes/` → migration plan documented above
- [ ] Update ai-guide.md, architecture.md with new concepts
- [ ] Design runner adapter interface (per-CLI invocation + response parsing)
- [x] Design runner log/report format for morning review → documented above (per-task: name, tokens, status, time, commit)
- [x] Determine git commit strategy → commit after each successful audit, auditor mode handles the commit
- [ ] Default agent-per-mode config file + board-level override UI
- [ ] Prompt assembly: update `prompt-builder.ts` to use modes instead of agents
- [ ] Runner UI: triggers, progress display, cancel (needs separate conversation)
- [ ] Handle Codex prompt size limitation (temp file? truncation? fallback to stdin workaround?)

## What Stays the Same

- 5-stage pipeline (Inbox → Plan → Code → Audit → Completed)
- Manual orchestration (roadmapper, architect, splitter) during the day
- Filesystem-based tasks with frontmatter
- Sidebar + Board UI
- Context system, tag taxonomy
- Stage transition rules
