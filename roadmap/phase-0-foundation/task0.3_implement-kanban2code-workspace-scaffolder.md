**Stage:** plan
**Tags:** mvp, infra, filesystem, scaffolding

**Goal**
Provide a one-shot command that generates the canonical `.kanban2code` folder with all required subfolders and seed files.

**Scope**

* Create `.kanban2code` with:

  * `inbox/`
  * `projects/`
  * `_agents/`
  * `_templates/stages/`
  * `_templates/tasks/`
  * `_archive/`
* Create seed files:

  * `how-it-works.md`
  * `architecture.md`
  * `project-details.md`
  * `_agents/opus.md` (optional `sonnet.md`, `codex.md`)
  * `_templates/stages/inbox.md`, `code.md`, `plan.md`, `audit.md`, `completed.md`
  * `_templates/tasks/bug.md` (optional: feature/spike)
  * `.gitignore` ignoring `_archive/`
  * A sample inbox task.
* Wire command `kanban2code.scaffoldWorkspace` with success/error messages.
* Use workspace detection from task 0.5 to check if `.kanban2code` exists before scaffolding.
* **Testing requirement:**

  * Add unit tests for the scaffolder’s pure logic (e.g. path generation, idempotency checks).

**Notes**
This defines the “Create Kanban” experience the sidebar will trigger.
