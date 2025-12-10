**Stage:** plan
**Tags:** mvp, context, clipboard, testing

**Goal**
Support multiple copy modes while making "full XML context" the default.

**Scope**

* Define `CopyMode` in `types/copy.ts`:

  * `'full_xml' | 'task_only' | 'context_only'`.
* Implement `copyService.buildCopyPayload(task, mode)`:

  * `full_xml` → 9-layer XML prompt.
  * `task_only` → task metadata + body.
  * `context_only` → system + context sections without task content.
* **Testing requirement:**

  * Unit tests (Task 2.6) for each mode and edge cases.
