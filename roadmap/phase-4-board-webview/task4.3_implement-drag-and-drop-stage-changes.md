**Stage:** plan
**Tags:** mvp, ui, board, dnd

**Goal**
Allow tasks to be moved between stages via drag-and-drop.

**Scope**

* Enable dragging `TaskCard` between columns.
* On drop:

  * Send message to extension host to call `moveTaskToStage`.
  * Update UI state after success.
* Optional: support ordering within a column via `order:`.
