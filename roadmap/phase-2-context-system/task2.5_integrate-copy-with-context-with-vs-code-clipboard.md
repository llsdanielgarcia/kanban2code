**Stage:** plan
**Tags:** mvp, context, clipboard

**Goal**
Make "Copy XML (Full Context)" a one-click action that fills the clipboard.

**Scope**

* Implement `kanban2code.copyTaskContext` command:

  * Accepts task identifier + `CopyMode`.
  * Uses `copyService.buildCopyPayload`.
  * Writes result to VS Code clipboard API.
* Show a toast/notification on success.
* Handle errors gracefully.

**Notes**
Command logic should be thin; most logic is in testable services.
