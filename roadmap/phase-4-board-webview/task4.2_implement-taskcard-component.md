**Stage:** plan
**Tags:** mvp, ui, board, tasks

**Goal**
Render individual tasks as Kanban cards with key information and actions.

**Scope**

* `<TaskCard />` shows:

  * Title.
  * Project › Phase crumb (or “Inbox”).
  * Tag row (1–3 tags).
  * Stage pill (optional).
* On hover:

  * `Copy XML`.
  * `Open` file.
  * `[…]` menu (Mark Implementation Done, Change Stage, Move, Archive, Delete).
* Keyboard shortcuts when focused:

  * `C` → copy XML.
  * `Enter` → open file.
  * `1–5` → move to specific stage.
