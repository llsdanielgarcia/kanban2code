import fs from 'fs/promises';
import path from 'path';
import vscode from 'vscode';
import { KANBAN_ROOT, FOLDERS } from '../core/constants';

/**
 * Validation status for workspace detection.
 */
export enum ValidationStatus {
  /** Workspace has a valid .kanban2code directory */
  Valid = 'valid',
  /** No .kanban2code directory found */
  Missing = 'missing',
  /** .kanban2code exists but is not a valid directory */
  Invalid = 'invalid',
  /** Path is outside the allowed workspace */
  Forbidden = 'forbidden',
}

/**
 * Result of workspace validation.
 */
export interface ValidationResult {
  status: ValidationStatus;
  root: string | null;
  message: string;
}

/**
 * Error messages for each validation status.
 */
const STATUS_MESSAGES: Record<ValidationStatus, string> = {
  [ValidationStatus.Valid]: 'Workspace is valid',
  [ValidationStatus.Missing]: 'No .kanban2code directory found. Run "Scaffold Workspace" to create one.',
  [ValidationStatus.Invalid]: '.kanban2code exists but is not a valid directory',
  [ValidationStatus.Forbidden]: 'Path is outside the workspace root',
};

/**
 * Finds the .kanban2code root directory in the workspace.
 */
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

/**
 * Validates the workspace and returns detailed status.
 */
export async function validateWorkspace(
  folders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders,
): Promise<ValidationResult> {
  if (!folders?.length) {
    return {
      status: ValidationStatus.Missing,
      root: null,
      message: 'No workspace folder open',
    };
  }

  for (const folder of folders) {
    const candidate = path.join(folder.uri.fsPath, KANBAN_ROOT);
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        return {
          status: ValidationStatus.Valid,
          root: candidate,
          message: STATUS_MESSAGES[ValidationStatus.Valid],
        };
      } else {
        return {
          status: ValidationStatus.Invalid,
          root: null,
          message: STATUS_MESSAGES[ValidationStatus.Invalid],
        };
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Error while checking kanban root', error);
      }
    }
  }

  return {
    status: ValidationStatus.Missing,
    root: null,
    message: STATUS_MESSAGES[ValidationStatus.Missing],
  };
}

/**
 * Ensures a path is inside the kanban root directory.
 * Throws an error if the path is outside the root.
 */
export function ensurePathInsideRoot(targetPath: string, root: string): void {
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(targetPath);
  if (!normalizedTarget.startsWith(normalizedRoot + path.sep) && normalizedTarget !== normalizedRoot) {
    throw new Error(`Unsafe path outside kanban root: ${normalizedTarget}`);
  }
}

/**
 * Validates a path and returns the validation status.
 */
export function validatePath(targetPath: string, root: string): ValidationStatus {
  try {
    ensurePathInsideRoot(targetPath, root);
    return ValidationStatus.Valid;
  } catch {
    return ValidationStatus.Forbidden;
  }
}

/**
 * Checks if a path is inside an excluded directory (templates, agents, archive).
 */
export function isExcludedPath(targetPath: string, root: string): boolean {
  const relativePath = path.relative(root, targetPath);
  const firstPart = relativePath.split(path.sep)[0];
  return [FOLDERS.templates, FOLDERS.agents, FOLDERS.archive].includes(firstPart);
}

/**
 * Checks if a path is a valid task location.
 */
export function isValidTaskPath(targetPath: string, root: string): boolean {
  if (validatePath(targetPath, root) !== ValidationStatus.Valid) {
    return false;
  }
  if (isExcludedPath(targetPath, root)) {
    return false;
  }
  return true;
}

/**
 * Guards a filesystem write operation.
 * Throws if the path is outside the root or in an excluded directory.
 */
export function guardWrite(targetPath: string, root: string): void {
  ensurePathInsideRoot(targetPath, root);
  if (isExcludedPath(targetPath, root)) {
    throw new Error(`Cannot write to excluded directory: ${targetPath}`);
  }
}

/**
 * Picks the default workspace folder.
 */
export function pickDefaultWorkspaceFolder(
  folders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders,
): vscode.WorkspaceFolder | null {
  if (!folders?.length) {
    return null;
  }
  return folders[0];
}

/**
 * Gets the workspace folder path, or null if none.
 */
export function getWorkspacePath(
  folders: readonly vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders,
): string | null {
  const folder = pickDefaultWorkspaceFolder(folders);
  return folder?.uri.fsPath ?? null;
}
