---
stage: plan
tags: [feature, ui, template, mvp, p2]
---

# Task 6.6: Implement Template Creation and Editing Modal

## Goal

Implement a modal for creating and editing task templates. Templates define default content and metadata for new tasks, allowing users to quickly create tasks with pre-filled information.

## Background

Task templates are stored in `.kanban2code/_templates/tasks/`. The current implementation has a `TemplatePicker` component for selection but no way to create or edit templates from the UI.

## Scope

### TemplateModal Component

```typescript
interface TemplateModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  template?: Template; // For edit mode
  onClose: () => void;
  onSaved?: (templateId: string) => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  defaultStage: Stage;
  defaultTags: string[];
  content: string; // Markdown body
}
```

### UI Sections

1. **Basic Information**
   - Name input (generates filename)
   - Description input
   - Icon/emoji picker (optional, for visual distinction)

2. **Default Values**
   - Default stage dropdown
   - Default tags (chip input)

3. **Template Content**
   - Large textarea for markdown content
   - Supports placeholders like `{{title}}`, `{{date}}`
   - Monospace font
   - Example placeholder:
     ```markdown
     ## Goal
     {{description}}

     ## Scope
     - [ ] Define requirements
     - [ ] Implement solution
     - [ ] Write tests

     ## Notes
     Created: {{date}}
     ```

4. **Preview**
   - Shows how the template will render
   - Replaces placeholders with sample values

### Generated Template File

Location: `.kanban2code/_templates/tasks/{name}.md`

```markdown
---
name: bug-fix
description: Template for bug fix tasks
icon: 🐛
default_stage: inbox
default_tags:
  - bug
created: 2025-12-13
---

## Problem
{{description}}

## Steps to Reproduce
1.
2.
3.

## Expected Behavior


## Actual Behavior


## Investigation Notes


## Fix
- [ ] Identify root cause
- [ ] Implement fix
- [ ] Add regression test
- [ ] Verify in staging

## Related
- Related issue:
- Related files:
```

### Template Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{{title}}` | Task title |
| `{{description}}` | Task description (if provided) |
| `{{date}}` | Current date (YYYY-MM-DD) |
| `{{project}}` | Project name |
| `{{phase}}` | Phase name |
| `{{author}}` | Current user (if available) |

### Edit Mode

When editing an existing template:
- Load template file and parse frontmatter
- Pre-fill form with existing values
- Update file in place on save

### Integration Points

1. **TemplatePicker Enhancement**
   - Add "Create new template" link
   - Add "Edit" button next to each template

2. **Task Creation**
   - When template selected, apply default values
   - Replace placeholders in content

## Files to Create/Modify

- `src/webview/ui/components/TemplateModal.tsx` - New modal component
- `src/webview/ui/components/TemplatePicker.tsx` - Add create/edit links
- `src/services/template.ts` - Add create/update functions
- `src/webview/messaging.ts` - Add CreateTemplate, UpdateTemplate
- `src/webview/SidebarProvider.ts` - Handle template messages
- `src/webview/KanbanPanel.ts` - Handle template messages
- `src/webview/ui/styles/main.css` - Template modal styles

## Testing

- Unit test for template file creation
- Unit test for placeholder replacement
- Manual test: create new template
- Manual test: edit existing template
- Manual test: use template when creating task

## Acceptance Criteria

- [ ] "Create new template" link in TemplatePicker opens modal
- [ ] "Edit" option available for existing templates
- [ ] Name, description, default stage fields functional
- [ ] Default tags can be added/removed
- [ ] Content textarea with placeholder support
- [ ] Preview shows template with sample values
- [ ] Template file created in `_templates/tasks/`
- [ ] Template immediately available in picker after creation
- [ ] Edit mode loads existing template data
- [ ] Edit mode updates file in place
- [ ] Keyboard shortcuts: Esc to close, Ctrl+Enter to save
