import * as vscode from 'vscode';
import * as path from 'path';
import matter from 'gray-matter';
import { WorkspaceState } from '../workspace/state';
import { findTaskById, loadAllTasks } from './scanner';
import { STAGES } from '../core/constants';
import { stringifyTaskFile } from './frontmatter';
import type { Task } from '../types/task';

export function validateTaskFileContent(content: string): void {
  const parsed = matter(content);
  const data = (parsed.data ?? {}) as Record<string, unknown>;

  if (data.stage !== undefined) {
    if (typeof data.stage !== 'string' || !STAGES.includes(data.stage as any)) {
      throw new Error(`Invalid frontmatter: "stage" must be one of ${STAGES.join(', ')}`);
    }
  }

  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    throw new Error('Invalid frontmatter: "tags" must be an array');
  }

  if (data.contexts !== undefined && !Array.isArray(data.contexts)) {
    throw new Error('Invalid frontmatter: "contexts" must be an array');
  }
}

export async function loadTaskContentById(taskId: string): Promise<{ task: Task; content: string }> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) {
    throw new Error('Kanban workspace not detected.');
  }
  if (!taskId) {
    throw new Error('Missing taskId.');
  }

  const task = await findTaskById(root, taskId);
  if (!task) {
    throw new Error('Task not found.');
  }

  const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(task.filePath));
  const content = new TextDecoder('utf-8').decode(raw);
  return { task, content };
}

export async function saveTaskContentById(taskId: string, content: string): Promise<Task[]> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) {
    throw new Error('Kanban workspace not detected.');
  }
  if (!taskId) {
    throw new Error('Missing taskId.');
  }

  const task = await findTaskById(root, taskId);
  if (!task) {
    throw new Error('Task not found.');
  }

  validateTaskFileContent(content);

  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(task.filePath),
    new TextEncoder().encode(content),
  );

  return loadAllTasks(root);
}

export async function saveTaskWithMetadata(
  taskId: string,
  content: string,
  metadata: {
    title: string;
    location: { type: 'inbox' } | { type: 'project'; project: string; phase?: string };
    agent: string | null;
    contexts: string[];
    tags: string[];
  }
): Promise<Task[]> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) throw new Error('Kanban workspace not detected.');
  if (!taskId) throw new Error('Missing taskId.');

  const task = await findTaskById(root, taskId);
  if (!task) throw new Error('Task not found.');

  // Parse the content to extract body (without frontmatter)
  const parsed = matter(content);
  const body = parsed.content;

  // Determine if location changed
  const currentLocation = task.project
    ? { type: 'project' as const, project: task.project, phase: task.phase }
    : { type: 'inbox' as const };

  const locationChanged = JSON.stringify(currentLocation) !== JSON.stringify(metadata.location);
  let targetPath = task.filePath;

  if (locationChanged) {
    const fileName = path.basename(task.filePath);

    if (metadata.location.type === 'inbox') {
      targetPath = path.join(root, 'inbox', fileName);
    } else {
      const { project, phase } = metadata.location;
      targetPath = phase
        ? path.join(root, 'projects', project, phase, fileName)
        : path.join(root, 'projects', project, fileName);
    }

    // Ensure target directory exists
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(targetPath)));
  }

  // Build updated task object
  const updatedTask: Task = {
    ...task,
    title: metadata.title,
    agent: metadata.agent || undefined,
    contexts: metadata.contexts.length > 0 ? metadata.contexts : undefined,
    tags: metadata.tags.length > 0 ? metadata.tags : undefined,
    content: body,
  };

  // Read original content to preserve any extra frontmatter fields
  const raw = await vscode.workspace.fs.readFile(vscode.Uri.file(task.filePath));
  const originalContent = new TextDecoder('utf-8').decode(raw);
  const serialized = stringifyTaskFile(updatedTask, originalContent);

  // Write to target path
  await vscode.workspace.fs.writeFile(vscode.Uri.file(targetPath), new TextEncoder().encode(serialized));

  // If location changed, delete the old file
  if (locationChanged && targetPath !== task.filePath) {
    await vscode.workspace.fs.delete(vscode.Uri.file(task.filePath));
  }

  return loadAllTasks(root);
}
