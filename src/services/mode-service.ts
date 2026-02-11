import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { MODES_FOLDER } from '../core/constants';
import { ensureSafePath } from '../workspace/validation';
import type { ModeConfig } from '../types/mode';

/**
 * List all available modes from the _modes/ directory.
 * Reads mode files, parses frontmatter, and returns ModeConfig[].
 */
export async function listAvailableModes(kanbanRoot: string): Promise<ModeConfig[]> {
  const modesDir = path.join(kanbanRoot, MODES_FOLDER);
  const modes: ModeConfig[] = [];

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

    await walk(modesDir);

    for (const filePath of filePaths) {
      const relativeFromModesDir = normalizeSlashes(path.relative(modesDir, filePath));
      const relativeFromKanbanRoot = normalizeSlashes(path.relative(kanbanRoot, filePath));
      const baseId = path.basename(filePath, '.md');

      const isTopLevel = !relativeFromModesDir.includes('/');
      const id = isTopLevel ? baseId : relativeFromKanbanRoot;

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = matter(content);

        modes.push({
          id,
          name: typeof parsed.data.name === 'string' ? parsed.data.name : formatModeName(baseId),
          description: typeof parsed.data.description === 'string' ? parsed.data.description : '',
          stage: typeof parsed.data.stage === 'string' ? parsed.data.stage : undefined,
          path: relativeFromKanbanRoot,
        });
      } catch {
        // If parsing fails, still include with defaults
        modes.push({
          id,
          name: formatModeName(baseId),
          description: '',
          path: relativeFromKanbanRoot,
        });
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
    return [];
  }

  return modes.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolve a mode identifier (either file ID or frontmatter name) to the actual file path.
 * Returns the relative path from kanban root, or undefined if not found.
 */
export async function resolveModePath(
  kanbanRoot: string,
  modeIdentifier: string
): Promise<string | undefined> {
  // First, try direct file path (mode ID is the filename without extension)
  const directPath = path.join(MODES_FOLDER, ensureExtension(modeIdentifier));
  if (await fileExists(kanbanRoot, directPath)) {
    return directPath;
  }

  // Fallback: scan all modes and find one whose frontmatter 'name' matches
  const modes = await listAvailableModes(kanbanRoot);
  const matchByName = modes.find((m) => m.name === modeIdentifier);
  if (matchByName) {
    return matchByName.path;
  }

  return undefined;
}

/**
 * Load the full content of a mode file as a string.
 */
export async function loadModeContext(kanbanRoot: string, modeName?: string | null): Promise<string> {
  if (!modeName) return '';

  const resolvedPath = await resolveModePath(kanbanRoot, modeName);
  if (!resolvedPath) return '';

  return readFileIfExists(kanbanRoot, resolvedPath);
}

/**
 * Create a new mode file with frontmatter + body.
 * Returns the relative path from kanban root.
 */
export async function createModeFile(
  kanbanRoot: string,
  data: {
    name: string;
    description: string;
    stage?: string;
    content: string;
  }
): Promise<string> {
  const fileName = `${data.name.toLowerCase().replace(/\s+/g, '-')}.md`;
  const modesDir = path.join(kanbanRoot, MODES_FOLDER);
  await fs.mkdir(modesDir, { recursive: true });

  const targetPath = path.join(modesDir, fileName);
  await ensureSafePath(kanbanRoot, targetPath);

  const frontmatter: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    created: new Date().toISOString().split('T')[0],
  };

  if (data.stage) {
    frontmatter.stage = data.stage;
  }

  const fileContent = matter.stringify(data.content, frontmatter);
  await fs.writeFile(targetPath, fileContent, 'utf-8');

  return path.relative(kanbanRoot, targetPath);
}

/**
 * Update an existing mode file by overwriting it.
 * Returns the relative path from kanban root.
 */
export async function updateModeFile(
  kanbanRoot: string,
  modeId: string,
  data: {
    name: string;
    description: string;
    stage?: string;
    content: string;
  }
): Promise<string> {
  const resolvedPath = await resolveModePath(kanbanRoot, modeId);
  if (!resolvedPath) {
    throw new Error(`Mode not found: ${modeId}`);
  }

  const targetPath = path.join(kanbanRoot, resolvedPath);
  await ensureSafePath(kanbanRoot, targetPath);

  const frontmatter: Record<string, unknown> = {
    name: data.name,
    description: data.description,
    updated: new Date().toISOString().split('T')[0],
  };

  if (data.stage) {
    frontmatter.stage = data.stage;
  }

  const fileContent = matter.stringify(data.content, frontmatter);
  await fs.writeFile(targetPath, fileContent, 'utf-8');

  return resolvedPath;
}

/**
 * Delete a mode file.
 * Returns true if deleted, false if not found.
 * Note: Does not check for task references - caller should handle warnings.
 */
export async function deleteModeFile(kanbanRoot: string, modeId: string): Promise<boolean> {
  const resolvedPath = await resolveModePath(kanbanRoot, modeId);
  if (!resolvedPath) {
    return false;
  }

  const targetPath = path.join(kanbanRoot, resolvedPath);
  await ensureSafePath(kanbanRoot, targetPath);

  try {
    await fs.unlink(targetPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a mode ID into a human-readable name.
 * e.g., "code-mode" -> "Code Mode"
 */
function formatModeName(id: string): string {
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
    console.warn(`Failed to read mode file ${targetPath}:`, error);
    return '';
  }
}

async function fileExists(root: string, relativePath: string): Promise<boolean> {
  const targetPath = path.join(root, relativePath);
  await ensureSafePath(root, targetPath);
  try {
    const stats = await fs.stat(targetPath);
    return stats.isFile();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return false;
    return false;
  }
}

function ensureExtension(name: string): string {
  return name.endsWith('.md') ? name : `${name}.md`;
}
