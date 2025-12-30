import matter from 'gray-matter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Task, Stage } from '../types/task';
import { STAGES, PROJECTS_FOLDER } from '../core/constants';

type WarnFn = (message: string, error?: unknown) => void;

const defaultWarn: WarnFn = (message, error) => console.warn(message, error);

export interface ParseOptions {
  warn?: WarnFn;
}

function inferProjectAndPhase(filePath: string): { project?: string; phase?: string } {
  const segments = filePath.split(path.sep).filter(Boolean);
  const projectIndex = segments.lastIndexOf(PROJECTS_FOLDER);

  if (projectIndex !== -1 && segments.length > projectIndex + 1) {
    const project = segments[projectIndex + 1];
    const fileName = segments[segments.length - 1];
    const maybePhase = segments[projectIndex + 2];

    const phase = maybePhase && maybePhase !== fileName ? maybePhase : undefined;

    return { project, phase };
  }

  return { project: undefined, phase: undefined };
}

function extractTitle(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : undefined;
}

export function parseTaskContent(content: string, filePath: string, options: ParseOptions = {}): Task {
  let data: Record<string, unknown> = {};
  let body = content;

  try {
    const parsed = matter(content);
    data = parsed.data ?? {};
    body = parsed.content;
  } catch (error) {
    const warn = options.warn ?? defaultWarn;
    warn(`Invalid frontmatter in ${filePath}; using defaults.`, error);
  }

  const stage = STAGES.includes(data.stage as Stage) ? (data.stage as Stage) : 'inbox';
  const { project, phase } = inferProjectAndPhase(filePath);

  let contexts = Array.isArray(data.contexts) ? data.contexts.map(String) : [];
  let skills = Array.isArray(data.skills) ? data.skills.map(String) : [];

  // Migration: Move skills from contexts to skills
  const migratedContexts: string[] = [];
  for (const ctx of contexts) {
    // Check for _context/skills/ prefix which was used for nested context files
    if (ctx.startsWith('_context/skills/') || ctx.startsWith('skills/')) {
      const basename = path.basename(ctx, '.md');
      if (!skills.includes(basename)) {
        skills.push(basename);
      }
    } else {
      migratedContexts.push(ctx);
    }
  }
  contexts = migratedContexts;

  const task: Task = {
    id: path.basename(filePath, '.md'),
    filePath,
    title: extractTitle(body) || path.basename(filePath, '.md'),
    stage,
    project,
    phase,
    agent: typeof data.agent === 'string' ? data.agent : undefined,
    parent: typeof data.parent === 'string' ? data.parent : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    contexts,
    skills,
    order: typeof data.order === 'number' ? data.order : undefined,
    created: typeof data.created === 'string' ? data.created : undefined,
    content: body,
  };

  return task;
}

export async function parseTaskFile(filePath: string, options: ParseOptions = {}): Promise<Task> {
  const content = await fs.readFile(filePath, 'utf-8');
  return parseTaskContent(content, filePath, options);
}

export function stringifyTaskFile(task: Task, originalContent?: string, options: ParseOptions = {}): string {
  let existingData: Record<string, unknown> = {};

  if (originalContent) {
    try {
      const parsed = matter(originalContent);
      existingData = parsed.data ?? {};
    } catch (error) {
      const warn = options.warn ?? defaultWarn;
      warn(`Invalid frontmatter while serializing ${task.filePath}; preserving known fields only.`, error);
    }
  }

  const data: Record<string, unknown> = {
    ...existingData,
    stage: task.stage,
    agent: task.agent,
    parent: task.parent,
    tags: task.tags ?? [],
    contexts: task.contexts ?? [],
    skills: task.skills ?? [],
    order: task.order,
    created: task.created,
  };

  // project/phase are inferred from the path and should never be written to frontmatter
  delete data.project;
  delete data.phase;

  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });

  return matter.stringify(task.content, data);
}

// Backward compatibility for existing imports
export function serializeTask(task: Task, originalContent?: string, options: ParseOptions = {}): string {
  return stringifyTaskFile(task, originalContent, options);
}
