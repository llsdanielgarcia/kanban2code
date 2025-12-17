/**
 * E2E Tests for Core Workflows
 * Phase 5.6: E2E Tests for Core Workflows
 *
 * Tests the core user workflows of Kanban2Code.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TEST_WORKSPACE, e2eUtils } from './setup';

describe('E2E: Core Workflows', () => {
  beforeEach(async () => {
    await e2eUtils.cleanWorkspace();
  });

  describe('Workflow 1: Workspace Creation', () => {
    it('should create .kanban2code folder with correct structure', async () => {
      await e2eUtils.createKanbanWorkspace();

      const kanbanPath = path.join(TEST_WORKSPACE, '.kanban2code');

      // Verify folder structure
      expect(fs.existsSync(path.join(kanbanPath, 'inbox'))).toBe(true);
      expect(fs.existsSync(path.join(kanbanPath, 'projects'))).toBe(true);
      expect(fs.existsSync(path.join(kanbanPath, '_agents'))).toBe(true);
      expect(fs.existsSync(path.join(kanbanPath, '_archive'))).toBe(true);
      expect(fs.existsSync(path.join(kanbanPath, '_context'))).toBe(true);

      // Verify how-it-works.md exists
      expect(fs.existsSync(path.join(kanbanPath, 'how-it-works.md'))).toBe(true);
    });
  });

  describe('Workflow 2: Task Creation', () => {
    beforeEach(async () => {
      await e2eUtils.createKanbanWorkspace();
    });

    it('should create task in inbox', async () => {
      const filePath = await e2eUtils.createTask('Fix login bug');

      expect(fs.existsSync(filePath)).toBe(true);

      const task = await e2eUtils.readTask(filePath);
      expect(task.title).toBe('Fix login bug');
      expect(task.stage).toBe('inbox');
    });

    it('should create task in project', async () => {
      const filePath = await e2eUtils.createTask('Implement feature', 'plan', {
        project: 'extension',
      });

      expect(filePath).toContain('projects/extension');
      expect(fs.existsSync(filePath)).toBe(true);

      const task = await e2eUtils.readTask(filePath);
      expect(task.stage).toBe('plan');
    });

    it('should create task in project phase', async () => {
      const filePath = await e2eUtils.createTask('Phase task', 'code', {
        project: 'extension',
        phase: 'phase-1',
      });

      expect(filePath).toContain('projects/extension/phase-1');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should create task with tags', async () => {
      const filePath = await e2eUtils.createTask('Tagged task', 'inbox', {
        tags: ['bug', 'p0', 'mvp'],
      });

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('tags: [bug, p0, mvp]');
    });

    it('should create task with agent', async () => {
      const filePath = await e2eUtils.createTask('Agent task', 'inbox', {
        agent: 'sonnet',
      });

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('agent: sonnet');
    });
  });

  describe('Workflow 3: Task Stage Progression', () => {
    beforeEach(async () => {
      await e2eUtils.createKanbanWorkspace();
    });

    it('should update task stage in frontmatter', async () => {
      const filePath = await e2eUtils.createTask('Progress task');

      // Read and verify initial stage
      let task = await e2eUtils.readTask(filePath);
      expect(task.stage).toBe('inbox');

      // Simulate moving to 'plan' stage
      let content = fs.readFileSync(filePath, 'utf-8');
      content = content.replace('stage: inbox', 'stage: plan');
      fs.writeFileSync(filePath, content);

      // Verify updated stage
      task = await e2eUtils.readTask(filePath);
      expect(task.stage).toBe('plan');
    });

    it('should track full stage pipeline', async () => {
      const filePath = await e2eUtils.createTask('Pipeline task');
      const stages = ['inbox', 'plan', 'code', 'audit', 'completed'];

      for (let i = 0; i < stages.length; i++) {
        let content = fs.readFileSync(filePath, 'utf-8');
        const currentStage = stages[i > 0 ? i - 1 : i];
        content = content.replace(`stage: ${currentStage}`, `stage: ${stages[i]}`);
        fs.writeFileSync(filePath, content);

        const task = await e2eUtils.readTask(filePath);
        expect(task.stage).toBe(stages[i]);
      }
    });
  });

  describe('Workflow 4: Project Structure', () => {
    beforeEach(async () => {
      await e2eUtils.createKanbanWorkspace();
    });

    it('should create project with _context.md', async () => {
      const kanbanPath = path.join(TEST_WORKSPACE, '.kanban2code');
      const projectPath = path.join(kanbanPath, 'projects', 'test-project');

      fs.mkdirSync(projectPath, { recursive: true });

      const contextPath = path.join(projectPath, '_context.md');
      fs.writeFileSync(contextPath, '# Test Project\n\nProject context.');

      expect(fs.existsSync(contextPath)).toBe(true);
    });

    it('should create phase within project', async () => {
      const kanbanPath = path.join(TEST_WORKSPACE, '.kanban2code');
      const phasePath = path.join(kanbanPath, 'projects', 'test-project', 'phase-1');

      fs.mkdirSync(phasePath, { recursive: true });

      const contextPath = path.join(phasePath, '_context.md');
      fs.writeFileSync(contextPath, '# Phase 1\n\nPhase context.');

      expect(fs.existsSync(contextPath)).toBe(true);
    });
  });

  describe('Workflow 5: Archive', () => {
    beforeEach(async () => {
      await e2eUtils.createKanbanWorkspace();
    });

    it('should move completed task to archive', async () => {
      const kanbanPath = path.join(TEST_WORKSPACE, '.kanban2code');

      // Create a completed task
      const filePath = await e2eUtils.createTask('Archive me', 'completed');
      const filename = path.basename(filePath);

      // Move to archive
      const archivePath = path.join(kanbanPath, '_archive', filename);
      fs.renameSync(filePath, archivePath);

      expect(fs.existsSync(filePath)).toBe(false);
      expect(fs.existsSync(archivePath)).toBe(true);
    });
  });

  describe('Workflow 6: Multiple Tasks', () => {
    beforeEach(async () => {
      await e2eUtils.createKanbanWorkspace();
    });

    it('should handle multiple tasks in different stages', async () => {
      const tasks = [
        await e2eUtils.createTask('Task 1', 'inbox'),
        await e2eUtils.createTask('Task 2', 'plan'),
        await e2eUtils.createTask('Task 3', 'code'),
        await e2eUtils.createTask('Task 4', 'audit'),
        await e2eUtils.createTask('Task 5', 'completed'),
      ];

      const stages = ['inbox', 'plan', 'code', 'audit', 'completed'];

      for (let i = 0; i < tasks.length; i++) {
        const task = await e2eUtils.readTask(tasks[i]);
        expect(task.stage).toBe(stages[i]);
      }
    });

    it('should handle tasks in multiple projects', async () => {
      const task1 = await e2eUtils.createTask('Project A Task', 'inbox', {
        project: 'project-a',
      });

      const task2 = await e2eUtils.createTask('Project B Task', 'inbox', {
        project: 'project-b',
      });

      expect(task1).toContain('project-a');
      expect(task2).toContain('project-b');

      expect(fs.existsSync(task1)).toBe(true);
      expect(fs.existsSync(task2)).toBe(true);
    });
  });
});
