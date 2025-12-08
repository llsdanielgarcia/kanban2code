import fs from 'fs/promises';
import path from 'path';
import type { Stage } from '../types/task';
import { FOLDERS } from '../core/constants';

/**
 * Safely reads a file's content, returning null if the file doesn't exist.
 */
async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Loads a stage template from _templates/stages/{stage}.md.
 * Returns null if the template file doesn't exist.
 *
 * @param root - The .kanban2code root directory
 * @param stage - The stage to load template for
 * @returns Template content or null if not found
 */
export async function loadStageTemplate(
  root: string,
  stage: Stage,
): Promise<string | null> {
  const templatePath = path.join(root, FOLDERS.stageTemplates, `${stage}.md`);
  return safeReadFile(templatePath);
}

/**
 * Loads a task template from _templates/tasks/{templateName}.md.
 * Returns null if the template file doesn't exist.
 *
 * @param root - The .kanban2code root directory
 * @param templateName - Name of the template (without .md extension)
 * @returns Template content or null if not found
 */
export async function loadTaskTemplate(
  root: string,
  templateName: string,
): Promise<string | null> {
  const templatePath = path.join(root, FOLDERS.taskTemplates, `${templateName}.md`);
  return safeReadFile(templatePath);
}
