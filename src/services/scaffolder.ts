import * as fs from 'fs/promises';
import * as path from 'path';
import type { Stats } from 'fs';
import { BUNDLED_AGENTS } from '../assets/agents';
import {
  HOW_IT_WORKS,
  ARCHITECTURE,
  PROJECT_DETAILS,
  AGENT_OPUS,
  INBOX_TASK_SAMPLE,
} from '../assets/seed-content';

export const KANBAN_FOLDER = '.kanban2code';

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
  await fs.writeFile(path.join(kanbanRoot, '_agents/opus.md'), AGENT_OPUS);

  // Write bundled agents (orchestration + execution pipeline agents)
  for (const [filename, content] of Object.entries(BUNDLED_AGENTS)) {
    await fs.writeFile(path.join(kanbanRoot, '_agents', filename), content);
  }

  await fs.writeFile(
    path.join(kanbanRoot, 'inbox/sample-task.md'),
    INBOX_TASK_SAMPLE.replace('{date}', new Date().toISOString())
  );

  // Create .gitignore for _archive
  await fs.writeFile(path.join(kanbanRoot, '.gitignore'), '_archive/\n');
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
