---
stage: code
tags: [feature, p0]
agent: coder
contexts: []
---

# Runner execution engine

## Goal
Create the core runner engine that orchestrates sequential task execution through pipeline stages.

## Definition of Done
- [ ] `RunnerEngine` class with `runTask(task)`, `runColumn(stage)`, `stop()`
- [ ] Pipeline logic: determines remaining stages from current stage, runs each via mode+agent+CLI
- [ ] Audit logic: rating 8+ → completed, <8 → increment `attempts` then back to code, `attempts >= 2` → hard stop (leave uncommitted changes)
- [ ] Hard stop on CLI crash (non-zero exit code that isn't an audit failure)
- [ ] **Runner owns all state transitions**: updates task frontmatter (`stage`, `mode`, `agent`, `attempts`) directly — LLM output parsed for structured markers only, LLM does NOT edit frontmatter
- [ ] Passes `automated: true` flag to `buildRunnerPrompt` so mode instructions tell LLM to output markers instead of editing frontmatter
- [ ] Pre-flight check: refuses to start if git working tree is dirty (uncommitted changes from previous failed run)
- [ ] Emits events: `taskStarted`, `stageStarted`, `stageCompleted`, `taskCompleted`, `taskFailed`, `runnerStopped`
- [ ] Uses `child_process.spawn` for CLI invocation

## Files
- `src/runner/runner-engine.ts` - create - core orchestration engine

## Tests
- [ ] Code-stage task runs coder mode then auditor mode
- [ ] Plan-stage task runs planner, coder, auditor in sequence
- [ ] Audit pass (8+) marks task completed
- [ ] Audit fail (attempt 1) sends task back to code stage
- [ ] Audit fail (attempt 2) stops runner entirely, leaves task in audit
- [ ] CLI crash (exit code 1) stops runner immediately
- [ ] `stop()` cancels execution before next stage

## Context
The runner engine is the core orchestration layer. It processes tasks one at a time through their full pipeline (plan → code → audit, or code → audit, or audit only).

Critical: The runner owns all state transitions when running automated. Mode instructions must output structured markers only, not edit frontmatter directly. The runner parses these markers and updates task frontmatter itself.
