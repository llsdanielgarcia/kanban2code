---
stage: plan
tags: [bug, board, ui, mvp, p1]
---

# Task 6.2: Fix Swimlane Layout

## Goal

Redesign the swimlane board view so that:
- **Rows = Stages** (Inbox, Plan, Code, Audit, Completed)
- **Columns = Projects** (Inbox column + one column per project)

This provides a matrix view showing which projects have tasks in each stage.

## Background

The current swimlane implementation is confusing:
- Column titles are empty (`title=""`)
- The layout doesn't clearly show the relationship between projects and stages
- Users can't easily see project progress at a glance

## Scope

### New Data Structure

```typescript
interface SwimlaneRow {
  stage: Stage;
  tasksByProject: Record<string, Task[]>; // key = 'inbox' | project name
}

interface BoardSwimlaneProps {
  rows: SwimlaneRow[];
  projects: string[]; // Column headers
  onMoveTask: (taskId: string, toStage: Stage, toProject?: string) => void;
  // ... other handlers
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Stage      │  Inbox   │  auth-system  │  navbar-redesign  │ ...
├─────────────┼──────────┼───────────────┼───────────────────┼────
│  Inbox      │  [task]  │               │    [task]         │
│             │  [task]  │               │                   │
├─────────────┼──────────┼───────────────┼───────────────────┼────
│  Plan       │          │    [task]     │    [task]         │
│             │          │    [task]     │                   │
├─────────────┼──────────┼───────────────┼───────────────────┼────
│  Code       │          │    [task]     │    [task]         │
│             │          │               │                   │
├─────────────┼──────────┼───────────────┼───────────────────┼────
│  Audit      │          │    [task]     │                   │
├─────────────┼──────────┼───────────────┼───────────────────┼────
│  Completed  │          │    [task]     │                   │
└─────────────┴──────────┴───────────────┴───────────────────┴────
```

### Implementation Steps

1. **Update `BoardSwimlane.tsx`**
   - Render stage rows instead of project rows
   - Add column headers for projects
   - Each cell shows tasks for that stage + project combination

2. **Update `Swimlane.tsx`**
   - Rename to `SwimlaneRow.tsx` for clarity
   - Accept `stage` and `tasksByProject` props
   - Render project columns within the row

3. **Update `Board.tsx`**
   - Transform task data into stage-row format
   - Extract unique project names for column headers
   - Pass transformed data to `BoardSwimlane`

4. **Update CSS**
   - Add column header row styles
   - Ensure horizontal scrolling for many projects
   - Stage labels should be sticky on horizontal scroll

### Drag-and-Drop Behavior

- Dragging between columns in same row = change project (keep stage)
- Dragging between rows in same column = change stage (keep project)
- Dragging between different row AND column = change both

## Files to Modify

- `src/webview/ui/components/BoardSwimlane.tsx` - Complete rewrite
- `src/webview/ui/components/Swimlane.tsx` - Rename and rewrite
- `src/webview/ui/components/Board.tsx` - Update data transformation
- `src/webview/ui/styles/main.css` - Add swimlane grid styles

## Testing

- Unit tests for data transformation (tasks → swimlane rows)
- Manual test with multiple projects
- Test drag-and-drop between cells
- Test with empty projects/stages

## Acceptance Criteria

- [ ] Stage names shown as row headers on left
- [ ] Project names shown as column headers on top
- [ ] Tasks appear in correct stage/project cell
- [ ] Horizontal scroll works for many projects
- [ ] Stage row headers stay visible during horizontal scroll
- [ ] Drag-and-drop updates stage and/or project correctly
- [ ] Empty cells show placeholder (not broken layout)
