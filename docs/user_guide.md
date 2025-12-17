# Kanban2Code User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Workspace Setup](#workspace-setup)
3. [Task Management Workflow](#task-management-workflow)
4. [Sidebar Interface](#sidebar-interface)
5. [Board Interface](#board-interface)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Context and Agent Systems](#context-and-agent-systems)
8. [Projects](#projects)
9. [Troubleshooting](#troubleshooting)

## Getting Started

Kanban2Code is a VS Code extension that brings Kanban board functionality directly into your editor, integrating AI agents and rich task context. It uses a file-based system where tasks are stored as markdown files with frontmatter metadata.

### Installation

1. Install the extension from the VS Code marketplace or build from source
2. Open a workspace folder in VS Code
3. The Kanban2Code sidebar will appear automatically if a `.kanban2code` folder is detected

### Quick Start

1. **Create a Kanban workspace**: Use the "Create Kanban" button in the sidebar
2. **Add your first task**: Click "New Task" or use `Ctrl+Shift+N` (Cmd+Shift+N on Mac)
3. **Open the board**: Click "View Kanban" or use `Ctrl+Shift+K` (Cmd+Shift+K on Mac)

## Workspace Setup

### Initial Setup

When you first create a Kanban workspace, Kanban2Code generates the following folder structure:

```
.kanban2code/
├── inbox/              # New/unplanned tasks
├── projects/           # Project-organized tasks
├── _agents/            # AI agent configurations
├── _context/           # Context files for AI prompts
├── _archive/           # Archived completed tasks
├── how-it-works.md     # Usage documentation
├── architecture.md     # Project architecture context
└── project-details.md  # Project details context
```

### Legacy `_templates/` folder (migration)

Older Kanban2Code workspaces may include `.kanban2code/_templates/` (task/stage/context templates). Newer versions no longer create or use this folder; it is safe to keep for reference or delete.

What you might see:
- `.kanban2code/_templates/tasks/*.md`: legacy task templates (e.g. bug report, feature, spike)
- `.kanban2code/_templates/stages/*`: legacy stage templates (may be empty)
- `.kanban2code/_templates/context/*.md`: legacy context templates (e.g. phase context, audit phase)

Migration guidance:
1. If you never customized these templates: delete `.kanban2code/_templates/` or move it under `.kanban2code/_archive/` to reduce clutter.
2. If you customized task templates: copy the relevant sections into new tasks created under `.kanban2code/inbox/` or `.kanban2code/projects/<project>/...` (the extension only scans tasks in those locations).
3. If you customized stage/context templates: move the guidance into either:
   - `.kanban2code/_context/*.md` (shared prompt context), and/or
   - `.kanban2code/_agents/*.md` (agent-specific instructions).

### Creating Your First Workspace

1. Open VS Code with a workspace folder
2. Click the Kanban2Code icon in the activity bar
3. Click "Create Kanban" in the sidebar
4. The workspace will be scaffolded automatically

## Task Management Workflow

### Task Stages

Tasks progress through five stages:

1. **Inbox** - New/unplanned tasks
2. **Plan** - Tasks being planned and designed
3. **Code** - Active development
4. **Audit** - Code review and testing
5. **Completed** - Done (can be archived)

### Task Structure

Each task is a markdown file with frontmatter:

```yaml
---
stage: code
project: my-project
phase: implementation
agent: frontend-dev
tags: [feature, ui, mvp]
contexts: [component-guide, api-docs]
created: 2024-01-15T10:30:00.000Z
---

# Task Title

Task description and implementation notes...
```

### Moving Tasks Between Stages

- **Drag and drop**: Drag tasks between columns in the board view
- **Context menu**: Right-click and select "Change Stage"
- **Keyboard shortcuts**: Use keys 1-5 to move focused task to specific stages
- **Stage transitions are validated** to prevent invalid moves

## Sidebar Interface

The sidebar provides comprehensive task management capabilities:

### Navigation

- **Task Tree**: Hierarchical view organized by Inbox and Projects/Phases
- **Quick Views**: Preset filters (Today's Focus, Development, Bugs, Ideas)
- **Stage Filters**: Toggle visibility by stage
- **Project/Tag Filters**: Filter by specific projects or tags

### Actions

- **New Task**: Create tasks with location, stage, tags, and agent assignment
- **New Project**: Create project folders with context files
- **New Context**: Create context files for AI prompts
- **New Agent**: Create AI agent configurations

### Task Operations

- **Click**: Select and focus a task
- **Double-click**: Open task in editor
- **Right-click**: Open context menu with additional actions
- **Drag and drop**: Move tasks between locations

## Board Interface

The board provides a visual Kanban interface with two layout options:

### Column Layout

- Five columns representing stages (Inbox → Plan → Code → Audit → Completed)
- Tasks displayed as cards within each column
- Drag and drop between stages

### Swimlane Layout

- Rows represent stages, columns represent projects
- Matrix view of project progress across stages
- Sticky stage labels during horizontal scroll

### Task Cards

Each task card displays:
- **Title**: Task name with completion styling
- **Breadcrumb**: Project/Phase location
- **Tags**: Up to 4 task tags
- **Agent**: Assigned AI agent
- **Actions**: Edit, delete, copy XML, more options

### Board Features

- **Search**: Real-time filtering of tasks
- **Layout Toggle**: Switch between column and swimlane views
- **Context Menu**: Right-click actions for tasks
- **Keyboard Navigation**: Full keyboard accessibility

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+N` / `Cmd+Shift+N` | New Task |
| `Ctrl+Shift+K` / `Cmd+Shift+K` | Open Board |
| `Ctrl+Shift+C` / `Cmd+Shift+C` | Copy Task Context (Full XML) |
| `Ctrl+L` / `Cmd+L` | Toggle Board Layout |

### In-Application Shortcuts

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate between tasks |
| `←` / `→` | Collapse/Expand tree nodes |
| `Enter` | Open focused task |
| `Space` | Toggle expand/collapse |
| `n` | New task (quick) |
| `Shift+N` | New task (modal) |
| `f` | Focus filter bar |
| `1-5` | Move focused task to stage (1=Plan, 2=Code, 3=Audit, 4=Completed, 5=Inbox) |
| `c` | Copy task only |
| `a` | Archive focused task |
| `Delete` / `Backspace` | Delete focused task |
| `?` | Show keyboard shortcuts |
| `Shift+F10` | Open context menu |
| `Escape` | Close modal/menu |

## Context and Agent Systems

### Context Files

Context files provide additional information for AI agents:

- **Global Context**: `how-it-works.md`, `architecture.md`, `project-details.md`
- **Project Context**: `projects/{project}/_context.md`
- **Phase Context**: `projects/{project}/{phase}/_context.md`
- **Custom Context**: Files in `_context/` folder

### AI Agents

Agents define AI personalities and capabilities:

- Create agents in `_agents/` folder
- Each agent has role description and guidelines
- Assign agents to tasks for specialized AI assistance
- Agents are used when copying task context for AI prompts

### Copy Context Modes

Three modes for copying task information:

1. **Full XML**: Complete 9-layer context with task, project, and system information
2. **Task Only**: Just the task content and metadata
3. **Context Only**: System and context files without task content

## Projects

Organize tasks by project:

- Each project has its own folder under `projects/`
- Optional phase subfolders for organization
- Project-specific context in `_context.md`
- Tasks inherit project and phase from folder structure

## Troubleshooting

### Common Issues

**Extension not activating**
- Ensure you have a workspace folder open
- Check that `.kanban2code` folder exists
- Try reloading VS Code

**Tasks not appearing**
- Verify task files have valid frontmatter
- Check that `stage` field is present and valid
- Look for parsing errors in VS Code output panel

**Drag and drop not working**
- Ensure you're in the board view
- Check that tasks have valid IDs
- Try refreshing the board

**Context copying fails**
- Verify context files exist
- Check file permissions
- Ensure agent files are valid markdown

### Getting Help

1. **Keyboard Shortcuts**: Press `?` to see available shortcuts
2. **Output Panel**: Check "Kanban2Code" output channel for error messages
3. **File Structure**: Verify `.kanban2code` folder structure is correct
4. **Task Validation**: Ensure task files have proper frontmatter format

### Resetting Workspace

If you encounter persistent issues:

1. Close VS Code
2. Backup your `.kanban2code` folder if needed
3. Delete the `.kanban2code` folder
4. Reopen VS Code and create a new workspace
5. Restore any custom files from backup

### Performance Tips

- **Large Projects**: Use filters to limit visible tasks
- **File Watching**: The extension watches for file changes automatically
- **Memory Usage**: Archive completed tasks to improve performance
- **Search**: Use the board search for quick task finding

---

For more detailed technical information, see the [architecture documentation](architecture.md).
