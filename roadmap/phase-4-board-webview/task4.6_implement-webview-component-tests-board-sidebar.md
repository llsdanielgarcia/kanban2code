**Stage:** plan
**Tags:** mvp, testing, ui, board, sidebar

**Goal**
Ensure webview components render correctly and handle interactions.

**Scope**

* `tests/board.test.tsx` (Vitest + React Testing Library):

  * TaskCard rendering.
  * Board column rendering.
  * Drag-and-drop (using test-friendly abstractions).
  * Filter and search behavior.
  * Context menu actions.
* `tests/sidebar.test.tsx`:

  * Sidebar tree rendering.
  * Filters and quick views.
  * Task selection.
  * Top nav (`Create Kanban`, `View Kanban`, `Settings`) click behavior.
* Mock VS Code APIs and message bridge for tests.
