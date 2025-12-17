---
stage: plan
tags: [refactor, p1]
agent: sonnet
contexts: []
---

# Define Tag Taxonomy for Orchestration

## Goal
Define and implement orchestration tags for tracking pipeline state.

## Definition of Done
- [ ] Orchestration tags added to `filters.ts` taxonomy
- [ ] Tag validation rules for orchestration state
- [ ] UI color/style for orchestration tags defined

## Context
This task defines the tag system that tracks orchestration pipeline state:
- Orchestration tags: missing-architecture, missing-decomposition, architecture-ready, decomposition-ready
- Type tags: roadmap, architecture, decomposition
- These tags coordinate the handoffs between agents in the pipeline