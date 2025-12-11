import { beforeEach, afterEach, expect, test } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { buildContextOnlyPrompt, buildXMLPrompt } from '../src/services/prompt-builder';
import { KANBAN_FOLDER, PROJECTS_FOLDER, AGENTS_FOLDER, TEMPLATES_FOLDER } from '../src/core/constants';
import { Task } from '../src/types/task';

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-prompt-' + Date.now());
  KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

async function seedContextFiles() {
  await fs.writeFile(path.join(KANBAN_ROOT, 'how-it-works.md'), 'HOW');
  await fs.writeFile(path.join(KANBAN_ROOT, 'architecture.md'), 'ARCH');
  await fs.writeFile(path.join(KANBAN_ROOT, 'project-details.md'), 'DETAIL');

  const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.writeFile(path.join(agentsDir, 'opus.md'), 'AGENT');

  const projectDir = path.join(KANBAN_ROOT, PROJECTS_FOLDER, 'alpha');
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(path.join(projectDir, '_context.md'), 'PROJECT');

  const phaseDir = path.join(projectDir, 'phase-1');
  await fs.mkdir(phaseDir, { recursive: true });
  await fs.writeFile(path.join(phaseDir, '_context.md'), 'PHASE');

  await fs.writeFile(path.join(KANBAN_ROOT, 'custom-ctx.md'), 'CUSTOM');

  const stageDir = path.join(KANBAN_ROOT, TEMPLATES_FOLDER, 'stages');
  await fs.mkdir(stageDir, { recursive: true });
  await fs.writeFile(path.join(stageDir, 'plan.md'), 'STAGE');
}

test('buildXMLPrompt assembles 9-layer ordering and wraps in system/task', async () => {
  await seedContextFiles();

  const filePath = path.join(KANBAN_ROOT, PROJECTS_FOLDER, 'alpha', 'phase-1', 'task-1.md');
  const task: Task = {
    id: 'task-1',
    filePath,
    title: 'Task 1',
    stage: 'plan',
    project: 'alpha',
    phase: 'phase-1',
    agent: 'opus',
    contexts: ['custom-ctx'],
    tags: ['tag-a'],
    content: 'TASK_BODY',
  };

  const xml = await buildXMLPrompt(task, KANBAN_ROOT);
  expect(xml.startsWith('<system>')).toBe(true);
  expect(xml.includes('<task>')).toBe(true);

  const tokens = ['HOW', 'ARCH', 'DETAIL', 'AGENT', 'PROJECT', 'PHASE', 'STAGE', 'CUSTOM', 'TASK_BODY'];
  const positions = tokens.map((token) => xml.indexOf(token));
  positions.forEach((pos) => expect(pos).toBeGreaterThanOrEqual(0));
  for (let i = 1; i < positions.length; i++) {
    expect(positions[i - 1]).toBeLessThan(positions[i]);
  }
});

test('buildContextOnlyPrompt omits task content but includes stage template', async () => {
  await seedContextFiles();

  const task: Task = {
    id: 'task-2',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-2.md'),
    title: 'Task 2',
    stage: 'plan',
    content: 'ONLY_TASK',
  };

  const xml = await buildContextOnlyPrompt(task, KANBAN_ROOT);
  expect(xml).toContain('<context>');
  expect(xml).not.toContain('<task>');
  expect(xml).toContain('STAGE');
  expect(xml).not.toContain('ONLY_TASK');
});

test('agent section is skipped when missing', async () => {
  await seedContextFiles();

  const task: Task = {
    id: 'task-3',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-3.md'),
    title: 'Task 3',
    stage: 'plan',
    content: 'BODY',
  };

  const xml = await buildXMLPrompt(task, KANBAN_ROOT);
  expect(xml).not.toContain('name="agent"');
});
