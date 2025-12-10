**Stage:** plan
**Tags:** mvp, infra, extension, foundation

**Goal**
Set up a minimal but scalable VS Code extension project that can host the Kanban2Code sidebar and board webview.

**Scope**

* Initialize a new VS Code extension in TypeScript.
* Configure bundler/build pipeline (esbuild) using Bun.
* Register core commands:

  * `kanban2code.openBoard`
  * `kanban2code.newTask`
  * `kanban2code.scaffoldWorkspace`
* Create a basic webview panel that can render a simple React app.
* Set up project structure:

  * `src/commands`
  * `src/services`
  * `src/webview`
* **Testing requirement:**

  * Ensure extension entry and commands are written in a testable, modular way.
  * Add at least one small unit test for a pure helper used by the extension (no VS Code API mocking yet).

**Notes**
Keep the scaffold minimal but clean; focus on modular design to make unit testing easy later.
