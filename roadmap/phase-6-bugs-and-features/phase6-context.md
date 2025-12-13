# Phase 6 Context: Bug Fixes and Feature Completion

## Overview

Phase 6 addresses critical bugs and missing features identified during testing. This phase focuses on making Kanban2Code fully functional by implementing the remaining design specifications, fixing broken functionality, and establishing a consistent visual identity.

## Key Issues Identified

### Bugs
1. **Delete button not working in Board view** - The delete action handler is wired in TaskCard but not properly connected to the host messaging system
2. **Swimlanes layout confusion** - Current implementation shows empty column titles and unclear organization

### Missing Features
1. **Context file selection** - Task modal lacks the multi-select context file picker from the original design
2. **Context creation modal** - No way to create new context files from the UI
3. **Agent selection/creation** - Task modal missing agent dropdown and agent creation modal
4. **Template creation/editing** - No modal to create or edit task templates
5. **In-place task editing** - Tasks must be opened in editor; no embedded editing capability

### Visual Issues
1. **Theme-dependent colors** - Colors change with VS Code theme, causing inconsistency

## Design References

- **Task Modal Design**: `docs/design/forms/task.html`
- **Context Modal Design**: `docs/design/forms/context.html`
- **Agent Modal Design**: `docs/design/forms/agent.html`
- **Swimlane Layout Design**: `docs/design/board-swimlane.html`
- **Color Palette**: `docs/design/styles/variables.css` (Navy Night Gradient)

## Swimlane Specification (Updated)

Per user feedback, swimlanes should be implemented as:
- **Rows = Stages** (Inbox, Plan, Code, Audit, Completed)
- **Columns = Projects** (Inbox, project-1, project-2, etc.)

This differs from the original HTML design but provides better visibility into project distribution across stages.

## Color Palette (Fixed)

The extension will use a fixed "Navy Night Gradient" color palette regardless of VS Code theme:

```css
/* Core colors */
--vscode-editor-background: linear-gradient(180deg, #0d111c 0%, #101524 45%, #121829 100%);
--vscode-editor-foreground: #f8fafc;
--vscode-sideBar-background: #0c101b;
--vscode-panel-background: #161b2b;
--vscode-panel-border: #2a3147;

/* Interactive elements */
--vscode-button-background: #3b82f6;
--vscode-focusBorder: #3b82f6;

/* Stage colors */
--stage-inbox: #3b82f6;
--stage-plan: #5d6b85;
--stage-code: #22c55e;
--stage-audit: #facc15;
--stage-completed: #5d6b85;

/* Tag colors */
--tag-bug: #ef4444;
--tag-feature: #3b82f6;
--tag-mvp: #60a5fa;
--tag-urgent: #facc15;
--tag-idea: #22c55e;
--tag-spike: #ef4444;
```

## Dependencies

- Monaco Editor package (`@monaco-editor/react` or `monaco-editor`)
- Existing messaging system for host-webview communication
- Context service for loading available context files
- Template service for loading available templates
