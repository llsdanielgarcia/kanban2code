import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { findKanbanRoot } from './workspace/validation';
import { WorkspaceState } from './workspace/state';
import { SidebarProvider } from './webview/SidebarProvider';
import { KanbanPanel } from './webview/KanbanPanel';
import { TaskWatcher } from './services/task-watcher';
import { loadAllTasks } from './services/scanner';
import { setSidebarProvider } from './webview/viewRegistry';
import { configService } from './services/config';
import { RunnerEngine, type RunnerPipelineStage, type RunnerRunResult } from './runner/runner-engine';
import type { Task } from './types/task';

let taskWatcher: TaskWatcher | null = null;
let sidebarProvider: SidebarProvider | null = null;
let statusBarItem: vscode.StatusBarItem | null = null;
let activeRunner: RunnerEngine | null = null;
let activeRunnerRun: Promise<RunnerRunResult> | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Kanban2Code is activating...');

  // 1. Detect Kanban Root (Multi-root support)
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  let kanbanRoot: string | null = null;

  for (const folder of workspaceFolders) {
    const root = await findKanbanRoot(folder.uri.fsPath);
    if (root) {
      kanbanRoot = root;
      break; // Found one, stop searching
    }
  }

  WorkspaceState.setKanbanRoot(kanbanRoot);
  vscode.commands.executeCommand('setContext', 'kanban2code:isActive', !!kanbanRoot);

  if (kanbanRoot) {
    console.log(`Kanban2Code found at: ${kanbanRoot}`);

    // Initialize configuration service
    await configService.initialize(kanbanRoot);
    console.log('ConfigService initialized');

    // Update Status Bar
    updateStatusBar(kanbanRoot);
  } else {
    console.log('Kanban2Code not found in workspace.');
    updateStatusBar(null);
  }

  // 2. Register Sidebar Provider
  sidebarProvider = new SidebarProvider(context.extensionUri);
  setSidebarProvider(sidebarProvider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
  );

  // 3. Register Commands (pass sidebarProvider for refresh)
  registerCommands(context, sidebarProvider);

  // 4. Start file watcher if kanban root exists
  if (kanbanRoot) {
    startFileWatcher(kanbanRoot);
  }

  // Clean up watcher on deactivation
  context.subscriptions.push({
    dispose: () => {
      taskWatcher?.dispose();
      taskWatcher = null;
    }
  });
}

function startFileWatcher(kanbanRoot: string) {
  if (taskWatcher) {
    taskWatcher.dispose();
  }

  taskWatcher = new TaskWatcher(kanbanRoot);

  taskWatcher.on('event', async () => {
    // Reload tasks and update sidebar
    try {
      const tasks = await loadAllTasks(kanbanRoot);
      sidebarProvider?.updateTasks(tasks);
      KanbanPanel.currentPanel?.updateTasks(tasks);
    } catch (error) {
      console.error('Error reloading tasks after file change:', error);
    }
  });

  taskWatcher.start();
  console.log('Task file watcher started');
}

export function deactivate() {
  taskWatcher?.dispose();
  taskWatcher = null;
  configService.dispose();
  setSidebarProvider(null);
  statusBarItem?.dispose();
  statusBarItem = null;
}

// Export for use by commands
export function getSidebarProvider(): SidebarProvider | null {
  return sidebarProvider;
}

export function restartFileWatcher(kanbanRoot: string) {
  startFileWatcher(kanbanRoot);
  updateStatusBar(kanbanRoot);
}

function attachRunnerProgress(
  runner: RunnerEngine,
  progress: vscode.Progress<{ message?: string; increment?: number }>,
): () => void {
  const onTaskStarted = (event: { task: Task }) => {
    progress.report({ message: `Task started: ${event.task.title}` });
  };
  const onStageStarted = (event: { stage: string; task: Task }) => {
    progress.report({ message: `${event.stage.toUpperCase()}: ${event.task.title}` });
  };
  const onTaskCompleted = (event: { task: Task }) => {
    progress.report({ message: `Completed: ${event.task.title}` });
  };
  const onTaskFailed = (event: { task: Task; error: string }) => {
    progress.report({ message: `Failed: ${event.task.title} (${event.error})` });
  };

  runner.on('taskStarted', onTaskStarted);
  runner.on('stageStarted', onStageStarted);
  runner.on('taskCompleted', onTaskCompleted);
  runner.on('taskFailed', onTaskFailed);

  return () => {
    runner.off('taskStarted', onTaskStarted);
    runner.off('stageStarted', onStageStarted);
    runner.off('taskCompleted', onTaskCompleted);
    runner.off('taskFailed', onTaskFailed);
  };
}

async function executeRunner(
  title: string,
  run: (runner: RunnerEngine) => Promise<RunnerRunResult>,
): Promise<RunnerRunResult> {
  const kanbanRoot = WorkspaceState.kanbanRoot;
  if (!kanbanRoot) {
    throw new Error('Kanban workspace not detected.');
  }

  if (activeRunnerRun) {
    throw new Error('Runner is already active.');
  }

  const runner = new RunnerEngine(kanbanRoot);
  activeRunner = runner;

  const runPromise = vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title,
      cancellable: true,
    },
    async (progress, token) => {
      const detach = attachRunnerProgress(runner, progress);
      token?.onCancellationRequested?.(() => runner.stop());
      try {
        return await run(runner);
      } finally {
        detach();
      }
    },
  );

  activeRunnerRun = runPromise;

  try {
    return await runPromise;
  } finally {
    activeRunnerRun = null;
    activeRunner = null;
  }
}

export async function runTaskWithRunner(task: Task): Promise<RunnerRunResult> {
  return executeRunner('Kanban2Code: Running task…', (runner) => runner.runTask(task));
}

export async function runColumnWithRunner(stage: RunnerPipelineStage): Promise<RunnerRunResult> {
  return executeRunner(`Kanban2Code: Running ${stage} column…`, (runner) => runner.runColumn(stage));
}

export async function runNightShiftWithRunner(): Promise<RunnerRunResult> {
  return executeRunner('Kanban2Code: Running night shift…', async (runner) => {
    const stages: RunnerPipelineStage[] = ['plan', 'code', 'audit'];

    for (const stage of stages) {
      const result = await runner.runColumn(stage);
      if (result.status !== 'completed') {
        return result;
      }
    }

    return { status: 'completed' };
  });
}

export function stopRunnerExecution(): boolean {
  if (!activeRunner) {
    return false;
  }
  activeRunner.stop();
  return true;
}

function updateStatusBar(kanbanRoot: string | null) {
  if (!statusBarItem) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'kanban2code.openBoard';
    statusBarItem.tooltip = 'Open Kanban Board';
  }

  if (kanbanRoot) {
    statusBarItem.text = `$(list-unordered) Kanban`;
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}
