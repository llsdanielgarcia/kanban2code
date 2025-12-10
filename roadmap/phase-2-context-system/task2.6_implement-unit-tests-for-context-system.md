**Stage:** plan
**Tags:** mvp, testing, context

**Goal**
Ensure all context-related modules are thoroughly unit tested.

**Scope**

* Create `tests/context-service.test.ts`:

  * Global, agent, project, phase, and custom context loaders.
  * Missing file behavior.
* Create `tests/prompt-builder.test.ts`:

  * Correct 9-layer ordering.
  * Handling of different stage/agent/project/phase combinations.
* Create `tests/copy-service.test.ts`:

  * Output for `full_xml`, `task_only`, `context_only`.
  * Error handling or fallback behavior.
