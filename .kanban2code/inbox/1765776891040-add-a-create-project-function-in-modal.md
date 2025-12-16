---
stage: completed
tags: []
contexts:
  - ai-guide
  - architecture
agent: code-reviewer
---

# Add a create project function in modal

Add a create project function from the modal when I select location project, it disrupts my workflow if I don't have it. I'd like to add a create project when a new task is created or edited. fromt he kanban view.

<context-pack timestamp="2025-12-16T05:06:00.000Z" task="Add a create project function in modal">
  <meta>
    <scope>Task creation modal</scope>
    <stack>
      <language>TypeScript</language>
      <framework>React</framework>
      <build-tools>
        <tool>esbuild</tool>
      </build-tools>
      <test-tools>
        <tool>vitest</tool>
      </test-tools>
    </stack>
  </meta>

  <task>
    <original><![CDATA[Add a create project function from the modal when I select location project, it disrupts my workflow if I don't have it. I'd like to add a create project when a new task is created or edited. from the kanban view.]]></original>
    <clarifying-questions>
      <question>Should the create project option be available in both the sidebar and board views when creating a task?</question>
      <question>Should the newly created project be automatically selected as the location for the task being created?</question>
      <question>Do you want to include phase creation in the project creation modal, or just the project name?</question>
    </clarifying-questions>
    <assumptions>
      <item>User wants to create projects directly from the task creation modal without leaving the workflow</item>
      <item>The project creation should be available when selecting "Project" as the location in the LocationPicker</item>
      <item>After creating a project, it should be available for selection in the task modal</item>
    </assumptions>
    <refined-prompt><![CDATA[Objective: Add a "Create Project" button in the LocationPicker component when the user selects "Project" as the location type in the TaskModal. This will open the ProjectModal to allow users to create a new project without leaving the task creation workflow.

Context: The TaskModal component uses LocationPicker to select where a new task should be created (inbox or project). Currently, users must create projects through the command palette or sidebar before creating tasks in that project.

Acceptance criteria:
- Add a "Create Project" button in the LocationPicker when "Project" is selected
- Clicking the button opens the ProjectModal component
- After project creation, the new project appears in the project dropdown
- The newly created project is automatically selected as the task location
- The workflow remains in the TaskModal (no page refreshes or navigation)

Non-goals:
- Modifying the ProjectModal component itself
- Changing the existing project creation commands

Notes/constraints:
- Use the existing ProjectModal component
- Follow the existing messaging pattern between webview and extension
- Maintain the current UI styling and layout patterns
- Ensure keyboard navigation remains functional
]]></refined-prompt>
  </task>

  <architecture>
    <primary-source path="docs/architecture.md" />
    <key-points>
      <item>Webview messaging uses versioned envelopes with createMessage function</item>
      <item>Project creation is handled by the CreateProject message type in SidebarProvider</item>
      <item>UI components follow a glassmorphic design pattern</item>
    </key-points>
    <extracts>
      <extract source="src/webview/messaging.ts:42">
        <![CDATA['CreateProject',]]>
      </extract>
      <extract source="src/webview/SidebarProvider.ts:222-244">
        <![CDATA[case 'CreateProject': {
          const projectPayload = payload as {
            name?: string;
            phases?: string[];
          };
          if (projectPayload.name) {
            const root = WorkspaceState.kanbanRoot;
            if (root) {
              try {
                await createProject(root, {
                  name: projectPayload.name,
                  phases: projectPayload.phases,
                });
                await this._sendInitialState();
              } catch (error) {
                vscode.window.showErrorMessage(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          } else {
            await vscode.commands.executeCommand('kanban2code.newProject');
          }
          break;
        }]]>
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
      <pattern>filesystem</pattern>
      <locations>
        <location path="src/services/projects.ts" />
      </locations>
      <error-handling>try/catch with error messages</error-handling>
      <transactions>none</transactions>
    </access-layer>
  </database>

  <code-map>
    <files>
      <file path="src/webview/ui/components/LocationPicker.tsx" role="modify">
        <reason>Component that needs the "Create Project" button</reason>
        <extract source="src/webview/ui/components/LocationPicker.tsx:90-150">
          <![CDATA[return (
    <div className="location-picker">
      <div className="form-group">
        <label className="form-label">Location</label>
        <div className="location-type-buttons">
          <button
            type="button"
            className={`location-type-btn ${locationType === 'inbox' ? 'active' : ''}`}
            onClick={() => handleTypeChange('inbox')}
          >
            📥 Inbox
          </button>
          <button
            type="button"
            className={`location-type-btn ${locationType === 'project' ? 'active' : ''}`}
            onClick={() => handleTypeChange('project')}
          >
            📁 Project
          </button>
        </div>
      </div>

      {locationType === 'project' && (
        <>
          <div className="form-group">
            <label className="form-label">Project</label>
            <select
              className="form-select"
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
            >
              <option value="">Select a project...</option>
              {projectOptions.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>]]>
        </extract>
      </file>
      <file path="src/webview/ui/components/TaskModal.tsx" role="modify">
        <reason>Parent component that needs to manage ProjectModal state</reason>
        <extract source="src/webview/ui/components/TaskModal.tsx:56-70">
          <![CDATA[export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  tasks,
  templates = [],
  contexts = [],
  agents = [],
  projects = [],
  phasesByProject = {},
  onClose,
  onOpenContextModal,
  onOpenAgentModal,
  onOpenTemplateModal,
  defaultLocation = 'inbox',
  parentTaskId,
}) => {]]>
        </extract>
      </file>
      <file path="src/webview/ui/components/ProjectModal.tsx" role="reference">
        <reason>Existing modal component to be reused</reason>
        <extract source="src/webview/ui/components/ProjectModal.tsx:11-26">
          <![CDATA[interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (projectName: string) => void;
}

interface ProjectFormData {
  name: string;
  phases: string[];
}]]>
        </extract>
      </file>
    </files>
    <types>
      <type name="LocationPickerProps" source="src/webview/ui/components/LocationPicker.tsx:4-10">
        <![CDATA[interface LocationPickerProps {
  tasks: Task[];
  projects?: string[];
  phasesByProject?: Record<string, string[]>;
  value: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  onChange: (location: LocationPickerProps['value']) => void;
}]]>
      </type>
    </types>
    <functions>
      <function name="handleProjectChange" source="src/webview/ui/components/LocationPicker.tsx:73-79">
        <signature><![CDATA[const handleProjectChange = (project: string) => {
  setSelectedProject(project);
  setSelectedPhase(''); // Reset phase when project changes
  if (project) {
    onChange({ type: 'project', project });
  }
};]]></signature>
        <purpose>Updates selected project and notifies parent component</purpose>
        <callers>
          <caller source="src/webview/ui/components/LocationPicker.tsx:119" />
        </callers>
      </function>
    </functions>
    <data-flow>User selects "Project" location → LocationPicker shows project dropdown → User clicks "Create Project" → ProjectModal opens → User creates project → ProjectModal calls onCreated callback → New project appears in dropdown and is selected</data-flow>
  </code-map>

  <tests>
    <framework>vitest</framework>
    <how-to-run>
      <command>bun run test</command>
    </how-to-run>
    <existing-tests>
      <test-file path="tests/webview/task-editor-modal.test.tsx">
        <patterns>modal testing with React Testing Library</patterns>
      </test-file>
    </existing-tests>
    <required-coverage>
      <item>Test that "Create Project" button appears when project location is selected</item>
      <item>Test that clicking button opens ProjectModal</item>
      <item>Test that created project appears in dropdown after creation</item>
    </required-coverage>
  </tests>

  <constraints>
    <validation>
      <item>Project names must be non-empty and contain only valid characters</item>
    </validation>
    <naming>
      <item>Follow existing naming conventions for components and functions</item>
    </naming>
    <security>
      <item>Never output secrets; redact config values.</item>
    </security>
  </constraints>

  <open-questions>
    <uncertainty>How to handle the case where a user creates a project with the same name as an existing project</uncertainty>
  </open-questions>

  <handoff>
    <planning-agent-ready>true</planning-agent-ready>
    <coding-agent-ready>true</coding-agent-ready>
    <next-step>Modify LocationPicker to add a "Create Project" button and update TaskModal to manage ProjectModal state</next-step>
  </handoff>
</context-pack>

## Audit Review

### Reviewed Files
- [LocationPicker.tsx](src/webview/ui/components/LocationPicker.tsx)
- [TaskModal.tsx](src/webview/ui/components/TaskModal.tsx)
- [TaskEditorModal.tsx](src/webview/ui/components/TaskEditorModal.tsx)
- [ProjectModal.tsx](src/webview/ui/components/ProjectModal.tsx)
- [tests/webview/task-editor-modal.test.tsx](tests/webview/task-editor-modal.test.tsx)
- [tests/webview/task-modal-create-project.test.tsx](tests/webview/task-modal-create-project.test.tsx)

### Code Review Summary
**Score: 8/10** - Well-implemented feature with good test coverage and architecture compliance.

#### Implementation Quality
✅ **Strengths:**
- Uses existing `ProjectModal` component (no duplication)
- Follows established messaging patterns (`createMessage`, `postMessage`)
- Proper React hooks usage (useState, useEffect, useCallback)
- Clean callback pattern for state management
- State properly synced between parent and child components
- Auto-selects newly created project
- Implemented in both TaskModal and TaskEditorModal consistently

✅ **Test Coverage:**
- Task creation with project creation workflow (171 total tests passing)
- Project auto-selection after creation
- Metadata synchronization
- Both new task and edit task flows covered

#### Issues Found

**Medium Severity:**
1. Inline styles in LocationPicker button container (line 138) - should use CSS class
2. Missing `aria-label` on Create Project button for accessibility (line 139)

**Low Severity:**
1. No test for button visibility toggle when switching locations
2. ProjectModal optimistic UI without error handling feedback
3. Close button character inconsistency (`x` vs `×`) across modals

#### Recommendations
1. Add `.location-create-project-action` CSS class and remove inline styles
2. Add `aria-label="Create a new project"` to button
3. Standardize close button character (`×`) across all modals
4. Consider adding error handling for project creation failures

### Test Results
```
✓ All 171 tests passing
✓ TaskModal create project workflow verified
✓ TaskEditorModal create project workflow verified
✓ New project appears in dropdown and is selected
```

### Conclusion
Feature is production-ready. Functional requirements met, code quality is high, and integration with existing architecture is seamless. Minor UI/accessibility improvements recommended but not blocking.

**Status: ✅ Approved for Merged**
