import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import matter from 'gray-matter';
import {
  AGENTS_FOLDER,
  ARCHIVE_FOLDER,
  CONFIG_FILE,
  INBOX_FOLDER,
  KANBAN_FOLDER,
  MODES_FOLDER,
  PROJECTS_FOLDER,
} from '../core/constants';
import { DEFAULT_CONFIG } from '../types/config';

const LEGACY_PREFIX_REGEX = /^\d+-[^\w]*/;
const NEW_AGENT_FILES = ['opus.md', 'codex.md', 'kimi.md', 'glm.md'] as const;

export interface MigrationReport {
  movedModes: string[];
  createdAgents: string[];
  updatedTasks: string[];
  skipped: string[];
}

interface LegacyAgentFile {
  absolutePath: string;
  relativePath: string;
  rawName: string;
  cleanName: string;
}

interface ResolvedConfig {
  modeDefaults: Record<string, string>;
  defaultAgent: string;
}

/**
 * Atomically migrate legacy behavior files from `_agents/` to `_modes/`,
 * rewrite tasks to use `mode + agent`, then replace `_agents/` with CLI config files.
 */
export async function migrateAgentsToModes(root: string): Promise<MigrationReport> {
  const report: MigrationReport = {
    movedModes: [],
    createdAgents: [],
    updatedTasks: [],
    skipped: [],
  };

  const kanbanRoot = resolveKanbanRoot(root);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  const modesDir = path.join(kanbanRoot, MODES_FOLDER);

  await fs.mkdir(modesDir, { recursive: true });
  await ensureLogsGitignoreEntry(kanbanRoot);

  const backupDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-migration-agents-'));
  let rollbackNeeded = false;

  try {
    await copyDir(agentsDir, backupDir);

    const legacyAgentFiles = await getLegacyAgentFiles(kanbanRoot);
    const legacyNameMap = buildLegacyNameMap(legacyAgentFiles);
    const migratedModePaths = await copyLegacyAgentsToModes(
      kanbanRoot,
      legacyAgentFiles,
      report,
    );

    rollbackNeeded = migratedModePaths.length > 0 || legacyAgentFiles.length > 0;

    await updateTaskFrontmatterForModes(kanbanRoot, legacyNameMap, report);
    await fixAuditorArchitecturePath(modesDir);

    await replaceAgentsWithCliConfigs(kanbanRoot, legacyAgentFiles, report);
  } catch (error) {
    if (rollbackNeeded) {
      await rollbackMigration(kanbanRoot, backupDir, report.movedModes);
    }
    throw error;
  } finally {
    await fs.rm(backupDir, { recursive: true, force: true });
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

async function getLegacyAgentFiles(kanbanRoot: string): Promise<LegacyAgentFile[]> {
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  const entries = await safeReadDir(agentsDir);
  const files: LegacyAgentFile[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    if (NEW_AGENT_FILES.includes(entry.name as (typeof NEW_AGENT_FILES)[number])) continue;

    const rawName = path.basename(entry.name, '.md');
    const cleanName = cleanLegacyAgentName(rawName);
    files.push({
      absolutePath: path.join(agentsDir, entry.name),
      relativePath: `${AGENTS_FOLDER}/${entry.name}`.replace(/\\/g, '/'),
      rawName,
      cleanName,
    });
  }

  return files.sort((a, b) => a.rawName.localeCompare(b.rawName));
}

function cleanLegacyAgentName(value: string): string {
  const cleaned = value.replace(LEGACY_PREFIX_REGEX, '');
  return cleaned || value;
}

function buildLegacyNameMap(legacyFiles: LegacyAgentFile[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of legacyFiles) {
    map.set(file.rawName, file.cleanName);
    map.set(file.cleanName, file.cleanName);
  }
  return map;
}

async function copyLegacyAgentsToModes(
  kanbanRoot: string,
  legacyFiles: LegacyAgentFile[],
  report: MigrationReport,
): Promise<string[]> {
  const created: string[] = [];
  const modesDir = path.join(kanbanRoot, MODES_FOLDER);

  for (const file of legacyFiles) {
    const modeRelativePath = `${MODES_FOLDER}/${file.cleanName}.md`;
    const modeAbsolutePath = path.join(kanbanRoot, modeRelativePath);

    if (await fileExists(modeAbsolutePath)) {
      report.skipped.push(modeRelativePath.replace(/\\/g, '/'));
      continue;
    }

    const raw = await fs.readFile(file.absolutePath, 'utf-8');
    const parsed = matter(raw);

    const modeFrontmatter: Record<string, unknown> = { ...parsed.data };
    delete modeFrontmatter.type;

    const next = matter.stringify(parsed.content, modeFrontmatter);
    await fs.mkdir(modesDir, { recursive: true });
    await fs.writeFile(modeAbsolutePath, next, 'utf-8');

    created.push(modeAbsolutePath);
    report.movedModes.push(modeRelativePath.replace(/\\/g, '/'));
  }

  return created;
}

async function updateTaskFrontmatterForModes(
  kanbanRoot: string,
  legacyNameMap: Map<string, string>,
  report: MigrationReport,
): Promise<void> {
  const config = await readMergedConfig(kanbanRoot);
  const taskFiles = await listTaskFiles(kanbanRoot);

  for (const filePath of taskFiles) {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(raw);

    const currentAgent = typeof parsed.data.agent === 'string' ? parsed.data.agent : undefined;
    if (!currentAgent) continue;

    const modeName = legacyNameMap.get(currentAgent);
    if (!modeName) continue;

    const mappedAgent = config.modeDefaults[modeName] ?? config.defaultAgent;
    const hasMode = typeof parsed.data.mode === 'string' && parsed.data.mode.length > 0;

    let changed = false;
    if (!hasMode) {
      parsed.data.mode = modeName;
      changed = true;
    }
    if (parsed.data.agent !== mappedAgent) {
      parsed.data.agent = mappedAgent;
      changed = true;
    }

    if (!changed) continue;

    const next = matter.stringify(parsed.content, parsed.data);
    await fs.writeFile(filePath, next, 'utf-8');
    report.updatedTasks.push(path.relative(kanbanRoot, filePath).replace(/\\/g, '/'));
  }
}

async function fixAuditorArchitecturePath(modesDir: string): Promise<void> {
  const auditorPath = path.join(modesDir, 'auditor.md');
  if (!(await fileExists(auditorPath))) return;

  const content = await fs.readFile(auditorPath, 'utf-8');
  const updated = content.replaceAll('_context/architecture.md', 'architecture.md');
  if (updated !== content) {
    await fs.writeFile(auditorPath, updated, 'utf-8');
  }
}

async function replaceAgentsWithCliConfigs(
  kanbanRoot: string,
  legacyFiles: LegacyAgentFile[],
  report: MigrationReport,
): Promise<void> {
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });

  for (const legacy of legacyFiles) {
    if (await fileExists(legacy.absolutePath)) {
      await fs.unlink(legacy.absolutePath);
    }
  }

  const templates = getAgentCliTemplates();
  for (const [fileName, content] of Object.entries(templates)) {
    const absolutePath = path.join(agentsDir, fileName);
    if (await fileExists(absolutePath)) {
      report.skipped.push(`${AGENTS_FOLDER}/${fileName}`.replace(/\\/g, '/'));
      continue;
    }
    await fs.writeFile(absolutePath, content, 'utf-8');
    report.createdAgents.push(`${AGENTS_FOLDER}/${fileName}`.replace(/\\/g, '/'));
  }
}

