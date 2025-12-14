# Kanban2Code

A VS Code extension for AI-assisted task management using a file-based kanban system.

## Quick Start

```bash
bun install
bun run compile
```

Press `F5` in VS Code to launch the Extension Host, then run `Kanban2Code: Scaffold Workspace` in the Command Palette to create `.kanban2code/`.

## Configuration (`.kanban2code/config.json`)

Kanban2Code loads optional configuration from `.kanban2code/config.json` and falls back to defaults if the file is missing or invalid.

- Config reference: `docs/config-schema.md`
- Example config: `examples/config.example.json`

Common customizations:
- Default agent: `preferences.defaultAgent`
- Tag categories: `tags.categories.*`
- Stage ordering/transitions: `stages.*`

## Templates

Templates live under `.kanban2code/_templates/`:

- Task templates: `.kanban2code/_templates/tasks/*.md`
- Stage templates: `.kanban2code/_templates/stages/*.md`

Task templates are markdown with optional YAML frontmatter (`name`, `description`, optional `default_stage`, optional `default_tags`). Stage templates are injected into AI prompts during context-copy.

## Context Workflow (for AI prompting)

Kanban2Code builds a structured prompt from layered context sources:

- Global: `.kanban2code/how-it-works.md`, `.kanban2code/architecture.md`, `.kanban2code/project-details.md`
- Agent: `.kanban2code/_agents/<agent>.md`
- Project/phase: `.kanban2code/projects/<project>/_context.md`, `.kanban2code/projects/<project>/<phase>/_context.md`
- Stage template: `.kanban2code/_templates/stages/<stage>.md`
- Custom contexts: `.kanban2code/_context/*.md` referenced by task `contexts: [...]`

Copy commands:
- `Kanban2Code: Copy Task Context (Full XML)`
- `Kanban2Code: Copy Task Only`
- `Kanban2Code: Copy Context Only`

## Features

### Sidebar

The Kanban2Code sidebar provides quick access to your tasks:

- **Task Tree**: View tasks organized by Inbox and Project/Phase hierarchy
- **Quick Views**: Preset filters for Today's Focus, Development, Bugs, and Ideas
- **Stage Filters**: Toggle visibility by stage (Inbox, Plan, Code, Audit)
- **Project/Tag Filters**: Filter tasks by project or tags
- **Task Creation**: Create new tasks via modal with location, stage, tags, and template selection
- **Context Menu**: Right-click tasks for copy, stage change, move, archive, or delete actions
- **Move Modal**: Relocate tasks between Inbox and Project/Phase locations

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between tasks |
| `←` / `→` | Collapse / Expand tree nodes |
| `Enter` | Open focused task |
| `Space` | Toggle expand/collapse |
| `n` | New task (quick) |
| `Shift+N` | New task (modal) |
| `f` | Focus filter bar |
| `?` | Show keyboard shortcuts |
| `Shift+F10` | Open context menu |
| `Escape` | Close modal/menu |

### Task Stages

Tasks move through these stages:
1. **Inbox** - New/unplanned tasks
2. **Plan** - Tasks being planned
3. **Code** - Active development
4. **Audit** - Code review/testing
5. **Completed** - Done (can be archived)

### Context Menu Actions

Right-click a task to:
- Copy XML (Full Context) - Copy task with all context for AI
- Copy Task Only - Copy just the task content
- Copy Context Only - Copy related context files
- Change Stage - Move to a different stage
- Move to Project/Phase - Relocate the task file
- Archive - Move completed tasks to archive
- Delete - Remove the task

## Development

```bash
bun run compile      # Build extension + webview
bun run watch        # Watch mode
bun run test         # Unit tests
bun run test:e2e     # E2E tests (filesystem workflows)
bun run typecheck    # TypeScript type checking
bun run lint         # ESLint
```

## Example Project

An example workspace is included at `examples/sample-project/` (including `.kanban2code/config.json`, sample contexts, and sample tasks).

## Project Structure

```
.kanban2code/
├── inbox/              # Inbox tasks
├── projects/           # Project folders with phases
├── _agents/            # AI agent configurations
├── _templates/
│   ├── tasks/          # Task templates
│   └── stages/         # Stage-specific templates
├── _archive/           # Archived tasks
├── architecture.md     # Project architecture context
├── project-details.md  # Project details context
└── how-it-works.md     # Usage documentation
```
