**Stage:** plan
**Tags:** mvp, filesystem, frontmatter, tasks, testing

**Goal**
Parse markdown task files into `Task` objects and write them back without losing metadata.

**Scope**

* Create `frontmatter.ts` using `gray-matter`:

  * `parseTaskFile(filePath): Promise<Task>`
  * `stringifyTaskFile(task, originalBody): string`
* Rules:

  * `stage` is required; default to `inbox` if missing.
  * `project` and `phase` are inferred from path (not trusted from frontmatter).
  * `tags` is an array of strings.
  * Unknown frontmatter fields are preserved.
* Handle invalid frontmatter gracefully with warnings, not crashes.
* **Testing requirement:**

  * Covered by unit tests in Task 1.6 (frontmatter tests).
  * Design API to be pure/testable (no VS Code APIs).
