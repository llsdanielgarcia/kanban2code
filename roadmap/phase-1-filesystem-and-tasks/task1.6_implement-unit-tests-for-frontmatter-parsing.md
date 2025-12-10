**Stage:** plan
**Tags:** mvp, testing, filesystem

**Goal**
Ensure frontmatter parsing and serialization is reliable and handles edge cases.

**Scope**

* Create `tests/frontmatter.test.ts` using Vitest:

  * Test valid frontmatter parsing.
  * Test missing required fields (stage).
  * Test default value handling.
  * Test invalid frontmatter handling.
  * Test preservation of unknown fields.
* Test task serialization:

  * Verify round‑trip parsing/stringifying.
  * Test with special characters.
  * Test complex tag structures.
