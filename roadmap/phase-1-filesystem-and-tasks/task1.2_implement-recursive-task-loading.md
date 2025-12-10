**Stage:** plan
**Tags:** mvp, filesystem, tasks, loader, testing

**Goal**
Load all tasks from `.kanban2code` into memory with the correct `project` and `phase` inferred.

**Scope**

* Implement `taskService.loadAllTasks(root): Promise<Task[]>`:

  * Load `inbox/*.md`.
  * For each project in `projects/`:

    * Load direct tasks under `projects/{project}/*.md` (excluding `_context.md`).
    * Load phase tasks under `projects/{project}/{phase}/*.md` (excluding `_context.md`).
* Set:

  * `task.project` based on project folder.
  * `task.phase` based on phase folder (or `null`).
* Resilient to missing folders and empty states.
* **Testing requirement:**

  * Integration tests in Task 1.7 will cover loading behavior.
  * Keep logic stateless and testable.
