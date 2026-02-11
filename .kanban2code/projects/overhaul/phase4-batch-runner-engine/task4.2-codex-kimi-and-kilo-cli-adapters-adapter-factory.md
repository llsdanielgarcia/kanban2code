---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: []
---

# Codex, KIMI, and Kilo CLI adapters + adapter factory

## Goal

Implement CLI adapters for Codex, KIMI, and Kilo, plus a factory function.

## Definition of Done

- [x] Codex adapter: stdin prompt style (pipe via `-` sentinel), `--yolo`, `--json`, JSONL response parser
- [x] KIMI adapter: `-p` flag style, `--print`, `--quiet` text response parser
- [x] Kilo adapter: positional, `--auto` (no `--yolo`), `--format json` (not `--json`), `-m provider/model` (combined flag), `--append-system-prompt`, JSONL parser
- [x] Factory function: `getAdapterForCli(cli: string) → CliAdapter`

## Files

- `src/runner/adapters/codex-adapter.ts` - create
- `src/runner/adapters/kimi-adapter.ts` - create
- `src/runner/adapters/kilo-adapter.ts` - create
- `src/runner/adapter-factory.ts` - create - factory function

## Tests

- [x] Codex adapter pipes prompt via stdin using `-` sentinel
- [x] KIMI adapter uses `-p` flag style correctly
- [x] Kilo adapter uses `--format json` (not `--json`) and `-m provider/model` (combined)
- [x] JSONL parser extracts final message from multi-line event stream
- [x] Factory returns correct adapter for each CLI name

## Context

Each CLI has different invocation patterns and response formats. The adapters abstract these differences so the runner can use a unified interface.

Codex uses stdin pipe, KIMI uses `-p` flag, Kilo uses positional args. Codex and Kilo return JSONL streams, KIMI returns plain text.

## Audit

- `src/runner/adapters/codex-adapter.ts`
- `src/runner/adapters/kimi-adapter.ts`
- `src/runner/adapters/kilo-adapter.ts`
- `src/runner/adapter-factory.ts`
- `tests/other-cli-adapters.test.ts`

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary

Solid implementation of all three adapters with proper handling of CLI-specific differences. Factory pattern is clean and maintainable.

### Findings

#### Blockers

- None

#### High Priority

- None

#### Medium Priority

- None

#### Low Priority / Nits

- [ ] [DRY]: `JsonlEvent` interface and `extractText` function are duplicated between `codex-adapter.ts` and `kilo-adapter.ts` - consider extracting to shared utility

### Test Assessment

- Coverage: Adequate
- Missing tests: None - all 5 specified tests present covering key behaviors

### What's Good

- Correct handling of CLI-specific flags (`--format json` vs `--json`, `--yolo` filtering for Kilo)
- JSONL parser with robust text extraction from various nested structures
- Factory throws clear error for unknown CLI names
- stdin vs flag vs positional prompt styles properly differentiated

### Recommendations

- Extract shared JSONL parsing logic (`JsonlEvent`, `extractText`) to `src/runner/jsonl-utils.ts` for reuse
