import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  loadAllTasks,
  loadTask,
  saveTask,
  createTask,
  deleteTask,
  listProjects,
  listPhases,
  inferProjectAndPhase,
} from '../../src/services/taskService';

describe('taskService', () => {
  let tempDir: string;
  let root: string;

  beforeEach(async () => {
    // Create temp directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
    root = tempDir;

    // Create standard directory structure
    await fs.mkdir(path.join(root, 'inbox'), { recursive: true });
    await fs.mkdir(path.join(root, 'projects'), { recursive: true });
    await fs.mkdir(path.join(root, '_templates'), { recursive: true });
    await fs.mkdir(path.join(root, '_agents'), { recursive: true });
    await fs.mkdir(path.join(root, '_archive'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('inferProjectAndPhase', () => {
    it('should return empty for inbox tasks', () => {
      const result = inferProjectAndPhase(
        path.join(root, 'inbox', 'task.md'),
        root,
      );
      expect(result).toEqual({});
    });

    it('should infer project for direct project tasks', () => {
      const result = inferProjectAndPhase(
        path.join(root, 'projects', 'my-project', 'task.md'),
        root,
      );
      expect(result).toEqual({ project: 'my-project' });
    });

    it('should infer project and phase for phase tasks', () => {
      const result = inferProjectAndPhase(
        path.join(root, 'projects', 'my-project', 'phase-1', 'task.md'),
        root,
      );
      expect(result).toEqual({ project: 'my-project', phase: 'phase-1' });
    });

    it('should return empty for unknown paths', () => {
      const result = inferProjectAndPhase(
        path.join(root, 'unknown', 'task.md'),
        root,
      );
      expect(result).toEqual({});
    });
  });

  describe('loadTask', () => {
    it('should load a single task file', async () => {
      const taskContent = `---
stage: plan
title: Test Task
tags:
  - test
---

# Test Task

Description here.`;

      const taskPath = path.join(root, 'inbox', 'test-task.md');
      await fs.writeFile(taskPath, taskContent);

      const task = await loadTask(taskPath, root);

      expect(task.id).toBe('test-task');
      expect(task.stage).toBe('plan');
      expect(task.title).toBe('Test Task');
      expect(task.tags).toEqual(['test']);
      expect(task.content).toContain('Description here.');
    });

    it('should infer project from path', async () => {
      await fs.mkdir(path.join(root, 'projects', 'my-project'), { recursive: true });

      const taskContent = `---
stage: code
---

# Project Task`;

      const taskPath = path.join(root, 'projects', 'my-project', 'task.md');
      await fs.writeFile(taskPath, taskContent);

      const task = await loadTask(taskPath, root);

      expect(task.project).toBe('my-project');
      expect(task.phase).toBeUndefined();
    });

    it('should infer project and phase from path', async () => {
      await fs.mkdir(path.join(root, 'projects', 'my-project', 'phase-1'), {
        recursive: true,
      });

      const taskContent = `---
stage: audit
---

# Phase Task`;

      const taskPath = path.join(root, 'projects', 'my-project', 'phase-1', 'task.md');
      await fs.writeFile(taskPath, taskContent);

      const task = await loadTask(taskPath, root);

      expect(task.project).toBe('my-project');
      expect(task.phase).toBe('phase-1');
    });
  });

  describe('loadAllTasks', () => {
    it('should return empty array for empty workspace', async () => {
      const tasks = await loadAllTasks(root);
      expect(tasks).toEqual([]);
    });

    it('should load tasks from inbox', async () => {
      await fs.writeFile(
        path.join(root, 'inbox', 'task1.md'),
        '---\nstage: inbox\n---\n\n# Task 1',
      );
      await fs.writeFile(
        path.join(root, 'inbox', 'task2.md'),
        '---\nstage: inbox\n---\n\n# Task 2',
      );

      const tasks = await loadAllTasks(root);

      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t.title).sort()).toEqual(['Task 1', 'Task 2']);
    });

    it('should exclude _context.md files', async () => {
      await fs.writeFile(
        path.join(root, 'inbox', 'task.md'),
        '---\nstage: inbox\n---\n\n# Task',
      );
      await fs.writeFile(
        path.join(root, 'inbox', '_context.md'),
        '---\nstage: inbox\n---\n\n# Context',
      );

      const tasks = await loadAllTasks(root);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task');
    });

    it('should exclude files starting with underscore', async () => {
      await fs.writeFile(
        path.join(root, 'inbox', 'task.md'),
        '---\nstage: inbox\n---\n\n# Task',
      );
      await fs.writeFile(
        path.join(root, 'inbox', '_hidden.md'),
        '---\nstage: inbox\n---\n\n# Hidden',
      );

      const tasks = await loadAllTasks(root);

      expect(tasks).toHaveLength(1);
    });

    it('should load tasks from projects', async () => {
      await fs.mkdir(path.join(root, 'projects', 'project-a'), { recursive: true });

      await fs.writeFile(
        path.join(root, 'projects', 'project-a', 'task.md'),
        '---\nstage: plan\n---\n\n# Project Task',
      );

      const tasks = await loadAllTasks(root);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].project).toBe('project-a');
    });

    it('should load tasks from project phases', async () => {
      await fs.mkdir(path.join(root, 'projects', 'project-a', 'phase-1'), {
        recursive: true,
      });

      await fs.writeFile(
        path.join(root, 'projects', 'project-a', 'phase-1', 'task.md'),
        '---\nstage: code\n---\n\n# Phase Task',
      );

      const tasks = await loadAllTasks(root);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].project).toBe('project-a');
      expect(tasks[0].phase).toBe('phase-1');
    });

    it('should sort tasks by order then title', async () => {
      await fs.writeFile(
        path.join(root, 'inbox', 'task-c.md'),
        '---\nstage: inbox\n---\n\n# C Task',
      );
      await fs.writeFile(
        path.join(root, 'inbox', 'task-a.md'),
        '---\nstage: inbox\norder: 2\n---\n\n# A Task',
      );
      await fs.writeFile(
        path.join(root, 'inbox', 'task-b.md'),
        '---\nstage: inbox\norder: 1\n---\n\n# B Task',
      );

      const tasks = await loadAllTasks(root);

      expect(tasks.map((t) => t.title)).toEqual(['B Task', 'A Task', 'C Task']);
    });

    it('should handle missing inbox directory', async () => {
      await fs.rm(path.join(root, 'inbox'), { recursive: true });

      const tasks = await loadAllTasks(root);
      expect(tasks).toEqual([]);
    });

    it('should handle missing projects directory', async () => {
      await fs.rm(path.join(root, 'projects'), { recursive: true });

      await fs.writeFile(
        path.join(root, 'inbox', 'task.md'),
        '---\nstage: inbox\n---\n\n# Task',
      );

      const tasks = await loadAllTasks(root);
      expect(tasks).toHaveLength(1);
    });

    it('should handle malformed task files gracefully', async () => {
      await fs.writeFile(
        path.join(root, 'inbox', 'good.md'),
        '---\nstage: inbox\n---\n\n# Good Task',
      );
      await fs.writeFile(
        path.join(root, 'inbox', 'bad.md'),
        '---\nstage: [invalid yaml\n---\n\n# Bad Task',
      );

      const tasks = await loadAllTasks(root);

      // Should still load the good task
      expect(tasks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('saveTask', () => {
    it('should save task to disk', async () => {
      const taskPath = path.join(root, 'inbox', 'new-task.md');
      const task = {
        id: 'new-task',
        filePath: taskPath,
        title: 'New Task',
        stage: 'inbox' as const,
        content: '# New Task\n\nDescription.',
      };

      await saveTask(task);

      const content = await fs.readFile(taskPath, 'utf-8');
      expect(content).toContain('stage: inbox');
      expect(content).toContain('# New Task');
      expect(content).toContain('Description.');
    });

    it('should preserve unknown fields when saving', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      const task = {
        id: 'task',
        filePath: taskPath,
        title: 'Task',
        stage: 'plan' as const,
        content: '# Task',
      };

      const rawFrontmatter = {
        customField: 'preserved',
      };

      await saveTask(task, rawFrontmatter);

      const content = await fs.readFile(taskPath, 'utf-8');
      expect(content).toContain('customField: preserved');
    });
  });

  describe('createTask', () => {
    it('should create a new task file', async () => {
      const taskPath = path.join(root, 'inbox', 'created-task.md');

      const task = await createTask(
        taskPath,
        {
          title: 'Created Task',
          tags: ['new'],
        },
        root,
      );

      expect(task.id).toBe('created-task');
      expect(task.title).toBe('Created Task');
      expect(task.stage).toBe('inbox');
      expect(task.tags).toEqual(['new']);
      expect(task.created).toBeDefined();

      // Verify file exists
      const content = await fs.readFile(taskPath, 'utf-8');
      expect(content).toContain('stage: inbox');
    });

    it('should infer project from path when creating', async () => {
      await fs.mkdir(path.join(root, 'projects', 'my-project'), { recursive: true });

      const taskPath = path.join(root, 'projects', 'my-project', 'task.md');
      const task = await createTask(taskPath, { title: 'Project Task' }, root);

      expect(task.project).toBe('my-project');
    });
  });

  describe('deleteTask', () => {
    it('should delete task file from disk', async () => {
      const taskPath = path.join(root, 'inbox', 'to-delete.md');
      await fs.writeFile(taskPath, '---\nstage: inbox\n---\n\n# To Delete');

      const task = await loadTask(taskPath, root);
      await deleteTask(task);

      await expect(fs.access(taskPath)).rejects.toThrow();
    });
  });

  describe('listProjects', () => {
    it('should return empty array when no projects', async () => {
      const projects = await listProjects(root);
      expect(projects).toEqual([]);
    });

    it('should list all projects', async () => {
      await fs.mkdir(path.join(root, 'projects', 'project-a'), { recursive: true });
      await fs.mkdir(path.join(root, 'projects', 'project-b'), { recursive: true });

      const projects = await listProjects(root);

      expect(projects).toEqual(['project-a', 'project-b']);
    });

    it('should exclude underscore-prefixed directories', async () => {
      await fs.mkdir(path.join(root, 'projects', 'real-project'), { recursive: true });
      await fs.mkdir(path.join(root, 'projects', '_hidden'), { recursive: true });

      const projects = await listProjects(root);

      expect(projects).toEqual(['real-project']);
    });
  });

  describe('listPhases', () => {
    it('should return empty array when no phases', async () => {
      await fs.mkdir(path.join(root, 'projects', 'my-project'), { recursive: true });

      const phases = await listPhases(root, 'my-project');
      expect(phases).toEqual([]);
    });

    it('should list all phases in a project', async () => {
      await fs.mkdir(path.join(root, 'projects', 'my-project', 'phase-1'), {
        recursive: true,
      });
      await fs.mkdir(path.join(root, 'projects', 'my-project', 'phase-2'), {
        recursive: true,
      });

      const phases = await listPhases(root, 'my-project');

      expect(phases).toEqual(['phase-1', 'phase-2']);
    });

    it('should return empty for non-existent project', async () => {
      const phases = await listPhases(root, 'non-existent');
      expect(phases).toEqual([]);
    });
  });
});
