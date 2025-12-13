---
stage: plan
tags: [feature, ui, editor, mvp, p2]
---

# Task 6.7: Implement Monaco Editor for Task Editing

## Goal

Replace the need to open task files externally by embedding Monaco Editor in a modal. Users can view and edit task content directly from the Kanban board or sidebar without leaving the extension UI.

## Background

Currently, clicking a task opens the markdown file in VS Code's editor tab. While this works, it breaks the flow of working in the Kanban view. An embedded editor allows users to:
- Quickly edit task details
- Stay focused on the board/sidebar
- See immediate updates without file switching

## Technology Choice: Monaco Editor

Monaco is VS Code's editor component, providing:
- Syntax highlighting for markdown
- Familiar editing experience
- Frontmatter YAML highlighting
- Line numbers, find/replace
- Available via `@monaco-editor/react`

## Scope

### TaskEditorModal Component

```typescript
interface TaskEditorModalProps {
  isOpen: boolean;
  task: Task;
  onClose: () => void;
  onSave: (content: string) => void;
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Edit Task: Fix auth token refresh                    [X]       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1  ---                                                   │    │
│  │ 2  stage: code                                          │    │
│  │ 3  tags: [bug, urgent]                                  │    │
│  │ 4  agent: ncoder                                        │    │
│  │ 5  ---                                                   │    │
│  │ 6                                                        │    │
│  │ 7  ## Problem                                           │    │
│  │ 8  Auth tokens expire but don't refresh automatically   │    │
│  │ 9                                                        │    │
│  │ 10 ## Investigation                                      │    │
│  │ 11 - Token refresh endpoint exists                       │    │
│  │ 12 - Middleware not calling it                           │    │
│  │    ...                                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  [Esc] Cancel     [Ctrl+S] Save            [Save] [Cancel]      │
└─────────────────────────────────────────────────────────────────┘
```

### Features

1. **Monaco Editor Configuration**
   - Language: markdown
   - Theme: match extension palette (custom theme)
   - Minimap: disabled (space-saving)
   - Line numbers: enabled
   - Word wrap: enabled
   - Font: monospace

2. **Custom Monaco Theme**
   - Match Navy Night Gradient palette
   - YAML frontmatter highlighting
   - Markdown syntax colors

3. **Keyboard Shortcuts**
   - `Ctrl+S` / `Cmd+S`: Save and close
   - `Escape`: Cancel (with unsaved changes warning)
   - Standard Monaco shortcuts (Ctrl+Z, Ctrl+F, etc.)

4. **Dirty State Tracking**
   - Track if content changed from original
   - Warn on close with unsaved changes
   - "Unsaved changes" indicator in footer

### Integration Points

1. **TaskCard Actions**
   - Replace "Open File" with "Edit Task"
   - Or add "Edit" as separate action

2. **TaskContextMenu**
   - Add "Edit Task" option
   - Remove "Open Task File" (or keep both)

3. **Sidebar TaskItem**
   - Double-click opens editor modal
   - Context menu "Edit" option

### Host-Side Handler

```typescript
// SaveTaskContent message
{
  type: 'SaveTaskContent',
  payload: {
    taskId: string;
    content: string; // Full file content including frontmatter
  }
}
```

Handler:
1. Validate frontmatter structure
2. Write content to task file
3. Re-parse task metadata
4. Broadcast `TaskUpdated` to all webviews

### Dependencies

```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0"
  }
}
```

### Bundle Size Considerations

Monaco is large (~2MB). Options:
1. **Lazy load**: Load Monaco only when editor modal opens
2. **CDN**: Load Monaco from CDN instead of bundling
3. **Accept the size**: For a VS Code extension, users expect rich editing

Recommendation: Lazy load with dynamic import.

## Files to Create/Modify

- `src/webview/ui/components/TaskEditorModal.tsx` - New modal with Monaco
- `src/webview/ui/components/monaco-theme.ts` - Custom editor theme
- `src/webview/ui/components/TaskCard.tsx` - Update action buttons
- `src/webview/ui/components/TaskContextMenu.tsx` - Add edit option
- `src/webview/ui/components/TaskItem.tsx` - Add edit option
- `src/webview/messaging.ts` - Add SaveTaskContent type
- `src/webview/SidebarProvider.ts` - Handle save message
- `src/webview/KanbanPanel.ts` - Handle save message
- `package.json` - Add Monaco dependency
- `build.ts` - Configure Monaco bundling

## Testing

- Unit test for content save handler
- Manual test: edit task from board
- Manual test: edit task from sidebar
- Test unsaved changes warning
- Test Ctrl+S save shortcut
- Visual test: Monaco theme matches palette

## Acceptance Criteria

- [ ] Monaco Editor package installed and bundled
- [ ] TaskEditorModal renders Monaco editor
- [ ] Task content loaded into editor
- [ ] Frontmatter displayed with YAML highlighting
- [ ] Markdown body displayed with syntax highlighting
- [ ] Custom theme matches Navy Night palette
- [ ] Ctrl+S saves and closes
- [ ] Escape closes (with warning if dirty)
- [ ] Unsaved changes indicator visible
- [ ] Save updates task file on disk
- [ ] Task list/board updates after save
- [ ] "Edit" action available on TaskCard
- [ ] "Edit" option in context menus
