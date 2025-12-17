import { expect, test, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { scaffoldWorkspace, KANBAN_FOLDER } from '../src/services/scaffolder';

const TEST_DIR = path.join(os.tmpdir(), 'kanban2code-test-' + Date.now());

test('scaffolderWorkspace creates expected structure', async () => {
  await fs.mkdir(TEST_DIR, { recursive: true });

  await scaffoldWorkspace(TEST_DIR);

  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  
  // Check directories
  const statsInbox = await fs.stat(path.join(kanbanRoot, 'inbox'));
  expect(statsInbox.isDirectory()).toBe(true);
  
  const statsArchive = await fs.stat(path.join(kanbanRoot, '_archive'));
  expect(statsArchive.isDirectory()).toBe(true);

  await expect(fs.stat(path.join(kanbanRoot, '_templates'))).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(fs.stat(path.join(kanbanRoot, '_templates', 'tasks'))).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(fs.stat(path.join(kanbanRoot, '_templates', 'stages'))).rejects.toMatchObject({ code: 'ENOENT' });

  // Check files
  const howItWorks = await fs.readFile(path.join(kanbanRoot, 'how-it-works.md'), 'utf-8');
  expect(howItWorks).toContain('# How Kanban2Code Works');

  const architecture = await fs.readFile(path.join(kanbanRoot, 'architecture.md'), 'utf-8');
  expect(architecture).toContain('# Architecture');

  const agent = await fs.readFile(path.join(kanbanRoot, '_agents/opus.md'), 'utf-8');
  expect(agent).toContain('name: Opus');

  const inboxTask = await fs.readFile(path.join(kanbanRoot, 'inbox/sample-task.md'), 'utf-8');
  expect(inboxTask).toContain('# Explore Kanban2Code');

  const gitignore = await fs.readFile(path.join(kanbanRoot, '.gitignore'), 'utf-8');
  expect(gitignore).toContain('_archive/');
});

test('scaffoldWorkspace fails if already initialized', async () => {
  await fs.mkdir(TEST_DIR, { recursive: true });
  await scaffoldWorkspace(TEST_DIR);

  await expect(scaffoldWorkspace(TEST_DIR)).rejects.toThrow('Kanban2Code already initialized.');
});


afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});
