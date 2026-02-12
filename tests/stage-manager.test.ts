import { expect, test, afterEach, beforeEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  updateTaskStage,
  changeStageAndReload,
  moveTaskToLocation,
  getDefaultAgentForStage,
  getDefaultProviderForAgent,
} from '../src/services/stage-manager';
import { parseTaskFile } from '../src/services/frontmatter';
import { Task } from '../src/types/task';
import { WorkspaceState } from '../src/workspace/state';
import { KANBAN_FOLDER, AGENTS_FOLDER, PROVIDERS_FOLDER } from '../src/core/constants';
import { configService } from '../src/services/config';

let TEST_DIR: string;
let TASK_PATH: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-stage-test-' + Date.now());
  await fs.mkdir(TEST_DIR, { recursive: true });

  TASK_PATH = path.join(TEST_DIR, 'task-1.md');
  await fs.writeFile(
    TASK_PATH,
    `---
stage: inbox
---
# Task 1
`,
  );
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  WorkspaceState.setKanbanRoot(null);
  vi.restoreAllMocks();
});

test('updateTaskStage moves forward one stage', async () => {
  const task = await parseTaskFile(TASK_PATH);

  const updated = await updateTaskStage(task, 'plan');

  expect(updated.stage).toBe('plan');

  const fileContent = await fs.readFile(TASK_PATH, 'utf-8');
  expect(fileContent).toContain('stage: plan');
});

test('updateTaskStage allows moving backward one stage', async () => {
  await fs.writeFile(
    TASK_PATH,
    `---
stage: audit
---
# Task 1
`,
  );

  const task = await parseTaskFile(TASK_PATH);

  const updated = await updateTaskStage(task, 'code');

  expect(updated.stage).toBe('code');

  const fileContent = await fs.readFile(TASK_PATH, 'utf-8');
  expect(fileContent).toContain('stage: code');
});

test('updateTaskStage forbids invalid transition', async () => {
  const task = await parseTaskFile(TASK_PATH);
  // Inbox -> Audit not allowed
  await expect(updateTaskStage(task, 'audit')).rejects.toThrow('not allowed');
});

test('updateTaskStage throws on task ID mismatch', async () => {
  const task = await parseTaskFile(TASK_PATH);
  (task as Task).id = 'different-id';
  await expect(updateTaskStage(task, 'plan')).rejects.toThrow('Task ID mismatch');
});

test('completed tasks cannot move to other stages', async () => {
  await fs.writeFile(
    TASK_PATH,
    `---
stage: completed
---
# Task 1
`,
  );

  const task = await parseTaskFile(TASK_PATH);
  await expect(updateTaskStage(task, 'plan')).rejects.toThrow('not allowed');
});

test('changeStageAndReload works with ID', async () => {
  // Mock WorkspaceState
  // We need to setup a fake kanban structure for scanner to find it
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });

  const inboxTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    inboxTaskPath,
    `---
stage: inbox
---
# Task 1
`,
  );

  // Mock the static getter if possible, or just use the setter
  WorkspaceState.setKanbanRoot(kanbanRoot);

  const updated = await changeStageAndReload('t1', 'plan');
  expect(updated.stage).toBe('plan');

  const content = await fs.readFile(inboxTaskPath, 'utf-8');
  expect(content).toContain('stage: plan');
});

test('changeStageAndReload throws when kanban root is missing', async () => {
  WorkspaceState.setKanbanRoot(null);
  await expect(changeStageAndReload('t1', 'plan')).rejects.toThrow('Kanban root not found');
});

test('changeStageAndReload throws when task is not found', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });
  WorkspaceState.setKanbanRoot(kanbanRoot);
  await expect(changeStageAndReload('missing', 'plan')).rejects.toThrow('Task not found');
});

