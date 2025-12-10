**Stage:** plan
**Tags:** mvp, ui, sidebar

**Goal**
Turn the approved sidebar shell into a functional view.

**Scope**

* Register custom view `kanban2code.sidebar`.
* Render `<Sidebar />` (production component) using the approved shell design.
* Wire top nav buttons:

  * `Create Kanban` → `kanban2code.scaffoldWorkspace` or equivalent flow.
  * `View Kanban` → `kanban2code.openBoard`.
  * `Settings` → open settings/config view or config webview.
* Wire sidebar to task data from `taskService.loadAllTasks`.
* Support basic refresh when files change (using Phase 1 watcher events).
