---
stage: audit
tags: [feature, p0]
agent: auditor
contexts: []
---

# Runner execution engine

## Goal
Create the core runner engine that orchestrates sequential task execution through pipeline stages.

## Definition of Done
- [x] `RunnerEngine` class with `runTask(task)`, `runColumn(stage)`, `stop()`
- [x] Pipeline logic: determines remaining stages from current stage, runs each via mode+agent+CLI
- [x] Audit logic: rating 8+ → completed, <8 → increment `attempts` then back to code, `attempts >= 2` → hard stop (leave uncommitted changes)
- [x] Hard stop on CLI crash (non-zero exit code that isn't an audit failure)
- [x] **Runner owns all state transitions**: updates task frontmatter (`stage`, `mode`, `agent`, `attempts`) directly — LLM output parsed for structured markers only, LLM does NOT edit frontmatter
- [x] Passes `automated: true` flag to `buildRunnerPrompt` so mode instructions tell LLM to output markers instead of editing frontmatter
- [x] Pre-flight check: refuses to start if git working tree is dirty (uncommitted changes from previous failed run)
- [x] Emits events: `taskStarted`, `stageStarted`, `stageCompleted`, `taskCompleted`, `taskFailed`, `runnerStopped`
- [x] Uses `child_process.spawn` for CLI invocation

## Files
- `src/runner/runner-engine.ts` - create - core orchestration engine

## Tests
- [x] Code-stage task runs coder mode then auditor mode
- [x] Plan-stage task runs planner, coder, auditor in sequence
- [x] Audit pass (8+) marks task completed
- [x] Audit fail (attempt 1) sends task back to code stage
- [x] Audit fail (attempt 2) stops runner entirely, leaves task in audit
- [x] CLI crash (exit code 1) stops runner immediately
- [x] `stop()` cancels execution before next stage

## Context
The runner engine is the core orchestration layer. It processes tasks one at a time through their full pipeline (plan → code → audit, or code → audit, or audit only).

Critical: The runner owns all state transitions when running automated. Mode instructions must output structured markers only, not edit frontmatter directly. The runner parses these markers and updates task frontmatter itself.

## Audit
- `src/runner/runner-engine.ts`
- `tests/runner-engine.test.ts`
