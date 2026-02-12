import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { Task, Stage } from '../types/task';
import { parseTaskFile, stringifyTaskFile } from './frontmatter';
import { isTransitionAllowed } from '../core/rules';
import { findTaskById } from './scanner';
import { WorkspaceState } from '../workspace/state';
import { INBOX_FOLDER, PROJECTS_FOLDER, AGENTS_FOLDER } from '../core/constants';
import { movePath } from './fs-move';
import { configService } from './config';

interface AgentInfo {
  id: string;
  name: string;
  stage?: string;
}

/**
 * List all agents with their frontmatter info (id from filename, name and stage from frontmatter).
 */
async function listAgentsWithStage(kanbanRoot: string): Promise<AgentInfo[]> {
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  const agents: AgentInfo[] = [];

  try {
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      const filePath = path.join(agentsDir, entry.name);
      const id = path.basename(entry.name, '.md');

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        agents.push({
          id,
          name: typeof parsed.data.name === 'string' ? parsed.data.name : id,
          stage: typeof parsed.data.stage === 'string' ? parsed.data.stage : undefined,
        });
      } catch {
        agents.push({ id, name: id });
      }
    }
  } catch {
    return [];
  }

  return agents.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Get the default agent ID for a given stage.
 * Returns the first agent (by id sort) whose frontmatter `stage` matches the target stage.
 * Returns undefined if no agent is found for the stage.
 */
export async function getDefaultAgentForStage(
  kanbanRoot: string,
  stage: Stage,
): Promise<string | undefined> {
  if (stage === 'inbox' || stage === 'completed') {
    return undefined;
  }

  const agents = await listAgentsWithStage(kanbanRoot);
  const match = agents.find((a) => a.stage === stage);
  return match?.id;
}

/**
 * Get the default provider for an agent name from providerDefaults config.
 */
export function getDefaultProviderForAgent(agentName: string): string | undefined {
  return configService.getProviderDefault(agentName);
}

/**
 * Determine whether the task's agent should be auto-updated on stage transition.
 * Only update if:
 * - Current agent is unset, OR
 * - Current agent matches the default agent for the *current* stage (meaning it wasn't manually assigned)
 */
async function shouldAutoUpdateAgent(
  kanbanRoot: string,
  currentAgent: string | undefined,
  currentStage: Stage,
): Promise<boolean> {
  if (!currentAgent) return true;

  const currentDefault = await getDefaultAgentForStage(kanbanRoot, currentStage);
  return currentAgent === currentDefault;
}

export class StageUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StageUpdateError';
  }
}

export async function updateTaskStage(
  task: Task,
  newStage: Stage,
  kanbanRoot?: string,
): Promise<Task> {
  // 1. Read fresh content (to avoid race conditions/stale data)
  const freshTask = await parseTaskFile(task.filePath);

  if (freshTask.id !== task.id) {
    throw new StageUpdateError('Task ID mismatch in file. File might have been overwritten.');
  }

  // 2. Validate Transition using current on-disk stage
  if (!isTransitionAllowed(freshTask.stage, newStage)) {
    throw new StageUpdateError(
      `Transition from '${freshTask.stage}' to '${newStage}' is not allowed.`,
    );
  }

  const oldStage = freshTask.stage;

  // 3. Update Stage
  freshTask.stage = newStage;

  // 4. Auto-update agent and provider if we have kanbanRoot
  const root = kanbanRoot ?? WorkspaceState.kanbanRoot;
  if (root) {
    const shouldUpdate = await shouldAutoUpdateAgent(root, freshTask.agent, oldStage);
    if (shouldUpdate) {
      const newAgent = await getDefaultAgentForStage(root, newStage);
      if (newAgent) {
        freshTask.agent = newAgent;
        const defaultProvider = getDefaultProviderForAgent(newAgent);
        if (defaultProvider) {
          freshTask.provider = defaultProvider;
        }
      }
    }
  }

  // 5. Serialize and Write
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

  return updateTaskStage(task, newStage, root);
}

export type TaskLocation = { type: 'inbox' } | { type: 'project'; project: string; phase?: string };

/**
 * Move a task to a new location (inbox or project/phase).
 * This physically moves the file to the new directory.
 */
export async function moveTaskToLocation(taskId: string, location: TaskLocation): Promise<string> {
  const root = WorkspaceState.kanbanRoot;
  if (!root) {
    throw new Error('Kanban root not found in state.');
  }

  const task = await findTaskById(root, taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const fileName = path.basename(task.filePath);
  let targetDir: string;

  if (location.type === 'inbox') {
    targetDir = path.join(root, INBOX_FOLDER);
  } else {
    targetDir = path.join(root, PROJECTS_FOLDER, location.project);
    if (location.phase) {
      targetDir = path.join(targetDir, location.phase);
    }
  }

  // Ensure target directory exists
  await fs.mkdir(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, fileName);

  // Don't move if already at target location
  if (task.filePath === targetPath) {
    return targetPath;
  }

  // Move the file
  await movePath(task.filePath, targetPath);

  return targetPath;
}
