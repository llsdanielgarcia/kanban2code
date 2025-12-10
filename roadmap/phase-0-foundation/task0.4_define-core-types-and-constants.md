**Stage:** plan
**Tags:** mvp, infra, types, model, testing

**Goal**
Create a shared type system and constants for tasks, stages, and copy modes used across the extension, services, and UI.

**Scope**

* In `types/task.ts`:

  * Define `Stage = 'inbox' | 'plan' | 'code' | 'audit' | 'completed'`.
  * Define `Task` interface with:

    * `id`, `filePath`, `title`, `stage`, `project?`, `phase?`, `agent?`,
      `parent?`, `tags?`, `contexts?`, `order?`, `created?`, `content`.
* In `core/constants.ts`:

  * `STAGES` array in order.
  * Folder names for `inbox`, `projects`, `_archive`, etc.
* **Testing requirement:**

  * Unit tests to assert `STAGES` ordering and valid `Stage` values.
  * Simple type-guard tests (where applicable).

**Notes**
This file is the single source of truth for task structure.
