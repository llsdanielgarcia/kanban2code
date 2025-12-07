import vscode from 'vscode';
import { openBoardCommand } from './commands/openBoard';
import { newTaskCommand } from './commands/newTask';
import { scaffoldWorkspaceCommand } from './commands/scaffoldWorkspace';
import { SidebarProvider } from './webview/SidebarProvider';
import { findKanbanRoot } from './workspace/validation';

export async function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider),
    vscode.commands.registerCommand('kanban2code.openBoard', () => openBoardCommand(context)),
    vscode.commands.registerCommand('kanban2code.newTask', () => newTaskCommand()),
    vscode.commands.registerCommand('kanban2code.scaffoldWorkspace', () => scaffoldWorkspaceCommand()),
  );

  const root = await findKanbanRoot();
  await context.workspaceState.update('kanban2code.root', root);
}

export function deactivate() {}
