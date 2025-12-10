import * as fs from 'fs/promises';
import { Task, Stage } from '../types/task';
import { parseTaskFile, stringifyTaskFile } from './frontmatter';
import { isTransitionAllowed } from '../core/rules';
import { findTaskById } from './scanner';
import { WorkspaceState } from '../workspace/state';

export class StageUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StageUpdateError';
  }
}

export async function updateTaskStage(task: Task, newStage: Stage): Promise<Task> {
  // 1. Read fresh content (to avoid race conditions/stale data)
  const freshTask = await parseTaskFile(task.filePath);
  
  if (freshTask.id !== task.id) {
    throw new StageUpdateError('Task ID mismatch in file. File might have been overwritten.');
  }

  // 2. Validate Transition using current on-disk stage
  if (!isTransitionAllowed(freshTask.stage, newStage)) {
    throw new StageUpdateError(`Transition from '${freshTask.stage}' to '${newStage}' is not allowed.`);
  }

  // 3. Update Stage
  freshTask.stage = newStage;

  // 4. Serialize and Write
  const originalContent = await fs.readFile(task.filePath, 'utf-8');
  const newContent = stringifyTaskFile(freshTask, originalContent);
  
  await fs.writeFile(task.filePath, newContent, 'utf-8');

  return freshTask;
}

export async function changeStageAndReload(taskId: string, newStage: Stage): Promise<Task> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) {
    throw new Error('Kanban root not found in state.');
  }

  const task = await findTaskById(root, taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return updateTaskStage(task, newStage);
}
