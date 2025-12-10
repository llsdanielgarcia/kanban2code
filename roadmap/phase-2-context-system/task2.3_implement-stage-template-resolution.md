**Stage:** plan
**Tags:** mvp, context, templates, testing

**Goal**
Load the correct stage template for a task's current stage.

**Scope**

* Implement `loadStageTemplate(root, stage)`:

  * Resolve `_templates/stages/{stage}.md`.
  * Read file or return minimal fallback if missing.
* Integrate into the XML prompt builder.
* **Testing requirement:**

  * Unit tests (Task 2.6) verifying correct file resolution and fallback behavior.
