# How Kanban2Code Works

Kanban2Code is a filesystem-native Kanban workflow for AI-assisted delivery.

## Folder Structure
- **inbox/**: New tasks start here.
- **projects/**: Organize tasks by project.
- **_agents/**: Behavioral role instructions (planner/coder/auditor/etc.).
- **_providers/**: LLM provider CLI configs (runtime + model settings).
- **_context/**: Shared context files used in prompt assembly.
- **_archive/**: Completed tasks go here.

## Workflow
1. Create a task in the sidebar.
2. Move it through stages: `inbox -> plan -> code -> audit -> completed`.
3. Use an **agent** to define behavior and a **provider** to define which model/CLI runs it.
4. In manual flow, agent instructions can update task frontmatter directly.
5. In automated runner flow, agent instructions output structured markers and the runner updates state.

## Agent/Provider Split
- **Agent** (`agent` field): how the AI should behave (planner/coder/auditor).
- **Provider** (`provider` field): which CLI/model configuration executes the prompt.

## Automated Runner
The runner can execute one task, a stage column, or a night shift batch:
- Builds prompt context with `<runner automated="true" />`
- Invokes the selected provider CLI adapter
- Parses structured output markers
- Applies stage transitions and attempt tracking automatically

Structured markers:
- `<!-- STAGE_TRANSITION: code|audit|completed -->`
- `<!-- FILES_CHANGED: file1.ts, file2.ts -->`
- `<!-- AUDIT_RATING: N -->`
- `<!-- AUDIT_VERDICT: ACCEPTED|NEEDS_WORK -->`
