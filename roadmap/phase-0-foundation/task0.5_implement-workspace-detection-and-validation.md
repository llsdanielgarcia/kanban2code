**Stage:** plan
**Tags:** mvp, infra, validation, testing

**Goal**
Reliably locate `.kanban2code` and prevent unsafe file operations.

**Scope**

* Implement `workspace/validation.ts`:

  * `findKanbanRoot(workspaceRoot)` to locate `.kanban2code`.
  * Guard against operations outside the kanban root.
* On missing `.kanban2code`:

  * Return null/false to indicate workspace needs scaffolding.
* Show clear error messages when the workspace is invalid.
* **Testing requirement:**

  * Unit tests for detection in different workspace layouts (single-root, multi-root, missing folder, forbidden paths).

**Notes**
Phase 1 will extend this with richer status codes.
