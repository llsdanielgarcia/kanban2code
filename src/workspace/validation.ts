import * as fs from 'fs/promises';
import * as path from 'path';
import { KANBAN_FOLDER, INBOX_FOLDER, PROJECTS_FOLDER } from '../core/constants';

export type ValidationStatus = 'VALID' | 'MISSING' | 'INVALID' | 'FORBIDDEN';

export interface ValidationResult {
  status: ValidationStatus;
  message?: string;
  rootPath?: string;
}

export async function findKanbanRoot(workspaceRoot: string): Promise<string | null> {
  const targetPath = path.join(workspaceRoot, KANBAN_FOLDER);
  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      return targetPath;
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
  }
  return null;
}

export async function validateKanbanStructure(root: string): Promise<ValidationResult> {
  const kanbanRoot = await findKanbanRoot(root);
  
  if (!kanbanRoot) {
    return { status: 'MISSING', message: 'Kanban folder not found.' };
  }

  // Check required subfolders
  const required = [INBOX_FOLDER, PROJECTS_FOLDER];
  const missing: string[] = [];

  for (const folder of required) {
    try {
      const stats = await fs.stat(path.join(kanbanRoot, folder));
      if (!stats.isDirectory()) {
        missing.push(folder);
      }
    } catch {
      missing.push(folder);
    }
  }

  if (missing.length > 0) {
    return { 
      status: 'INVALID', 
      message: `Missing required folders: ${missing.join(', ')}`,
      rootPath: kanbanRoot
    };
  }

  return { status: 'VALID', rootPath: kanbanRoot };
}

export async function isSafePath(root: string, target: string): Promise<boolean> {
  const relative = path.relative(root, target);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function ensureSafePath(root: string, target: string): Promise<void> {
  if (!(await isSafePath(root, target))) {
    throw new Error(`Path validation failed: '${target}' is outside valid root '${root}'.`);
  }
}
