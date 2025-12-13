---
stage: completed
tags: [bug, board, mvp, p0]
---

# Task 6.0: Fix Delete Button in Board View

## Goal

Fix the non-functional delete button on TaskCard components in the Board webview so tasks can be deleted directly from the Kanban board.

## Background

The delete button appears on task cards but clicking it does not delete the task. The `onDelete` callback is passed through the component hierarchy but the message is not being sent to or handled by the host extension properly.

## Scope

### Investigation
1. Trace the delete flow from `TaskCard.tsx` through `Board.tsx` to the host messaging
2. Verify the `DeleteTask` message type is defined in `messaging.ts`
3. Check the host-side handler in `KanbanPanel.ts` or command handlers

### Implementation
1. Ensure `DeleteTask` message is sent with correct payload `{ taskId: string }`
2. Add/fix host-side handler to:
   - Read the task file path from task ID
   - Show confirmation dialog (if not already shown in webview)
   - Delete the file using VS Code's `workspace.fs.delete()`
   - Broadcast task deletion to all webviews
3. Update webview state after deletion confirmation

### Testing
- Unit test for delete message validation
- Manual test: delete task from board, verify file removed
- Verify sidebar also reflects the deletion

## Files to Modify

- `src/webview/ui/components/Board.tsx` - Verify onDeleteTask handler
- `src/webview/ui/components/TaskCard.tsx` - Verify delete click handler
- `src/webview/KanbanPanel.ts` - Add/fix DeleteTask message handler
- `src/webview/messaging.ts` - Verify DeleteTask type exists

## Acceptance Criteria

- [x] Clicking delete button on a task card shows confirmation
- [x] Confirming deletion removes the task file from filesystem
- [x] Board updates to show task removed
- [x] Sidebar (if open) also reflects deletion
- [ ] Undo not required for MVP but nice-to-have
