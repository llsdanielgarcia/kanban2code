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

/**
 * Create a new project directory with optional initial phases.
 */
export async function createProject(
  kanbanRoot: string,
  data: {
    name: string;
    phases?: string[];
  }
): Promise<string> {
  const projectsDir = path.join(kanbanRoot, PROJECTS_FOLDER);
  await fs.mkdir(projectsDir, { recursive: true });

  const projectName = data.name.toLowerCase().replace(/\s+/g, '-');
  const projectDir = path.join(projectsDir, projectName);
  await ensureSafePath(kanbanRoot, projectDir);

  await fs.mkdir(projectDir, { recursive: true });

  // Create initial phases if provided
  if (data.phases && data.phases.length > 0) {
    for (const phase of data.phases) {
      const phaseName = phase.toLowerCase().replace(/\s+/g, '-');
      const phaseDir = path.join(projectDir, phaseName);
      await ensureSafePath(kanbanRoot, phaseDir);
      await fs.mkdir(phaseDir, { recursive: true });
    }
  }

  return projectName;
}
