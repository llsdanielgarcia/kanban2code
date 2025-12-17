import { beforeAll, beforeEach, afterEach, expect, test, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { KANBAN_FOLDER } from '../src/core/constants';
import { Task } from '../src/types/task';

const clipboardMock = vi.fn();

vi.mock('vscode', () => ({
  env: { clipboard: { writeText: clipboardMock } },
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
}));

let buildCopyPayload: typeof import('../src/services/copy').buildCopyPayload;
let copyToClipboard: typeof import('../src/services/copy').copyToClipboard;

beforeAll(async () => {
  const mod = await import('../src/services/copy');
  buildCopyPayload = mod.buildCopyPayload;
  copyToClipboard = mod.copyToClipboard;
});

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  clipboardMock.mockReset();
  TEST_DIR = path.join(os.tmpdir(), 'kanban-copy-' + Date.now());
  KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

function buildTask(): Task {
  return {
    id: 't1',
    filePath: path.join(KANBAN_ROOT, 'inbox', 't1.md'),
    title: 'Sample Task',
    stage: 'plan',
    contexts: ['custom-one'],
    tags: ['alpha'],
    content: 'Task Body',
  };
}

test('buildCopyPayload returns full XML payload by default', async () => {
  const task = buildTask();
  const payload = await buildCopyPayload(task, 'full_xml', KANBAN_ROOT);
  expect(payload).toContain('<system>');
  expect(payload).toContain('<context>');
  expect(payload).toContain('<task>');
  expect(payload).toContain('Task Body');
});

test('task_only mode omits context but keeps metadata and content', async () => {
  const task = buildTask();
  const payload = await buildCopyPayload(task, 'task_only', KANBAN_ROOT);
  expect(payload).toContain('<task>');
  expect(payload).not.toContain('<context>');
  expect(payload).toContain('Sample Task');
  expect(payload).toContain('Task Body');
});

test('context_only mode excludes task content', async () => {
  const task = buildTask();
  const payload = await buildCopyPayload(task, 'context_only', KANBAN_ROOT);
  expect(payload).toContain('<context>');
  expect(payload).not.toContain('Task Body');
  expect(payload).not.toContain('<task>');
});

test('copyToClipboard writes to VS Code clipboard API', async () => {
  await copyToClipboard('hello world');
  expect(clipboardMock).toHaveBeenCalledWith('hello world');
});
