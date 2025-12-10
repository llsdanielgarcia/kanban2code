**Stage:** plan
**Tags:** mvp, ui, board, ui-shell

**Goal**
Create a static board layout to visualize the final UI before wiring it to real data or actions.

**Scope**

* Implement `<BoardShell />` React component:

  * Columns: Inbox, Plan, Code, Audit, Completed.
  * Static/fake TaskCards in each column.
* Top bar:

  * Search box (client-side only on fake data).
  * Non-functional buttons mirroring core actions (e.g., “New Task”, quick filter).
* Click/drag on cards can be:

  * No‑ops.
  * Simple console logs.
* Get explicit visual/UX approval for:

  * Column layout.
  * Card appearance.
  * Top bar controls.

**Notes**
No filesystem writes or real data here. Once approved, proceed to 4.1–4.5.
