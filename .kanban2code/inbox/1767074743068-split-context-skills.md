---
stage: inbox
agent: "01-\U0001F5FA️roadmapper"
tags: []
contexts: []
---
---
stage: inbox
agent: "07-💬conversational"
tags: []
contexts: []

# Split context/skills

Design a plan to split context-skills in the modal editor

## Refined Prompt

Implement a split between context files and skills in the TaskEditorModal. Currently, the modal editor has a single "Context Files" section that displays both regular context files (e.g., `architecture.md`) and skill files from the `_context/skills/` subdirectory (e.g., `nextjs-core-skills.md`, `python-core-skills.md`).

### Requirements

1. **Backend Changes** ([`src/services/context.ts`](src/services/context.ts:1)):
   - Modify [`listAvailableContexts()`](src/services/context.ts:28) to exclude the `skills/` subdirectory
   - Create new `listAvailableSkills()` function that walks only through `_context/skills/` directory
   - Add `SkillFile` interface with fields: `id`, `name`, `description`, `path`, `framework`, `priority`, `alwaysAttach`, `triggers`
   - Parse skill-specific frontmatter (skill_name, framework, priority, triggers, always_attach)

2. **Frontend Component** (New file: `src/webview/ui/components/SkillPicker.tsx`):
   - Create `SkillPicker` component similar to [`ContextPicker`](src/webview/ui/components/ContextPicker.tsx:1)
   - Display skills with framework badges, priority indicators, "always attach" badges, and trigger tags
   - Support multi-selection of skills

3. **Task Type** ([`src/types/task.ts`](src/types/task.ts:1)):
   - Add `skills?: string[]` field to [`Task`](src/types/task.ts:3) interface (separate from `contexts`)

4. **TaskEditorModal** ([`src/webview/ui/components/TaskEditorModal.tsx`](src/webview/ui/components/TaskEditorModal.tsx:1)):
   - Add `skills` state and `availableSkills` state
   - Update [`TaskMetadata`](src/webview/ui/components/TaskEditorModal.tsx:37) interface to include `skills: string[]`
   - Update `isMetadataDirty` to check skills
   - Replace single "Context Files" section with two sections: "Context Files" and "Skills"
   - Update message handlers to receive and send skills separately

5. **Extension Command Handlers**:
   - Update `SaveTaskWithMetadata` to handle skills separately in task frontmatter
   - Update `RequestFullTaskData` to return both contexts and skills

6. **Data Migration**:
   - For existing tasks, detect context IDs containing `skills/` path and migrate to new `skills` array
   - Update task file frontmatter to separate contexts from skills

### Success Criteria

- Modal editor displays "Context Files" and "Skills" as separate sections
- Context files list excludes `_context/skills/` directory
- Skills are displayed with framework badges and priority indicators
- Skills are saved separately from contexts in task frontmatter
- Existing tasks with skills in contexts are migrated correctly
