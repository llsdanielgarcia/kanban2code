**Stage:** plan
**Tags:** mvp, infra, foundation, testing

**Goal**
Create the foundational project structure using Bun and set up the initial test harness.

**Scope**

* Run `bun init` to create `package.json`.
* Configure TypeScript (`tsconfig.json`).
* Set up esbuild for bundling.
* Create `.gitignore` (node_modules, dist, .vscode-test).
* Set up ESLint + Prettier.
* Create initial folder structure:

  * `src/`
  * `tests/`
  * `webview/`
* **Testing:**

  * Add Vitest as a dev dependency.
  * Configure a minimal Vitest setup.
  * Add `bun test` script.
  * Add a trivial sample test (`tests/smoke.test.ts`) to prove the pipeline.

**Notes**
This is the prerequisite for all other Phase 0 tasks, including any later tests.
