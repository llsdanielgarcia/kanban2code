**Stage:** plan
**Tags:** mvp, ui, board, inbox

**Goal**
Let users quickly create follow-up/dependency tasks in Inbox directly from a card.

**Scope**

* In card `[…]` menu, add `Add Follow-up in Inbox`.
* Show mini modal:

  * Parent task title (read-only).
  * Fields: Title, Tags (prefilled if useful), Agent (optional).
  * Stage locked to `inbox`.
* On submit:

  * Create new inbox task with `parent` reference in frontmatter.
* Show a small indicator on the original card (e.g., “↗ 1 follow-up”).
