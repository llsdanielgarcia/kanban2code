import * as fs from 'fs/promises';
import * as path from 'path';
import { Task } from '../types/task';
import { ARCHIVE_FOLDER, PROJECTS_FOLDER } from '../core/constants';
import { updateTaskStage } from './stage-manager';

export async function archiveTask(task: Task, kanbanRoot: string): Promise<void> {
  if (task.stage !== 'completed') {
    throw new Error(`Cannot archive task '${task.title}': Stage must be 'completed', is '${task.stage}'.`);
  }

  // Determine target path
  let relativePath = '';
  
  // Logic: Replicate structure inside _archive
  // If task is in inbox/t.md -> _archive/inbox/t.md
  // If task is in projects/p1/t.md -> _archive/projects/p1/t.md
  // If task is in projects/p1/phase/t.md -> _archive/projects/p1/phase/t.md
  
  // We can derive relative path from kanbanRoot
  relativePath = path.relative(kanbanRoot, task.filePath);
  
  const targetPath = path.join(kanbanRoot, ARCHIVE_FOLDER, relativePath);
  const targetDir = path.dirname(targetPath);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.rename(task.filePath, targetPath);
}

export async function archiveProject(kanbanRoot: string, projectName: string): Promise<void> {
  const projectPath = path.join(kanbanRoot, PROJECTS_FOLDER, projectName);
  const targetPath = path.join(kanbanRoot, ARCHIVE_FOLDER, PROJECTS_FOLDER, projectName);

  try {
    await fs.access(projectPath);
  } catch {
    throw new Error(`Project '${projectName}' not found.`);
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.rename(projectPath, targetPath);
}

// Helper to mark complete AND archive
export async function completeAndArchiveTask(task: Task, kanbanRoot: string): Promise<void> {
  const updated = await updateTaskStage(task, 'completed');
  await archiveTask(updated, kanbanRoot);
}
