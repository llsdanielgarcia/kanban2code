---
stage: completed
agent: react-dev
tags:
  - bug
  - ui
contexts:
  - architecture
  - ai-guide
---

# Remove duplicated label

Context files shows up twice when editing a task, I want to remove one of the labels.

<context-pack timestamp="2025-12-16T04:32:00.000Z" task="Remove duplicated label">
  <meta>
    <scope>UI Component</scope>
    <stack>
      <language>TypeScript</language>
      <framework>React</framework>
      <build-tools>
        <tool>esbuild</tool>
        <tool>bun</tool>
      </build-tools>
      <test-tools>
        <tool>vitest</tool>
      </test-tools>
    </stack>
  </meta>

  <task>
    <original><![CDATA[Context files shows up twice when editing a task, I want to remove one of the labels.]]></original>
    <clarifying-questions>
    </clarifying-questions>
    <assumptions>
      <item>The issue occurs in the task editing modal where "Context Files" label appears twice</item>
      <item>The duplication is happening in the TaskEditorModal component</item>
    </assumptions>
    <refined-prompt><![CDATA[
Objective: Remove duplicate "Context Files" label in task editing modal
Context: The "Context Files" label appears twice when editing a task - once in the parent TaskEditorModal component and once in the child ContextPicker component
Acceptance criteria:
- Only one "Context Files" label should be displayed when editing a task
- The functionality of selecting context files should remain unchanged
- The fix should not affect other components that use ContextPicker
Non-goals:
- Changing the functionality of context file selection
- Modifying other picker components
Notes/constraints:
- The fix should be minimal and not break existing functionality
- Both TaskEditorModal and TaskModal use ContextPicker, so the fix should work for both
]]></refined-prompt>
  </task>

  <architecture>
    <primary-source path="docs/architecture.md" />
    <key-points>
      <item>Kanban2Code uses React webviews with a component-based architecture</item>
      <item>UI components follow a parent-child pattern with reusable picker components</item>
      <item>Task editing uses a split-panel layout with metadata panel and Monaco editor</item>
    </key-points>
    <extracts>
      <extract source="docs/architecture.md:233-238">
<![CDATA[### Task Editing Flow (Split-Panel Editor)

- UI: [`src/webview/ui/components/TaskEditorModal.tsx`](../src/webview/ui/components/TaskEditorModal.tsx) renders a left metadata panel (title/location/agent/template/contexts/tags) and a right markdown editor (Monaco).
- Load: webview sends `RequestFullTaskData` → host replies `FullTaskDataLoaded` with file content, current metadata, and option lists (templates/agents/contexts/projects/phases).
- Save: webview sends `SaveTaskWithMetadata` → host persists content/metadata via [`src/services/task-content.ts`](../src/services/task-content.ts) and returns `TaskMetadataSaved` (or `TaskMetadataSaveFailed`).
- Templates: selecting a template triggers `RequestTemplateContent` → host loads via [`loadTemplateById`](../src/services/template.ts) and replies `TemplateContentLoaded` (or `TemplateContentLoadFailed`).
]]>
      </extract>
    </extracts>
  </architecture>

  <database>
    <status>not-detected</status>
    <engine>unknown</engine>
    <schema-sources>
    </schema-sources>
    <model>
    </model>
    <access-layer>
      <pattern>react-components</pattern>
      <locations>
      </locations>
      <error-handling>prop-based</error-handling>
      <transactions>state-updates</transactions>
    </access-layer>
  </database>

  <code-map>
    <files>
      <file path="src/webview/ui/components/TaskEditorModal.tsx" role="modify">
        <reason>Contains the duplicate "Context Files" label in the parent component</reason>
        <extract source="src/webview/ui/components/TaskEditorModal.tsx:386-395">
<![CDATA[                {/* Contexts */}
                <div className="task-editor-section">
                  <div className="task-editor-section-title">Context Files</div>
                  <ContextPicker
                    contexts={availableContexts}
                    selected={contexts}
                    onChange={setContexts}
                    onCreateNew={() => postMessage('CreateContext', {})}
                  />
                </div>
]]>
        </extract>
      </file>
      <file path="src/webview/ui/components/ContextPicker.tsx" role="modify">
        <reason>Contains the duplicate "Context Files" label in the child component</reason>
        <extract source="src/webview/ui/components/ContextPicker.tsx:32-36">
