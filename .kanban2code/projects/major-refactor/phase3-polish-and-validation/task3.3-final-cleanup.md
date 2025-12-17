---
stage: plan
tags: [chore, p2]
agent: coder
contexts: []
---

# Final Cleanup

## Goal
Ensure all build processes pass and the extension is in a clean state.

## Definition of Done
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run test` passes (all unit/integration tests)
- [ ] `bun run test:e2e` passes
- [ ] `bun run build` produces valid extension

## Context
This task performs final validation to ensure the extension builds correctly and all tests pass after the major refactor from template system to agent-driven workflow.