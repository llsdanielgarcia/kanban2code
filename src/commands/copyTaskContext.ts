import vscode from 'vscode';
import type { Task } from '../types/task';
import type { CopyMode } from '../types/copy';
import { findKanbanRoot } from '../workspace/validation';
import { loadTask } from '../services/taskService';
import { buildCopyPayload } from '../services/copyService';

/**
 * Command arguments for copyTaskContext.
 */
export interface CopyTaskContextArgs {
  taskFilePath?: string;
  task?: Task;
  mode?: CopyMode;
}

/**
 * Copies task context to the clipboard.
 *
 * This command can be invoked with:
 * - A task file path
 * - A Task object directly
 * - From the active editor (uses current file)
 *
 * @param args - Command arguments
 */
export async function copyTaskContextCommand(args?: CopyTaskContextArgs): Promise<void> {
  const root = await findKanbanRoot();

  if (!root) {
    vscode.window.showErrorMessage('No .kanban2code workspace found.');
    return;
  }

  let task: Task;
  const mode: CopyMode = args?.mode || 'full_xml';

  // Determine the task to copy
  if (args?.task) {
    task = args.task;
  } else if (args?.taskFilePath) {
    try {
      task = await loadTask(args.taskFilePath, root);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load task: ${error}`);
      return;
    }
  } else {
    // Try to use the active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showErrorMessage('No task selected. Open a task file or provide a task identifier.');
      return;
    }

    const filePath = activeEditor.document.uri.fsPath;
    if (!filePath.endsWith('.md')) {
      vscode.window.showErrorMessage('Active file is not a markdown task file.');
      return;
    }

    try {
      task = await loadTask(filePath, root);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load task from active file: ${error}`);
      return;
    }
  }

  try {
    const result = await buildCopyPayload(task, root, mode);

    await vscode.env.clipboard.writeText(result.content);

    const modeLabel = mode === 'full_xml' ? 'full XML context'
      : mode === 'task_only' ? 'task only'
      : 'context only';

    vscode.window.showInformationMessage(
      `Copied ${modeLabel} for "${result.taskTitle}".`,
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to copy task context: ${error}`);
  }
}
