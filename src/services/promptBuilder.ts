import type { Task } from '../types/task';
import {
  loadGlobalContext,
  loadAgentContext,
  loadProjectContext,
  loadPhaseContext,
  loadCustomContextsCombined,
} from './contextService';
import { loadStageTemplate } from './templateService';

/**
 * XML builder result containing the full prompt and individual sections.
 */
export interface XMLPromptResult {
  fullPrompt: string;
  contextSection: string;
  taskSection: string;
}

/**
 * Escapes special XML characters in content.
 */
function escapeXml(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Wraps content in XML tags if content is non-null and non-empty.
 * Escapes XML special characters in the content to prevent broken XML.
 */
function wrapTag(tag: string, content: string | null, indent: string = ''): string {
  if (!content) {
    return '';
  }
  const escaped = escapeXml(content);
  const lines = escaped.split('\n').map((line) => `${indent}  ${line}`).join('\n');
  return `${indent}<${tag}>\n${lines}\n${indent}</${tag}>`;
}

/**
 * Formats task metadata as a readable string.
 */
function formatTaskMetadata(task: Task): string {
  const lines: string[] = [];

  lines.push(`Title: ${task.title}`);
  lines.push(`Stage: ${task.stage}`);

  if (task.project) {
    lines.push(`Project: ${task.project}`);
  }
  if (task.phase) {
    lines.push(`Phase: ${task.phase}`);
  }
  if (task.agent) {
    lines.push(`Agent: ${task.agent}`);
  }
  if (task.tags && task.tags.length > 0) {
    lines.push(`Tags: ${task.tags.join(', ')}`);
  }
  if (task.created) {
    lines.push(`Created: ${task.created}`);
  }

  return lines.join('\n');
}

/**
 * Builds a complete 9-layer XML prompt for a task.
 *
 * Assembly order:
 * 1. how-it-works.md (global)
 * 2. architecture.md (global)
 * 3. project-details.md (global)
 * 4. _agents/{agent}.md (if agent is set)
 * 5. projects/{project}/_context.md (if project)
 * 6. projects/{project}/{phase}/_context.md (if phase)
 * 7. _templates/stages/{stage}.md
 * 8. Custom contexts from task.contexts
 * 9. Task body + metadata
 *
 * @param task - The task to build prompt for
 * @param root - The .kanban2code root directory
 * @returns XMLPromptResult with full prompt and sections
 */
export async function buildXMLPrompt(
  task: Task,
  root: string,
): Promise<XMLPromptResult> {
  // Load all context layers in parallel
  const [
    globalContext,
    agentContext,
    projectContext,
    phaseContext,
    stageTemplate,
    customContexts,
  ] = await Promise.all([
    loadGlobalContext(root),
    task.agent ? loadAgentContext(root, task.agent) : Promise.resolve(null),
    task.project ? loadProjectContext(root, task.project) : Promise.resolve(null),
    task.project && task.phase
      ? loadPhaseContext(root, task.project, task.phase)
      : Promise.resolve(null),
    loadStageTemplate(root, task.stage),
    task.contexts ? loadCustomContextsCombined(root, task.contexts) : Promise.resolve(null),
  ]);

  // Build context section
  const contextParts: string[] = [];

  // Layer 1-3: Global context
  if (globalContext.howItWorks) {
    contextParts.push(wrapTag('how-it-works', globalContext.howItWorks, '    '));
  }
  if (globalContext.architecture) {
    contextParts.push(wrapTag('architecture', globalContext.architecture, '    '));
  }
  if (globalContext.projectDetails) {
    contextParts.push(wrapTag('project-details', globalContext.projectDetails, '    '));
  }

  // Layer 4: Agent context
  if (agentContext) {
    contextParts.push(wrapTag('agent', agentContext, '    '));
  }

  // Layer 5: Project context
  if (projectContext) {
    contextParts.push(wrapTag('project', projectContext, '    '));
  }

  // Layer 6: Phase context
  if (phaseContext) {
    contextParts.push(wrapTag('phase', phaseContext, '    '));
  }

  // Layer 7: Stage template
  if (stageTemplate) {
    contextParts.push(wrapTag('stage-guidance', stageTemplate, '    '));
  }

  // Layer 8: Custom contexts
  if (customContexts) {
    contextParts.push(wrapTag('custom-contexts', customContexts, '    '));
  }

  const contextSection = contextParts.length > 0
    ? `  <context>\n${contextParts.join('\n')}\n  </context>`
    : '';

  // Layer 9: Task section
  const taskMetadata = formatTaskMetadata(task);
  const taskParts: string[] = [];
  taskParts.push(wrapTag('metadata', taskMetadata, '    '));
  if (task.content) {
    taskParts.push(wrapTag('body', task.content, '    '));
  }

  const taskSection = `  <task>\n${taskParts.join('\n')}\n  </task>`;

  // Assemble full prompt
  const systemParts: string[] = [];
  if (contextSection) {
    systemParts.push(contextSection);
  }
  systemParts.push(taskSection);

  const fullPrompt = `<system>\n${systemParts.join('\n')}\n</system>`;

  return {
    fullPrompt,
    contextSection,
    taskSection,
  };
}

/**
 * Builds only the context section (without task content).
 * Useful for context_only copy mode.
 *
 * @param task - The task to build context for
 * @param root - The .kanban2code root directory
 * @returns Context section XML string
 */
export async function buildContextOnly(
  task: Task,
  root: string,
): Promise<string> {
  const result = await buildXMLPrompt(task, root);
  return result.contextSection
    ? `<system>\n${result.contextSection}\n</system>`
    : '';
}

/**
 * Builds only the task section (metadata + body).
 * Useful for task_only copy mode.
 *
 * @param task - The task to build for
 * @returns Task section XML string
 */
export function buildTaskOnly(task: Task): string {
  const taskMetadata = formatTaskMetadata(task);
  const taskParts: string[] = [];
  taskParts.push(wrapTag('metadata', taskMetadata, '    '));
  if (task.content) {
    taskParts.push(wrapTag('body', task.content, '    '));
  }

  return `<system>\n  <task>\n${taskParts.join('\n')}\n  </task>\n</system>`;
}
