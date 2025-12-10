import { expect, test, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { findKanbanRoot, isSafePath, validateKanbanStructure, ensureSafePath } from '../src/workspace/validation';
import { KANBAN_FOLDER, INBOX_FOLDER, PROJECTS_FOLDER } from '../src/core/constants';

const TEST_DIR = path.join(os.tmpdir(), 'kanban2code-validation-test-' + Date.now());

test('findKanbanRoot returns path when folder exists', async () => {
  await fs.mkdir(path.join(TEST_DIR, KANBAN_FOLDER), { recursive: true });
  
  const result = await findKanbanRoot(TEST_DIR);
  expect(result).toBe(path.join(TEST_DIR, KANBAN_FOLDER));
});

test('findKanbanRoot returns null when folder missing', async () => {
  await fs.mkdir(TEST_DIR, { recursive: true });
  
  const result = await findKanbanRoot(TEST_DIR);
  expect(result).toBeNull();
});

test('validateKanbanStructure detects valid workspace', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(path.join(kanbanRoot, INBOX_FOLDER), { recursive: true });
  await fs.mkdir(path.join(kanbanRoot, PROJECTS_FOLDER), { recursive: true });

  const result = await validateKanbanStructure(TEST_DIR);
  expect(result.status).toBe('VALID');
});

test('validateKanbanStructure detects invalid workspace (missing subfolders)', async () => {
  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(kanbanRoot, { recursive: true });
  // Missing inbox/projects

  const result = await validateKanbanStructure(TEST_DIR);
  expect(result.status).toBe('INVALID');
  expect(result.message).toContain('Missing required folders');
});

test('isSafePath detects unsafe paths', async () => {
  const root = '/foo/bar';
  expect(await isSafePath(root, '/foo/bar/baz')).toBe(true);
  expect(await isSafePath(root, '/foo/baz')).toBe(false); // Sibling
  expect(await isSafePath(root, '/etc/passwd')).toBe(false);
});

test('ensureSafePath throws on unsafe paths', async () => {
  const root = '/foo/bar';
  await expect(ensureSafePath(root, '/foo/baz')).rejects.toThrow('Path validation failed');
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});
