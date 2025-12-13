import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { AGENTS_FOLDER, CONTEXT_FOLDER, PROJECTS_FOLDER, TEMPLATES_FOLDER } from '../core/constants';
import { Stage } from '../types/task';
import { ensureSafePath } from '../workspace/validation';

type NullableString = string | null | undefined;

export interface ContextFile {
  id: string;
  name: string;
  description: string;
  path: string;
  scope?: 'global' | 'project';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  path: string;
}

/**
 * List all available context files from the _context/ directory.
 */
export async function listAvailableContexts(kanbanRoot: string): Promise<ContextFile[]> {
  const contextDir = path.join(kanbanRoot, CONTEXT_FOLDER);
  const contexts: ContextFile[] = [];

  try {
    const files = await fs.readdir(contextDir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(contextDir, file);
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) continue;

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const id = path.basename(file, '.md');

        contexts.push({
          id,
          name: typeof parsed.data.name === 'string' ? parsed.data.name : formatContextName(id),
          description: typeof parsed.data.description === 'string' ? parsed.data.description : '',
          path: path.relative(kanbanRoot, filePath),
          scope: parsed.data.scope === 'project' ? 'project' : 'global',
        });
      } catch {
        // If parsing fails, still include with defaults
        const id = path.basename(file, '.md');
        contexts.push({
          id,
          name: formatContextName(id),
          description: '',
          path: path.relative(kanbanRoot, filePath),
          scope: 'global',
        });
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
    return [];
  }

  return contexts.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * List all available agents from the _agents/ directory.
 */
export async function listAvailableAgents(kanbanRoot: string): Promise<Agent[]> {
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  const agents: Agent[] = [];

  try {
    const files = await fs.readdir(agentsDir);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(agentsDir, file);
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) continue;

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const id = path.basename(file, '.md');

        agents.push({
          id,
          name: typeof parsed.data.name === 'string' ? parsed.data.name : formatContextName(id),
          description: typeof parsed.data.description === 'string' ? parsed.data.description : '',
          path: path.relative(kanbanRoot, filePath),
        });
      } catch {
        // If parsing fails, still include with defaults
        const id = path.basename(file, '.md');
        agents.push({
          id,
          name: formatContextName(id),
          description: '',
          path: path.relative(kanbanRoot, filePath),
        });
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
    return [];
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create a new context file.
 */
export async function createContextFile(
  kanbanRoot: string,
  data: {
    name: string;
    scope: 'global' | 'project';
    project?: string;
    description: string;
    fileReferences?: string[];
    content: string;
  }
): Promise<string> {
  const fileName = `${data.name.toLowerCase().replace(/\s+/g, '-')}.md`;
  let targetPath: string;

  if (data.scope === 'project' && data.project) {
    const projectContextDir = path.join(kanbanRoot, PROJECTS_FOLDER, data.project, '_context');
    await fs.mkdir(projectContextDir, { recursive: true });
    targetPath = path.join(projectContextDir, fileName);
  } else {
    const contextDir = path.join(kanbanRoot, CONTEXT_FOLDER);
    await fs.mkdir(contextDir, { recursive: true });
    targetPath = path.join(contextDir, fileName);
  }

  await ensureSafePath(kanbanRoot, targetPath);

  const frontmatter: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    scope: data.scope,
    created: new Date().toISOString().split('T')[0],
  };

  if (data.fileReferences && data.fileReferences.length > 0) {
    frontmatter.file_references = data.fileReferences;
  }

  const fileContent = matter.stringify(data.content, frontmatter);
  await fs.writeFile(targetPath, fileContent, 'utf-8');

  return path.relative(kanbanRoot, targetPath);
}

/**
 * Create a new agent file.
 */
export async function createAgentFile(
  kanbanRoot: string,
  data: {
    name: string;
    description: string;
    instructions: string;
  }
): Promise<string> {
  const fileName = `${data.name.toLowerCase().replace(/\s+/g, '-')}.md`;
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });

  const targetPath = path.join(agentsDir, fileName);
  await ensureSafePath(kanbanRoot, targetPath);

  const frontmatter = {
    name: data.name,
    description: data.description,
    created: new Date().toISOString().split('T')[0],
  };

  const fileContent = matter.stringify(data.instructions, frontmatter);
  await fs.writeFile(targetPath, fileContent, 'utf-8');

  return path.relative(kanbanRoot, targetPath);
}

/**
 * Format a context/agent ID into a human-readable name.
 * e.g., "project-details" -> "Project Details"
 */
function formatContextName(id: string): string {
  return id
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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

async function fileExists(root: string, relativePath: string): Promise<boolean> {
  const targetPath = path.join(root, relativePath);
  await ensureSafePath(root, targetPath);
  try {
    const stats = await fs.stat(targetPath);
    return stats.isFile();
  } catch (error: any) {
    if (error?.code === 'ENOENT') return false;
    return false;
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
      const isExplicitPath = normalized.includes('/') || normalized.includes('\\');
      if (isExplicitPath) {
        return readFileIfExists(root, normalized);
      }

      const fromContextDir = path.join(CONTEXT_FOLDER, normalized);
      if (await fileExists(root, fromContextDir)) {
        return readFileIfExists(root, fromContextDir);
      }

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
