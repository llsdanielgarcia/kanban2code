import vscode from 'vscode';
import { scaffoldWorkspace } from '../workspace/scaffolder';

export async function scaffoldWorkspaceCommand(): Promise<void> {
  const root = await scaffoldWorkspace();
  vscode.window.showInformationMessage(`Scaffolded Kanban2Code workspace at ${root}`);
}
