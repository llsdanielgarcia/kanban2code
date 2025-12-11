import * as fs from 'fs/promises';
import * as path from 'path';
import { AGENTS_FOLDER, PROJECTS_FOLDER, TEMPLATES_FOLDER } from '../core/constants';
import { Stage } from '../types/task';
import { ensureSafePath } from '../workspace/validation';

type NullableString = string | null | undefined;

async function readFileIfExists(root: string, relativePath: string): Promise<string> {
  const targetPath = path.join(root, relativePath);
  await ensureSafePath(root, targetPath);

  try {
    return await fs.readFile(targetPath, 'utf-8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return '';
    }
    console.warn(`Failed to read context file ${targetPath}:`, error);
    return '';
  }
}

function ensureExtension(name: string): string {
  return name.endsWith('.md') ? name : `${name}.md`;
}

export async function loadGlobalContext(root: string): Promise<string> {
  const files = ['how-it-works.md', 'architecture.md', 'project-details.md'];

  const contents = await Promise.all(files.map((file) => readFileIfExists(root, file)));

  return contents.filter(Boolean).join('\n\n');
}

export async function loadAgentContext(root: string, agentName?: NullableString): Promise<string> {
  if (!agentName) return '';
  const agentPath = path.join(AGENTS_FOLDER, ensureExtension(agentName));
  return readFileIfExists(root, agentPath);
}

export async function loadProjectContext(root: string, projectName?: NullableString): Promise<string> {
  if (!projectName) return '';
  const projectPath = path.join(PROJECTS_FOLDER, projectName, '_context.md');
  return readFileIfExists(root, projectPath);
}

export async function loadPhaseContext(
  root: string,
  projectName?: NullableString,
  phaseName?: NullableString,
): Promise<string> {
  if (!projectName || !phaseName) return '';
  const phasePath = path.join(PROJECTS_FOLDER, projectName, phaseName, '_context.md');
  return readFileIfExists(root, phasePath);
}

export async function loadCustomContexts(root: string, contextNames?: string[] | null): Promise<string> {
  if (!contextNames || contextNames.length === 0) return '';

  const contents = await Promise.all(
    contextNames.map(async (ctx) => {
      const normalized = ensureExtension(ctx);
      return readFileIfExists(root, normalized);
    }),
  );

  return contents.filter(Boolean).join('\n\n');
}

export async function loadStageTemplate(root: string, stage: Stage): Promise<string> {
  const stageTemplatePath = path.join(TEMPLATES_FOLDER, 'stages', `${stage}.md`);
  const content = await readFileIfExists(root, stageTemplatePath);

  if (content.trim().length === 0) {
    return `## Stage: ${stage}\nNo stage template was found for this stage.`;
  }

  return content;
}
