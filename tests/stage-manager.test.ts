import { expect, test, afterEach, beforeEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { updateTaskStage, changeStageAndReload } from '../src/services/stage-manager';
import { parseTaskFile } from '../src/services/frontmatter';
import { Task } from '../src/types/task';
import { WorkspaceState } from '../src/workspace/state';
import { KANBAN_FOLDER } from '../src/core/constants';

let TEST_DIR: string;
let TASK_PATH: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-stage-test-' + Date.now());
  await fs.mkdir(TEST_DIR, { recursive: true });
  
  TASK_PATH = path.join(TEST_DIR, 'task-1.md');
  await fs.writeFile(TASK_PATH, `---
stage: inbox
---
# Task 1
`);
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  vi.restoreAllMocks();
});

test('updateTaskStage updates stage in file', async () => {
  const task = await parseTaskFile(TASK_PATH);
  
  const updated = await updateTaskStage(task, 'plan');
  
  expect(updated.stage).toBe('plan');
  
  const fileContent = await fs.readFile(TASK_PATH, 'utf-8');
  expect(fileContent).toContain('stage: plan');
});

test('updateTaskStage forbids invalid transition', async () => {
  const task = await parseTaskFile(TASK_PATH);
  // Inbox -> Audit not allowed
  await expect(updateTaskStage(task, 'audit')).rejects.toThrow('not allowed');
});

test('changeStageAndReload works with ID', async () => {
  // Mock WorkspaceState
  // We need to setup a fake kanban structure for scanner to find it
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });
  
  const inboxTaskPath = path.join(kanbanRoot, 'inbox', 't1.md');
  await fs.writeFile(inboxTaskPath, `---
stage: inbox
---
# Task 1
`);

  // Mock the static getter if possible, or just use the setter
  WorkspaceState.setKanbanRoot(kanbanRoot);

  const updated = await changeStageAndReload('t1', 'plan');
  expect(updated.stage).toBe('plan');
  
  const content = await fs.readFile(inboxTaskPath, 'utf-8');
  expect(content).toContain('stage: plan');
});
