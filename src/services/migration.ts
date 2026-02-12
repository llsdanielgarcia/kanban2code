import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import {
  AGENTS_FOLDER,
  ARCHIVE_FOLDER,
  CONFIG_FILE,
  INBOX_FOLDER,
  KANBAN_FOLDER,
  PROVIDERS_FOLDER,
  PROJECTS_FOLDER,
} from '../core/constants';
import { DEFAULT_CONFIG } from '../types/config';

export interface MigrationReport {
  createdProviders: string[];
  updatedTasks: string[];
  removedModes: boolean;
  skipped: string[];
}

interface ResolvedConfig {
  providerDefaults: Record<string, string>;
  defaultProvider: string;
}

/**
 * Migrate workspace to provider-based configuration:
 * 1. Create `_providers/` with CLI config files
 * 2. Scan all task files: remove `mode` field, add `provider` from defaults
 * 3. Delete `_modes/` directory if it exists
 */
export async function migrateToProviders(root: string): Promise<MigrationReport> {
  const report: MigrationReport = {
    createdProviders: [],
    updatedTasks: [],
    removedModes: false,
    skipped: [],
  };

  const kanbanRoot = resolveKanbanRoot(root);
  const providersDir = path.join(kanbanRoot, PROVIDERS_FOLDER);

  await fs.mkdir(providersDir, { recursive: true });
  await ensureLogsGitignoreEntry(kanbanRoot);

  // 1. Create provider CLI config files
  await createProviderConfigs(kanbanRoot, report);

  // 2. Update task frontmatter: remove mode, add provider
  await updateTaskFrontmatterForProviders(kanbanRoot, report);

  // 3. Delete _modes/ directory if it exists
  const modesDir = path.join(kanbanRoot, '_modes');
  if (await pathExists(modesDir)) {
    await fs.rm(modesDir, { recursive: true, force: true });
    report.removedModes = true;
  }

  return report;
}

function resolveKanbanRoot(root: string): string {
  if (path.basename(root) === KANBAN_FOLDER) {
    return root;
  }
  return path.join(root, KANBAN_FOLDER);
}

async function ensureLogsGitignoreEntry(kanbanRoot: string): Promise<void> {
  const gitignorePath = path.join(kanbanRoot, '.gitignore');
  let existing = '';
  try {
    existing = await fs.readFile(gitignorePath, 'utf-8');
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const entries = new Set(
    existing
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
  entries.add('_logs/');

  const nextContent = `${Array.from(entries).join('\n')}\n`;
  if (nextContent !== existing) {
    await fs.writeFile(gitignorePath, nextContent, 'utf-8');
  }
}

async function createProviderConfigs(
  kanbanRoot: string,
  report: MigrationReport,
): Promise<void> {
  const providersDir = path.join(kanbanRoot, PROVIDERS_FOLDER);
  await fs.mkdir(providersDir, { recursive: true });

  const templates = getProviderCliTemplates();
  for (const [fileName, content] of Object.entries(templates)) {
    const absolutePath = path.join(providersDir, fileName);
    if (await fileExists(absolutePath)) {
      report.skipped.push(`${PROVIDERS_FOLDER}/${fileName}`.replace(/\\/g, '/'));
      continue;
    }
    await fs.writeFile(absolutePath, content, 'utf-8');
    report.createdProviders.push(`${PROVIDERS_FOLDER}/${fileName}`.replace(/\\/g, '/'));
  }
}

function getProviderCliTemplates(): Record<string, string> {
  return {
    'opus.md': matter.stringify('', {
      cli: 'claude',
      model: 'claude-opus-4-5',
      unattended_flags: ['--dangerously-skip-permissions'],
      output_flags: ['--output-format', 'json'],
      prompt_style: 'flag',
      safety: {
        max_turns: 20,
        max_budget_usd: 5,
      },
      provider: 'anthropic',
    }),
    'codex.md': matter.stringify('', {
      cli: 'codex',
      subcommand: 'exec',
      model: 'gpt-5.3-codex',
      unattended_flags: ['--yolo'],
      output_flags: ['--json'],
      prompt_style: 'stdin',
      provider: 'openai',
      config_overrides: {
        model_reasoning_effort: 'high',
      },
    }),
    'kimi.md': matter.stringify('', {
      cli: 'kimi',
      model: 'kimi-k2-thinking-turbo',
      unattended_flags: ['--print'],
      output_flags: ['--quiet'],
      prompt_style: 'flag',
      provider: 'moonshot',
    }),
    'glm.md': matter.stringify('', {
      cli: 'kilo',
      subcommand: 'run',
      model: 'openrouter/z-ai/glm-4.7',
      unattended_flags: ['--auto'],
      output_flags: ['--format', 'json'],
      prompt_style: 'positional',
      provider: 'openrouter',
    }),
  };
}

async function updateTaskFrontmatterForProviders(
  kanbanRoot: string,
  report: MigrationReport,
): Promise<void> {
  const config = await readMergedConfig(kanbanRoot);
  const taskFiles = await listTaskFiles(kanbanRoot);

  for (const filePath of taskFiles) {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(raw);

    let changed = false;

    // Remove mode field if present
    if (typeof parsed.data.mode === 'string') {
      delete parsed.data.mode;
      changed = true;
    }

    // Add provider based on agent field if provider is not set
    const currentAgent = typeof parsed.data.agent === 'string' ? parsed.data.agent : undefined;
    if (currentAgent && !parsed.data.provider) {
      const mappedProvider = config.providerDefaults[currentAgent] ?? config.defaultProvider;
      parsed.data.provider = mappedProvider;
      changed = true;
    }

    if (!changed) continue;

    const next = matter.stringify(parsed.content, parsed.data);
    await fs.writeFile(filePath, next, 'utf-8');
    report.updatedTasks.push(path.relative(kanbanRoot, filePath).replace(/\\/g, '/'));
  }
}

async function readMergedConfig(kanbanRoot: string): Promise<ResolvedConfig> {
  const configPath = path.join(kanbanRoot, CONFIG_FILE);

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as {
      providerDefaults?: Record<string, string>;
      modeDefaults?: Record<string, string>; // backward compat
      preferences?: { defaultAgent?: string };
    };

    return {
      providerDefaults: {
        ...DEFAULT_CONFIG.providerDefaults,
        ...parsed.modeDefaults, // backward compat: read old key
        ...parsed.providerDefaults,
      },
      defaultProvider: parsed.preferences?.defaultAgent ?? DEFAULT_CONFIG.preferences.defaultAgent ?? 'codex',
    };
  } catch {
    return {
      providerDefaults: { ...DEFAULT_CONFIG.providerDefaults },
      defaultProvider: DEFAULT_CONFIG.preferences.defaultAgent ?? 'codex',
    };
  }
}

async function listTaskFiles(kanbanRoot: string): Promise<string[]> {
  const roots = [
    path.join(kanbanRoot, INBOX_FOLDER),
    path.join(kanbanRoot, PROJECTS_FOLDER),
    path.join(kanbanRoot, ARCHIVE_FOLDER),
  ];

  const files: string[] = [];
  for (const root of roots) {
    await walkMarkdownFiles(root, files);
  }
  return files.sort();
}

async function walkMarkdownFiles(absoluteDir: string, collector: string[]): Promise<void> {
  const entries = await safeReadDir(absoluteDir);
  for (const entry of entries) {
    const entryPath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      await walkMarkdownFiles(entryPath, collector);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      collector.push(entryPath);
    }
  }
}

async function safeReadDir(dirPath: string) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}
