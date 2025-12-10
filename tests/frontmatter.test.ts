import { expect, test, vi, afterEach } from 'vitest';
import { parseTaskContent, stringifyTaskFile } from '../src/services/frontmatter';
import { Task } from '../src/types/task';
import * as path from 'path';

afterEach(() => {
  vi.restoreAllMocks();
});

const SAMPLE_CONTENT = `--- 
stage: plan
tags: ['feature', 'ui']
created: 2025-01-01
extra_field: preserved
---

# My Task Title

This is the body.
`;

test('parseTaskContent extracts frontmatter and content', () => {
  const filePath = '/workspace/projects/kanban/phase-1/task-1.md';
  const task = parseTaskContent(SAMPLE_CONTENT, filePath);

  expect(task.id).toBe('task-1');
  expect(task.title).toBe('My Task Title');
  expect(task.stage).toBe('plan');
  expect(task.tags).toEqual(['feature', 'ui']);
  expect(task.content.trim()).toBe('# My Task Title\n\nThis is the body.');
  
  // Inferred fields
  expect(task.project).toBe('kanban');
  expect(task.phase).toBe('phase-1');
});

test('parseTaskContent defaults stage to inbox', () => {
  const content = `--- 
tags: []
---
# No Stage
`;
  const task = parseTaskContent(content, '/inbox/task.md');
  expect(task.stage).toBe('inbox');
});

test('parseTaskContent extracts title from h1', () => {
  const content = `
body without frontmatter
# The Title
`;
  const task = parseTaskContent(content, 'foo.md');
  expect(task.title).toBe('The Title');
});

test('stringifyTaskFile preserves unknown fields', () => {
  const filePath = '/workspace/projects/kanban/phase-1/task-1.md';
  const originalTask = parseTaskContent(SAMPLE_CONTENT, filePath);
  
  // Modify a known field
  originalTask.stage = 'code';
  
  const serialized = stringifyTaskFile(originalTask, SAMPLE_CONTENT);
  
  expect(serialized).toContain('stage: code');
  expect(serialized).toContain('extra_field: preserved');
  expect(serialized).toContain('# My Task Title');
});

test('stringifyTaskFile does not write project/phase to frontmatter', () => {
  const task: Task = {
    id: 'foo',
    filePath: '/projects/p1/t1.md',
    title: 'Foo',
    stage: 'inbox',
    project: 'p1', // Should not appear in output
    content: 'Body',
  };
  
  const serialized = stringifyTaskFile(task);
  expect(serialized).not.toContain('project:');
  expect(serialized).toContain('stage: inbox');
});

test('parseTaskContent warns but does not throw on invalid YAML', () => {
  const content = `---
stage: [unclosed list
---
# Title`;
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  const task = parseTaskContent(content, 'foo.md');

  expect(task.stage).toBe('inbox');
  expect(task.title).toBe('Title');
  expect(warn).toHaveBeenCalled();
});

test('stringifyTaskFile handles special characters', () => {
  const task: Task = {
    id: 'special',
    filePath: 's.md',
    title: 'Special: "Quotes" & symbols',
    stage: 'inbox',
    content: '# Special: "Quotes" & symbols\n\nBody with emoji 🚀 and "quotes".',
    tags: ['c++', 'c#']
  };

  const serialized = stringifyTaskFile(task);
  // Ensure we can parse it back
  const parsed = parseTaskContent(serialized, 's.md');
  expect(parsed.title).toBe('Special: "Quotes" & symbols');
  expect(parsed.tags).toEqual(['c++', 'c#']);
});
