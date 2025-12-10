**Stage:** plan
**Tags:** mvp, ui, sidebar, ui-shell

**Goal**
Design and implement a visual sidebar shell that opens in VS Code with the correct layout and navigation, using placeholders only.

**Scope**

* Create `<SidebarShell />` React component that:

  * Renders in the sidebar webview (no data yet).
  * Shows a title bar: **“Kanban2Code”**.
  * Includes three main buttons:

    * `Create Kanban`
    * `View Kanban`
    * `Settings`
  * Uses dummy content for the rest (e.g., placeholder task list).
* Buttons may:

  * Be no‑ops.
  * Or just log to the console/postMessage for now.
* Get visual/UX approval on:

  * Layout.
  * Button placement and naming.
  * Overall look and feel.

**Notes**
No filesystem calls or task data yet. This is purely about what the sidebar looks like.