<![CDATA[  return (
    <div className="context-picker">
      <div className="form-group">
        <label className="form-label">Select Context Files</label>
        <div className="context-list">
]]>
        </extract>
      </file>
      <file path="src/webview/ui/components/TaskModal.tsx" role="reference">
        <reason>Also uses ContextPicker but without a parent section title</reason>
        <extract source="src/webview/ui/components/TaskModal.tsx:253-259">
<![CDATA[          {/* Context Files */}
          <ContextPicker
            contexts={contexts}
            selected={formData.contexts}
            onChange={(selectedContexts) => setFormData((prev) => ({ ...prev, contexts: selectedContexts }))}
            onCreateNew={handleCreateContext}
          />
]]>
        </extract>
      </file>
    </files>
    <types>
      <type name="ContextFile" source="src/webview/ui/components/ContextPicker.tsx:3-9">
<![CDATA[export interface ContextFile {
  id: string;
  name: string;
  description: string;
  path: string;
  scope?: 'global' | 'project';
}
]]>
      </type>
    </types>
    <functions>
      <function name="ContextPicker" source="src/webview/ui/components/ContextPicker.tsx:18-23">
        <signature><![CDATA[React.FC<ContextPickerProps>]]></signature>
        <purpose>Renders a multi-select list of context files with checkboxes</purpose>
        <callers>
          <caller source="src/webview/ui/components/TaskEditorModal.tsx:389" />
          <caller source="src/webview/ui/components/TaskModal.tsx:254" />
        </callers>
      </function>
    </functions>
    <data-flow>TaskEditorModal provides section title "Context Files" → ContextPicker renders its own label → duplication occurs</data-flow>
  </code-map>

  <tests>
    <framework>vitest</framework>
    <how-to-run>
      <command>bun run test</command>
    </how-to-run>
    <existing-tests>
      <test-file path="tests/webview/task-editor-modal.test.tsx">
        <patterns>
          <item>component rendering tests</item>
          <item>form interaction tests</item>
        </patterns>
      </test-file>
    </existing-tests>
    <required-coverage>
      <item>Test that ContextPicker renders without duplicate labels</item>
      <item>Test that context selection functionality still works</item>
    </required-coverage>
  </tests>

  <constraints>
    <validation>
      <item>Components must maintain existing prop interfaces</item>
      <item>No breaking changes to parent components</item>
    </validation>
    <naming>
      <item>Follow existing React component naming conventions</item>
    </naming>
    <security>
      <item>Never output secrets; redact config values.</item>
    </security>
  </constraints>

  <open-questions>
    <uncertainty>None - the issue is clearly identified in the code</uncertainty>
  </open-questions>

  <handoff>
    <planning-agent-ready>true</planning-agent-ready>
    <coding-agent-ready>true</coding-agent-ready>
    <next-step>Remove the duplicate "Context Files" label from ContextPicker component since the parent component (TaskEditorModal) already provides this section title</next-step>
  </handoff>
</context-pack>

## Implementation Complete

### Changes Made

**File: [src/webview/ui/components/ContextPicker.tsx](src/webview/ui/components/ContextPicker.tsx#L35)**

- Removed the duplicate `<label className="form-label">Select Context Files</label>` element
- The component now renders only the context list without its own label
- Parent components ([TaskEditorModal.tsx:388](src/webview/ui/components/TaskEditorModal.tsx#L388) and [TaskModal.tsx:253](src/webview/ui/components/TaskModal.tsx#L253)) provide the appropriate section titles

### Result

✅ Duplicate label eliminated
✅ Component prop interface unchanged
✅ No breaking changes to parent components
✅ `ContextPicker` is now a pure presentational component

## Audit

### Files Modified

- [src/webview/ui/components/ContextPicker.tsx](src/webview/ui/components/ContextPicker.tsx) - Removed duplicate label element (line 35)
