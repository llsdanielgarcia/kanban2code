import * as fs from 'fs/promises';
import { Task, Stage } from '../types/task';
import { parseTaskFile, serializeTask } from './frontmatter';
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
  // 1. Validate Transition
  if (!isTransitionAllowed(task.stage, newStage)) {
    throw new StageUpdateError(`Transition from '${task.stage}' to '${newStage}' is not allowed.`);
  }

  // 2. Read fresh content (to avoid race conditions/stale data)
  // We re-parse to ensure we have the latest file content for serialization
  const freshTask = await parseTaskFile(task.filePath);
  
  if (freshTask.id !== task.id) {
    throw new StageUpdateError('Task ID mismatch in file. File might have been overwritten.');
  }

  // 3. Update Stage
  freshTask.stage = newStage;

  // 4. Serialize and Write
  const originalContent = await fs.readFile(task.filePath, 'utf-8');
  const newContent = serializeTask(freshTask, originalContent);
  
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
