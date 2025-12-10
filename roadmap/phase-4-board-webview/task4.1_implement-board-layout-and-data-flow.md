**Stage:** plan
**Tags:** mvp, ui, board

**Goal**
Turn the approved board shell into the main Kanban board webview with real data.

**Scope**

* Replace `<BoardShell />` with `<Board />` using real data:

  * Columns show tasks filtered by stage + global filters.
* Top bar:

  * Search box (client-side filtering on real tasks).
  * `[+ New Task]` button that reuses the task creation flow.
  * Filter controls synced with sidebar (via host messaging).
* Wire board to extension host for task data loading and updates.
