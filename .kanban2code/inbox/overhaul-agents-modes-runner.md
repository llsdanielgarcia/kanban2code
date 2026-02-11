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

### Mode files = behavior/instructions

`_modes/` folder replaces the role aspect of current `_agents/`:
- `_modes/coder.md` — system prompt, coding instructions
- `_modes/auditor.md` — review criteria, rating threshold
- `_modes/planner.md` — planning instructions
- Orchestration modes: `roadmapper.md`, `architect.md`, `splitter.md`

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

### Implementation

- New **runner service** using `child_process` to invoke CLIs
- Per-CLI adapter to handle different invocation styles (piped stdin vs positional args)
- Runner log/report for morning review

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
- [ ] Rename `_agents/` folder or split into `_agents/` + `_modes/`
- [ ] Update ai-guide.md, architecture.md with new concepts
- [ ] Design runner adapter interface (per-CLI invocation + response parsing)
- [ ] Design runner log/report format for morning review
- [ ] Determine git commit strategy (per task? per stage? per run?)
- [ ] Handle Codex prompt size limitation (temp file? truncation? fallback to stdin workaround?)

## What Stays the Same

- 5-stage pipeline (Inbox → Plan → Code → Audit → Completed)
- Manual orchestration (roadmapper, architect, splitter) during the day
- Filesystem-based tasks with frontmatter
- Sidebar + Board UI
- Context system, tag taxonomy
- Stage transition rules
