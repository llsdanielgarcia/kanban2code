import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  isValidStage,
  isTransitionAllowed,
  getValidTransitions,
  getAllValidTransitions,
  validateTransition,
  moveTaskToStage,
  getNextStage,
  getPreviousStage,
  advanceTask,
  sendTaskBack,
  changeStageAndReload,
  InvalidTransitionError,
  InvalidStageError,
} from '../../src/services/taskMoveService';
import { loadTask } from '../../src/services/taskService';
import type { Task } from '../../src/types/task';

describe('taskMoveService', () => {
  describe('isValidStage', () => {
    it('should return true for valid stages', () => {
      expect(isValidStage('inbox')).toBe(true);
      expect(isValidStage('plan')).toBe(true);
      expect(isValidStage('code')).toBe(true);
      expect(isValidStage('audit')).toBe(true);
      expect(isValidStage('completed')).toBe(true);
    });

    it('should return false for invalid stages', () => {
      expect(isValidStage('invalid')).toBe(false);
      expect(isValidStage('')).toBe(false);
      expect(isValidStage('INBOX')).toBe(false);
    });
  });

  describe('isTransitionAllowed', () => {
    it('should allow same stage (no-op)', () => {
      expect(isTransitionAllowed('inbox', 'inbox')).toBe(true);
      expect(isTransitionAllowed('plan', 'plan')).toBe(true);
    });

    it('should allow forward transitions from inbox', () => {
      expect(isTransitionAllowed('inbox', 'plan')).toBe(true);
      expect(isTransitionAllowed('inbox', 'code')).toBe(true);
    });

    it('should allow forward from plan but not backward by default', () => {
      expect(isTransitionAllowed('plan', 'code')).toBe(true);
      expect(isTransitionAllowed('plan', 'inbox')).toBe(false);
    });

    it('should allow backward from plan with allowRegressions', () => {
      expect(isTransitionAllowed('plan', 'inbox', { allowRegressions: true })).toBe(true);
    });

    it('should allow forward from code but not backward by default', () => {
      expect(isTransitionAllowed('code', 'audit')).toBe(true);
      expect(isTransitionAllowed('code', 'plan')).toBe(false);
    });

    it('should allow backward from code with allowRegressions', () => {
      expect(isTransitionAllowed('code', 'plan', { allowRegressions: true })).toBe(true);
    });

    it('should allow forward from audit but not backward by default', () => {
      expect(isTransitionAllowed('audit', 'completed')).toBe(true);
      expect(isTransitionAllowed('audit', 'code')).toBe(false);
    });

    it('should allow backward from audit with allowRegressions', () => {
      expect(isTransitionAllowed('audit', 'code', { allowRegressions: true })).toBe(true);
    });

    it('should not allow transitions from completed even with allowRegressions', () => {
      expect(isTransitionAllowed('completed', 'inbox')).toBe(false);
      expect(isTransitionAllowed('completed', 'audit')).toBe(false);
      expect(isTransitionAllowed('completed', 'audit', { allowRegressions: true })).toBe(false);
    });

    it('should not allow skipping stages', () => {
      expect(isTransitionAllowed('inbox', 'audit')).toBe(false);
      expect(isTransitionAllowed('inbox', 'completed')).toBe(false);
      expect(isTransitionAllowed('plan', 'completed')).toBe(false);
    });
  });

  describe('getValidTransitions', () => {
    it('should return forward-only transitions for each stage', () => {
      expect(getValidTransitions('inbox')).toEqual(['plan', 'code']);
      expect(getValidTransitions('plan')).toEqual(['code']);
      expect(getValidTransitions('code')).toEqual(['audit']);
      expect(getValidTransitions('audit')).toEqual(['completed']);
      expect(getValidTransitions('completed')).toEqual([]);
    });
  });

  describe('getAllValidTransitions', () => {
    it('should return all transitions including regressions', () => {
      expect(getAllValidTransitions('inbox')).toEqual(['plan', 'code']);
      expect(getAllValidTransitions('plan')).toEqual(['code', 'inbox']);
      expect(getAllValidTransitions('code')).toEqual(['audit', 'plan']);
      expect(getAllValidTransitions('audit')).toEqual(['completed', 'code']);
      expect(getAllValidTransitions('completed')).toEqual([]);
    });
  });

  describe('validateTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() => validateTransition('inbox', 'plan')).not.toThrow();
      expect(() => validateTransition('plan', 'code')).not.toThrow();
    });

    it('should throw InvalidTransitionError for invalid transitions', () => {
      expect(() => validateTransition('inbox', 'completed')).toThrow(
        InvalidTransitionError,
      );
      expect(() => validateTransition('completed', 'inbox')).toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe('getNextStage', () => {
    it('should return next stage in progression', () => {
      expect(getNextStage('inbox')).toBe('plan');
      expect(getNextStage('plan')).toBe('code');
      expect(getNextStage('code')).toBe('audit');
      expect(getNextStage('audit')).toBe('completed');
    });

    it('should return null for completed', () => {
      expect(getNextStage('completed')).toBe(null);
    });
  });

  describe('getPreviousStage', () => {
    it('should return previous stage', () => {
      expect(getPreviousStage('plan')).toBe('inbox');
      expect(getPreviousStage('code')).toBe('plan');
      expect(getPreviousStage('audit')).toBe('code');
    });

    it('should return null for inbox and completed', () => {
      expect(getPreviousStage('inbox')).toBe(null);
      expect(getPreviousStage('completed')).toBe(null);
    });
  });

  describe('moveTaskToStage (integration)', () => {
    let tempDir: string;
    let root: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
      root = tempDir;
      await fs.mkdir(path.join(root, 'inbox'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should update stage in file', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(
        taskPath,
        `---
stage: inbox
title: Test Task
customField: preserved
---

# Test Task

Content here.`,
      );

      const task = await loadTask(taskPath, root);
      await moveTaskToStage(task, 'plan');

      // Re-read the file
      const content = await fs.readFile(taskPath, 'utf-8');
      expect(content).toContain('stage: plan');
      expect(content).toContain('customField: preserved');
      expect(content).toContain('# Test Task');
    });

    it('should throw for invalid transition', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: inbox\n---\n\n# Task');

      const task = await loadTask(taskPath, root);

      await expect(moveTaskToStage(task, 'completed')).rejects.toThrow(
        InvalidTransitionError,
      );
    });

    it('should be no-op for same stage', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      const originalContent = '---\nstage: inbox\n---\n\n# Task';
      await fs.writeFile(taskPath, originalContent);

      const task = await loadTask(taskPath, root);
      await moveTaskToStage(task, 'inbox');

      // File should not be modified (same content)
      const content = await fs.readFile(taskPath, 'utf-8');
      expect(content).toContain('stage: inbox');
    });
  });

  describe('advanceTask', () => {
    let tempDir: string;
    let root: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
      root = tempDir;
      await fs.mkdir(path.join(root, 'inbox'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should advance task to next stage', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: inbox\n---\n\n# Task');

      const task = await loadTask(taskPath, root);
      const newStage = await advanceTask(task);

      expect(newStage).toBe('plan');
      const content = await fs.readFile(taskPath, 'utf-8');
      expect(content).toContain('stage: plan');
    });
  });

  describe('sendTaskBack', () => {
    let tempDir: string;
    let root: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
      root = tempDir;
      await fs.mkdir(path.join(root, 'inbox'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should send task back to previous stage', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: code\n---\n\n# Task');

      const task = await loadTask(taskPath, root);
      const newStage = await sendTaskBack(task);

      expect(newStage).toBe('plan');
      const content = await fs.readFile(taskPath, 'utf-8');
      expect(content).toContain('stage: plan');
    });
  });

  describe('changeStageAndReload', () => {
    let tempDir: string;
    let root: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
      root = tempDir;
      await fs.mkdir(path.join(root, 'inbox'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should change stage and return updated task', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: inbox\n---\n\n# Task');

      const result = await changeStageAndReload('task', taskPath, 'plan', root);

      expect(result.previousStage).toBe('inbox');
      expect(result.newStage).toBe('plan');
      expect(result.task.stage).toBe('plan');
    });

    it('should throw for disallowed regression without flag', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: plan\n---\n\n# Task');

      await expect(
        changeStageAndReload('task', taskPath, 'inbox', root),
      ).rejects.toThrow(InvalidTransitionError);
    });

    it('should allow regression with allowRegressions flag', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: plan\n---\n\n# Task');

      const result = await changeStageAndReload(
        'task',
        taskPath,
        'inbox',
        root,
        { allowRegressions: true },
      );

      expect(result.previousStage).toBe('plan');
      expect(result.newStage).toBe('inbox');
      expect(result.task.stage).toBe('inbox');
    });
  });
});
