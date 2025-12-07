import vscode from 'vscode';
import { BoardPanel } from '../webview/BoardPanel';
import { scaffoldWorkspace } from '../workspace/scaffolder';
import { findKanbanRoot } from '../workspace/validation';

export async function openBoardCommand(context: vscode.ExtensionContext): Promise<void> {
  const root = await findKanbanRoot();

  if (!root) {
    const selection = await vscode.window.showInformationMessage(
      'No .kanban2code workspace found. Scaffold one?',
      'Scaffold workspace',
    );
    if (selection === 'Scaffold workspace') {
      const newRoot = await scaffoldWorkspace();
      BoardPanel.createOrShow(context, newRoot);
      return;
    }
    return;
  }

  BoardPanel.createOrShow(context, root);
}
