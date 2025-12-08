import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { buildCopyPayload } from '../../src/services/copyService';
import { GLOBAL_CONTEXT_FILES } from '../../src/core/constants';
import type { Task } from '../../src/types/task';

describe('copyService', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  const createTestTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'test-task',
    filePath: '/path/to/test-task.md',
    title: 'Test Task',
    stage: 'code',
    content: '# Test Task\n\nTask content here.',
    ...overrides,
  });

  describe('buildCopyPayload', () => {
    it('should build full_xml payload by default', async () => {
      const task = createTestTask();

      const result = await buildCopyPayload(task, tempRoot);

      expect(result.mode).toBe('full_xml');
      expect(result.taskTitle).toBe('Test Task');
      expect(result.content).toContain('<system>');
      expect(result.content).toContain('<task>');
    });

    it('should build full_xml payload with context', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'How it works',
      );

      const task = createTestTask();
      const result = await buildCopyPayload(task, tempRoot, 'full_xml');

      expect(result.content).toContain('<context>');
      expect(result.content).toContain('How it works');
      expect(result.content).toContain('<task>');
    });

    it('should build context_only payload', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'Context content only',
      );

      const task = createTestTask();
      const result = await buildCopyPayload(task, tempRoot, 'context_only');

      expect(result.mode).toBe('context_only');
      expect(result.content).toContain('<context>');
      expect(result.content).toContain('Context content only');
      expect(result.content).not.toContain('<task>');
    });

    it('should return empty string for context_only when no context', async () => {
      const task = createTestTask();
      const result = await buildCopyPayload(task, tempRoot, 'context_only');

      expect(result.content).toBe('');
    });

    it('should build task_only payload', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'Should not appear',
      );

      const task = createTestTask({ title: 'Task Only Mode' });
      const result = await buildCopyPayload(task, tempRoot, 'task_only');

      expect(result.mode).toBe('task_only');
      expect(result.taskTitle).toBe('Task Only Mode');
      expect(result.content).toContain('<task>');
      expect(result.content).toContain('Task Only Mode');
      expect(result.content).not.toContain('<context>');
      expect(result.content).not.toContain('Should not appear');
    });

    it('should include task title in result', async () => {
      const task = createTestTask({ title: 'My Special Task' });

      const result = await buildCopyPayload(task, tempRoot);

      expect(result.taskTitle).toBe('My Special Task');
    });

    it('should handle task with all metadata', async () => {
      const task = createTestTask({
        title: 'Full Task',
        stage: 'audit',
        project: 'my-project',
        phase: 'phase-1',
        agent: 'claude',
        tags: ['important', 'mvp'],
        created: '2025-01-15T10:00:00Z',
      });

      const result = await buildCopyPayload(task, tempRoot, 'task_only');

      expect(result.content).toContain('Title: Full Task');
      expect(result.content).toContain('Stage: audit');
      expect(result.content).toContain('Project: my-project');
      expect(result.content).toContain('Phase: phase-1');
      expect(result.content).toContain('Agent: claude');
      expect(result.content).toContain('Tags: important, mvp');
    });
  });
});
