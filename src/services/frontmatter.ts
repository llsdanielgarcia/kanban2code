import matter from 'gray-matter';
import path from 'path';
import type { Task, Stage } from '../types/task';
import { STAGES } from '../core/constants';

/**
 * Raw frontmatter data as parsed from YAML.
 * All fields except 'stage' are optional.
 */
export interface RawFrontmatter {
  stage?: string;
  title?: string;
  tags?: string[];
  created?: string;
  agent?: string;
  parent?: string;
  contexts?: string[];
  order?: number;
  [key: string]: unknown; // Preserve unknown fields
}

/**
 * Result of parsing a task file, includes raw data for round-trip preservation.
 */
export interface ParseResult {
  task: Task;
  rawFrontmatter: RawFrontmatter;
  originalContent: string;
}

/**
 * Validates that a string is a valid Stage value.
 */
export function isValidStage(value: unknown): value is Stage {
  return typeof value === 'string' && STAGES.includes(value as Stage);
}

/**
 * Generates a task ID from a file path.
 * Uses the filename without extension as the base ID.
 */
export function generateTaskId(filePath: string): string {
  const basename = path.basename(filePath, '.md');
  // Normalize to create a stable ID
  return basename.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

/**
 * Extracts title from markdown content.
 * Looks for first h1 heading, falls back to filename.
 */
export function extractTitle(content: string, filePath: string): string {
  // Look for first h1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  // Fall back to filename
  return path.basename(filePath, '.md');
}

/**
 * Parses a task markdown file content into a Task object.
 *
 * @param content - Raw file content including frontmatter
 * @param filePath - Absolute path to the file (used for ID and fallback title)
 * @returns ParseResult with task, raw frontmatter, and original content
 */
export function parseTaskFile(content: string, filePath: string): ParseResult {
  let parsed: matter.GrayMatterFile<string>;

  try {
    parsed = matter(content);
  } catch (error) {
    // Handle malformed YAML gracefully
    console.warn(`Invalid frontmatter in ${filePath}:`, error);
    parsed = {
      data: {},
      content: content,
      orig: content,
      language: '',
      matter: '',
      stringify: () => content,
    };
  }

  const rawFrontmatter = parsed.data as RawFrontmatter;
  const bodyContent = parsed.content.trim();

  // Validate and default stage
  const stage: Stage = isValidStage(rawFrontmatter.stage)
    ? rawFrontmatter.stage
    : 'inbox';

  // Extract or default title
  const title = rawFrontmatter.title || extractTitle(bodyContent, filePath);

  // Ensure tags is an array
  let tags: string[] | undefined;
  if (Array.isArray(rawFrontmatter.tags)) {
    tags = rawFrontmatter.tags.filter((t): t is string => typeof t === 'string');
  } else if (typeof rawFrontmatter.tags === 'string') {
    tags = [rawFrontmatter.tags];
  }

  // Ensure contexts is an array
  let contexts: string[] | undefined;
  if (Array.isArray(rawFrontmatter.contexts)) {
    contexts = rawFrontmatter.contexts.filter((c): c is string => typeof c === 'string');
  } else if (typeof rawFrontmatter.contexts === 'string') {
    contexts = [rawFrontmatter.contexts];
  }

  const task: Task = {
    id: generateTaskId(filePath),
    filePath,
    title,
    stage,
    content: bodyContent,
    // Optional fields - only set if present
    ...(tags && { tags }),
    ...(contexts && { contexts }),
    ...(rawFrontmatter.agent && { agent: String(rawFrontmatter.agent) }),
    ...(rawFrontmatter.parent && { parent: String(rawFrontmatter.parent) }),
    ...(rawFrontmatter.created && { created: String(rawFrontmatter.created) }),
    ...(typeof rawFrontmatter.order === 'number' && { order: rawFrontmatter.order }),
    // project and phase are NOT set here - they're inferred from path by taskService
  };

  return {
    task,
    rawFrontmatter,
    originalContent: content,
  };
}

/**
 * Serializes a Task object back to markdown with frontmatter.
 *
 * @param task - The task to serialize
 * @param preserveUnknown - Optional raw frontmatter to preserve unknown fields
 * @returns Markdown string with YAML frontmatter
 */
export function stringifyTask(
  task: Task,
  preserveUnknown?: RawFrontmatter,
): string {
  // Start with preserved unknown fields
  const frontmatter: Record<string, unknown> = { ...(preserveUnknown || {}) };

  // Set known fields (these override preserved values)
  frontmatter.stage = task.stage;

  // Only include title if it differs from what would be extracted
  const extractedTitle = extractTitle(task.content, task.filePath);
  if (task.title && task.title !== extractedTitle) {
    frontmatter.title = task.title;
  } else {
    delete frontmatter.title;
  }

  if (task.tags && task.tags.length > 0) {
    frontmatter.tags = task.tags;
  } else {
    delete frontmatter.tags;
  }

  if (task.contexts && task.contexts.length > 0) {
    frontmatter.contexts = task.contexts;
  } else {
    delete frontmatter.contexts;
  }

  if (task.agent) {
    frontmatter.agent = task.agent;
  } else {
    delete frontmatter.agent;
  }

  if (task.parent) {
    frontmatter.parent = task.parent;
  } else {
    delete frontmatter.parent;
  }

  if (task.created) {
    frontmatter.created = task.created;
  } else {
    delete frontmatter.created;
  }

  if (typeof task.order === 'number') {
    frontmatter.order = task.order;
  } else {
    delete frontmatter.order;
  }

  // Remove project and phase from frontmatter - they're path-based
  delete frontmatter.project;
  delete frontmatter.phase;

  return matter.stringify(task.content, frontmatter);
}

/**
 * Updates only the stage field in a task file content.
 * Preserves all other content and frontmatter fields.
 *
 * @param originalContent - The original file content
 * @param newStage - The new stage value
 * @returns Updated markdown string
 */
export function updateStageInContent(
  originalContent: string,
  newStage: Stage,
): string {
  const { task, rawFrontmatter } = parseTaskFile(originalContent, '');
  task.stage = newStage;
  return stringifyTask(task, rawFrontmatter);
}
