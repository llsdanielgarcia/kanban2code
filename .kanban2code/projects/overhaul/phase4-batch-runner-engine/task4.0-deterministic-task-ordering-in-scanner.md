---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Deterministic task ordering in scanner

## Goal
Add deterministic sorting to task loading so runner can rely on stable "topmost task" ordering.

## Definition of Done
- [ ] `loadAllTasks` in `src/services/scanner.ts` returns tasks sorted deterministically: by `order` field ascending (undefined last), then by filename as tiebreaker
- [ ] New export: `getOrderedTasksForStage(tasks, stage)` — filters by stage and returns in deterministic order for runner consumption
- [ ] Runner can rely on "topmost task" being stable across calls

## Files
- `src/services/scanner.ts` - modify - add sort after parallel load

## Tests
- [ ] Tasks with explicit `order` values sort correctly (1, 2, 3)
- [ ] Tasks without `order` sort after those with `order`, by filename
- [ ] `getOrderedTasksForStage` filters and sorts correctly

## Context
The scanner currently loads tasks via parallel `Promise.all` without sorting. Runner execution order would be unpredictable. This task adds deterministic sort by `order` field + filename tiebreaker so the runner can reliably pick the "topmost task" from each column.
