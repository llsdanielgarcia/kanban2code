import * as vscode from 'vscode';
import { WorkspaceState } from '../workspace/state';
import { findTaskById, loadAllTasks } from './scanner';
import type { Task } from '../types/task';

async function deleteFileWithTrashFallback(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.workspace.fs.delete(uri, { useTrash: true });
  } catch {
    await vscode.workspace.fs.delete(uri);
  }
}

export async function deleteTaskById(taskId: string): Promise<Task[] | null> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) {
    vscode.window.showErrorMessage('Kanban workspace not detected.');
    return null;
  }

  if (!taskId) return null;

  const task = await findTaskById(root, taskId);
  if (!task) {
    vscode.window.showErrorMessage('Task not found.');
    return null;
  }

  const choice = await vscode.window.showWarningMessage(
    `Delete task "${task.title}"?`,
    { modal: true },
    'Delete',
  );

  if (choice !== 'Delete') return null;

  try {
    await deleteFileWithTrashFallback(vscode.Uri.file(task.filePath));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to delete task: ${message}`);
    return null;
  }

  return loadAllTasks(root);
}

