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

let taskWatcher: TaskWatcher | null = null;
let sidebarProvider: SidebarProvider | null = null;

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
  } else {
    console.log('Kanban2Code not found in workspace.');
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
}

// Export for use by commands
export function getSidebarProvider(): SidebarProvider | null {
  return sidebarProvider;
}

export function restartFileWatcher(kanbanRoot: string) {
  startFileWatcher(kanbanRoot);
}
