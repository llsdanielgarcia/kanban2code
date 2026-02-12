import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { PROVIDERS_FOLDER } from '../core/constants';
import { ensureSafePath } from '../workspace/validation';
import { ProviderConfigSchema, type ProviderConfig } from '../types/provider';

export interface ProviderConfigFile {
  id: string;
  name: string;
  path: string;
  config?: ProviderConfig;
}

export async function listAvailableProviders(kanbanRoot: string): Promise<ProviderConfigFile[]> {
  const providersDir = path.join(kanbanRoot, PROVIDERS_FOLDER);
  const providers: ProviderConfigFile[] = [];

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

    await walk(providersDir);

    for (const filePath of filePaths) {
      const relativeFromProvidersDir = normalizeSlashes(path.relative(providersDir, filePath));
      const relativeFromKanbanRoot = normalizeSlashes(path.relative(kanbanRoot, filePath));
      const baseId = path.basename(filePath, '.md');

      const isTopLevel = !relativeFromProvidersDir.includes('/');
      const id = isTopLevel ? baseId : relativeFromKanbanRoot;

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        const name =
          typeof parsed.data.name === 'string' ? parsed.data.name : formatProviderName(baseId);

        const configResult = ProviderConfigSchema.safeParse(parsed.data);

        providers.push({
          id,
          name,
          path: relativeFromKanbanRoot,
          config: configResult.success ? configResult.data : undefined,
        });
      } catch {
        providers.push({
          id,
          name: formatProviderName(baseId),
          path: relativeFromKanbanRoot,
          config: undefined,
        });
      }
    }
  } catch {
    return [];
  }

  return providers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolveProviderConfig(
  kanbanRoot: string,
  providerIdentifier: string,
): Promise<ProviderConfig | undefined> {
  const providers = await listAvailableProviders(kanbanRoot);

  const match = providers.find((a) => a.id === providerIdentifier || a.name === providerIdentifier);

  return match?.config;
}

export async function resolveProviderConfigFile(
  kanbanRoot: string,
  providerIdentifier: string,
): Promise<ProviderConfigFile | undefined> {
  const providers = await listAvailableProviders(kanbanRoot);

  return providers.find((a) => a.id === providerIdentifier || a.name === providerIdentifier);
}

export async function createProviderConfigFile(
  kanbanRoot: string,
  data: {
    name: string;
    config: ProviderConfig;
    content?: string;
  },
): Promise<string> {
  const fileName = `${data.name.toLowerCase().replace(/\s+/g, '-')}.md`;
  const providersDir = path.join(kanbanRoot, PROVIDERS_FOLDER);
  await fs.mkdir(providersDir, { recursive: true });

  const targetPath = path.join(providersDir, fileName);
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

export async function updateProviderConfigFile(
  kanbanRoot: string,
  providerId: string,
  data: {
    name?: string;
    config: ProviderConfig;
    content?: string;
  },
): Promise<string> {
  const provider = await resolveProviderConfigFile(kanbanRoot, providerId);
  if (!provider) {
    throw new Error(`Provider config not found: ${providerId}`);
  }

  const targetPath = path.join(kanbanRoot, provider.path);
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
    name: data.name || provider.name,
    updated: new Date().toISOString().split('T')[0],
    ...data.config,
  };

  const fileContent = matter.stringify(data.content ?? existingContent, frontmatter);
  await fs.writeFile(targetPath, fileContent, 'utf-8');

  return provider.path;
}

export async function deleteProviderConfigFile(kanbanRoot: string, providerId: string): Promise<boolean> {
  const provider = await resolveProviderConfigFile(kanbanRoot, providerId);
  if (!provider) {
    return false;
  }

  const targetPath = path.join(kanbanRoot, provider.path);
  await ensureSafePath(kanbanRoot, targetPath);

  try {
    await fs.unlink(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function loadProviderConfigContent(
  kanbanRoot: string,
  providerName?: string | null,
): Promise<string> {
  if (!providerName) return '';

  const provider = await resolveProviderConfigFile(kanbanRoot, providerName);
  if (!provider) return '';

  return readFileIfExists(kanbanRoot, provider.path);
}

function formatProviderName(id: string): string {
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
    console.warn(`Failed to read provider config file ${targetPath}:`, error);
    return '';
  }
}
