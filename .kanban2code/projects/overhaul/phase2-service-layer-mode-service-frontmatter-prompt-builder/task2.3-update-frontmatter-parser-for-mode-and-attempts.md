---
stage: code
tags: [feature, p1]
agent: coder
contexts: []
---

# Update frontmatter parser for `mode` and `attempts`

## Goal
Update the frontmatter parser to handle the new `mode` and `attempts` fields in task files.

## Definition of Done
- [ ] `parseTaskContent` in `src/services/frontmatter.ts` extracts `mode` (string, optional) and `attempts` (number, optional, defaults to undefined)
- [ ] `stringifyTaskFile` serializes `mode` and `attempts` fields in YAML frontmatter
- [ ] `saveTaskWithMetadata` in `src/services/task-content.ts` accepts `mode` in its metadata interface

## Files
- `src/services/frontmatter.ts` - modify - parse/serialize `mode` and `attempts`
- `src/services/task-content.ts` - modify - metadata interface gains `mode`

## Tests
- [ ] Parse task with `mode: coder` → `task.mode === 'coder'`
- [ ] Parse task without `mode` → `task.mode === undefined`
- [ ] Parse task with `attempts: 1` → `task.attempts === 1`
- [ ] Round-trip: parse → modify mode → stringify → parse → verify
- [ ] Existing frontmatter tests pass unchanged

## Context
The frontmatter parser needs to handle the new fields added to the Task interface in Task 1.1. Both `mode` and `attempts` are optional to maintain backward compatibility with existing tasks.

The `attempts` field tracks how many times a task has failed audit and been sent back to code. The runner increments this counter on each audit failure.
