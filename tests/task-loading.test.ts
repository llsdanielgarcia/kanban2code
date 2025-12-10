import { expect, test, afterEach, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { loadAllTasks } from '../src/services/scanner';
import { KANBAN_FOLDER, INBOX_FOLDER, PROJECTS_FOLDER } from '../src/core/constants';

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-scanner-test-' + Date.now());
  KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

test('loadAllTasks finds tasks in inbox and projects', async () => {
  // Setup structure
  const inbox = path.join(KANBAN_ROOT, INBOX_FOLDER);
  const proj = path.join(KANBAN_ROOT, PROJECTS_FOLDER, 'alpha');
  const phase = path.join(proj, 'phase-1');

  await fs.mkdir(inbox, { recursive: true });
  await fs.mkdir(phase, { recursive: true });

  // Create tasks
  await fs.writeFile(path.join(inbox, 't1.md'), '---\nstage: inbox\n---\n# Task 1');
  await fs.writeFile(path.join(proj, 't2.md'), '---\nstage: plan\n---\n# Task 2');
  await fs.writeFile(path.join(phase, 't3.md'), '---\nstage: code\n---\n# Task 3');
  
  // Create ignored file
  await fs.writeFile(path.join(proj, '_context.md'), 'Context info');

  const tasks = await loadAllTasks(KANBAN_ROOT);

  expect(tasks).toHaveLength(3);
  
  const t1 = tasks.find(t => t.id === 't1');
  expect(t1).toBeDefined();
  expect(t1?.stage).toBe('inbox');

  const t2 = tasks.find(t => t.id === 't2');
  expect(t2).toBeDefined();
  expect(t2?.project).toBe('alpha');
  expect(t2?.phase).toBeUndefined();

  const t3 = tasks.find(t => t.id === 't3');
  expect(t3).toBeDefined();
  expect(t3?.project).toBe('alpha');
  expect(t3?.phase).toBe('phase-1');
});

test('loadAllTasks handles empty workspace', async () => {
  const tasks = await loadAllTasks(KANBAN_ROOT);
  expect(tasks).toEqual([]);
});

test('loadAllTasks tolerates malformed frontmatter and applies defaults', async () => {
  const inbox = path.join(KANBAN_ROOT, INBOX_FOLDER);
  await fs.mkdir(inbox, { recursive: true });
  
  await fs.writeFile(path.join(inbox, 'valid.md'), '---\nstage: inbox\n---\n# Valid');
  await fs.writeFile(path.join(inbox, 'bad.md'), '---\nstage: [unclosed\n---\n# Bad');

  const tasks = await loadAllTasks(KANBAN_ROOT);
  
  expect(tasks.map((t) => t.id).sort()).toEqual(['bad', 'valid']);
  const bad = tasks.find((t) => t.id === 'bad');
  expect(bad?.stage).toBe('inbox');
});
