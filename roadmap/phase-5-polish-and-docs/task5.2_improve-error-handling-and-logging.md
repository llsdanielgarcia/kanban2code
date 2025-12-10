**Stage:** plan
**Tags:** mvp, polish, robustness

**Goal**
Make Kanban2Code resilient and transparent when things go wrong.

**Scope**

* Wrap filesystem operations with try/catch and user-facing messages.
* Write debug logs to a dedicated VS Code output channel.
* Ensure a single failing task does not break the whole UI.
