import type { Stage } from '../types/task';

export const STAGES: Stage[] = ['inbox', 'plan', 'code', 'audit', 'completed'];

export const KANBAN_ROOT = '.kanban2code';

export const FOLDERS = {
  inbox: 'inbox',
  projects: 'projects',
  agents: '_agents',
  templates: '_templates',
  stageTemplates: '_templates/stages',
  taskTemplates: '_templates/tasks',
  archive: '_archive',
  contexts: '_contexts',
};

export const GLOBAL_CONTEXT_FILES = {
  howItWorks: 'how-it-works.md',
  architecture: 'architecture.md',
  projectDetails: 'project-details.md',
};
