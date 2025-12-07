import fs from 'fs/promises';
import path from 'path';
import vscode from 'vscode';
import { KANBAN_ROOT } from '../core/constants';

export async function findKanbanRoot(
  folders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders,
): Promise<string | null> {
  if (!folders?.length) {
    return null;
  }

  for (const folder of folders) {
    const candidate = path.join(folder.uri.fsPath, KANBAN_ROOT);
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        return candidate;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        // Surface unexpected errors for visibility while still continuing the search.
        // eslint-disable-next-line no-console
        console.warn('Error while checking kanban root', error);
      }
    }
  }

  return null;
}

export function ensurePathInsideRoot(targetPath: string, root: string): void {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(targetPath);
  if (!normalizedTarget.startsWith(normalizedRoot)) {
    throw new Error(`Unsafe path outside kanban root: ${normalizedTarget}`);
  }
}

export function pickDefaultWorkspaceFolder(
  folders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders,
): vscode.WorkspaceFolder | null {
  if (!folders?.length) {
    return null;
  }
  return folders[0];
}
