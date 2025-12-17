---
stage: completed
tags:
  - docs
  - p2
agent: auditor
contexts: []
---

# Update AI Guide with Orchestration Protocol

## Goal
Document the orchestration workflow and handoff protocols in the AI guide.

## Definition of Done
- [x] `ai-guide.md` - Orchestration section added
- [x] Handoff protocol documented (how each agent spawns next)
- [x] Tag transition rules documented
- [x] Examples of full pipeline provided

## Context
This task updates the AI guide to include comprehensive documentation of the new orchestration workflow, including how agents hand off work to each other and how tags track the pipeline state.

## Audit

.kanban2code/_context/ai-guide.md

---

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
The orchestration workflow and handoff protocols have been comprehensively documented in the AI guide. The implementation provides clear guidance on agent specialization, workflow stages, handoff protocols, and tag transitions with practical examples.

### Findings

#### Blockers (must fix)
(none)

#### High Priority
(none)

#### Medium Priority
- [ ] Consider adding a visual diagram of the orchestration workflow to aid understanding - `.kanban2code/_context/ai-guide.md:174`

#### Low Priority / Nits
- [ ] Could add more examples of actual agent instruction files to show the specialization in practice - `.kanban2code/_context/ai-guide.md:156`
- [ ] The handoff protocol examples could include more context about error handling - `.kanban2code/_context/ai-guide.md:206`

### Test Assessment
- Coverage: Not applicable for documentation task
- Missing tests: N/A

### What's Good
- Comprehensive documentation of the orchestration workflow with clear separation between meta-tasks and execution tasks
- Detailed handoff protocol showing exactly how agents create and link tasks
- Well-defined tag transition rules that track pipeline state
- Excellent end-to-end example that demonstrates the full pipeline
- Clear formatting and structure that makes the complex workflow easy to follow

### Recommendations
- Consider adding a troubleshooting section for common orchestration issues
- The documentation is excellent and ready for production use
