**Stage:** plan
**Tags:** mvp, infra, validation, testing

**Goal**
Reuse the Phase 0 workspace detection while adding Phase 1-specific outputs (status codes and guardrails).

**Scope**

* Reuse core detection from Task 0.5.
* Extend API to return explicit status enums:

  * `valid | missing | invalid | forbidden`.
* Provide helper guards for filesystem services to block writes outside the kanban root.
* Emit consistent error strings for UI surfaces.
* **Testing requirement:**

  * Unit tests verifying each status is returned in the correct scenarios.
