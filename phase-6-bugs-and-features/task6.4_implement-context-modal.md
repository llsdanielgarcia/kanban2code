---
stage: plan
tags: [feature, ui, context, mvp, p1]
---

# Task 6.4: Implement Context Creation Modal

## Goal

Implement a modal for creating new context files, following the design in `docs/design/forms/context.html`. This allows users to add context files that provide codebase information to AI agents.

## Design Reference

From `docs/design/forms/context.html`:
- **Context Name** (required) - Filename will be `{name}.md`
- **Scope** - Global (all projects) or Project-specific
- **Description** (required) - Brief description of what this context covers
- **File References** - List of files to reference (with add/remove)
- **Content** - Markdown content for the context
- **Metadata Preview** - Shows generated frontmatter

## Scope

### ContextModal Component

```typescript
interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (contextPath: string) => void;
  defaultScope?: 'global' | 'project';
  defaultProject?: string;
}

interface ContextFormData {
  name: string;
  scope: 'global' | 'project';
  project?: string;
  description: string;
  fileReferences: Array<{ path: string; note?: string }>;
  content: string;
}
```

### UI Sections

1. **Basic Information**
   - Name input (generates filename)
   - Scope dropdown (Global / Project-specific)
   - Project dropdown (when scope = project)
   - Description textarea

2. **File References**
   - List of referenced files
   - Each item shows: file path, optional note, remove button
   - "Add File" button opens VS Code file picker
   - Empty state when no files added

3. **Content**
   - Large textarea for markdown content
   - Monospace font
   - Placeholder showing example structure

4. **Metadata Preview**
   - Read-only preview of generated frontmatter
   - Updates live as form changes

### Host-Side Handler

1. **CreateContext message handler**
   ```typescript
   {
     type: 'CreateContext',
     payload: {
       name: string;
       scope: 'global' | 'project';
       project?: string;
       description: string;
       fileReferences: string[];
       content: string;
     }
   }
   ```

2. **File creation logic**
   - Global scope: `.kanban2code/{name}.md`
   - Project scope: `.kanban2code/projects/{project}/_context/{name}.md`
   - Generate frontmatter from form data
   - Write markdown file

3. **File picker integration**
   - Use `vscode.window.showOpenDialog()` for file selection
   - Return relative paths from workspace root

### Generated File Format

```markdown
---
name: phase-2-context
description: Navigation redesign with new navbar and routing structure
scope: project
created: 2025-12-13
file_references:
  - src/components/Navbar.tsx
  - src/app/layout.tsx
  - docs/architecture/routing.md
---

# Phase 2: Navbar Redesign

## Overview
Redesigning navigation system with new component structure...

## Key Components
- Navbar: Main navigation bar
- NavLinks: Dynamic link generation
- MobileMenu: Responsive mobile navigation
```

## Files to Create/Modify

- `src/webview/ui/components/ContextModal.tsx` - New modal component
- `src/webview/ui/components/FileReferencePicker.tsx` - File list subcomponent
- `src/webview/messaging.ts` - Add CreateContext, PickFile types
- `src/webview/SidebarProvider.ts` - Handle CreateContext, PickFile
- `src/webview/KanbanPanel.ts` - Handle CreateContext, PickFile
- `src/services/context.ts` - Add `createContextFile()`
- `src/webview/ui/styles/main.css` - Modal styles

## Integration Points

- "Create new context" link in ContextPicker (Task 6.3) opens this modal
- After creation, refresh available contexts list
- Consider adding to sidebar actions menu

## Testing

- Unit test for context file generation
- Unit test for frontmatter formatting
- Manual test: create global context
- Manual test: create project-scoped context
- Verify file created in correct location

## Acceptance Criteria

- [ ] Modal opens from "Create new context" link
- [ ] Name, scope, description fields functional
- [ ] Project dropdown shows when scope = project
- [ ] File references can be added via file picker
- [ ] File references can be removed
- [ ] Content textarea accepts markdown
- [ ] Metadata preview updates live
- [ ] Context file created in correct location
- [ ] Frontmatter includes all metadata
- [ ] Modal closes and refreshes context list after creation
- [ ] Keyboard shortcuts: Esc to close, Ctrl+Enter to create
