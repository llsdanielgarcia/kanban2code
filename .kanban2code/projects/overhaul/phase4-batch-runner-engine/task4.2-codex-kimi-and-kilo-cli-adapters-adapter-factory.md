---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Codex, KIMI, and Kilo CLI adapters + adapter factory

## Goal
Implement CLI adapters for Codex, KIMI, and Kilo, plus a factory function.

## Definition of Done
- [ ] Codex adapter: stdin prompt style (pipe via `-` sentinel), `--yolo`, `--json`, JSONL response parser
- [ ] KIMI adapter: `-p` flag style, `--print`, `--quiet` text response parser
- [ ] Kilo adapter: positional, `--auto` (no `--yolo`), `--format json` (not `--json`), `-m provider/model` (combined flag), `--append-system-prompt`, JSONL parser
- [ ] Factory function: `getAdapterForCli(cli: string) → CliAdapter`

## Files
- `src/runner/adapters/codex-adapter.ts` - create
- `src/runner/adapters/kimi-adapter.ts` - create
- `src/runner/adapters/kilo-adapter.ts` - create
- `src/runner/adapter-factory.ts` - create - factory function

## Tests
- [ ] Codex adapter pipes prompt via stdin using `-` sentinel
- [ ] KIMI adapter uses `-p` flag style correctly
- [ ] Kilo adapter uses `--format json` (not `--json`) and `-m provider/model` (combined)
- [ ] JSONL parser extracts final message from multi-line event stream
- [ ] Factory returns correct adapter for each CLI name

## Context
Each CLI has different invocation patterns and response formats. The adapters abstract these differences so the runner can use a unified interface.

Codex uses stdin pipe, KIMI uses `-p` flag, Kilo uses positional args. Codex and Kilo return JSONL streams, KIMI returns plain text.
