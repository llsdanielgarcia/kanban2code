import * as vscode from 'vscode';
import { CopyMode } from '../types/copy';
import { Task } from '../types/task';
import { buildContextOnlyPrompt, buildTaskOnlyPrompt, buildXMLPrompt } from './prompt-builder';
import { WorkspaceState } from '../workspace/state';

function resolveRoot(root?: string): string {
  const kanbanRoot = root ?? WorkspaceState.kanbanRoot;
  if (!kanbanRoot) {
    throw new Error('Kanban root is not available.');
  }
  return kanbanRoot;
}

export async function buildCopyPayload(task: Task, mode: CopyMode = 'full_xml', root?: string): Promise<string> {
  switch (mode) {
    case 'full_xml':
      return buildXMLPrompt(task, resolveRoot(root));
    case 'context_only':
      return buildContextOnlyPrompt(task, resolveRoot(root));
    case 'task_only':
      return buildTaskOnlyPrompt(task);
    default:
      throw new Error(`Unsupported copy mode: ${mode}`);
  }
}

export async function copyToClipboard(content: string): Promise<void> {
  await vscode.env.clipboard.writeText(content);
}