function getAgentCliTemplates(): Record<string, string> {
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

async function readMergedConfig(kanbanRoot: string): Promise<ResolvedConfig> {
  const configPath = path.join(kanbanRoot, CONFIG_FILE);

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as {
      modeDefaults?: Record<string, string>;
      preferences?: { defaultAgent?: string };
    };

    return {
      modeDefaults: { ...DEFAULT_CONFIG.modeDefaults, ...parsed.modeDefaults },
      defaultAgent: parsed.preferences?.defaultAgent ?? DEFAULT_CONFIG.preferences.defaultAgent ?? 'codex',
    };
  } catch {
    return {
      modeDefaults: { ...DEFAULT_CONFIG.modeDefaults },
      defaultAgent: DEFAULT_CONFIG.preferences.defaultAgent ?? 'codex',
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

async function rollbackMigration(
  kanbanRoot: string,
  backupDir: string,
  movedModeRelativePaths: string[],
): Promise<void> {
  for (const movedModePath of movedModeRelativePaths) {
    const absolutePath = path.join(kanbanRoot, movedModePath);
    await fs.rm(absolutePath, { force: true });
  }

  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.rm(agentsDir, { recursive: true, force: true });
  await copyDir(backupDir, agentsDir);
}

async function copyDir(fromDir: string, toDir: string): Promise<void> {
  await fs.mkdir(toDir, { recursive: true });
  const entries = await safeReadDir(fromDir);

  for (const entry of entries) {
    const sourcePath = path.join(fromDir, entry.name);
    const targetPath = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function safeReadDir(dirPath: string): Promise<fs.Dirent[]> {
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
