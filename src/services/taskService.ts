import fs from 'fs/promises';
import path from 'path';
import type { Task } from '../types/task';
import { FOLDERS } from '../core/constants';
import { parseTaskFile, stringifyTask, type RawFrontmatter } from './frontmatter';

/**
 * Files that should be excluded from task loading.
 * These are metadata/context files, not tasks.
 */
const EXCLUDED_FILES = ['_context.md', '_project.md', '_phase.md'];

/**
 * Directories that should be excluded from task loading.
 */
const EXCLUDED_DIRS = [
  FOLDERS.templates,
  FOLDERS.agents,
  FOLDERS.archive,
];

/**
 * Checks if a path exists and is a directory.
 */
async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Checks if a file should be treated as a task file.
 */
function isTaskFile(filename: string): boolean {
  if (!filename.endsWith('.md')) {
    return false;
  }
  if (EXCLUDED_FILES.includes(filename)) {
    return false;
  }
  if (filename.startsWith('_')) {
    return false;
  }
  return true;
}

/**
 * Infers project and phase from a task file path.
 *
 * @param filePath - Absolute path to the task file
 * @param root - The .kanban2code root directory
 * @returns Object with project and phase (both may be undefined)
 */
export function inferProjectAndPhase(
  filePath: string,
  root: string,
): { project?: string; phase?: string } {
  const relativePath = path.relative(root, filePath);
  const parts = relativePath.split(path.sep);

  // inbox/task.md -> no project, no phase
  if (parts[0] === FOLDERS.inbox) {
    return {};
  }

  // projects/project-name/task.md -> project, no phase
  // projects/project-name/phase-name/task.md -> project and phase
  if (parts[0] === FOLDERS.projects && parts.length >= 2) {
    const project = parts[1];

    if (parts.length === 3) {
      // Direct project task: projects/project-name/task.md
      return { project };
    }

    if (parts.length === 4) {
      // Phase task: projects/project-name/phase-name/task.md
      const phase = parts[2];
      return { project, phase };
    }
  }

  return {};
}

/**
 * Loads a single task file from disk.
 *
 * @param filePath - Absolute path to the task file
 * @param root - The .kanban2code root directory (for path inference)
 * @returns Task object with inferred project/phase
 */
export async function loadTask(filePath: string, root: string): Promise<Task> {
  const content = await fs.readFile(filePath, 'utf-8');
  const { task } = parseTaskFile(content, filePath);

  // Infer project and phase from path
  const { project, phase } = inferProjectAndPhase(filePath, root);
  if (project) {
    task.project = project;
  }
  if (phase) {
    task.phase = phase;
  }

  return task;
}

/**
 * Loads all markdown task files from a directory (non-recursive).
 *
 * @param dirPath - Directory to load from
 * @param root - The .kanban2code root directory
 * @returns Array of Task objects
 */
async function loadTasksFromDir(dirPath: string, root: string): Promise<Task[]> {
  if (!(await isDirectory(dirPath))) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const tasks: Task[] = [];

  for (const entry of entries) {
    if (entry.isFile() && isTaskFile(entry.name)) {
      try {
        const filePath = path.join(dirPath, entry.name);
        const task = await loadTask(filePath, root);
        tasks.push(task);
      } catch (error) {
        console.warn(`Failed to load task from ${entry.name}:`, error);
      }
    }
  }

  return tasks;
}

/**
 * Loads all tasks from the inbox directory.
 *
 * @param root - The .kanban2code root directory
 * @returns Array of inbox tasks
 */
async function loadInboxTasks(root: string): Promise<Task[]> {
  const inboxPath = path.join(root, FOLDERS.inbox);
  return loadTasksFromDir(inboxPath, root);
}

/**
 * Loads all tasks from a project directory, including phase subdirectories.
 *
 * @param projectPath - Path to the project directory
 * @param root - The .kanban2code root directory
 * @returns Array of project tasks (direct and from phases)
 */
