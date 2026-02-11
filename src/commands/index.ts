import * as vscode from 'vscode';
import { KanbanPanel } from '../webview/KanbanPanel';
import { scaffoldWorkspace, syncWorkspace } from '../services/scaffolder';
import { WorkspaceState } from '../workspace/state';
import { KANBAN_FOLDER } from '../core/constants';
import { buildCopyPayload, copyToClipboard } from '../services/copy';
import { findTaskById, loadAllTasks } from '../services/scanner';
import { CopyMode } from '../types/copy';
import { SidebarProvider } from '../webview/SidebarProvider';
import {
  restartFileWatcher,
  runTaskWithRunner,
  runColumnWithRunner,
  runNightShiftWithRunner,
  stopRunnerExecution,
} from '../extension';
import * as path from 'path';
import type { Stage } from '../types/task';
import { parseTaskFile } from '../services/frontmatter';
import type { Task } from '../types/task';
import { migrateAgentsToModes } from '../services/migration';
import type { RunnerPipelineStage } from '../runner/runner-engine';

export function registerCommands(context: vscode.ExtensionContext, sidebarProvider: SidebarProvider) {
  async function resolveTaskForCommand(kanbanRoot: string, taskInput?: string | { id: string }): Promise<Task | null> {
    const taskId = typeof taskInput === 'string' ? taskInput : taskInput?.id;
    if (taskId) {
      return (await findTaskById(kanbanRoot, taskId)) ?? null;
    }

    const activePath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (activePath && activePath.endsWith('.md')) {
      const normalizedRoot = path.resolve(kanbanRoot) + path.sep;
      const normalizedPath = path.resolve(activePath);

      const isInKanbanRoot = normalizedPath.startsWith(normalizedRoot);
      const isContextFile = path.basename(normalizedPath) === '_context.md';

      if (isInKanbanRoot && !isContextFile) {
        try {
          return await parseTaskFile(normalizedPath);
        } catch {
          // fall through to picker
        }
      }
    }

    const tasks = await loadAllTasks(kanbanRoot);
    if (!tasks.length) return null;

    const pick = await vscode.window.showQuickPick(
      tasks
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((task) => ({
          label: task.title,
          description: [task.stage, task.project, task.phase].filter(Boolean).join(' · '),
          detail: task.filePath,
          task,
        })),
      { placeHolder: 'Select a task' },
    );

    return pick?.task ?? null;
  }

  function parseCopyMode(input: unknown, fallback: CopyMode): CopyMode {
    return input === 'full_xml' || input === 'task_only' || input === 'context_only' ? input : fallback;
  }

  async function copyForTask(
    mode: CopyMode,
    taskInput?: string | { id: string },
  ): Promise<void> {
    const kanbanRoot = WorkspaceState.kanbanRoot;
    if (!kanbanRoot) {
      vscode.window.showErrorMessage('Kanban workspace not detected.');
      return;
    }

    const task = await resolveTaskForCommand(kanbanRoot, taskInput);
    if (!task) {
      vscode.window.showErrorMessage('No task selected.');
      return;
    }

    const payload = await buildCopyPayload(task, mode, kanbanRoot);
    await copyToClipboard(payload);

    const label = mode === 'full_xml' ? 'Task context (full XML)' : mode === 'task_only' ? 'Task only' : 'Context only';
    vscode.window.showInformationMessage(`${label} copied to clipboard.`);
  }

  async function pickRunnerStage(input?: Stage): Promise<RunnerPipelineStage | null> {
    if (input === 'plan' || input === 'code' || input === 'audit') {
      return input;
    }

    const pick = await vscode.window.showQuickPick(
      [
        { label: 'Plan', stage: 'plan' as const },
        { label: 'Code', stage: 'code' as const },
        { label: 'Audit', stage: 'audit' as const },
      ],
      { placeHolder: 'Select a stage to run' },
    );

    return pick?.stage ?? null;
  }

  context.subscriptions.push(
    // Open Board command
    vscode.commands.registerCommand('kanban2code.openBoard', () => {
      KanbanPanel.createOrShow(context.extensionUri);
    }),

    // New Task command (modal-friendly)
    vscode.commands.registerCommand('kanban2code.newTask', async (options?: {
      title?: string;
      location?: 'inbox' | { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
      stage?: Stage;
      agent?: string;
      tags?: string[];
      parent?: string;
      content?: string;
    }) => {
      const kanbanRoot = WorkspaceState.kanbanRoot;
      if (!kanbanRoot) {
        vscode.window.showErrorMessage('Kanban workspace not detected. Please create a Kanban board first.');
        return;
      }

      // If no options provided (e.g., from keyboard shortcut), open the modal
      if (!options) {
        sidebarProvider.openTaskModal();
        return;
      }

      const title =
        options?.title ??
        (await vscode.window.showInputBox({
          prompt: 'Enter task title',
          placeHolder: 'New task...',
        }));

      if (!title) return;

      const location = options?.location || 'inbox';
      const timestamp = Date.now();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const filename = `${timestamp}-${slug}.md`;

      let targetDir: string;
      if (location === 'inbox' || (typeof location === 'object' && location.type === 'inbox')) {
        targetDir = path.join(kanbanRoot, 'inbox');
      } else {
        const project = typeof location === 'string' ? location : location.project;
        const phase = typeof location === 'string' ? undefined : location.phase;
        targetDir = phase
          ? path.join(kanbanRoot, 'projects', project, phase)
          : path.join(kanbanRoot, 'projects', project);
      }

      await vscode.workspace.fs.createDirectory(vscode.Uri.file(targetDir));

      const filePath = path.join(targetDir, filename);
      const stage = options?.stage ?? 'inbox';

      const frontmatterLines = [
        `stage: ${stage}`,
        `created: ${new Date().toISOString()}`,
      ];

      if (options?.agent) {
        frontmatterLines.push(`agent: ${options.agent}`);
      }

      if (options?.tags && options.tags.length > 0) {
        frontmatterLines.push(`tags: [${options.tags.join(', ')}]`);
      }

      if (options?.parent) {
        frontmatterLines.push(`parent: ${options.parent}`);
      }

      const content = `---
${frontmatterLines.join('\n')}
---

# ${title}

${options?.content ?? ''}
`;

      try {
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(filePath),
          Buffer.from(content, 'utf8')
        );

        await sidebarProvider.refresh();

        // Open the new task file
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Task "${title}" created.`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create task: ${message}`);
      }
    }),

    // Scaffold Workspace command
    vscode.commands.registerCommand('kanban2code.scaffoldWorkspace', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace open. Please open a folder first.');
        return;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      try {
        await scaffoldWorkspace(rootPath);

        // Update State
        const newKanbanRoot = path.join(rootPath, KANBAN_FOLDER);
        WorkspaceState.setKanbanRoot(newKanbanRoot);
        await vscode.commands.executeCommand('setContext', 'kanban2code:isActive', true);

        // Start file watcher for the new kanban root
        restartFileWatcher(newKanbanRoot);

        // Refresh sidebar
        await sidebarProvider.refresh();

        vscode.window.showInformationMessage('Kanban2Code initialized successfully!');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to scaffold: ${message}`);
      }
    }),

    // Sync Workspace command
    vscode.commands.registerCommand('kanban2code.syncWorkspace', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace open. Please open a folder first.');
        return;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      try {
        const report = await syncWorkspace(rootPath);

        const newKanbanRoot = path.join(rootPath, KANBAN_FOLDER);
        WorkspaceState.setKanbanRoot(newKanbanRoot);
        await vscode.commands.executeCommand('setContext', 'kanban2code:isActive', true);

        restartFileWatcher(newKanbanRoot);
        await sidebarProvider.refresh();

        const message = `Kanban2Code sync complete. Updated ${report.updated.length}, added ${report.created.length}, skipped ${report.skipped.length}.`;
        vscode.window.showInformationMessage(message);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to sync: ${message}`);
      }
    }),

    // Copy Task Context command
    vscode.commands.registerCommand('kanban2code.copyTaskContext', async (taskInput?: string | { id: string }, modeInput?: unknown) => {
      try {
        const mode = parseCopyMode(modeInput, 'full_xml');
        await copyForTask(mode, taskInput);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to copy: ${message}`);
      }
    }),

    vscode.commands.registerCommand('kanban2code.copyTaskOnly', async (taskInput?: string | { id: string }) => {
      try {
        await copyForTask('task_only', taskInput);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to copy: ${message}`);
      }
    }),

    vscode.commands.registerCommand('kanban2code.copyContextOnly', async (taskInput?: string | { id: string }) => {
      try {
        await copyForTask('context_only', taskInput);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to copy: ${message}`);
      }
    }),

    vscode.commands.registerCommand('kanban2code.toggleLayout', () => {
      KanbanPanel.createOrShow(context.extensionUri);
      KanbanPanel.currentPanel?.toggleLayout();
    }),

    vscode.commands.registerCommand('kanban2code.showKeyboardShortcuts', () => {
      // If a board is open, show shortcuts there; also attempt sidebar.
      sidebarProvider.showKeyboardShortcuts();
      KanbanPanel.createOrShow(context.extensionUri);
      KanbanPanel.currentPanel?.showKeyboardShortcuts();
    }),

    // Open Settings command (placeholder)
    vscode.commands.registerCommand('kanban2code.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', '@ext:kanban2code');
    }),

    // New Project command (placeholder)
    vscode.commands.registerCommand('kanban2code.newProject', async () => {
      const kanbanRoot = WorkspaceState.kanbanRoot;
      if (!kanbanRoot) {
        vscode.window.showErrorMessage('Kanban workspace not detected.');
        return;
      }

      const name = await vscode.window.showInputBox({
        prompt: 'Enter project name',
        placeHolder: 'my-project',
        validateInput: (value) => {
          if (!value) return 'Project name is required';
          if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers, and hyphens only';
          return null;
        }
      });

      if (!name) return;

      const projectDir = path.join(kanbanRoot, 'projects', name);
      try {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(projectDir));

        // Create _context.md file
        const contextPath = path.join(projectDir, '_context.md');
        const contextContent = `# ${name}

Project context and documentation goes here.
`;
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(contextPath),
          Buffer.from(contextContent, 'utf8')
        );

        await sidebarProvider.refresh();
        if (KanbanPanel.currentPanel) {
          await KanbanPanel.currentPanel.refresh();
        }

        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(contextPath));
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Project "${name}" created.`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create project: ${message}`);
      }
    }),

    // New Context command (placeholder)
    vscode.commands.registerCommand('kanban2code.newContext', async () => {
      const kanbanRoot = WorkspaceState.kanbanRoot;
      if (!kanbanRoot) {
        vscode.window.showErrorMessage('Kanban workspace not detected.');
        return;
      }

      const name = await vscode.window.showInputBox({
        prompt: 'Enter context name',
        placeHolder: 'my-context',
        validateInput: (value) => {
          if (!value) return 'Context name is required';
          if (!/^[a-z0-9-]+$/.test(value)) return 'Use lowercase letters, numbers, and hyphens only';
          return null;
        },
      });

      if (!name) return;

      const contextDir = path.join(kanbanRoot, '_context');
      const contextPath = path.join(contextDir, `${name}.md`);
      const contextContent = `# ${name}

Context notes go here.
`;

      try {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(contextDir));

        let exists = false;
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(contextPath));
          exists = true;
        } catch {
          // does not exist
        }

        if (!exists) {
          await vscode.workspace.fs.writeFile(
            vscode.Uri.file(contextPath),
            Buffer.from(contextContent, 'utf8'),
          );
        }

        await sidebarProvider.refresh();
        if (KanbanPanel.currentPanel) {
          await KanbanPanel.currentPanel.refresh();
        }

        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(contextPath));
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(exists ? `Context "${name}" opened.` : `Context "${name}" created.`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create context: ${message}`);
      }
    }),

    // New Agent command (placeholder)
    vscode.commands.registerCommand('kanban2code.newAgent', async () => {
      const kanbanRoot = WorkspaceState.kanbanRoot;
      if (!kanbanRoot) {
        vscode.window.showErrorMessage('Kanban workspace not detected.');
        return;
      }

      const name = await vscode.window.showInputBox({
        prompt: 'Enter agent name',
        placeHolder: 'frontend-dev',
      });

      if (!name) return;

      const agentPath = path.join(kanbanRoot, '_agents', `${name}.md`);
      const agentContent = `# ${name}

## Role
Describe the agent's role and expertise.

## Guidelines
- Guideline 1
- Guideline 2
`;
      try {
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(agentPath),
          Buffer.from(agentContent, 'utf8')
        );

        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(agentPath));
        await vscode.window.showTextDocument(doc);

        vscode.window.showInformationMessage(`Agent "${name}" created.`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create agent: ${message}`);
      }
    }),

    // Migrate Agents to Modes command
    vscode.commands.registerCommand('kanban2code.migrateAgentsModes', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace open. Please open a folder first.');
        return;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Kanban2Code: Migrating agents to modes…',
          cancellable: false,
        },
        async (progress) => {
          try {
            progress.report({ message: 'Scanning workspace…' });
            const report = await migrateAgentsToModes(rootPath);

            progress.report({ message: 'Finalizing…' });

            const parts: string[] = [];
            if (report.movedModes.length > 0) {
              parts.push(`${report.movedModes.length} mode(s) created`);
            }
            if (report.createdAgents.length > 0) {
              parts.push(`${report.createdAgents.length} agent config(s) created`);
            }
            if (report.updatedTasks.length > 0) {
              parts.push(`${report.updatedTasks.length} task(s) updated`);
            }
            if (report.skipped.length > 0) {
              parts.push(`${report.skipped.length} skipped`);
            }

            const summary = parts.length > 0
              ? `Migration complete: ${parts.join(', ')}.`
              : 'Migration complete: nothing to migrate.';

            vscode.window.showInformationMessage(summary);

            // Refresh sidebar if kanban root is active
            if (WorkspaceState.kanbanRoot) {
              await sidebarProvider.refresh();
            }
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Migration failed: ${message}`);
          }
        },
      );
    }),

    vscode.commands.registerCommand('kanban2code.runTask', async (taskInput?: string | { id: string }) => {
      const kanbanRoot = WorkspaceState.kanbanRoot;
      if (!kanbanRoot) {
        vscode.window.showErrorMessage('Kanban workspace not detected.');
        return;
      }

      const task = await resolveTaskForCommand(kanbanRoot, taskInput);
      if (!task) {
        vscode.window.showErrorMessage('No task selected.');
        return;
      }

      try {
        const result = await runTaskWithRunner(task);
        if (result.status === 'completed') {
          vscode.window.showInformationMessage(`Runner completed task: ${task.title}`);
        } else if (result.status === 'stopped') {
          vscode.window.showWarningMessage(`Runner stopped: ${task.title}`);
        } else {
          vscode.window.showErrorMessage(`Runner failed: ${result.error ?? 'Unknown error'}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to run task: ${message}`);
      }
    }),

    vscode.commands.registerCommand('kanban2code.runColumn', async (stageInput?: Stage) => {
      const stage = await pickRunnerStage(stageInput);
      if (!stage) {
        return;
      }

      try {
        const result = await runColumnWithRunner(stage);
        if (result.status === 'completed') {
          vscode.window.showInformationMessage(`Runner completed ${stage} column.`);
        } else if (result.status === 'stopped') {
          vscode.window.showWarningMessage(`Runner stopped while processing ${stage} column.`);
        } else {
          vscode.window.showErrorMessage(`Runner failed: ${result.error ?? 'Unknown error'}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to run column: ${message}`);
      }
    }),

    vscode.commands.registerCommand('kanban2code.runNightShift', async () => {
      try {
        const result = await runNightShiftWithRunner();
        if (result.status === 'completed') {
          vscode.window.showInformationMessage('Night shift completed.');
        } else if (result.status === 'stopped') {
          vscode.window.showWarningMessage('Night shift stopped.');
        } else {
          vscode.window.showErrorMessage(`Night shift failed: ${result.error ?? 'Unknown error'}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to run night shift: ${message}`);
      }
    }),

    vscode.commands.registerCommand('kanban2code.stopRunner', async () => {
      const stopped = stopRunnerExecution();
      if (stopped) {
        vscode.window.showInformationMessage('Runner stop requested.');
      } else {
        vscode.window.showWarningMessage('Runner is not active.');
      }
    }),
  );
}
