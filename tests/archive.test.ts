import { expect, test, afterEach, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { archiveTask, archiveProject } from '../src/services/archive';
import { Task } from '../src/types/task';
import { KANBAN_FOLDER, INBOX_FOLDER, PROJECTS_FOLDER, ARCHIVE_FOLDER } from '../src/core/constants';

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-archive-test-' + Date.now());
  KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

test('archiveTask moves inbox task to archive', async () => {
  const inbox = path.join(KANBAN_ROOT, INBOX_FOLDER);
  await fs.mkdir(inbox, { recursive: true });
  const taskPath = path.join(inbox, 't1.md');
  await fs.writeFile(taskPath, 'content');

  const task: Task = {
    id: 't1',
    filePath: taskPath,
    title: 'T1',
    stage: 'completed',
    content: 'content'
  };

  await archiveTask(task, KANBAN_ROOT);

  // Check original gone
  await expect(fs.access(taskPath)).rejects.toThrow();
  // Check new exists
  const archivePath = path.join(KANBAN_ROOT, ARCHIVE_FOLDER, INBOX_FOLDER, 't1.md');
  await fs.access(archivePath);
});

test('archiveTask forbids non-completed tasks', async () => {
  const task: Task = {
    id: 't1',
    filePath: 'foo',
    title: 'T1',
    stage: 'inbox',
    content: ''
  };
  await expect(archiveTask(task, KANBAN_ROOT)).rejects.toThrow('must be \'completed\'');
});

test('archiveProject moves entire project folder', async () => {
  const proj = path.join(KANBAN_ROOT, PROJECTS_FOLDER, 'alpha');
  await fs.mkdir(proj, { recursive: true });
  await fs.writeFile(path.join(proj, 't1.md'), 'content');

  await archiveProject(KANBAN_ROOT, 'alpha');

  // Check original gone
  await expect(fs.access(proj)).rejects.toThrow();
  // Check new exists
  const archiveProj = path.join(KANBAN_ROOT, ARCHIVE_FOLDER, PROJECTS_FOLDER, 'alpha');
  await fs.access(archiveProj);
  await fs.access(path.join(archiveProj, 't1.md'));
});
