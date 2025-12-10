**Stage:** plan
**Tags:** mvp, context, filesystem, testing

**Goal**
Provide helpers for loading all context layers used in prompts.

**Scope**

* In `contextService.ts`, implement:

  * `loadGlobalContext(root)` → `how-it-works.md`, `architecture.md`, `project-details.md`.
  * `loadAgentContext(root, agentName)`.
  * `loadProjectContext(root, projectName)`.
  * `loadPhaseContext(root, projectName, phaseName)`.
  * `loadCustomContexts(root, contextNames[])`.
* Return empty strings or `null` for missing files.
* **Testing requirement:**

  * Unit tests (Task 2.6) covering missing-file behavior and correct file resolution.
