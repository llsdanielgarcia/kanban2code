import * as fs from 'fs/promises';
import * as path from 'path';
import {
  HOW_IT_WORKS,
  TASK_TEMPLATE_BUG,
  STAGE_TEMPLATE,
  ARCHITECTURE,
  PROJECT_DETAILS,
  AGENT_OPUS,
  INBOX_TASK_SAMPLE,
} from '../assets/templates';
import { STAGES } from '../core/constants';

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
    '_templates/stages',
    '_templates/tasks',
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

  await fs.writeFile(
    path.join(kanbanRoot, 'inbox/sample-task.md'),
    INBOX_TASK_SAMPLE.replace('{date}', new Date().toISOString())
  );

  await fs.writeFile(
    path.join(kanbanRoot, '_templates/tasks/bug.md'),
    TASK_TEMPLATE_BUG.replace('{date}', new Date().toISOString())
  );

  for (const stage of STAGES) {
    await fs.writeFile(
      path.join(kanbanRoot, `_templates/stages/${stage}.md`),
      STAGE_TEMPLATE(stage)
    );
  }

  // Create .gitignore for _archive
  await fs.writeFile(path.join(kanbanRoot, '.gitignore'), '_archive/\n');
}
