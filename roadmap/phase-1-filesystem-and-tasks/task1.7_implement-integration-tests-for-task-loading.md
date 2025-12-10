**Stage:** plan
**Tags:** mvp, testing, filesystem

**Goal**
Ensure task loading works correctly across all folder structures and edge cases.

**Scope**

* Create `tests/task-loading.test.ts` using Vitest:

  * Test loading from empty workspace.
  * Inbox only.
  * Projects with phases and without phases.
  * `_context.md` exclusion.
  * Project/phase inference.
  * Missing folders and malformed files.
* Use temporary test directories, not real workspace.
