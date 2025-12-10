**Stage:** plan
**Tags:** mvp, testing, ci, infrastructure

**Goal**
Upgrade the testing setup into a full, CI-backed test infrastructure.

**Scope**

* Refine Vitest configuration:

  * Coverage thresholds.
  * Watch mode for dev.
* Configure @vscode/test-electron for extension + e2e tests.
* Add GitHub Actions (or similar) CI pipeline:

  * Run unit tests.
  * Run integration tests.
  * Run extension/e2e tests on suitable matrix.
* Ensure `bun test` is the single entry point for local tests; CI calls it (or variants).
