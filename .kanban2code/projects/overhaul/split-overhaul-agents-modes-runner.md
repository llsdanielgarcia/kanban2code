---
stage: inbox
tags: [decomposition, missing-decomposition]
agent: splitter
contexts: []
parent: overhaul-agents-modes-runner
---

# Split: Agent/Mode Split + Automated Batch Runner

## Goal

Generate individual task files from the architected roadmap.

## Input

Roadmap: `.kanban2code/projects/overhaul/overhaul-agents-modes-runner.md`

## Notes

The roadmap contains 6 phases with 31 tasks. Each task has definition of done, files to modify/create, and test cases. The Splitter should generate one task file per task (e.g., `task-1-1-add-mode-attempts-to-task-interface.md`), preserving the phase structure and dependencies.
