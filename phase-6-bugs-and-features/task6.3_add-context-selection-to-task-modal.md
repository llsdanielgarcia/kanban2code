---
stage: plan
tags: [feature, ui, context, mvp, p1]
---

# Task 6.3: Add Context Selection to Task Modal

## Goal

Add a multi-select context file picker to the Task Modal, allowing users to select which context files should be included when generating XML context for a task.

## Background

The original design (`docs/design/forms/task.html`) includes a "Context Files" section with checkboxes for selecting multiple context files. This feature was not implemented in Phase 3/4. Context files provide important information to AI agents about the codebase, project structure, and specific features.

## Design Reference

From `docs/design/forms/task.html`:
```html
<div class="section-header">Context Files</div>
<div class="form-group">
  <label class="form-label">Select Context Files</label>
  <div class="context-list">
    <label class="context-item">
      <input type="checkbox" value="architecture">
      <div class="context-item-content">
        <div class="context-item-name">architecture.md</div>
        <div class="context-item-description">File tree, tech stack, project structure</div>
      </div>
    </label>
    <!-- more items -->
  </div>
  <span class="form-hint">
    <a href="#">Create new context file</a>
  </span>
</div>
```

## Scope

### Host-Side Changes

1. **Add context discovery service**
   - Scan `.kanban2code/` for context files
   - Load context metadata (name, description from frontmatter)
   - Return list of available contexts with their paths

2. **Add `RequestContexts` message type**
   - Webview requests available context files
   - Host responds with `ContextsLoaded` message

3. **Update task creation handler**
   - Accept `contexts: string[]` in CreateTask payload
   - Write contexts to task frontmatter

### Webview Changes

1. **Create `ContextPicker.tsx` component**
   ```typescript
   interface ContextFile {
     id: string;
     name: string;
     description: string;
     path: string;
   }

   interface ContextPickerProps {
     contexts: ContextFile[];
     selected: string[];
     onChange: (selected: string[]) => void;
     onCreateNew: () => void;
   }
   ```

2. **Update `TaskModal.tsx`**
   - Add `contexts: string[]` to form state
   - Request contexts on modal open
   - Render `ContextPicker` between Template and Tags sections
   - Include "Create new context" link that opens ContextModal (Task 6.4)

3. **Add context list styling**
   - Scrollable list with max-height
   - Checkbox items with name and description
   - Selected state styling

### Task Frontmatter Update

```yaml
---
stage: code
tags: [feature, mvp]
contexts:
  - architecture
  - phase-1-context
  - design-system
---
```

## Files to Create/Modify

- `src/services/context.ts` - Add `listAvailableContexts(root)`
- `src/webview/messaging.ts` - Add `RequestContexts`, `ContextsLoaded`
- `src/webview/ui/components/ContextPicker.tsx` - New component
- `src/webview/ui/components/TaskModal.tsx` - Add context section
- `src/webview/SidebarProvider.ts` - Handle RequestContexts
- `src/webview/KanbanPanel.ts` - Handle RequestContexts
- `src/webview/ui/styles/main.css` - Context picker styles

## Testing

- Unit test for context discovery service
- Unit test for context picker component
- Manual test: create task with multiple contexts selected
- Verify contexts saved to task frontmatter

## Acceptance Criteria

- [ ] Task modal shows "Context Files" section
- [ ] Available contexts loaded from `.kanban2code/` directory
- [ ] Multi-select checkboxes for context selection
- [ ] Context name and description displayed
- [ ] "Create new context" link visible (wired in Task 6.4)
- [ ] Selected contexts saved to task frontmatter as `contexts:` array
- [ ] Context selection persists when editing existing tasks
