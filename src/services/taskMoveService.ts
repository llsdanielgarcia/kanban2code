import fs from 'fs/promises';
import type { Task, Stage } from '../types/task';
import { STAGES } from '../core/constants';
import { parseTaskFile, stringifyTask } from './frontmatter';
import { loadTask } from './taskService';

/**
 * Defines allowed forward stage transitions (default mode).
 * Regressions require explicit allowRegressions flag.
 */
const FORWARD_TRANSITIONS: Record<Stage, Stage[]> = {
  inbox: ['plan', 'code'],
  plan: ['code'],
  code: ['audit'],
  audit: ['completed'],
  completed: [], // No stage transitions from completed (only archive)
};

/**
 * Defines allowed backward stage transitions (regressions).
 * Only allowed when explicitly requested.
 */
const BACKWARD_TRANSITIONS: Record<Stage, Stage[]> = {
  inbox: [],
  plan: ['inbox'],
  code: ['plan'],
  audit: ['code'],
  completed: [], // Cannot regress from completed
};

/**
 * Error thrown when a stage transition is not allowed.
 */
export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: Stage,
    public readonly to: Stage,
  ) {
    super(`Invalid transition from '${from}' to '${to}'`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Error thrown when a stage value is invalid.
 */
export class InvalidStageError extends Error {
  constructor(public readonly stage: string) {
    super(`Invalid stage: '${stage}'. Must be one of: ${STAGES.join(', ')}`);
    this.name = 'InvalidStageError';
  }
}

/**
 * Validates that a string is a valid Stage value.
 */
export function isValidStage(value: string): value is Stage {
  return STAGES.includes(value as Stage);
}

/**
 * Options for stage transition validation.
 */
export interface TransitionOptions {
  /** Allow backward transitions (regressions). Default: false */
  allowRegressions?: boolean;
}

/**
 * Checks if a stage transition is allowed.
 *
 * @param from - Current stage
 * @param to - Target stage
 * @param options - Transition options
 * @returns true if the transition is allowed
 */
export function isTransitionAllowed(
  from: Stage,
  to: Stage,
  options: TransitionOptions = {},
): boolean {
  // Same stage is always allowed (no-op)
  if (from === to) {
    return true;
  }

  // Check forward transitions
  if (FORWARD_TRANSITIONS[from].includes(to)) {
    return true;
  }

  // Check backward transitions only if explicitly allowed
  if (options.allowRegressions && BACKWARD_TRANSITIONS[from].includes(to)) {
    return true;
  }

  return false;
}

/**
 * Gets the list of valid forward target stages from a given stage.
 *
 * @param from - Current stage
 * @returns Array of stages that can be transitioned to (forward only)
 */
export function getValidTransitions(from: Stage): Stage[] {
  return [...FORWARD_TRANSITIONS[from]];
}

/**
 * Gets the list of all valid target stages including regressions.
 *
 * @param from - Current stage
 * @returns Array of all stages that can be transitioned to
 */
export function getAllValidTransitions(from: Stage): Stage[] {
  return [...FORWARD_TRANSITIONS[from], ...BACKWARD_TRANSITIONS[from]];
}

/**
 * Validates a stage transition and throws if invalid.
 *
 * @param from - Current stage
 * @param to - Target stage
 * @param options - Transition options
 * @throws InvalidTransitionError if transition is not allowed
 * @throws InvalidStageError if either stage is invalid
 */
export function validateTransition(
  from: Stage,
  to: Stage,
  options: TransitionOptions = {},
): void {
  if (!isValidStage(from)) {
    throw new InvalidStageError(from);
  }
  if (!isValidStage(to)) {
    throw new InvalidStageError(to);
  }
  if (!isTransitionAllowed(from, to, options)) {
    throw new InvalidTransitionError(from, to);
  }
}

/**
 * Moves a task to a new stage by updating its frontmatter.
 * The file is read, stage updated, and written back.
 *
 * @param task - The task to move
 * @param newStage - The target stage
 * @param options - Transition options (allowRegressions)
 * @throws InvalidTransitionError if transition is not allowed
 * @throws InvalidStageError if stage is invalid
 */
export async function moveTaskToStage(
  task: Task,
  newStage: Stage,
  options: TransitionOptions = {},
): Promise<void> {
  // Validate the transition
  validateTransition(task.stage, newStage, options);

  // No-op if same stage
  if (task.stage === newStage) {
    return;
  }

  // Read the current file content to preserve unknown fields
  const content = await fs.readFile(task.filePath, 'utf-8');
  const { rawFrontmatter } = parseTaskFile(content, task.filePath);

  // Update the stage
  task.stage = newStage;

  // Write back with preserved unknown fields
  const updatedContent = stringifyTask(task, rawFrontmatter);
  await fs.writeFile(task.filePath, updatedContent, 'utf-8');
}

/**
 * Advances a task to the next logical stage.
 * Follows the typical workflow: inbox → plan → code → audit → completed
 *
 * @param task - The task to advance
 * @returns The new stage, or null if cannot advance
 */
export function getNextStage(currentStage: Stage): Stage | null {
  const progression: Record<Stage, Stage | null> = {
    inbox: 'plan',
    plan: 'code',
    code: 'audit',
    audit: 'completed',
    completed: null,
  };
  return progression[currentStage];
}

/**
 * Gets the previous stage (for sending back/rework).
 *
 * @param currentStage - The current stage
 * @returns The previous stage, or null if at the beginning
 */
export function getPreviousStage(currentStage: Stage): Stage | null {
  const regression: Record<Stage, Stage | null> = {
    inbox: null,
    plan: 'inbox',
    code: 'plan',
    audit: 'code',
    completed: null, // Cannot regress from completed
  };
  return regression[currentStage];
}

/**
 * Advances a task to the next stage in the workflow.
 *
 * @param task - The task to advance
 * @throws InvalidTransitionError if cannot advance (at completed)
 */
export async function advanceTask(task: Task): Promise<Stage> {
  const nextStage = getNextStage(task.stage);
  if (!nextStage) {
    throw new InvalidTransitionError(task.stage, task.stage);
  }
  await moveTaskToStage(task, nextStage);
  return nextStage;
}

/**
 * Sends a task back to the previous stage (for rework).
 * Requires explicit allowRegressions flag.
 *
 * @param task - The task to send back
 * @throws InvalidTransitionError if cannot go back (at inbox or completed)
 */
export async function sendTaskBack(task: Task): Promise<Stage> {
  const prevStage = getPreviousStage(task.stage);
  if (!prevStage) {
    throw new InvalidTransitionError(task.stage, task.stage);
  }
  await moveTaskToStage(task, prevStage, { allowRegressions: true });
  return prevStage;
}

/**
 * Result of a stage change operation with the updated task.
 */
export interface StageChangeResult {
  task: Task;
  previousStage: Stage;
  newStage: Stage;
}

/**
 * Higher-level helper for UI: changes stage and reloads the task from disk.
 * Returns the updated task so the UI can refresh its state.
 *
 * @param taskId - The task ID (used for identification in the result)
 * @param filePath - Path to the task file
 * @param newStage - The target stage
 * @param root - The .kanban2code root directory
 * @param options - Transition options
 * @returns The updated task with new stage
 * @throws InvalidTransitionError if transition is not allowed
 */
export async function changeStageAndReload(
  taskId: string,
  filePath: string,
  newStage: Stage,
  root: string,
  options: TransitionOptions = {},
): Promise<StageChangeResult> {
  // Load the current task
  const task = await loadTask(filePath, root);
  const previousStage = task.stage;

  // Perform the stage change
  await moveTaskToStage(task, newStage, options);

  // Reload to get the updated task
  const updatedTask = await loadTask(filePath, root);

  return {
    task: updatedTask,
    previousStage,
    newStage,
  };
}
