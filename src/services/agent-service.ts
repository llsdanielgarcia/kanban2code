import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { AGENTS_FOLDER } from '../core/constants';
import { ensureSafePath } from '../workspace/validation';
import { AgentCliConfigSchema, type AgentCliConfig } from '../types/agent';

export interface AgentConfigFile {
  id: string;
  name: string;
  path: string;
  config?: AgentCliConfig;
}

export async function listAvailableAgentConfigs(kanbanRoot: string): Promise<AgentConfigFile[]> {
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  const agents: AgentConfigFile[] = [];

  try {
    const filePaths: string[] = [];
    const normalizeSlashes = (value: string) => value.replace(/\\/g, '/');

    const walk = async (absoluteDir: string) => {
      const dirEntries = await fs.readdir(absoluteDir, { withFileTypes: true });
      for (const entry of dirEntries) {
        const entryPath = path.join(absoluteDir, entry.name);
        if (entry.isDirectory()) {
          await walk(entryPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          filePaths.push(entryPath);
        }
      }
    };

    await walk(agentsDir);

    for (const filePath of filePaths) {
      const relativeFromAgentsDir = normalizeSlashes(path.relative(agentsDir, filePath));
      const relativeFromKanbanRoot = normalizeSlashes(path.relative(kanbanRoot, filePath));
      const baseId = path.basename(filePath, '.md');

      const isTopLevel = !relativeFromAgentsDir.includes('/');
      const id = isTopLevel ? baseId : relativeFromKanbanRoot;

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const name =
          typeof parsed.data.name === 'string' ? parsed.data.name : formatAgentName(baseId);

        const configResult = AgentCliConfigSchema.safeParse(parsed.data);

        agents.push({
          id,
          name,
          path: relativeFromKanbanRoot,
          config: configResult.success ? configResult.data : undefined,
        });
      } catch {
        agents.push({
          id,
          name: formatAgentName(baseId),
          path: relativeFromKanbanRoot,
          config: undefined,
        });
      }
    }
  } catch {
    return [];
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolveAgentConfig(
  kanbanRoot: string,
  agentIdentifier: string,
): Promise<AgentCliConfig | undefined> {
  const agents = await listAvailableAgentConfigs(kanbanRoot);

  const match = agents.find((a) => a.id === agentIdentifier || a.name === agentIdentifier);

  return match?.config;
}

export async function resolveAgentConfigFile(
  kanbanRoot: string,
  agentIdentifier: string,
): Promise<AgentConfigFile | undefined> {
  const agents = await listAvailableAgentConfigs(kanbanRoot);

  return agents.find((a) => a.id === agentIdentifier || a.name === agentIdentifier);
}

export async function createAgentConfigFile(
  kanbanRoot: string,
  data: {
    name: string;
    config: AgentCliConfig;
    content?: string;
  },
): Promise<string> {
  const fileName = `${data.name.toLowerCase().replace(/\s+/g, '-')}.md`;
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });

  const targetPath = path.join(agentsDir, fileName);
  await ensureSafePath(kanbanRoot, targetPath);

  const frontmatter: Record<string, unknown> = {
    name: data.name,
    created: new Date().toISOString().split('T')[0],
    ...data.config,
  };

  const fileContent = matter.stringify(data.content || '', frontmatter);
  await fs.writeFile(targetPath, fileContent, 'utf-8');

  return path.relative(kanbanRoot, targetPath);
}

export async function updateAgentConfigFile(
  kanbanRoot: string,
  agentId: string,
  data: {
    name?: string;
    config: AgentCliConfig;
    content?: string;
  },
): Promise<string> {
  const agent = await resolveAgentConfigFile(kanbanRoot, agentId);
  if (!agent) {
    throw new Error(`Agent config not found: ${agentId}`);
  }

  const targetPath = path.join(kanbanRoot, agent.path);
  await ensureSafePath(kanbanRoot, targetPath);

  let existingContent = '';
  try {
    const raw = await fs.readFile(targetPath, 'utf-8');
    const parsed = matter(raw);
    existingContent = parsed.content;
  } catch {
    // File doesn't exist or can't be read
  }

  const frontmatter: Record<string, unknown> = {
    name: data.name || agent.name,
    updated: new Date().toISOString().split('T')[0],
    ...data.config,
  };

  const fileContent = matter.stringify(data.content ?? existingContent, frontmatter);
  await fs.writeFile(targetPath, fileContent, 'utf-8');

  return agent.path;
}

export async function deleteAgentConfigFile(kanbanRoot: string, agentId: string): Promise<boolean> {
  const agent = await resolveAgentConfigFile(kanbanRoot, agentId);
  if (!agent) {
    return false;
  }

  const targetPath = path.join(kanbanRoot, agent.path);
  await ensureSafePath(kanbanRoot, targetPath);

  try {
    await fs.unlink(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function loadAgentConfigContent(
  kanbanRoot: string,
  agentName?: string | null,
): Promise<string> {
  if (!agentName) return '';

  const agent = await resolveAgentConfigFile(kanbanRoot, agentName);
  if (!agent) return '';

  return readFileIfExists(kanbanRoot, agent.path);
}

function formatAgentName(id: string): string {
  return id
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function readFileIfExists(root: string, relativePath: string): Promise<string> {
  const targetPath = path.join(root, relativePath);
  await ensureSafePath(root, targetPath);

  try {
    return await fs.readFile(targetPath, 'utf-8');
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return '';
    }
    console.warn(`Failed to read agent config file ${targetPath}:`, error);
    return '';
  }
}
