import * as vscode from 'vscode';
import matter from 'gray-matter';
import { WorkspaceState } from '../workspace/state';
import { findTaskById, loadAllTasks } from './scanner';
import { STAGES } from '../core/constants';
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

