---
stage: completed
tags: [feature, p1]
agent: auditor
contexts: []
---

# Update frontmatter parser for `mode` and `attempts`

## Goal

Update the frontmatter parser to handle the new `mode` and `attempts` fields in task files.

## Definition of Done

- [x] `parseTaskContent` in `src/services/frontmatter.ts` extracts `mode` (string, optional) and `attempts` (number, optional, defaults to undefined)
- [x] `stringifyTaskFile` serializes `mode` and `attempts` fields in YAML frontmatter
- [x] `saveTaskWithMetadata` in `src/services/task-content.ts` accepts `mode` in its metadata interface

## Files

- `src/services/frontmatter.ts` - modify - parse/serialize `mode` and `attempts`
- `src/services/task-content.ts` - modify - metadata interface gains `mode`

## Tests

- [x] Parse task with `mode: coder` → `task.mode === 'coder'`
- [x] Parse task without `mode` → `task.mode === undefined`
- [x] Parse task with `attempts: 1` → `task.attempts === 1`
- [x] Round-trip: parse → modify mode → stringify → parse → verify
- [x] Existing frontmatter tests pass unchanged

## Context

The frontmatter parser needs to handle the new fields added to the Task interface in Task 1.1. Both `mode` and `attempts` are optional to maintain backward compatibility with existing tasks.

The `attempts` field tracks how many times a task has failed audit and been sent back to code. The runner increments this counter on each audit failure.

## Audit

- src/services/frontmatter.ts
- src/services/task-content.ts
- src/webview/KanbanPanel.ts
- src/webview/SidebarProvider.ts
- src/webview/ui/components/TaskEditorModal.tsx
- tests/frontmatter.test.ts

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
Clean, minimal implementation that correctly adds `mode` and `attempts` to the frontmatter parser, serializer, metadata interfaces, and UI layer with full backward compatibility.

### Findings

#### Blockers
- (none)

#### High Priority
- (none)

#### Medium Priority
- (none)

#### Low Priority / Nits
- [ ] `saveTaskWithMetadata` uses `metadata.mode || undefined` (line 131 of `task-content.ts`) which coerces empty string `""` to `undefined`. This is fine in practice since mode values are meaningful strings, but `?? undefined` would be more precise for null-to-undefined conversion - `task-content.ts:131`
- [ ] Similarly, `KanbanPanel.ts:287` and `SidebarProvider.ts:174` use `task.mode || null` — if `mode` were ever an empty string it would be treated as falsy. Cosmetic nit only since modes are always non-empty strings.

### Test Assessment
- Coverage: Adequate — all 4 specified test cases are present and the round-trip test is particularly well-constructed
- Missing tests: None significant. A minor addition could test `attempts: 0` to verify it's not coerced to `undefined` (since `typeof 0 === 'number'` is true, this works correctly, but the edge case isn't explicitly tested)

### What's Good
- Consistent pattern — `mode` and `attempts` follow the exact same `typeof` guard pattern as existing optional fields (`agent`, `order`, `created`)
- The `stringifyTaskFile` correctly strips `undefined` values via the cleanup loop (lines 140–144), ensuring clean YAML output when these fields are absent
- Both `KanbanPanel` and `SidebarProvider` correctly thread `mode` through `FullTaskDataLoaded` and `SaveTaskWithMetadata` message payloads
- `TaskEditorModal.tsx` properly manages `mode` state, includes it in dirty checking, and sends it on save
- No regressions — all 11 tests pass including all pre-existing ones

### Recommendations
- Consider adding an `attempts: 0` edge-case test to document that zero is a valid value (not coerced away)
