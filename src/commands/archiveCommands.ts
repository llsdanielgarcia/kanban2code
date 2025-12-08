import * as vscode from 'vscode';
import { findKanbanRoot } from '../workspace/validation';
import {
  archiveTask,
  archiveCompletedInProject,
  archiveProject,
  NotCompletedError,
  ProjectNotCompletedError,
} from '../services/archiveService';
import { loadAllTasks, listProjects } from '../services/taskService';
import type { Task } from '../types/task';

/**
 * Shows a quick pick to select a task from a list.
 */
async function pickTask(tasks: Task[], title: string): Promise<Task | undefined> {
  const items = tasks.map((task) => ({
    label: task.title,
    description: task.project ? `${task.project}${task.phase ? '/' + task.phase : ''}` : 'inbox',
    detail: `Stage: ${task.stage}`,
    task,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: title,
    matchOnDescription: true,
  });

  return selected?.task;
}

/**
 * Shows a quick pick to select a project.
 */
async function pickProject(root: string): Promise<string | undefined> {
  const projects = await listProjects(root);

  if (projects.length === 0) {
    vscode.window.showInformationMessage('No projects found.');
    return undefined;
  }

  return vscode.window.showQuickPick(projects, {
    placeHolder: 'Select a project',
  });
}

/**
 * Command: Archive Task
 * Archives a single completed task.
 */
export async function archiveTaskCommand(): Promise<void> {
  const root = await findKanbanRoot();
  if (!root) {
    vscode.window.showErrorMessage('No .kanban2code workspace found.');
    return;
  }

  const allTasks = await loadAllTasks(root);
  const completedTasks = allTasks.filter((t) => t.stage === 'completed');

  if (completedTasks.length === 0) {
    vscode.window.showInformationMessage('No completed tasks to archive.');
    return;
  }

  const task = await pickTask(completedTasks, 'Select a completed task to archive');
  if (!task) {
    return;
  }

  try {
    const archivePath = await archiveTask(task, root);
    vscode.window.showInformationMessage(`Archived: ${task.title}`);
  } catch (error) {
    if (error instanceof NotCompletedError) {
      vscode.window.showErrorMessage(`Cannot archive: task must be completed first.`);
    } else {
      vscode.window.showErrorMessage(`Failed to archive task: ${error}`);
    }
  }
}

/**
 * Command: Archive Completed in Project
 * Archives all completed tasks in a selected project.
 */
export async function archiveCompletedInProjectCommand(): Promise<void> {
  const root = await findKanbanRoot();
  if (!root) {
    vscode.window.showErrorMessage('No .kanban2code workspace found.');
    return;
  }

  const project = await pickProject(root);
  if (!project) {
    return;
  }

  try {
    const archivedPaths = await archiveCompletedInProject(root, project);

    if (archivedPaths.length === 0) {
      vscode.window.showInformationMessage(`No completed tasks in project "${project}".`);
    } else {
      vscode.window.showInformationMessage(
        `Archived ${archivedPaths.length} completed task(s) from "${project}".`,
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to archive tasks: ${error}`);
  }
}

/**
 * Command: Archive Project
 * Archives an entire project (all tasks must be completed).
 */
export async function archiveProjectCommand(): Promise<void> {
  const root = await findKanbanRoot();
  if (!root) {
    vscode.window.showErrorMessage('No .kanban2code workspace found.');
    return;
  }

  const project = await pickProject(root);
  if (!project) {
    return;
  }

  // Confirm before archiving entire project
  const confirm = await vscode.window.showWarningMessage(
    `Archive entire project "${project}"? All tasks must be completed.`,
    { modal: true },
    'Archive',
  );

  if (confirm !== 'Archive') {
    return;
  }

  try {
    await archiveProject(root, project);
    vscode.window.showInformationMessage(`Archived project: ${project}`);
  } catch (error) {
    if (error instanceof ProjectNotCompletedError) {
      const incomplete = error.incompleteTasks;
      vscode.window.showErrorMessage(
        `Cannot archive: ${incomplete.length} task(s) are not completed.`,
      );
    } else {
      vscode.window.showErrorMessage(`Failed to archive project: ${error}`);
    }
  }
}

/**
 * Registers all archive commands.
 */
export function registerArchiveCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban2code.archiveTask', archiveTaskCommand),
    vscode.commands.registerCommand(
      'kanban2code.archiveCompletedInProject',
      archiveCompletedInProjectCommand,
    ),
    vscode.commands.registerCommand('kanban2code.archiveProject', archiveProjectCommand),
  );
}
