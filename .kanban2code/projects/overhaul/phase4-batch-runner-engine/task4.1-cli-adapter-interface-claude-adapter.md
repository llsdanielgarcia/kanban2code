---
stage: audit
tags: [feature, p1]
agent: auditor
contexts: []
---

# CLI adapter interface + Claude adapter

## Goal
Define CLI adapter interface and implement Claude CLI adapter.

## Definition of Done
- [x] `CliAdapter` interface: `buildCommand(config, prompt, options?) → { command, args, stdin? }` and `parseResponse(stdout, exitCode) → CliResponse`
- [x] `CliResponse` type: `success`, `result`, `error?`, `sessionId?`, `cost?`, `turns?`
- [x] Claude adapter: `-p` flag, `--model`, `--dangerously-skip-permissions`, `--output-format json`, `--max-turns`, `--append-system-prompt`
- [x] Parses single JSON object (`is_error`, `result`, `session_id`, `total_cost_usd`, `num_turns`)

## Files
- `src/runner/cli-adapter.ts` - create - interface + shared types
- `src/runner/adapters/claude-adapter.ts` - create - Claude CLI adapter

## Tests
- [x] `buildCommand` produces correct argv array for opus config
- [x] `buildCommand` includes `--append-system-prompt` flag when system prompt provided
- [x] `parseResponse` extracts result from valid JSON
- [x] `parseResponse` handles `is_error: true` correctly
- [x] `parseResponse` handles non-JSON output gracefully (crash scenario)

## Context
The CLI adapter interface abstracts differences between CLIs (Claude, Codex, KIMI, Kilo). Each adapter knows how to build the shell command and parse the response.

Claude CLI uses `-p` flag for prompt input and returns a single JSON object with structured output.

## Audit
- `src/runner/cli-adapter.ts`
- `src/runner/adapters/claude-adapter.ts`
- `tests/claude-adapter.test.ts`