async function loadProjectTasks(projectPath: string, root: string): Promise<Task[]> {
  const tasks: Task[] = [];

  // Load direct project tasks
  const directTasks = await loadTasksFromDir(projectPath, root);
  tasks.push(...directTasks);

  // Load phase subdirectories
  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const phasePath = path.join(projectPath, entry.name);
      const phaseTasks = await loadTasksFromDir(phasePath, root);
      tasks.push(...phaseTasks);
    }
  }

  return tasks;
}

/**
 * Loads all tasks from the projects directory.
 *
 * @param root - The .kanban2code root directory
 * @returns Array of all project tasks
 */
async function loadAllProjectTasks(root: string): Promise<Task[]> {
  const projectsPath = path.join(root, FOLDERS.projects);

  if (!(await isDirectory(projectsPath))) {
    return [];
  }

  const entries = await fs.readdir(projectsPath, { withFileTypes: true });
  const tasks: Task[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_')) {
      const projectPath = path.join(projectsPath, entry.name);
      const projectTasks = await loadProjectTasks(projectPath, root);
      tasks.push(...projectTasks);
    }
  }

  return tasks;
}

/**
 * Loads all tasks from the .kanban2code root directory.
 * This includes inbox tasks and all project/phase tasks.
 *
 * @param root - The .kanban2code root directory path
 * @returns Array of all tasks sorted by order (if present) then title
 */
export async function loadAllTasks(root: string): Promise<Task[]> {
  const [inboxTasks, projectTasks] = await Promise.all([
    loadInboxTasks(root),
    loadAllProjectTasks(root),
  ]);

  const allTasks = [...inboxTasks, ...projectTasks];

  // Sort by order (if present) then by title
  return allTasks.sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    if (typeof a.order === 'number') return -1;
    if (typeof b.order === 'number') return 1;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Saves a task back to disk, preserving unknown frontmatter fields.
 *
 * @param task - The task to save
 * @param preserveUnknown - Optional raw frontmatter to preserve unknown fields
 */
export async function saveTask(
  task: Task,
  preserveUnknown?: RawFrontmatter,
): Promise<void> {
  const content = stringifyTask(task, preserveUnknown);
  await fs.writeFile(task.filePath, content, 'utf-8');
}

/**
 * Creates a new task file.
 *
 * @param filePath - Path where to create the task
 * @param task - Partial task data (at minimum title)
 * @returns The created task
 */
export async function createTask(
  filePath: string,
  task: Partial<Task> & { title: string },
  root: string,
): Promise<Task> {
  const newTask: Task = {
    id: path.basename(filePath, '.md').toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
    filePath,
    title: task.title,
    stage: task.stage || 'inbox',
    content: task.content || `# ${task.title}\n\n`,
    ...(task.tags && { tags: task.tags }),
    ...(task.agent && { agent: task.agent }),
    ...(task.parent && { parent: task.parent }),
    ...(task.contexts && { contexts: task.contexts }),
    created: new Date().toISOString(),
  };

  // Infer project and phase from path
  const { project, phase } = inferProjectAndPhase(filePath, root);
  if (project) {
    newTask.project = project;
  }
  if (phase) {
    newTask.phase = phase;
  }

  await saveTask(newTask);
  return newTask;
}

/**
 * Deletes a task file from disk.
 *
 * @param task - The task to delete
 */
export async function deleteTask(task: Task): Promise<void> {
  await fs.unlink(task.filePath);
}

/**
 * Lists all projects in the workspace.
 *
 * @param root - The .kanban2code root directory
 * @returns Array of project names
 */
export async function listProjects(root: string): Promise<string[]> {
  const projectsPath = path.join(root, FOLDERS.projects);

  if (!(await isDirectory(projectsPath))) {
    return [];
  }

  const entries = await fs.readdir(projectsPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort();
}

/**
 * Lists all phases within a project.
 *
 * @param root - The .kanban2code root directory
 * @param project - Project name
 * @returns Array of phase names
 */
export async function listPhases(root: string, project: string): Promise<string[]> {
  const projectPath = path.join(root, FOLDERS.projects, project);

  if (!(await isDirectory(projectPath))) {
    return [];
  }

  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort();
}
