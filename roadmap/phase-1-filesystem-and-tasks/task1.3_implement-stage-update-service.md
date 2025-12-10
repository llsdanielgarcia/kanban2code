**Stage:** plan
**Tags:** mvp, filesystem, stages, testing

**Goal**
Allow stages to change by updating frontmatter only, without moving files.

**Scope**

* Implement `taskMoveService.moveTaskToStage(task, newStage)` with transition guards:

  * Read file, update `stage` in frontmatter, write back.
  * Enforce allowed transitions (e.g., Code → Audit via "Mark Implementation Done").
  * Completed can only move to Archive.
  * Disallow regressions unless explicitly allowed.
* Provide `changeStageAndReload(taskId, newStage)` helper for the UI.
* **Testing requirement:**

  * Unit tests for allowed/forbidden transitions and error cases.
