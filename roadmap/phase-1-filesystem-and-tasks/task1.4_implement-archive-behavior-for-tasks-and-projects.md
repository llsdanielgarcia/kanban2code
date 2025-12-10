**Stage:** plan
**Tags:** mvp, filesystem, archive, testing

**Goal**
Support explicit archive actions that move files into `_archive/` while preserving structure.

**Scope**

* Implement `archiveTask(task, root)`:

  * Only allow if `stage: 'completed'`.
  * Move:

    * Inbox tasks → `_archive/inbox/{filename}`
    * Project/phase tasks → `_archive/projects/{project}/{phase?}/{filename}`
* Implement `archiveProject(root, projectName)`:

  * Move entire `projects/{project}` into `_archive/projects/{project}`.
* Add commands:

  * `Archive Task`
  * `Archive Completed in Project`
  * `Archive Project`
* **Testing requirement:**

  * Unit tests for path calculations and guard conditions.
