**Stage:** plan
**Tags:** mvp, testing, e2e, workflows

**Goal**
Verify critical workflows end-to-end in a real VS Code environment.

**Scope**

* `tests/e2e/` using @vscode/test-electron:

  * Workspace scaffolding.
  * Task creation from sidebar and board.
  * Stage changes via drag-and-drop.
  * Copy XML context functionality.
  * Archive workflow.
  * Filter synchronization.
* Set up fixtures and cleanup.
