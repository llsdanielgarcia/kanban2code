**Stage:** plan
**Tags:** mvp, infra, extension, activation

**Goal**
Ensure Kanban2Code activates at the right time and handles missing workspaces gracefully.

**Scope**

* Set `activationEvents` in `package.json`:

  * `workspaceContains:.kanban2code`
  * `onCommand:kanban2code.scaffoldWorkspace`
  * `onView:kanban2code.sidebar`
* On activation without `.kanban2code`:

  * Show an empty state in sidebar with “Create Kanban” (scaffold) button.
* Multi-root handling:

  * Use first folder containing `.kanban2code`.
  * If none found, target first workspace folder for scaffolding.
* Store workspace root in extension context for all services to use.
* **Testing requirement:**

  * Add unit tests for helper functions that compute activation state.
  * Full activation/e2e tests will come in Phase 5.

**Notes**
Keep activation fast; heavy loading is deferred.
