import matter from 'gray-matter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Task, Stage } from '../types/task';
import { STAGES, PROJECTS_FOLDER } from '../core/constants';

export interface TaskParseResult {
  task: Task;
  originalContent: string;
}

export function parseTaskContent(content: string, filePath: string): Task {
  const { data, content: body } = matter(content);
  
  // 1. Validate/Default Stage
  let stage: Stage = 'inbox';
  if (data.stage && STAGES.includes(data.stage as Stage)) {
    stage = data.stage as Stage;
  }

  // 2. Infer Project/Phase from Path
  // Expected structure: .../projects/<project>/[<phase>]/<task>.md
  // or .../inbox/<task>.md
  let project: string | undefined;
  let phase: string | undefined;

  // Normalize path to forward slashes for consistent parsing
  const normalizedPath = filePath.split(path.sep).join('/');
  const projectIndex = normalizedPath.indexOf(`/${PROJECTS_FOLDER}/`);
  
  if (projectIndex !== -1) {
    const relativePart = normalizedPath.substring(projectIndex + PROJECTS_FOLDER.length + 2); // +2 for slashes
    const parts = relativePart.split('/');
    
    // parts[0] is project name
    if (parts.length >= 1) {
      project = parts[0];
    }
    // if parts length > 1 and not the file itself, usually phase is the folder
    // e.g. projects/my-app/phase-1/task.md -> parts=['my-app', 'phase-1', 'task.md']
    if (parts.length >= 3) {
      phase = parts[1];
    }
  }

  // 3. Construct Task
  const task: Task = {
    id: path.basename(filePath, '.md'),
    filePath,
    title: extractTitle(body) || path.basename(filePath, '.md'),
    stage,
    project,
    phase,
    agent: data.agent,
    parent: data.parent,
    tags: Array.isArray(data.tags) ? data.tags : [],
    contexts: Array.isArray(data.contexts) ? data.contexts : [],
    order: typeof data.order === 'number' ? data.order : undefined,
    created: data.created,
    content: body,
  };

  return task;
}

export async function parseTaskFile(filePath: string): Promise<Task> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseTaskContent(content, filePath);
}

export function serializeTask(task: Task, originalContent?: string): string {
  // Use original content's matter options if available to preserve formatting?
  // gray-matter doesn't easily support "preserving unknown fields" unless we pass them in.
  // We should merge task properties back into the data object.

  // Re-parse original to get all unknown fields
  let existingData: any = {};
  if (originalContent) {
    const parsed = matter(originalContent);
    existingData = parsed.data;
  }

  // Update known fields
  const data = {
    ...existingData,
    stage: task.stage,
    // Project/Phase are NOT stored in frontmatter, they are file-location based.
    // So we do NOT write them back to frontmatter.
    agent: task.agent,
    parent: task.parent,
    tags: task.tags,
    contexts: task.contexts,
    order: task.order,
    created: task.created,
  };

  // Remove undefined keys to keep it clean
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

  // Gray-matter stringify
  return matter.stringify(task.content, data);
}

function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
}
