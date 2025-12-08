import fs from 'fs/promises';
import path from 'path';
import { FOLDERS, KANBAN_ROOT, STAGES } from '../core/constants';
import { ensurePathInsideRoot, findKanbanRoot, pickDefaultWorkspaceFolder } from './validation';

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function writeFileIfMissing(target: string, contents: string): Promise<void> {
  const exists = await pathExists(target);
  if (exists) return;
  await fs.writeFile(target, contents, 'utf8');
}

export async function scaffoldWorkspace(): Promise<string> {
  const existingRoot = await findKanbanRoot();
  if (existingRoot) {
    return existingRoot;
  }

  const workspaceFolder = pickDefaultWorkspaceFolder();
  if (!workspaceFolder) {
    throw new Error('No workspace folders available to scaffold Kanban2Code.');
  }

  const root = path.join(workspaceFolder.uri.fsPath, KANBAN_ROOT);
  await fs.mkdir(root, { recursive: true });

  const foldersToCreate = [
    FOLDERS.inbox,
    FOLDERS.projects,
    FOLDERS.agents,
    FOLDERS.stageTemplates,
    FOLDERS.taskTemplates,
    FOLDERS.archive,
    FOLDERS.contexts,
  ];

  await Promise.all(
    foldersToCreate.map(async (folder) => {
      const folderPath = path.join(root, folder);
      ensurePathInsideRoot(folderPath, root);
      await fs.mkdir(folderPath, { recursive: true });
    }),
  );

  await writeFileIfMissing(
    path.join(root, '.gitignore'),
    `# Kanban2Code archive\n${FOLDERS.archive}\n`,
  );

  await writeFileIfMissing(
    path.join(root, 'how-it-works.md'),
    `# Kanban2Code Workspace\n\nThis folder is managed by the Kanban2Code extension. Tasks live in the inbox or in project folders.\n\n- Use templates in ${FOLDERS.stageTemplates} and ${FOLDERS.taskTemplates}\n- Archive completed tasks into ${FOLDERS.archive}\n- Agents live in ${FOLDERS.agents}\n`,
  );

  await writeFileIfMissing(
    path.join(root, 'architecture.md'),
    `# Architecture\n\n- Inbox: ${FOLDERS.inbox}\n- Projects: ${FOLDERS.projects}\n- Agents: ${FOLDERS.agents}\n- Templates: ${FOLDERS.templates}\n- Contexts: ${FOLDERS.contexts}\n- Archive: ${FOLDERS.archive}\n`,
  );

  await writeFileIfMissing(
    path.join(root, 'project-details.md'),
    `# Project Details\n\nDocument your project goals, constraints, and conventions here.\n`,
  );

  await writeFileIfMissing(
    path.join(root, FOLDERS.agents, 'opus.md'),
    `# Opus Agent\n\nDescribe the Opus agent behavior, strengths, and usage patterns.\n`,
  );

  await writeFileIfMissing(
    path.join(root, FOLDERS.stageTemplates, 'inbox.md'),
    stageTemplate('inbox', 'Untriaged work items live here.'),
  );
  await writeFileIfMissing(
    path.join(root, FOLDERS.stageTemplates, 'plan.md'),
    stageTemplate('plan', 'Break down scope and acceptance criteria.'),
  );
  await writeFileIfMissing(
    path.join(root, FOLDERS.stageTemplates, 'code.md'),
    stageTemplate('code', 'Actively coding or implementing changes.'),
  );
  await writeFileIfMissing(
    path.join(root, FOLDERS.stageTemplates, 'audit.md'),
    stageTemplate('audit', 'Review, test, or validate work.'),
  );
  await writeFileIfMissing(
    path.join(root, FOLDERS.stageTemplates, 'completed.md'),
    stageTemplate('completed', 'Done and ready to archive.'),
  );

  await writeFileIfMissing(
    path.join(root, FOLDERS.taskTemplates, 'bug.md'),
    `---\nstage: inbox\ntitle: Fix a bug\ntags:\n  - bug\n  - triage\n---\n\n# Bug\n\nDescribe the issue, steps to reproduce, and expected behavior.\n`,
  );

  const sampleTaskPath = path.join(root, FOLDERS.inbox, 'sample-task.md');
  await writeFileIfMissing(sampleTaskPath, sampleTask());

  return root;
}

function stageTemplate(stage: string, body: string): string {
  return `---\nstage: ${stage}\ntitle: ${stage} template\n---\n\n${body}\n`;
}

function sampleTask(): string {
  return `---\nstage: inbox\ntitle: Welcome to Kanban2Code\ntags:\n  - mvp\n  - onboarding\ncreated: ${new Date().toISOString()}\n---\n\nThanks for installing Kanban2Code. Move this task through the stages: ${STAGES.join(
    ' → ',
  )}.\n`;
}
