---
stage: completed
tags: []
contexts:
  - architecture
  - ai-guide
agent: react-dev
---

# new task shorcut

Create a new shortcut, doesn't open modal when I press ctral shift + n. It opens a create task in the navbar but modal does not open

## Context Analysis

The issue is that the Ctrl+Shift+N keyboard shortcut is registered in package.json to trigger the `kanban2code.newTask` command, but when this command is executed via the keyboard shortcut, it's not opening the task modal in the sidebar UI.

### Current Implementation

1. In [`package.json`](package.json:101-105), the shortcut is defined:
```json
{
  "command": "kanban2code.newTask",
  "key": "ctrl+shift+n",
  "mac": "cmd+shift+n",
  "when": "kanban2code:isActive"
}
```

2. In [`src/commands/index.ts`](src/commands/index.ts:93-186), the command handler creates a task file but doesn't trigger the modal:
- It prompts for a title via input box
- Creates the task file directly
- Opens the task file in an editor
- Refreshes the sidebar

3. In [`src/webview/ui/components/Sidebar.tsx`](src/webview/ui/components/Sidebar.tsx:107-109), the `handleNewTask` function simply sets the modal state to true:
```typescript
const handleNewTask = () => {
  setShowTaskModal(true);
};
```

4. The keyboard shortcut handling in [`src/webview/ui/hooks/useKeyboard.ts`](src/webview/ui/hooks/useKeyboard.ts:100-102) defines Shift+N for opening the modal:
```typescript
if (onNewTaskModal) {
  list.push({ key: 'N', modifiers: ['shift'], action: onNewTaskModal, description: 'New task (detailed modal)', category: 'actions' });
}
```

### Problem

The VS Code command (`kanban2code.newTask`) and the webview keyboard shortcut (Shift+N) are two separate mechanisms:
1. The VS Code command creates a task file directly without opening the modal
2. The webview keyboard shortcut opens the modal but uses a different key combination (Shift+N)

### Solution Options

1. **Option 1**: Modify the VS Code command to trigger the modal instead of creating a task directly
2. **Option 2**: Update the webview keyboard shortcut to use Ctrl+Shift+N instead of Shift+N
3. **Option 3**: Create a new command specifically for opening the modal

### Recommended Solution

Option 1 is recommended as it provides the most consistent user experience. When the user presses Ctrl+Shift+N, they expect to see the modal regardless of how the command is triggered.

