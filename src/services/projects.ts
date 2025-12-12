import * as fs from 'fs/promises';
import type { Dirent } from 'fs';
import * as path from 'path';
import { PROJECTS_FOLDER } from '../core/constants';
import { ensureSafePath } from '../workspace/validation';

export interface ProjectListing {
  projects: string[];
  phasesByProject: Record<string, string[]>;
}

export async function listProjectsAndPhases(kanbanRoot: string): Promise<ProjectListing> {
  const projectsDir = path.join(kanbanRoot, PROJECTS_FOLDER);
  await ensureSafePath(kanbanRoot, projectsDir);

  let entries: Dirent[];
  try {
    entries = await fs.readdir(projectsDir, { withFileTypes: true });
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { projects: [], phasesByProject: {} };
    }
    throw error;
  }

  const projects: string[] = [];
  const phasesByProject: Record<string, string[]> = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

    const project = entry.name;
    projects.push(project);

    const projectDir = path.join(projectsDir, project);
    await ensureSafePath(kanbanRoot, projectDir);

    try {
      const phaseEntries = await fs.readdir(projectDir, { withFileTypes: true });
      phasesByProject[project] = phaseEntries
        .filter((phaseEntry) => phaseEntry.isDirectory())
        .map((phaseEntry) => phaseEntry.name)
        .filter((phase) => !(phase.startsWith('.') || phase.startsWith('_')))
        .sort();
    } catch {
      phasesByProject[project] = [];
    }
  }

  projects.sort((a, b) => a.localeCompare(b));

  return { projects, phasesByProject };
}
