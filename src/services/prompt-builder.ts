import { Task } from '../types/task';
import {
  loadCustomContexts,
  loadGlobalContext,
  loadPhaseContext,
  loadProjectContext,
  loadSkills,
  readFileIfExists,
} from './context';
import { AGENTS_FOLDER, MODES_FOLDER } from '../core/constants';
import * as path from 'path';

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapSection(name: string, content: string): string {
  if (!content) return '';
  return `<section name="${name}">${xmlEscape(content)}</section>`;
}

function buildMetadata(task: Task): string {
  const parts: string[] = [];

  parts.push(`<id>${xmlEscape(task.id)}</id>`);
  parts.push(`<filePath>${xmlEscape(task.filePath)}</filePath>`);
  // Convenience for agents that expect a context-request style target file.
  parts.push(`<target-file>${xmlEscape(task.filePath)}</target-file>`);
  parts.push(`<title>${xmlEscape(task.title)}</title>`);
  parts.push(`<stage>${xmlEscape(task.stage)}</stage>`);

  if (task.project) parts.push(`<project>${xmlEscape(task.project)}</project>`);
  if (task.phase) parts.push(`<phase>${xmlEscape(task.phase)}</phase>`);
  if (task.agent) parts.push(`<agent>${xmlEscape(task.agent)}</agent>`);
  if (task.parent) parts.push(`<parent>${xmlEscape(task.parent)}</parent>`);
  if (typeof task.order === 'number') parts.push(`<order>${task.order}</order>`);
  if (task.created) parts.push(`<created>${xmlEscape(task.created)}</created>`);

  const tags = (task.tags ?? []).map((tag) => `<tag>${xmlEscape(tag)}</tag>`).join('');
  parts.push(`<tags>${tags}</tags>`);

  const contexts = (task.contexts ?? [])
    .map((ctx) => `<contextRef>${xmlEscape(ctx)}</contextRef>`)
    .join('');
  parts.push(`<contexts>${contexts}</contexts>`);

  return `<metadata>${parts.join('')}</metadata>`;
}

async function loadModeInstructions(
  root: string,
  task: Task,
): Promise<{ content: string; sectionName: 'mode' | 'agent' }> {
  if (task.mode) {
    const modePath = path.join(MODES_FOLDER, `${task.mode}.md`);
    const content = await readFileIfExists(root, modePath);
    if (content) {
      return { content, sectionName: 'mode' };
    }
  }

  if (task.agent) {
    const modePath = path.join(MODES_FOLDER, `${task.agent}.md`);
    const modeContent = await readFileIfExists(root, modePath);
    if (modeContent) {
      return { content: modeContent, sectionName: 'mode' };
    }

    const agentPath = path.join(AGENTS_FOLDER, `${task.agent}.md`);
    const agentContent = await readFileIfExists(root, agentPath);
    if (agentContent) {
      return { content: agentContent, sectionName: 'agent' };
    }
  }

  return { content: '', sectionName: 'agent' };
}

async function buildContextSection(
  task: Task,
  root: string,
  options?: { isRunner?: boolean },
): Promise<string> {
  const [globalContext, modeResult, projectContext, phaseContext, customContexts, skills] =
    await Promise.all([
      loadGlobalContext(root),
      loadModeInstructions(root, task),
      loadProjectContext(root, task.project),
      loadPhaseContext(root, task.project, task.phase),
      loadCustomContexts(root, task.contexts),
      loadSkills(root, task.skills),
    ]);

  const layers = [
    wrapSection('global', globalContext),
    wrapSection(modeResult.sectionName, modeResult.content),
    wrapSection('project', projectContext),
    wrapSection('phase', phaseContext),
    wrapSection('custom', customContexts),
    wrapSection('skills', skills),
  ];

  if (options?.isRunner) {
    layers.push('<runner automated="true" />');
  }

  return `<context>${layers.filter(Boolean).join('')}</context>`;
}

function buildTaskSection(task: Task): string {
  const metadata = buildMetadata(task);
  const content = `<content>${xmlEscape(task.content)}</content>`;
  return `<task>${metadata}${content}</task>`;
}

export async function buildXMLPrompt(task: Task, root: string): Promise<string> {
  const contextSection = await buildContextSection(task, root);
  const taskSection = buildTaskSection(task);
  return `<system>${contextSection}${taskSection}</system>`;
}

export async function buildContextOnlyPrompt(task: Task, root: string): Promise<string> {
  const contextSection = await buildContextSection(task, root);
  return `<system>${contextSection}</system>`;
}

export function buildTaskOnlyPrompt(task: Task): string {
  return `<system>${buildTaskSection(task)}</system>`;
}

export async function buildRunnerPrompt(
  task: Task,
  root: string,
): Promise<{ xmlPrompt: string; modeInstructions: string }> {
  const modeResult = await loadModeInstructions(root, task);
  const contextSection = await buildContextSection(task, root, { isRunner: true });
  const taskSection = buildTaskSection(task);

  return {
    xmlPrompt: `<system>${contextSection}${taskSection}</system>`,
    modeInstructions: modeResult.content,
  };
}
