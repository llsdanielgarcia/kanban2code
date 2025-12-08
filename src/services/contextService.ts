import fs from 'fs/promises';
import path from 'path';
import { FOLDERS, GLOBAL_CONTEXT_FILES } from '../core/constants';

/**
 * Result of loading context files.
 * Each field is the content of the respective file, or null if not found.
 */
export interface GlobalContext {
  howItWorks: string | null;
  architecture: string | null;
  projectDetails: string | null;
}

/**
 * Safely reads a file's content, returning null if the file doesn't exist.
 */
async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Loads global context files from the .kanban2code root.
 * Files: how-it-works.md, architecture.md, project-details.md
 *
 * @param root - The .kanban2code root directory
 * @returns GlobalContext object with file contents or null for missing files
 */
export async function loadGlobalContext(root: string): Promise<GlobalContext> {
  const [howItWorks, architecture, projectDetails] = await Promise.all([
    safeReadFile(path.join(root, GLOBAL_CONTEXT_FILES.howItWorks)),
    safeReadFile(path.join(root, GLOBAL_CONTEXT_FILES.architecture)),
    safeReadFile(path.join(root, GLOBAL_CONTEXT_FILES.projectDetails)),
  ]);

  return { howItWorks, architecture, projectDetails };
}

/**
 * Loads an agent context file.
 *
 * @param root - The .kanban2code root directory
 * @param agentName - Name of the agent (without .md extension)
 * @returns Agent context content or null if not found
 */
export async function loadAgentContext(
  root: string,
  agentName: string,
): Promise<string | null> {
  const agentPath = path.join(root, FOLDERS.agents, `${agentName}.md`);
  return safeReadFile(agentPath);
}

/**
 * Loads a project's context file (_context.md in project directory).
 *
 * @param root - The .kanban2code root directory
 * @param projectName - Name of the project
 * @returns Project context content or null if not found
 */
export async function loadProjectContext(
  root: string,
  projectName: string,
): Promise<string | null> {
  const contextPath = path.join(root, FOLDERS.projects, projectName, '_context.md');
  return safeReadFile(contextPath);
}

/**
 * Loads a phase's context file (_context.md in phase directory).
 *
 * @param root - The .kanban2code root directory
 * @param projectName - Name of the project
 * @param phaseName - Name of the phase
 * @returns Phase context content or null if not found
 */
export async function loadPhaseContext(
  root: string,
  projectName: string,
  phaseName: string,
): Promise<string | null> {
  const contextPath = path.join(
    root,
    FOLDERS.projects,
    projectName,
    phaseName,
    '_context.md',
  );
  return safeReadFile(contextPath);
}

/**
 * Loads custom context files from the _contexts directory.
 *
 * @param root - The .kanban2code root directory
 * @param contextNames - Array of context file names (with or without .md extension)
 * @returns Array of context contents (null entries for missing files)
 */
export async function loadCustomContexts(
  root: string,
  contextNames: string[],
): Promise<(string | null)[]> {
  const results = await Promise.all(
    contextNames.map((name) => {
      const fileName = name.endsWith('.md') ? name : `${name}.md`;
      const contextPath = path.join(root, FOLDERS.contexts, fileName);
      return safeReadFile(contextPath);
    }),
  );
  return results;
}

/**
 * Loads all custom contexts and combines them into a single string.
 * Filters out null values and joins with double newlines.
 *
 * @param root - The .kanban2code root directory
 * @param contextNames - Array of context file names
 * @returns Combined context content or null if no contexts found
 */
export async function loadCustomContextsCombined(
  root: string,
  contextNames: string[],
): Promise<string | null> {
  if (!contextNames || contextNames.length === 0) {
    return null;
  }

  const contexts = await loadCustomContexts(root, contextNames);
  const validContexts = contexts.filter((c): c is string => c !== null);

  if (validContexts.length === 0) {
    return null;
  }

  return validContexts.join('\n\n');
}
