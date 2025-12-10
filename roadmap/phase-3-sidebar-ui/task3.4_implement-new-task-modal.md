**Stage:** plan
**Tags:** mvp, ui, tasks, creation

**Goal**
Provide a rich task creation flow, accessible from the sidebar (and later from the board).

**Scope**

* `<TaskModal />` with fields:

  * Location (Inbox or Project + optional phase).
  * Title (required).
  * Stage (default `inbox`).
  * Agent (dropdown from `_agents/`).
  * Tags (free-text with chips).
  * Template (from `_templates/tasks/`).
* On submit:

  * Generate filename `{timestamp}-{slug(title)}.md`.
  * Apply selected template to build frontmatter + body.
  * Write file into appropriate folder.
  * Reload tasks.
