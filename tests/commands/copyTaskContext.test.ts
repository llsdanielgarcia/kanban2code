import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { Task } from '../../src/types/task';
import { buildCopyPayload } from '../../src/services/copyService';
import { FOLDERS, GLOBAL_CONTEXT_FILES } from '../../src/core/constants';

describe('copyTaskContext command', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  const createTestTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'test-task',
    filePath: path.join(tempRoot, 'inbox', 'test-task.md'),
    title: 'Test Task',
    stage: 'code',
    content: '# Test Task\n\nTask content here.',
    ...overrides,
  });

  describe('buildCopyPayload integration', () => {
    it('should build full_xml payload with all context layers', async () => {
      // Setup global context files
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'How it works content',
      );
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.architecture),
        'Architecture content',
      );
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.projectDetails),
        'Project details content',
      );

      // Setup agent
      await fs.mkdir(path.join(tempRoot, FOLDERS.agents), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.agents, 'claude.md'),
        'Claude agent config',
      );

      // Setup project context
      const projectPath = path.join(tempRoot, FOLDERS.projects, 'my-project');
      await fs.mkdir(projectPath, { recursive: true });
      await fs.writeFile(
        path.join(projectPath, '_context.md'),
        'Project context',
      );

      // Setup phase context
      const phasePath = path.join(projectPath, 'phase-1');
      await fs.mkdir(phasePath, { recursive: true });
      await fs.writeFile(
        path.join(phasePath, '_context.md'),
        'Phase context',
      );

      // Setup stage template
      await fs.mkdir(path.join(tempRoot, FOLDERS.stageTemplates), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.stageTemplates, 'code.md'),
        'Code stage guidance',
      );

      // Setup custom context
      await fs.mkdir(path.join(tempRoot, FOLDERS.contexts), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'custom.md'),
        'Custom context content',
      );

      const task = createTestTask({
        agent: 'claude',
        project: 'my-project',
        phase: 'phase-1',
        contexts: ['custom'],
      });

      const result = await buildCopyPayload(task, tempRoot, 'full_xml');

      expect(result.mode).toBe('full_xml');
      expect(result.taskTitle).toBe('Test Task');
      expect(result.content).toContain('<system>');
      expect(result.content).toContain('<context>');
      expect(result.content).toContain('<task>');
      expect(result.content).toContain('How it works content');
      expect(result.content).toContain('Architecture content');
      expect(result.content).toContain('Project details content');
      expect(result.content).toContain('Claude agent config');
      expect(result.content).toContain('Project context');
      expect(result.content).toContain('Phase context');
      expect(result.content).toContain('Code stage guidance');
      expect(result.content).toContain('Custom context content');
    });

    it('should handle task_only mode', async () => {
      // Add some context that should NOT appear
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'This should not appear',
      );

      const task = createTestTask({ title: 'Task Only Mode' });

      const result = await buildCopyPayload(task, tempRoot, 'task_only');

      expect(result.mode).toBe('task_only');
      expect(result.content).toContain('<task>');
      expect(result.content).toContain('Task Only Mode');
      expect(result.content).not.toContain('<context>');
      expect(result.content).not.toContain('This should not appear');
    });

    it('should handle context_only mode', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'Context content',
      );

      const task = createTestTask({ content: 'Task body should not appear' });

      const result = await buildCopyPayload(task, tempRoot, 'context_only');

      expect(result.mode).toBe('context_only');
      expect(result.content).toContain('<context>');
      expect(result.content).toContain('Context content');
      expect(result.content).not.toContain('<task>');
      expect(result.content).not.toContain('Task body should not appear');
    });

    it('should escape XML special characters', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'Content with <html> & special > chars',
      );

      const task = createTestTask({
        title: 'Task with <angle> brackets',
        content: 'Body with & ampersand',
      });

      const result = await buildCopyPayload(task, tempRoot, 'full_xml');

      expect(result.content).toContain('&lt;html&gt;');
      expect(result.content).toContain('&amp;');
      expect(result.content).toContain('&lt;angle&gt;');
      expect(result.content).not.toMatch(/<html>/);
      expect(result.content).not.toMatch(/<angle>/);
    });

    it('should handle missing context files gracefully', async () => {
      // No context files exist
      const task = createTestTask({
        agent: 'nonexistent',
        project: 'missing-project',
        contexts: ['missing'],
      });

      const result = await buildCopyPayload(task, tempRoot, 'full_xml');

      // Should still produce valid output
      expect(result.mode).toBe('full_xml');
      expect(result.content).toContain('<system>');
      expect(result.content).toContain('<task>');
      expect(result.content).toContain('Test Task');
    });
  });
});
