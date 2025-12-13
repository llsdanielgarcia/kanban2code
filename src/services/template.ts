import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { TEMPLATES_FOLDER } from '../core/constants';
import { ensureSafePath } from '../workspace/validation';
import type { Stage } from '../types/task';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  icon?: string;
  defaultStage?: Stage;
  defaultTags?: string[];
}

/**
 * Load all task templates from the _templates/tasks/ directory.
 * Templates are markdown files with optional frontmatter containing name and description.
 */
export async function loadTaskTemplates(kanbanRoot: string): Promise<TaskTemplate[]> {
  const templatesDir = path.join(kanbanRoot, TEMPLATES_FOLDER, 'tasks');
  const templates: TaskTemplate[] = [];

  try {
    const files = await fs.readdir(templatesDir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(templatesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');

      try {
        const parsed = matter(content);
        const id = path.basename(file, '.md');

        templates.push({
          id,
          name: typeof parsed.data.name === 'string' ? parsed.data.name : formatTemplateName(id),
          description: typeof parsed.data.description === 'string' ? parsed.data.description : '',
          content: parsed.content,
          icon: typeof parsed.data.icon === 'string' ? parsed.data.icon : undefined,
          defaultStage: typeof parsed.data.default_stage === 'string' ? parsed.data.default_stage as Stage : undefined,
          defaultTags: Array.isArray(parsed.data.default_tags) ? parsed.data.default_tags : undefined,
        });
      } catch {
        // If parsing fails, still include the template with defaults
        const id = path.basename(file, '.md');
        templates.push({
          id,
          name: formatTemplateName(id),
          description: '',
          content,
        });
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
    return [];
  }

  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create a new task template.
 */
export async function createTaskTemplate(
  kanbanRoot: string,
  data: {
    name: string;
    description: string;
    icon?: string;
    defaultStage?: Stage;
    defaultTags?: string[];
    content: string;
  }
): Promise<string> {
  const templatesDir = path.join(kanbanRoot, TEMPLATES_FOLDER, 'tasks');
  await fs.mkdir(templatesDir, { recursive: true });

  const fileName = `${data.name.toLowerCase().replace(/\s+/g, '-')}.md`;
  const filePath = path.join(templatesDir, fileName);
  await ensureSafePath(kanbanRoot, filePath);

  const frontmatter: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    created: new Date().toISOString().split('T')[0],
  };

  if (data.icon) {
    frontmatter.icon = data.icon;
  }
  if (data.defaultStage) {
    frontmatter.default_stage = data.defaultStage;
  }
  if (data.defaultTags && data.defaultTags.length > 0) {
    frontmatter.default_tags = data.defaultTags;
  }

  const fileContent = matter.stringify(data.content, frontmatter);
  await fs.writeFile(filePath, fileContent, 'utf-8');

  return path.basename(fileName, '.md');
}

/**
 * Update an existing task template.
 */
export async function updateTaskTemplate(
  kanbanRoot: string,
  templateId: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    defaultStage?: Stage;
    defaultTags?: string[];
    content?: string;
  }
): Promise<void> {
  const templatesDir = path.join(kanbanRoot, TEMPLATES_FOLDER, 'tasks');
  const filePath = path.join(templatesDir, `${templateId}.md`);
  await ensureSafePath(kanbanRoot, filePath);

  // Read existing template
  let existingContent: string;
  let existingData: Record<string, unknown>;
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(raw);
    existingContent = parsed.content;
    existingData = parsed.data;
  } catch {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Merge data
  const frontmatter: Record<string, unknown> = {
    ...existingData,
    updated: new Date().toISOString().split('T')[0],
  };

  if (data.name !== undefined) frontmatter.name = data.name;
  if (data.description !== undefined) frontmatter.description = data.description;
  if (data.icon !== undefined) frontmatter.icon = data.icon;
  if (data.defaultStage !== undefined) frontmatter.default_stage = data.defaultStage;
  if (data.defaultTags !== undefined) {
    frontmatter.default_tags = data.defaultTags.length > 0 ? data.defaultTags : undefined;
  }

  const content = data.content !== undefined ? data.content : existingContent;
  const fileContent = matter.stringify(content, frontmatter);
  await fs.writeFile(filePath, fileContent, 'utf-8');
}

/**
 * Format a template ID into a human-readable name.
 * e.g., "bug-report" -> "Bug Report"
 */
function formatTemplateName(id: string): string {
  return id
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
