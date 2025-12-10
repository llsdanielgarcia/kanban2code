**Stage:** plan
**Tags:** mvp, infra, webview, ui-shell

**Goal**
Set up React bootstrapping, theme system, and message wiring for Kanban2Code webviews, including a thin UI shell.

**Scope**

* Implement webview bootstrapping (`contentProvider`, CSP, message wiring).
* Create React entry (`main.tsx`, `App.tsx`).
* Set up theme provider + tokens (glassmorphic styles).
* Render a minimal **UI shell**:

  * Placeholder sidebar area.
  * Placeholder board area.
  * Simple `"Hello from Kanban2Code"` content.
* **Testing requirement:**

  * Add unit tests for any pure utilities (theme tokens, message serializers).
  * Optional: simple component test to assert `<App />` renders a known string.

**Notes**
This is still infrastructure; real sidebar/board designs happen in Phases 3 and 4.
