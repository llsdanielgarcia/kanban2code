import fg from 'fast-glob';
import * as path from 'path';
import { parseTaskFile } from './frontmatter';
import { Task, Stage } from '../types/task';
import { INBOX_FOLDER, PROJECTS_FOLDER } from '../core/constants';

export async function findAllTaskFiles(kanbanRoot: string): Promise<string[]> {
  // We want to find markdown task files primarily in 'inbox' and 'projects'.
  // Additionally, we support "phase-*" folders at the kanban root to allow
  // phase-scoped task groupings without requiring a project.
  
  const patterns = [
    path.join(kanbanRoot, INBOX_FOLDER, '*.md'),
    path.join(kanbanRoot, PROJECTS_FOLDER, '**', '*.md'),
    path.join(kanbanRoot, 'phase-*', '*.md'),
  ];

  // fast-glob only supports forward slashes, even on Windows
  const normalizePattern = (p: string) => p.split(path.sep).join('/');
  
  const files = await fg(patterns.map(normalizePattern), {
    ignore: ['**/_context.md'],
    absolute: true,
    cwd: kanbanRoot,
  });

  return files;
}

export async function loadAllTasks(kanbanRoot: string): Promise<Task[]> {
  const files = await findAllTaskFiles(kanbanRoot);
  
  const tasks: Task[] = [];
  const errors: Error[] = [];

  // Parse in parallel
  await Promise.all(
    files.map(async (file) => {
      try {
        const task = await parseTaskFile(file);
        tasks.push(task);
      } catch (err: any) {
        console.error(`Failed to load task: ${file}`, err);
        errors.push(err);
      }
    })
  );

  return sortTasks(tasks);
}

/**
 * Sort tasks deterministically: by `order` ascending (undefined last),
 * then by filename (task id) as tiebreaker.
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Primary: order field ascending, undefined last
    const aOrder = a.order ?? Infinity;
    const bOrder = b.order ?? Infinity;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    // Tiebreaker: filename (id) lexicographic
    return a.id.localeCompare(b.id);
  });
}

/**
 * Filter tasks by stage and return in deterministic order.
 * Useful for runner consumption where "topmost task" must be stable.
 */
export function getOrderedTasksForStage(tasks: Task[], stage: Stage): Task[] {
  const filtered = tasks.filter(t => t.stage === stage);
  return sortTasks(filtered);
}

export async function findTaskById(kanbanRoot: string, taskId: string): Promise<Task | undefined> {
  const tasks = await loadAllTasks(kanbanRoot);
  return tasks.find(t => t.id === taskId);
}
