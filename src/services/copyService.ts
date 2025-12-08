import type { Task } from '../types/task';
import type { CopyMode } from '../types/copy';
import { buildXMLPrompt, buildContextOnly, buildTaskOnly } from './promptBuilder';

/**
 * Result of building a copy payload.
 */
export interface CopyPayloadResult {
  content: string;
  mode: CopyMode;
  taskTitle: string;
}

/**
 * Builds a copy payload for a task based on the specified mode.
 *
 * @param task - The task to build payload for
 * @param root - The .kanban2code root directory
 * @param mode - The copy mode (defaults to 'full_xml')
 * @returns CopyPayloadResult with content and metadata
 */
export async function buildCopyPayload(
  task: Task,
  root: string,
  mode: CopyMode = 'full_xml',
): Promise<CopyPayloadResult> {
  let content: string;

  switch (mode) {
    case 'full_xml': {
      const result = await buildXMLPrompt(task, root);
      content = result.fullPrompt;
      break;
    }

    case 'context_only': {
      content = await buildContextOnly(task, root);
      break;
    }

    case 'task_only': {
      content = buildTaskOnly(task);
      break;
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = mode;
      throw new Error(`Unknown copy mode: ${_exhaustive}`);
    }
  }

  return {
    content,
    mode,
    taskTitle: task.title,
  };
}