test('moveTaskToLocation moves tasks between inbox and projects', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });

  const taskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    taskPath,
    `---
stage: inbox
---
# Task 1
`,
  );

  WorkspaceState.setKanbanRoot(kanbanRoot);

  const toProject = await moveTaskToLocation('t1', {
    type: 'project',
    project: 'alpha',
    phase: 'phase-1',
  });
  expect(toProject).toBe(path.join(kanbanRoot, 'projects', 'alpha', 'phase-1', 't1.md'));
  await expect(fs.readFile(toProject, 'utf-8')).resolves.toContain('# Task 1');

  // No-op move when already in target location
  const again = await moveTaskToLocation('t1', {
    type: 'project',
    project: 'alpha',
    phase: 'phase-1',
  });
  expect(again).toBe(toProject);

  const backToInbox = await moveTaskToLocation('t1', { type: 'inbox' });
  expect(backToInbox).toBe(path.join(kanbanRoot, 'inbox', 't1.md'));
  await expect(fs.readFile(backToInbox, 'utf-8')).resolves.toContain('# Task 1');
});

test('moveTaskToLocation throws when kanban root is missing', async () => {
  WorkspaceState.setKanbanRoot(null);
  await expect(moveTaskToLocation('t1', { type: 'inbox' })).rejects.toThrow(
    'Kanban root not found',
  );
});

test('moveTaskToLocation throws when task is not found', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });
  WorkspaceState.setKanbanRoot(kanbanRoot);
  await expect(moveTaskToLocation('missing', { type: 'inbox' })).rejects.toThrow('Task not found');
});

test('getDefaultAgentForStage returns agent matching stage', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });

  await fs.writeFile(
    path.join(agentsDir, '04-planner.md'),
    `---
name: planner
stage: plan
---
# Planner
`,
  );
  await fs.writeFile(
    path.join(agentsDir, '05-coder.md'),
    `---
name: coder
stage: code
---
# Coder
`,
  );
  await fs.writeFile(
    path.join(agentsDir, '06-auditor.md'),
    `---
name: auditor
stage: audit
---
# Auditor
`,
  );

  expect(await getDefaultAgentForStage(kanbanRoot, 'plan')).toBe('04-planner');
  expect(await getDefaultAgentForStage(kanbanRoot, 'code')).toBe('05-coder');
  expect(await getDefaultAgentForStage(kanbanRoot, 'audit')).toBe('06-auditor');
  expect(await getDefaultAgentForStage(kanbanRoot, 'inbox')).toBeUndefined();
  expect(await getDefaultAgentForStage(kanbanRoot, 'completed')).toBeUndefined();
});

test('updateTaskStage auto-assigns agent when transitioning stages', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });

  await fs.writeFile(
    path.join(agentsDir, '04-planner.md'),
    `---
name: planner
stage: plan
---
# Planner
`,
  );

  const inboxTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    inboxTaskPath,
    `---
stage: inbox
---
# Task 1
`,
  );

  const task = await parseTaskFile(inboxTaskPath);
  const updated = await updateTaskStage(task, 'plan', kanbanRoot);

  expect(updated.stage).toBe('plan');
  expect(updated.agent).toBe('04-planner');

  const fileContent = await fs.readFile(inboxTaskPath, 'utf-8');
  expect(fileContent).toContain('stage: plan');
  expect(fileContent).toContain('agent: 04-planner');
});

test('updateTaskStage preserves custom agent when transitioning', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });

  await fs.writeFile(
    path.join(agentsDir, '04-planner.md'),
    `---
name: planner
stage: plan
---
# Planner
`,
  );
  await fs.writeFile(
    path.join(agentsDir, '05-coder.md'),
    `---
name: coder
stage: code
---
# Coder
`,
  );

  const planTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    planTaskPath,
    `---
stage: plan
agent: custom-agent
---
# Task 1
`,
  );

  const task = await parseTaskFile(planTaskPath);
  const updated = await updateTaskStage(task, 'code', kanbanRoot);

  expect(updated.stage).toBe('code');
  expect(updated.agent).toBe('custom-agent');
});

