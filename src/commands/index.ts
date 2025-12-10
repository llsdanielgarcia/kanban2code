import * as vscode from 'vscode';
import { KanbanPanel } from '../webview/KanbanPanel';
import { scaffoldWorkspace } from '../services/scaffolder';
import { WorkspaceState } from '../workspace/state';
import { KANBAN_FOLDER } from '../core/constants';
import * as path from 'path';

export function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban2code.openBoard', () => {
      KanbanPanel.createOrShow(context.extensionUri);
    }),
    vscode.commands.registerCommand('kanban2code.newTask', () => {
      vscode.window.showInformationMessage('New Task command triggered (Not implemented)');
    }),
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

        vscode.window.showInformationMessage('Kanban2Code initialized successfully!');
        
        // Ideally we trigger a sidebar refresh here, but that requires an event emitter.
        // For MVP/Phase 0, user might need to reload or we add a reload command.
        // Or we can expose a refresh method on SidebarProvider if we had access to the instance.
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to scaffold: ${error.message}`);
      }
    }),
  );
}
