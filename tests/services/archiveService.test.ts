import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  archiveTask,
  archiveCompletedInProject,
  archiveProject,
  restoreTask,
  listArchivedTasks,
  getArchivePath,
  NotCompletedError,
  ProjectNotCompletedError,
} from '../../src/services/archiveService';
import { loadTask } from '../../src/services/taskService';
import type { Task } from '../../src/types/task';

describe('archiveService', () => {
  let tempDir: string;
  let root: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
    root = tempDir;

    // Create standard directory structure
    await fs.mkdir(path.join(root, 'inbox'), { recursive: true });
    await fs.mkdir(path.join(root, 'projects'), { recursive: true });
    await fs.mkdir(path.join(root, '_archive'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getArchivePath', () => {
    it('should compute archive path for inbox task', () => {
      const task: Task = {
        id: 'task',
        filePath: path.join(root, 'inbox', 'task.md'),
        title: 'Task',
        stage: 'completed',
        content: '# Task',
      };

      const archivePath = getArchivePath(task, root);
      expect(archivePath).toBe(path.join(root, '_archive', 'inbox', 'task.md'));
    });

    it('should compute archive path for project task', () => {
      const task: Task = {
        id: 'task',
        filePath: path.join(root, 'projects', 'my-project', 'task.md'),
        title: 'Task',
        stage: 'completed',
        content: '# Task',
      };

      const archivePath = getArchivePath(task, root);
      expect(archivePath).toBe(
        path.join(root, '_archive', 'projects', 'my-project', 'task.md'),
      );
    });

    it('should compute archive path for phase task', () => {
      const task: Task = {
        id: 'task',
        filePath: path.join(root, 'projects', 'my-project', 'phase-1', 'task.md'),
        title: 'Task',
        stage: 'completed',
        content: '# Task',
      };

      const archivePath = getArchivePath(task, root);
      expect(archivePath).toBe(
        path.join(root, '_archive', 'projects', 'my-project', 'phase-1', 'task.md'),
      );
    });
  });

  describe('archiveTask', () => {
    it('should archive a completed task', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: completed\n---\n\n# Task');

      // Create task manually with completed stage
      const task: Task = {
        id: 'task',
        filePath: taskPath,
        title: 'Task',
        stage: 'completed',
        content: '# Task',
      };

      const archivePath = await archiveTask(task, root);

      // Original file should be gone
      await expect(fs.access(taskPath)).rejects.toThrow();

      // Archived file should exist
      const stat = await fs.stat(archivePath);
      expect(stat.isFile()).toBe(true);

      // Content should be preserved
      const content = await fs.readFile(archivePath, 'utf-8');
      expect(content).toContain('# Task');
    });

    it('should throw NotCompletedError for non-completed task', async () => {
      const taskPath = path.join(root, 'inbox', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: inbox\n---\n\n# Task');

      const task: Task = {
        id: 'task',
        filePath: taskPath,
        title: 'Task',
        stage: 'inbox',
        content: '# Task',
      };

      await expect(archiveTask(task, root)).rejects.toThrow(NotCompletedError);
    });

    it('should create archive directory structure', async () => {
      await fs.mkdir(path.join(root, 'projects', 'deep', 'nested'), {
        recursive: true,
      });

      const taskPath = path.join(root, 'projects', 'deep', 'nested', 'task.md');
      await fs.writeFile(taskPath, '---\nstage: completed\n---\n\n# Task');

      const task: Task = {
        id: 'task',
        filePath: taskPath,
        title: 'Task',
        stage: 'completed',
        content: '# Task',
      };

      const archivePath = await archiveTask(task, root);

      expect(archivePath).toBe(
        path.join(root, '_archive', 'projects', 'deep', 'nested', 'task.md'),
      );
      const stat = await fs.stat(archivePath);
      expect(stat.isFile()).toBe(true);
    });
  });

  describe('archiveCompletedInProject', () => {
    it('should archive all completed tasks in a project', async () => {
      await fs.mkdir(path.join(root, 'projects', 'my-project'), { recursive: true });

      // Create completed tasks
      await fs.writeFile(
        path.join(root, 'projects', 'my-project', 'done1.md'),
        '---\nstage: completed\n---\n\n# Done 1',
      );
      await fs.writeFile(
        path.join(root, 'projects', 'my-project', 'done2.md'),
        '---\nstage: completed\n---\n\n# Done 2',
      );

      // Create non-completed task
      await fs.writeFile(
        path.join(root, 'projects', 'my-project', 'in-progress.md'),
        '---\nstage: code\n---\n\n# In Progress',
      );

      const archivedPaths = await archiveCompletedInProject(root, 'my-project');

      expect(archivedPaths).toHaveLength(2);

      // Completed tasks should be archived
      await expect(
        fs.access(path.join(root, 'projects', 'my-project', 'done1.md')),
      ).rejects.toThrow();
      await expect(
        fs.access(path.join(root, 'projects', 'my-project', 'done2.md')),
      ).rejects.toThrow();

      // Non-completed task should remain
      const remainingStat = await fs.stat(
        path.join(root, 'projects', 'my-project', 'in-progress.md'),
      );
      expect(remainingStat.isFile()).toBe(true);
    });
  });

  describe('archiveProject', () => {
    it('should archive entire project when all tasks completed', async () => {
      await fs.mkdir(path.join(root, 'projects', 'my-project'), { recursive: true });

      await fs.writeFile(
        path.join(root, 'projects', 'my-project', 'task1.md'),
        '---\nstage: completed\n---\n\n# Task 1',
      );
      await fs.writeFile(
        path.join(root, 'projects', 'my-project', 'task2.md'),
        '---\nstage: completed\n---\n\n# Task 2',
      );

      const archivePath = await archiveProject(root, 'my-project');

      expect(archivePath).toBe(path.join(root, '_archive', 'projects', 'my-project'));

      // Original project directory should be gone
      await expect(
        fs.access(path.join(root, 'projects', 'my-project')),
      ).rejects.toThrow();

      // Archive should exist with all files
      const stat1 = await fs.stat(
        path.join(root, '_archive', 'projects', 'my-project', 'task1.md'),
      );
      expect(stat1.isFile()).toBe(true);
      const stat2 = await fs.stat(
        path.join(root, '_archive', 'projects', 'my-project', 'task2.md'),
      );
      expect(stat2.isFile()).toBe(true);
    });

    it('should throw ProjectNotCompletedError for incomplete project', async () => {
      await fs.mkdir(path.join(root, 'projects', 'my-project'), { recursive: true });

      await fs.writeFile(
        path.join(root, 'projects', 'my-project', 'done.md'),
        '---\nstage: completed\n---\n\n# Done',
      );
      await fs.writeFile(
        path.join(root, 'projects', 'my-project', 'not-done.md'),
        '---\nstage: code\n---\n\n# Not Done',
      );

      await expect(archiveProject(root, 'my-project')).rejects.toThrow(
        ProjectNotCompletedError,
      );
    });
  });

  describe('restoreTask', () => {
    it('should restore task from archive', async () => {
      // Create archived task - note: inbox dir already exists from beforeEach
      await fs.mkdir(path.join(root, '_archive', 'inbox'), { recursive: true });
      const archivePath = path.join(root, '_archive', 'inbox', 'task.md');
      await fs.writeFile(archivePath, '---\nstage: completed\n---\n\n# Task');

      const restoredPath = await restoreTask(archivePath, root);

      expect(restoredPath).toBe(path.join(root, 'inbox', 'task.md'));

      // Archive file should be gone
      await expect(fs.access(archivePath)).rejects.toThrow();

      // Restored file should exist
      const restoredStat = await fs.stat(restoredPath);
      expect(restoredStat.isFile()).toBe(true);
    });

    it('should create necessary directories when restoring', async () => {
      // Remove the projects directory to test creation
      await fs.rm(path.join(root, 'projects'), { recursive: true, force: true });

      await fs.mkdir(path.join(root, '_archive', 'projects', 'new-project'), {
        recursive: true,
      });
      const archivePath = path.join(
        root,
        '_archive',
        'projects',
        'new-project',
        'task.md',
      );
      await fs.writeFile(archivePath, '---\nstage: completed\n---\n\n# Task');

      const restoredPath = await restoreTask(archivePath, root);

      expect(restoredPath).toBe(
        path.join(root, 'projects', 'new-project', 'task.md'),
      );
      const restoredStat = await fs.stat(restoredPath);
      expect(restoredStat.isFile()).toBe(true);
    });
  });

  describe('listArchivedTasks', () => {
    it('should return empty array when no archived tasks', async () => {
      const tasks = await listArchivedTasks(root);
      expect(tasks).toEqual([]);
    });

    it('should list all archived tasks', async () => {
      await fs.mkdir(path.join(root, '_archive', 'inbox'), { recursive: true });
      await fs.mkdir(path.join(root, '_archive', 'projects', 'proj'), {
        recursive: true,
      });

      await fs.writeFile(
        path.join(root, '_archive', 'inbox', 'task1.md'),
        '# Task 1',
      );
      await fs.writeFile(
        path.join(root, '_archive', 'projects', 'proj', 'task2.md'),
        '# Task 2',
      );

      const tasks = await listArchivedTasks(root);

      expect(tasks).toHaveLength(2);
      expect(tasks).toContain(path.join(root, '_archive', 'inbox', 'task1.md'));
      expect(tasks).toContain(
        path.join(root, '_archive', 'projects', 'proj', 'task2.md'),
      );
    });

    it('should exclude underscore-prefixed files', async () => {
      await fs.mkdir(path.join(root, '_archive', 'inbox'), { recursive: true });

      await fs.writeFile(
        path.join(root, '_archive', 'inbox', 'task.md'),
        '# Task',
      );
      await fs.writeFile(
        path.join(root, '_archive', 'inbox', '_hidden.md'),
        '# Hidden',
      );

      const tasks = await listArchivedTasks(root);

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toContain('task.md');
    });
  });
});
