import { beforeEach, afterEach, expect, test } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  buildContextOnlyPrompt,
  buildXMLPrompt,
  buildRunnerPrompt,
} from '../src/services/prompt-builder';
import {
  KANBAN_FOLDER,
  PROJECTS_FOLDER,
  AGENTS_FOLDER,
  CONTEXT_FOLDER,
} from '../src/core/constants';
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

  const tokens = ['HOW', 'ARCH', 'DETAIL', 'AGENT', 'PROJECT', 'PHASE', 'CUSTOM', 'TASK_BODY'];
  const positions = tokens.map((token) => xml.indexOf(token));
  positions.forEach((pos) => expect(pos).toBeGreaterThanOrEqual(0));
  for (let i = 1; i < positions.length; i++) {
    expect(positions[i - 1]).toBeLessThan(positions[i]);
  }
});

test('buildContextOnlyPrompt omits task content', async () => {
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

test('skills are included in the prompt when specified', async () => {
  await seedContextFiles();

  const skillsDir = path.join(KANBAN_ROOT, CONTEXT_FOLDER, 'skills');
  await fs.mkdir(skillsDir, { recursive: true });
  await fs.writeFile(path.join(skillsDir, 'react.md'), 'REACT_SKILL_CONTENT');

  const task: Task = {
    id: 'task-4',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-4.md'),
    title: 'Task 4',
    stage: 'plan',
    skills: ['react'],
    content: 'BODY',
  };

  const xml = await buildXMLPrompt(task, KANBAN_ROOT);
  expect(xml).toContain('REACT_SKILL_CONTENT');
  expect(xml).toContain('name="skills"');
});

test('skills section is skipped when no skills specified', async () => {
  await seedContextFiles();

  const task: Task = {
    id: 'task-5',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-5.md'),
    title: 'Task 5',
    stage: 'plan',
    content: 'BODY',
  };

  const xml = await buildXMLPrompt(task, KANBAN_ROOT);
  expect(xml).not.toContain('name="skills"');
});

test('task with agent loads instructions from _agents/{agent}.md', async () => {
  await seedContextFiles();

  const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
  await fs.writeFile(path.join(agentsDir, 'coder.md'), 'AGENT_CODER_INSTRUCTIONS');

  const task: Task = {
    id: 'task-6',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-6.md'),
    title: 'Task 6',
    stage: 'plan',
    agent: 'coder',
    content: 'BODY',
  };

  const xml = await buildXMLPrompt(task, KANBAN_ROOT);
  expect(xml).toContain('AGENT_CODER_INSTRUCTIONS');
  expect(xml).toContain('name="agent"');
});

test('task agent name resolves prefixed agent filename for copy XML prompts', async () => {
  await seedContextFiles();

  const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
  await fs.writeFile(
    path.join(agentsDir, '06-✅auditor.md'),
    `---
name: auditor
---

AUDITOR_INSTRUCTIONS`,
  );

  const task: Task = {
    id: 'task-6b',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-6b.md'),
    title: 'Task 6b',
    stage: 'audit',
    agent: 'auditor',
    content: 'BODY',
  };

  const xml = await buildXMLPrompt(task, KANBAN_ROOT);
  expect(xml).toContain('AUDITOR_INSTRUCTIONS');
  expect(xml).toContain('name="agent"');
});

test('task without agent skips agent section', async () => {
  await seedContextFiles();

  const task: Task = {
    id: 'task-7',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-7.md'),
    title: 'Task 7',
    stage: 'plan',
    content: 'BODY',
  };

  const xml = await buildXMLPrompt(task, KANBAN_ROOT);
  expect(xml).not.toContain('name="agent"');
});

test('buildRunnerPrompt returns both xmlPrompt and agentInstructions', async () => {
  await seedContextFiles();

  const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
  await fs.writeFile(path.join(agentsDir, 'coder.md'), 'AGENT_INSTRUCTIONS_RAW');

  const task: Task = {
    id: 'task-9',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-9.md'),
    title: 'Task 9',
    stage: 'plan',
    agent: 'coder',
    content: 'BODY',
  };

  const result = await buildRunnerPrompt(task, KANBAN_ROOT);
  expect(result.xmlPrompt).toContain('<system>');
  expect(result.xmlPrompt).toContain('AGENT_INSTRUCTIONS_RAW');
  expect(result.agentInstructions).toBe('AGENT_INSTRUCTIONS_RAW');
});

test('buildRunnerPrompt resolves agent instructions by frontmatter agent name', async () => {
  await seedContextFiles();

  const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
  await fs.writeFile(
    path.join(agentsDir, '06-✅auditor.md'),
    `---
name: auditor
---

RUNNER_AUDITOR_INSTRUCTIONS`,
  );

  const task: Task = {
    id: 'task-9b',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-9b.md'),
    title: 'Task 9b',
    stage: 'audit',
    agent: 'auditor',
    content: 'BODY',
  };

  const result = await buildRunnerPrompt(task, KANBAN_ROOT);
  expect(result.xmlPrompt).toContain('RUNNER_AUDITOR_INSTRUCTIONS');
  expect(result.agentInstructions).toContain('RUNNER_AUDITOR_INSTRUCTIONS');
});

test('runner prompt includes automated flag', async () => {
  await seedContextFiles();

  const task: Task = {
    id: 'task-10',
    filePath: path.join(KANBAN_ROOT, 'inbox', 'task-10.md'),
    title: 'Task 10',
    stage: 'plan',
    content: 'BODY',
  };

  const result = await buildRunnerPrompt(task, KANBAN_ROOT);
  expect(result.xmlPrompt).toContain('<runner automated="true" />');
});
