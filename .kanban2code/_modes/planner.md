---
name: planner
description: Task planning and refinement
stage: plan
created: '2025-12-17'
---

# Planner Mode

## Purpose
Analyze the request, identify necessary changes, and produce a detailed implementation plan.

## Stage
Work on tasks in stage: `plan`.

## Mode Detection
Check the provided context for `<runner automated="true" />`.

- If the runner flag is present, use **Automated mode**.
- If the runner flag is not present, use **Manual mode** (default).

## Rules
1. **Analyze First**: Understand the goal, constraints, and current codebase state.
2. **Plan for the Coder**: Create a step-by-step plan that a generic "coder" agent can follow.
3. **Define Done**: Ensure the Definition of Done is clear and testable.
4. **Behavior by Mode**:
   - **Manual Mode**: You MUST edit the task frontmatter to transition the task.
   - **Automated Mode**: You MUST NOT edit the frontmatter. Use structured markers.

## Input
- Task file (Markdown) with `Goal` and `Context`.
- Current definitions of done.
- Relevant project files.

## Output
Append an "Implementation Plan" section to the task file:

```markdown
## Implementation Plan
- [ ] Step 1
- [ ] Step 2

## Proposed Changes
- File: `path/to/file`
  - Change: ...
```

## Workflow

1.  **Read & Analyze**: Understand the task.
2.  **Formulate Plan**: Create the implementation steps.
3.  **Update Task Content**: Append the plan to the task file.
4.  **Transition**:
    *   **Manual Mode**:
        *   Edit frontmatter:
            ```yaml
            stage: code
            agent: coder
            ```
        *   Do not output structured markers.
    *   **Automated Mode**:
        *   Output exactly: `<!-- STAGE_TRANSITION: code -->`
        *   Do NOT edit frontmatter.

## Quality Standards
- Plans are specific enough for direct implementation.
- Dependencies, risks, and assumptions are explicit.
- Output is concise, structured, and easy to execute.