```xml
<context-pack timestamp="2025-12-16T06:07:00.000Z" task="Fix Ctrl+Shift+N shortcut to open new task modal">
  <meta>
    <scope>keyboard-shortcut, modal, command-handling</scope>
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
    <original><![CDATA[Create a new shortcut, doesn't open modal when I press ctral shift + n. It opens a create task in the navbar but modal does not open]]></original>
    <clarifying-questions>
      <question>I see that the Ctrl+Shift+N shortcut is defined in package.json to trigger the 'kanban2code.newTask' command, but it seems the modal isn't opening. Can you confirm if you see the "New Task" button in the sidebar working correctly when you click it with the mouse?</question>
    </clarifying-questions>
    <assumptions>
      <item>User expects Ctrl+Shift+N to open the task modal in the sidebar</item>
      <item>The "New Task" button in the sidebar works correctly when clicked</item>
      <item>The issue is specifically with the keyboard shortcut not triggering the modal</item>
    </assumptions>
    <refined-prompt><![CDATA[
Objective: Fix the Ctrl+Shift+N keyboard shortcut to open the new task modal in the sidebar UI.

Context: The VS Code command `kanban2code.newTask` is registered with Ctrl+Shift+N shortcut, but it creates a task directly without opening the modal. The sidebar has a separate keyboard shortcut (Shift+N) that opens the modal, but users expect Ctrl+Shift+N to work.

Acceptance criteria:
- Ctrl+Shift+N opens the new task modal in the sidebar
- The modal opens with the same state as clicking the "New Task" button
- Existing functionality of the modal remains unchanged
- The shortcut works when the sidebar has focus

Non-goals:
- Change the behavior of the "New Task" button click
- Modify the Shift+N shortcut behavior

Notes/constraints:
- The solution should work across different platforms (Windows, macOS, Linux)
- Maintain backward compatibility with existing command palette functionality
    ]]></refined-prompt>
  </task>

  <architecture>
    <primary-source path="docs/architecture.md" />
    <key-points>
      <item>Extension uses VS Code commands for keyboard shortcuts</item>
      <item>Webview handles its own keyboard shortcuts separately</item>
      <item>Sidebar and board are separate React components with their own state</item>
    </key-points>
    <extracts>
      <extract source="src/commands/index.ts:93-186">
        <![CDATA[
vscode.commands.registerCommand('kanban2code.newTask', async (options?: {
  title?: string;
  location?: 'inbox' | { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  stage?: Stage;
  agent?: string;
  tags?: string[];
  template?: string;
  parent?: string;
  content?: string;
}) => {
  const kanbanRoot = WorkspaceState.kanbanRoot;
  if (!kanbanRoot) {
    vscode.window.showErrorMessage('Kanban workspace not detected. Please create a Kanban board first.');
    return;
  }

  const title =
    options?.title ??
    (await vscode.window.showInputBox({
      prompt: 'Enter task title',
      placeHolder: 'New task...',
    }));

  if (!title) return;

  // ... creates task file directly without opening modal
}
        ]]>
      </extract>
      <extract source="src/webview/ui/components/Sidebar.tsx:107-109">
        <![CDATA[
const handleNewTask = () => {
  setShowTaskModal(true);
};
        ]]>
      </extract>
    </extracts>
  </architecture>

  <database>
    <status>not-detected</status>
    <engine>unknown</engine>
    <schema-sources />
    <model />
    <access-layer />
  </database>

  <code-map>
    <files>
      <file path="package.json" role="config">
        <reason>Contains keyboard shortcut definition</reason>
        <extract source="package.json:101-105">
          <![CDATA[
{
  "command": "kanban2code.newTask",
  "key": "ctrl+shift+n",
  "mac": "cmd+shift+n",
  "when": "kanban2code:isActive"
}
          ]]>
        </extract>
      </file>
      <file path="src/commands/index.ts" role="modify">
        <reason>Contains command handler that needs modification</reason>
        <extract source="src/commands/index.ts:93-186">
          <![CDATA[
vscode.commands.registerCommand('kanban2code.newTask', async (options?: {
  title?: string;
  location?: 'inbox' | { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  stage?: Stage;
  agent?: string;
  tags?: string[];
  template?: string;
  parent?: string;
  content?: string;
}) => {
          ]]>
        </extract>
      </file>
      <file path="src/webview/ui/hooks/useKeyboard.ts" role="reference">
        <reason>Contains webview keyboard shortcut handling</reason>
        <extract source="src/webview/ui/hooks/useKeyboard.ts:100-102">
          <![CDATA[
if (onNewTaskModal) {
  list.push({ key: 'N', modifiers: ['shift'], action: onNewTaskModal, description: 'New task (detailed modal)', category: 'actions' });
}
          ]]>
        </extract>
      </file>
      <file path="src/webview/ui/components/Sidebar.tsx" role="reference">
        <reason>Contains modal state management</reason>
        <extract source="src/webview/ui/components/Sidebar.tsx:107-109">
          <![CDATA[
const handleNewTask = () => {
  setShowTaskModal(true);
};
          ]]>
        </extract>
      </file>
    </files>
    <types>
      <type name="Stage" source="src/types/task.ts">
        <![CDATA[
export type Stage = 'inbox' | 'plan' | 'code' | 'audit' | 'completed';
        ]]>
      </type>
    </types>
    <functions>
      <function name="registerCommands" source="src/commands/index.ts:16">
        <signature><![CDATA[export function registerCommands(context: vscode.ExtensionContext, sidebarProvider: SidebarProvider)]]></signature>
        <purpose>Registers all VS Code commands for the extension</purpose>
        <callers>
          <caller source="src/extension.ts:51" />
        </callers>
      </function>
      <function name="handleNewTask" source="src/webview/ui/components/Sidebar.tsx:107">
        <signature><![CDATA[const handleNewTask = () => void]]></signature>
        <purpose>Sets the task modal state to visible</purpose>
        <callers>
          <caller source="src/webview/ui/components/Sidebar.tsx:269" />
        </callers>
      </function>
    </functions>
    <data-flow>VS Code command creates task directly → Should trigger webview modal instead</data-flow>
  </code-map>

  <tests>
    <framework>vitest</framework>
    <how-to-run>
      <command>bun test</command>
    </how-to-run>
    <existing-tests>
      <test-file path="tests/webview.test.ts">
        <patterns>
          <item>mocking vscode API</item>
          <item>testing webview components</item>
        </patterns>
      </test-file>
    </existing-tests>
    <required-coverage>
      <item>Test that Ctrl+Shift+N triggers modal opening</item>
      <item>Test that modal opens with correct state</item>
    </required-coverage>
  </tests>

  <constraints>
    <validation>
      <item>Must maintain backward compatibility with command palette</item>
      <item>Must work across platforms (Windows, macOS, Linux)</item>
    </validation>
    <naming>
      <item>Follow existing naming conventions for commands and handlers</item>
    </naming>
    <security>
      <item>Never output secrets; redact config values.</item>
    </security>
  </constraints>

  <open-questions>
    <uncertainty>None - the issue is clearly identified</uncertainty>
  </open-questions>

  <handoff>
    <planning-agent-ready>true</planning-agent-ready>
    <coding-agent-ready>true</coding-agent-ready>
    <next-step>Modify the kanban2code.newTask command to trigger the modal in the sidebar webview instead of creating a task directly</next-step>
  </handoff>
</context-pack>
    ]]></refined-prompt>
  </task>

  <architecture>
    <primary-source path="docs/architecture.md" />
    <key-points>
      <item>Extension uses VS Code commands for keyboard shortcuts</item>
      <item>Webview handles its own keyboard shortcuts separately</item>
      <item>Sidebar and board are separate React components with their own state</item>
    </key-points>
    <extracts>
      <extract source="src/commands/index.ts:93-186">
        <![CDATA[
vscode.commands.registerCommand('kanban2code.newTask', async (options?: {
  title?: string;
  location?: 'inbox' | { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  stage?: Stage;
  agent?: string;
  tags?: string[];
  template?: string;
  parent?: string;
  content?: string;
}) => {
  const kanbanRoot = WorkspaceState.kanbanRoot;
  if (!kanbanRoot) {
    vscode.window.showErrorMessage('Kanban workspace not detected. Please create a Kanban board first.');
    return;
  }

  const title =
    options?.title ??
    (await vscode.window.showInputBox({
      prompt: 'Enter task title',
      placeHolder: 'New task...',
    }));

  if (!title) return;

  // ... creates task file directly without opening modal
}
        ]]>
      </extract>
      <extract source="src/webview/ui/components/Sidebar.tsx:107-109">
        <![CDATA[
const handleNewTask = () => {
  setShowTaskModal(true);
};
        ]]>
      </extract>
    </extracts>
  </architecture>

  <database>
    <status>not-detected</status>
    <engine>unknown</engine>
    <schema-sources />
    <model />
    <access-layer />
  </database>

  <code-map>
    <files>
      <file path="package.json" role="config">
        <reason>Contains keyboard shortcut definition</reason>
        <extract source="package.json:101-105">
          <![CDATA[
{
  "command": "kanban2code.newTask",
  "key": "ctrl+shift+n",
  "mac": "cmd+shift+n",
  "when": "kanban2code:isActive"
}
          ]]>
        </extract>
      </file>
      <file path="src/commands/index.ts" role="modify">
        <reason>Contains command handler that needs modification</reason>
        <extract source="src/commands/index.ts:93-186">
          <![CDATA[
vscode.commands.registerCommand('kanban2code.newTask', async (options?: {
  title?: string;
  location?: 'inbox' | { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
  stage?: Stage;
  agent?: string;
  tags?: string[];
  template?: string;
  parent?: string;
  content?: string;
}) => {
          ]]>
        </extract>
      </file>
      <file path="src/webview/ui/hooks/useKeyboard.ts" role="reference">
        <reason>Contains webview keyboard shortcut handling</reason>
        <extract source="src/webview/ui/hooks/useKeyboard.ts:100-102">
          <![CDATA[
if (onNewTaskModal) {
  list.push({ key: 'N', modifiers: ['shift'], action: onNewTaskModal, description: 'New task (detailed modal)', category: 'actions' });
}
          ]]>
        </extract>
      </file>
      <file path="src/webview/ui/components/Sidebar.tsx" role="reference">
        <reason>Contains modal state management</reason>
        <extract source="src/webview/ui/components/Sidebar.tsx:107-109">
          <![CDATA[
const handleNewTask = () => {
  setShowTaskModal(true);
};
          ]]>
        </extract>
      </file>
    </files>
    <types>
      <type name="Stage" source="src/types/task.ts">
        <![CDATA[
export type Stage = 'inbox' | 'plan' | 'code' | 'audit' | 'completed';
        ]]>
      </type>
    </types>
    <functions>
      <function name="registerCommands" source="src/commands/index.ts:16">
        <signature><![CDATA[export function registerCommands(context: vscode.ExtensionContext, sidebarProvider: SidebarProvider)]]></signature>
        <purpose>Registers all VS Code commands for the extension</purpose>
        <callers>
          <caller source="src/extension.ts:51" />
        </callers>
      </function>
      <function name="handleNewTask" source="src/webview/ui/components/Sidebar.tsx:107">
        <signature><![CDATA[const handleNewTask = () => void]]></signature>
        <purpose>Sets the task modal state to visible</purpose>
        <callers>
          <caller source="src/webview/ui/components/Sidebar.tsx:269" />
        </callers>
      </function>
    </functions>
    <data-flow>VS Code command creates task directly → Should trigger webview modal instead</data-flow>
  </code-map>

  <tests>
    <framework>vitest</framework>
    <how-to-run>
      <command>bun test</command>
    </how-to-run>
    <existing-tests>
      <test-file path="tests/webview.test.ts">
        <patterns>
          <item>mocking vscode API</item>
          <item>testing webview components</item>
        </patterns>
      </test-file>
    </existing-tests>
    <required-coverage>
      <item>Test that Ctrl+Shift+N triggers modal opening</item>
      <item>Test that modal opens with correct state</item>
    </required-coverage>
  </tests>

  <constraints>
    <validation>
      <item>Must maintain backward compatibility with command palette</item>
      <item>Must work across platforms (Windows, macOS, Linux)</item>
    </validation>
    <naming>
      <item>Follow existing naming conventions for commands and handlers</item>
    </naming>
    <security>
      <item>Never output secrets; redact config values.</item>
    </security>
  </constraints>

  <open-questions>
    <uncertainty>None - the issue is clearly identified</uncertainty>
  </open-questions>

  <handoff>
    <planning-agent-ready>true</planning-agent-ready>
    <coding-agent-ready>true</coding-agent-ready>
    <next-step>Modify the kanban2code.newTask command to trigger the modal in the sidebar webview instead of creating a task directly</next-step>
  </handoff>
</context-pack>

## Audit

Files modified:
- src/webview/messaging.ts
- src/webview/SidebarProvider.ts
- src/commands/index.ts
- src/webview/ui/App.tsx
- src/webview/ui/components/Sidebar.tsx
