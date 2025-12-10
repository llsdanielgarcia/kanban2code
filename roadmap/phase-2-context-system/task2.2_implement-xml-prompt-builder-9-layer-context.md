**Stage:** plan
**Tags:** mvp, context, prompts, testing

**Goal**
Assemble a complete XML prompt for a task, following the defined context order.

**Scope**

* Implement `promptBuilder.buildXMLPrompt(task, root): Promise<string>`.
* Order:

  1. `how-it-works.md`
  2. `architecture.md`
  3. `project-details.md`
  4. `_agents/{agent}.md` (if `agent`)
  5. `projects/{project}/_context.md` (if project)
  6. `projects/{project}/{phase}/_context.md` (if phase)
  7. `_templates/stages/{stage}.md`
  8. Custom contexts from `contexts:`
  9. Task body + metadata
* Wrap in `<system>`, `<context>`, `<task>` structure.
* **Testing requirement:**

  * Unit tests (Task 2.6) to verify ordering, inclusion, and correct XML wrapping.