test('updateTaskStage updates agent when current matches stage default', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });

  await fs.writeFile(
    path.join(agentsDir, '04-planner.md'),
    `---
name: planner
stage: plan
---
# Planner
`,
  );
  await fs.writeFile(
    path.join(agentsDir, '05-coder.md'),
    `---
name: coder
stage: code
---
# Coder
`,
  );

  const planTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    planTaskPath,
    `---
stage: plan
agent: 04-planner
---
# Task 1
`,
  );

  const task = await parseTaskFile(planTaskPath);
  const updated = await updateTaskStage(task, 'code', kanbanRoot);

  expect(updated.stage).toBe('code');
  expect(updated.agent).toBe('05-coder');
});

test('changeStageAndReload auto-assigns agent', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });

  await fs.writeFile(
    path.join(agentsDir, '04-planner.md'),
    `---
name: planner
stage: plan
---
# Planner
`,
  );

  const inboxTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    inboxTaskPath,
    `---
stage: inbox
---
# Task 1
`,
  );

  WorkspaceState.setKanbanRoot(kanbanRoot);

  const updated = await changeStageAndReload('t1', 'plan');
  expect(updated.stage).toBe('plan');
  expect(updated.agent).toBe('04-planner');
});

test('getDefaultProviderForAgent returns provider from config', () => {
  expect(getDefaultProviderForAgent('coder')).toBe('opus');
  expect(getDefaultProviderForAgent('auditor')).toBe('opus');
  expect(getDefaultProviderForAgent('planner')).toBe('sonnet');
  expect(getDefaultProviderForAgent('nonexistent')).toBeUndefined();
});

test('updateTaskStage auto-sets provider and agent from providerDefaults', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });
  await configService.initialize(kanbanRoot);

  await fs.writeFile(
    path.join(agentsDir, 'coder.md'),
    `---
name: coder
stage: code
---
# Coder
`,
  );
  await fs.writeFile(
    path.join(agentsDir, 'auditor.md'),
    `---
name: auditor
stage: audit
---
# Auditor
`,
  );

  const inboxTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    inboxTaskPath,
    `---
stage: plan
---
# Task 1
`,
  );

  const task = await parseTaskFile(inboxTaskPath);
  const updated = await updateTaskStage(task, 'code', kanbanRoot);

  expect(updated.stage).toBe('code');
  expect(updated.agent).toBe('coder');
  expect(updated.provider).toBe('opus');

  const fileContent = await fs.readFile(inboxTaskPath, 'utf-8');
  expect(fileContent).toContain('agent: coder');
  expect(fileContent).toContain('provider: opus');
});

test('updateTaskStage auto-sets auditor agent and provider on audit stage', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });
  await configService.initialize(kanbanRoot);

  await fs.writeFile(
    path.join(agentsDir, 'coder.md'),
    `---
name: coder
stage: code
---
# Coder
`,
  );
  await fs.writeFile(
    path.join(agentsDir, 'auditor.md'),
    `---
name: auditor
stage: audit
---
# Auditor
`,
  );

  const codeTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    codeTaskPath,
    `---
stage: code
agent: coder
---
# Task 1
`,
  );

  const task = await parseTaskFile(codeTaskPath);
  const updated = await updateTaskStage(task, 'audit', kanbanRoot);

  expect(updated.stage).toBe('audit');
  expect(updated.agent).toBe('auditor');
  expect(updated.provider).toBe('opus');
});

test('updateTaskStage preserves manually set provider on stage change', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  const agentsDir = path.join(kanbanRoot, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });
  await configService.initialize(kanbanRoot);

  await fs.writeFile(
    path.join(agentsDir, 'coder.md'),
    `---
name: coder
stage: code
---
# Coder
`,
  );
  await fs.writeFile(
    path.join(agentsDir, 'auditor.md'),
    `---
name: auditor
stage: audit
---
# Auditor
`,
  );

  const codeTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(
    codeTaskPath,
    `---
stage: code
provider: custom-provider
agent: custom-agent
---
# Task 1
`,
  );

  const task = await parseTaskFile(codeTaskPath);
  const updated = await updateTaskStage(task, 'audit', kanbanRoot);

  expect(updated.stage).toBe('audit');
  expect(updated.provider).toBe('custom-provider');
  expect(updated.agent).toBe('custom-agent');
});
