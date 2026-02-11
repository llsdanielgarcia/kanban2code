import { expect, test, describe, afterEach, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { sortTasks, getOrderedTasksForStage, loadAllTasks } from '../src/services/scanner';
import { Task } from '../src/types/task';
import { KANBAN_FOLDER, INBOX_FOLDER } from '../src/core/constants';

/** Helper to create a minimal Task stub */
function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    filePath: `/fake/${overrides.id}.md`,
    title: overrides.id,
    stage: 'inbox',
    content: '',
    tags: [],
    contexts: [],
    skills: [],
    ...overrides,
  };
}

describe('sortTasks', () => {
  test('tasks with explicit order values sort correctly (1, 2, 3)', () => {
    const tasks = [
      makeTask({ id: 'c', order: 3 }),
      makeTask({ id: 'a', order: 1 }),
      makeTask({ id: 'b', order: 2 }),
    ];

    const sorted = sortTasks(tasks);

    expect(sorted.map(t => t.id)).toEqual(['a', 'b', 'c']);
    expect(sorted.map(t => t.order)).toEqual([1, 2, 3]);
  });

  test('tasks without order sort after those with order, by filename', () => {
    const tasks = [
      makeTask({ id: 'z-task' }),              // no order
      makeTask({ id: 'a-task', order: 2 }),    // order 2
      makeTask({ id: 'm-task' }),              // no order
      makeTask({ id: 'b-task', order: 1 }),    // order 1
    ];

    const sorted = sortTasks(tasks);

    expect(sorted.map(t => t.id)).toEqual([
      'b-task',  // order 1
      'a-task',  // order 2
      'm-task',  // no order, alphabetically first
      'z-task',  // no order, alphabetically last
    ]);
  });

  test('tasks with same order sort by filename', () => {
    const tasks = [
      makeTask({ id: 'charlie', order: 1 }),
      makeTask({ id: 'alpha', order: 1 }),
      makeTask({ id: 'bravo', order: 1 }),
    ];

    const sorted = sortTasks(tasks);

    expect(sorted.map(t => t.id)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  test('all tasks without order sort by filename only', () => {
    const tasks = [
      makeTask({ id: 'zebra' }),
      makeTask({ id: 'apple' }),
      makeTask({ id: 'mango' }),
    ];

    const sorted = sortTasks(tasks);

    expect(sorted.map(t => t.id)).toEqual(['apple', 'mango', 'zebra']);
  });

  test('returns new array and does not mutate input', () => {
    const tasks = [
      makeTask({ id: 'b', order: 2 }),
      makeTask({ id: 'a', order: 1 }),
    ];
    const copy = [...tasks];

    const sorted = sortTasks(tasks);

    expect(sorted).not.toBe(tasks);
    expect(tasks.map(t => t.id)).toEqual(copy.map(t => t.id));
  });

  test('empty array returns empty array', () => {
    expect(sortTasks([])).toEqual([]);
  });
});

describe('getOrderedTasksForStage', () => {
  test('filters by stage and sorts correctly', () => {
    const tasks = [
      makeTask({ id: 'plan-z', stage: 'plan', order: 2 }),
      makeTask({ id: 'code-a', stage: 'code', order: 1 }),
      makeTask({ id: 'plan-a', stage: 'plan', order: 1 }),
      makeTask({ id: 'code-b', stage: 'code' }),
      makeTask({ id: 'plan-m', stage: 'plan' }),
    ];

    const planTasks = getOrderedTasksForStage(tasks, 'plan');
    expect(planTasks.map(t => t.id)).toEqual(['plan-a', 'plan-z', 'plan-m']);

    const codeTasks = getOrderedTasksForStage(tasks, 'code');
    expect(codeTasks.map(t => t.id)).toEqual(['code-a', 'code-b']);
  });

  test('returns empty array when no tasks match stage', () => {
    const tasks = [
      makeTask({ id: 'task-1', stage: 'inbox' }),
    ];

    expect(getOrderedTasksForStage(tasks, 'audit')).toEqual([]);
  });

  test('preserves deterministic order across multiple calls', () => {
    const tasks = [
      makeTask({ id: 'c', stage: 'code' }),
      makeTask({ id: 'a', stage: 'code', order: 1 }),
      makeTask({ id: 'b', stage: 'code' }),
    ];

    const first = getOrderedTasksForStage(tasks, 'code');
    const second = getOrderedTasksForStage(tasks, 'code');

    expect(first.map(t => t.id)).toEqual(second.map(t => t.id));
    expect(first.map(t => t.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('loadAllTasks deterministic ordering', () => {
  let TEST_DIR: string;
  let KANBAN_ROOT: string;

  beforeEach(async () => {
    TEST_DIR = path.join(os.tmpdir(), 'kanban-scanner-order-test-' + Date.now());
    KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
    const inbox = path.join(KANBAN_ROOT, INBOX_FOLDER);
    await fs.mkdir(inbox, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  test('loadAllTasks returns tasks sorted by order then filename', async () => {
    const inbox = path.join(KANBAN_ROOT, INBOX_FOLDER);

    // Write files in non-deterministic naming to verify sort
    await fs.writeFile(
      path.join(inbox, 'z-task.md'),
      '---\nstage: inbox\n---\n# Z Task',
    );
    await fs.writeFile(
      path.join(inbox, 'a-task.md'),
      '---\nstage: inbox\norder: 2\n---\n# A Task',
    );
    await fs.writeFile(
      path.join(inbox, 'm-task.md'),
      '---\nstage: inbox\norder: 1\n---\n# M Task',
    );

    const tasks = await loadAllTasks(KANBAN_ROOT);

    expect(tasks.map(t => t.id)).toEqual([
      'm-task',  // order 1
      'a-task',  // order 2
      'z-task',  // no order, last
    ]);
  });
});
