import * as fs from 'fs/promises';
import * as path from 'path';
import type { Stats } from 'fs';
import { BUNDLED_AGENTS } from '../assets/agents';
import { BUNDLED_MODES } from '../assets/modes';
import { BUNDLED_CONTEXTS } from '../assets/contexts';
import {
  HOW_IT_WORKS,
  ARCHITECTURE,
  PROJECT_DETAILS,
  INBOX_TASK_SAMPLE,
} from '../assets/seed-content';

export const KANBAN_FOLDER = '.kanban2code';

export type SyncReport = {
  updated: string[];
  skipped: string[];
  created: string[];
};

export async function scaffoldWorkspace(rootPath: string): Promise<void> {
  const kanbanRoot = path.join(rootPath, KANBAN_FOLDER);

  try {
    await fs.access(kanbanRoot);
    // If access succeeds, folder exists. We MUST fail.
    throw new Error('Kanban2Code already initialized.');
  } catch (error: any) {
    // Only proceed if the error is specifically that the entry is missing
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Create directories
  const dirs = [
    'inbox',
    'projects',
    '_agents',
    '_modes',
    '_context',
    '_archive',
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(kanbanRoot, dir), { recursive: true });
  }

  // Create seed files
  await fs.writeFile(path.join(kanbanRoot, 'how-it-works.md'), HOW_IT_WORKS);
  await fs.writeFile(path.join(kanbanRoot, 'architecture.md'), ARCHITECTURE);
  await fs.writeFile(path.join(kanbanRoot, 'project-details.md'), PROJECT_DETAILS);

  // Write bundled agents (orchestration + execution pipeline agents)
  for (const [filename, content] of Object.entries(BUNDLED_AGENTS)) {
    await fs.writeFile(path.join(kanbanRoot, '_agents', filename), content);
  }

  // Write bundled modes
  for (const [filename, content] of Object.entries(BUNDLED_MODES)) {
    await fs.writeFile(path.join(kanbanRoot, '_modes', filename), content);
  }

  // Write bundled context files
  for (const [relativePath, content] of Object.entries(BUNDLED_CONTEXTS)) {
    const contextPath = path.join(kanbanRoot, '_context', relativePath);
    await fs.mkdir(path.dirname(contextPath), { recursive: true });
    await fs.writeFile(contextPath, content);
  }

  await fs.writeFile(
    path.join(kanbanRoot, 'inbox/sample-task.md'),
    INBOX_TASK_SAMPLE.replace('{date}', new Date().toISOString())
  );

  // Create .gitignore for _archive
  await fs.writeFile(path.join(kanbanRoot, '.gitignore'), '_archive/\n');
}

/**
 * Sync workspace template files to an existing workspace.
 * Updates only files that match the bundled template content.
 */
export async function syncWorkspace(rootPath: string): Promise<SyncReport> {
  const kanbanRoot = path.join(rootPath, KANBAN_FOLDER);
  let kanbanRootStat: Stats;
  try {
    kanbanRootStat = await fs.stat(kanbanRoot);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw new Error('Kanban2Code not initialized. Run scaffoldWorkspace first.');
    }
    throw error;
  }

  if (!kanbanRootStat.isDirectory()) {
    throw new Error(`${KANBAN_FOLDER} exists but is not a directory.`);
  }

  const dirs = [
    'inbox',
    'projects',
    '_agents',
    '_modes',
    '_context',
    '_archive',
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(kanbanRoot, dir), { recursive: true });
  }

  const templates: Record<string, string> = {
    'how-it-works.md': HOW_IT_WORKS,
    'architecture.md': ARCHITECTURE,
    'project-details.md': PROJECT_DETAILS,
    '.gitignore': '_archive/\n',
  };

  for (const [filename, content] of Object.entries(BUNDLED_AGENTS)) {
    templates[`_agents/${filename}`] = content;
  }

  for (const [filename, content] of Object.entries(BUNDLED_MODES)) {
    templates[`_modes/${filename}`] = content;
  }

  for (const [relativePath, content] of Object.entries(BUNDLED_CONTEXTS)) {
    templates[`_context/${relativePath}`] = content;
  }

  const report: SyncReport = {
    updated: [],
    skipped: [],
    created: [],
  };

  for (const [relativePath, content] of Object.entries(templates)) {
    const filePath = path.join(kanbanRoot, relativePath);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new Error(`Template path exists but is not a file: ${filePath}`);
      }
      
      // File exists, skipping to preserve user changes
      report.skipped.push(relativePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
      // File does not exist, creating it
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
      report.created.push(relativePath);
    }
  }

  return report;
}

/**
 * Sync bundled agents to an existing workspace.
 * Only writes agents that don't already exist (preserves user customizations).
 */
export async function syncBundledAgents(rootPath: string): Promise<string[]> {
  const kanbanRoot = path.join(rootPath, KANBAN_FOLDER);
  let kanbanRootStat: Stats;
  try {
    kanbanRootStat = await fs.stat(kanbanRoot);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw new Error('Kanban2Code not initialized. Run scaffoldWorkspace first.');
    }
    throw error;
  }

  if (!kanbanRootStat.isDirectory()) {
    throw new Error(`${KANBAN_FOLDER} exists but is not a directory.`);
  }

  const agentsDir = path.join(kanbanRoot, '_agents');
  const synced: string[] = [];

  // Ensure _agents directory exists
  await fs.mkdir(agentsDir, { recursive: true });

  for (const [filename, content] of Object.entries(BUNDLED_AGENTS)) {
    const agentPath = path.join(agentsDir, filename);
    try {
      const stat = await fs.stat(agentPath);
      if (!stat.isFile()) {
        throw new Error(`Agent path exists but is not a file: ${agentPath}`);
      }
      // File exists, skip to preserve user customizations.
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }

      // File doesn't exist, write it.
      await fs.writeFile(agentPath, content);
      synced.push(filename);
    }
  }

  return synced;
}
