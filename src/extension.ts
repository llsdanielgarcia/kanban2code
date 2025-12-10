import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { findKanbanRoot } from './workspace/validation';
import { WorkspaceState } from './workspace/state';
import { SidebarProvider } from './webview/SidebarProvider';

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
  } else {
    console.log('Kanban2Code not found in workspace.');
  }

  // 2. Register Sidebar Provider
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
  );

  // Handle messages from sidebar (e.g., "Create Kanban")
  // Note: Actual message handling is inside resolveWebviewView usually, 
  // but we can wire it up if the provider exposes an event or we do it inside the provider.
  // For simplicity, let's update SidebarProvider to handle it internally or expose it.
  // We'll leave it to the provider's internal logic for now, but we need to ensure 
  // the provider calls the command.
  
  // 3. Register Commands
  registerCommands(context);
}

export function deactivate() {}
