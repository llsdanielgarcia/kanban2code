import { Task } from '../types/task';
import { loadAgentContext, loadCustomContexts, loadGlobalContext, loadPhaseContext, loadProjectContext, loadStageTemplate } from './context';

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

  const contexts = (task.contexts ?? []).map((ctx) => `<contextRef>${xmlEscape(ctx)}</contextRef>`).join('');
  parts.push(`<contexts>${contexts}</contexts>`);

  return `<metadata>${parts.join('')}</metadata>`;
}

async function buildContextSection(task: Task, root: string): Promise<string> {
  const [
    globalContext,
    agentContext,
    projectContext,
    phaseContext,
    stageTemplate,
    customContexts,
  ] = await Promise.all([
    loadGlobalContext(root),
    loadAgentContext(root, task.agent),
    loadProjectContext(root, task.project),
    loadPhaseContext(root, task.project, task.phase),
    loadStageTemplate(root, task.stage),
    loadCustomContexts(root, task.contexts),
  ]);

  const layers = [
    wrapSection('global', globalContext),
    wrapSection('agent', agentContext),
    wrapSection('project', projectContext),
    wrapSection('phase', phaseContext),
    wrapSection('stage_template', stageTemplate),
    wrapSection('custom', customContexts),
  ];

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
