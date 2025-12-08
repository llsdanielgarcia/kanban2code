import fs from 'fs/promises';
import path from 'path';
import type { Task } from '../types/task';
import { FOLDERS } from '../core/constants';
import { loadAllTasks } from './taskService';

/**
 * Error thrown when trying to archive a task that is not completed.
 */
export class NotCompletedError extends Error {
  constructor(public readonly task: Task) {
    super(`Cannot archive task '${task.title}': task must be in 'completed' stage (current: '${task.stage}')`);
    this.name = 'NotCompletedError';
  }
}

/**
 * Error thrown when trying to archive a project that has incomplete tasks.
 */
export class ProjectNotCompletedError extends Error {
  constructor(
    public readonly project: string,
    public readonly incompleteTasks: Task[],
  ) {
    super(
      `Cannot archive project '${project}': ${incompleteTasks.length} task(s) are not completed`,
    );
    this.name = 'ProjectNotCompletedError';
  }
}

/**
 * Ensures a directory exists, creating it recursively if needed.
 */
async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Computes the archive destination path for a task.
 *
 * Structure mirrors the source:
 * - inbox/task.md → _archive/inbox/task.md
 * - projects/project/task.md → _archive/projects/project/task.md
 * - projects/project/phase/task.md → _archive/projects/project/phase/task.md
 *
 * @param task - The task to archive
 * @param root - The .kanban2code root directory
 * @returns The destination path in the archive
 */
export function getArchivePath(task: Task, root: string): string {
  const relativePath = path.relative(root, task.filePath);
  return path.join(root, FOLDERS.archive, relativePath);
}

/**
 * Archives a single task by moving it to the archive directory.
 *
 * @param task - The task to archive (must be in 'completed' stage)
 * @param root - The .kanban2code root directory
 * @throws NotCompletedError if task is not completed
 */
export async function archiveTask(task: Task, root: string): Promise<string> {
  if (task.stage !== 'completed') {
    throw new NotCompletedError(task);
  }

  const archivePath = getArchivePath(task, root);
  const archiveDir = path.dirname(archivePath);

  // Ensure archive directory exists
  await ensureDir(archiveDir);

  // Move the file
  await fs.rename(task.filePath, archivePath);

  return archivePath;
}

/**
 * Archives all completed tasks in a project.
 *
 * @param root - The .kanban2code root directory
 * @param project - The project name
 * @returns Array of archived task paths
 */
export async function archiveCompletedInProject(
  root: string,
  project: string,
): Promise<string[]> {
  const allTasks = await loadAllTasks(root);
  const projectTasks = allTasks.filter((t) => t.project === project);
  const completedTasks = projectTasks.filter((t) => t.stage === 'completed');

  const archivedPaths: string[] = [];
  for (const task of completedTasks) {
    const archivePath = await archiveTask(task, root);
    archivedPaths.push(archivePath);
  }

  return archivedPaths;
}

/**
 * Archives an entire project directory.
 * All tasks in the project must be completed.
 *
 * @param root - The .kanban2code root directory
 * @param project - The project name
 * @throws ProjectNotCompletedError if any tasks are not completed
 */
export async function archiveProject(root: string, project: string): Promise<string> {
  const allTasks = await loadAllTasks(root);
  const projectTasks = allTasks.filter((t) => t.project === project);

  // Check all tasks are completed
  const incompleteTasks = projectTasks.filter((t) => t.stage !== 'completed');
  if (incompleteTasks.length > 0) {
    throw new ProjectNotCompletedError(project, incompleteTasks);
  }

  const projectPath = path.join(root, FOLDERS.projects, project);
  const archivePath = path.join(root, FOLDERS.archive, FOLDERS.projects, project);

  // Ensure archive directory parent exists
  await ensureDir(path.dirname(archivePath));

  // Move the entire project directory
  await fs.rename(projectPath, archivePath);

  return archivePath;
}

/**
 * Restores a task from the archive back to its original location.
 *
 * @param archivedPath - Path to the archived task file
 * @param root - The .kanban2code root directory
 * @returns The restored task path
 */
export async function restoreTask(archivedPath: string, root: string): Promise<string> {
  const archiveRoot = path.join(root, FOLDERS.archive);
  const relativePath = path.relative(archiveRoot, archivedPath);
  const originalPath = path.join(root, relativePath);
  const originalDir = path.dirname(originalPath);

  // Ensure original directory exists
  await ensureDir(originalDir);

  // Move back
  await fs.rename(archivedPath, originalPath);

  return originalPath;
}

/**
 * Lists all archived tasks.
 *
 * @param root - The .kanban2code root directory
 * @returns Array of archived task file paths
 */
export async function listArchivedTasks(root: string): Promise<string[]> {
  const archivePath = path.join(root, FOLDERS.archive);

  try {
    await fs.access(archivePath);
  } catch {
    return [];
  }

  const archivedFiles: string[] = [];

  async function scanDir(dirPath: string): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await scanDir(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_')) {
        archivedFiles.push(entryPath);
      }
    }
  }

  await scanDir(archivePath);
  return archivedFiles;
}

/**
 * Clears the entire archive.
 * Use with caution - this permanently deletes archived content.
 *
 * @param root - The .kanban2code root directory
 */
export async function clearArchive(root: string): Promise<void> {
  const archivePath = path.join(root, FOLDERS.archive);

  try {
    await fs.rm(archivePath, { recursive: true, force: true });
    await ensureDir(archivePath);
  } catch {
    // Archive might not exist
  }
}
