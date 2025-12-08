import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  buildXMLPrompt,
  buildContextOnly,
  buildTaskOnly,
} from '../../src/services/promptBuilder';
import { FOLDERS, GLOBAL_CONTEXT_FILES } from '../../src/core/constants';
import type { Task } from '../../src/types/task';

describe('promptBuilder', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  const createMinimalTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'test-task',
    filePath: '/path/to/test-task.md',
    title: 'Test Task',
    stage: 'plan',
    content: '# Test Task\n\nTask description here.',
    ...overrides,
  });

  describe('buildXMLPrompt', () => {
    it('should build basic XML structure with task only', async () => {
      const task = createMinimalTask();

      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('<system>');
      expect(result.fullPrompt).toContain('</system>');
      expect(result.fullPrompt).toContain('<task>');
      expect(result.fullPrompt).toContain('</task>');
      expect(result.fullPrompt).toContain('<metadata>');
      expect(result.fullPrompt).toContain('<body>');
      expect(result.fullPrompt).toContain('Test Task');
    });

    it('should include global context when files exist', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'How it works content',
      );
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.architecture),
        'Architecture content',
      );

      const task = createMinimalTask();
      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('<context>');
      expect(result.fullPrompt).toContain('<how-it-works>');
      expect(result.fullPrompt).toContain('How it works content');
      expect(result.fullPrompt).toContain('<architecture>');
      expect(result.fullPrompt).toContain('Architecture content');
    });

    it('should include agent context when task has agent', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.agents), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.agents, 'claude.md'),
        'Claude agent instructions',
      );

      const task = createMinimalTask({ agent: 'claude' });
      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('<agent>');
      expect(result.fullPrompt).toContain('Claude agent instructions');
    });

    it('should include project context when task has project', async () => {
      const projectPath = path.join(tempRoot, FOLDERS.projects, 'my-project');
      await fs.mkdir(projectPath, { recursive: true });
      await fs.writeFile(
        path.join(projectPath, '_context.md'),
        'Project context info',
      );

      const task = createMinimalTask({ project: 'my-project' });
      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('<project>');
      expect(result.fullPrompt).toContain('Project context info');
    });

    it('should include phase context when task has project and phase', async () => {
      const phasePath = path.join(tempRoot, FOLDERS.projects, 'my-project', 'phase-1');
      await fs.mkdir(phasePath, { recursive: true });
      await fs.writeFile(
        path.join(phasePath, '_context.md'),
        'Phase context info',
      );

      const task = createMinimalTask({ project: 'my-project', phase: 'phase-1' });
      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('<phase>');
      expect(result.fullPrompt).toContain('Phase context info');
    });

    it('should include stage template when exists', async () => {
      const stageTemplatesPath = path.join(tempRoot, FOLDERS.stageTemplates);
      await fs.mkdir(stageTemplatesPath, { recursive: true });
      await fs.writeFile(
        path.join(stageTemplatesPath, 'plan.md'),
        'Planning stage guidance',
      );

      const task = createMinimalTask({ stage: 'plan' });
      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('<stage-guidance>');
      expect(result.fullPrompt).toContain('Planning stage guidance');
    });

    it('should include custom contexts when task has contexts array', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.contexts), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'custom1.md'),
        'Custom context 1',
      );
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'custom2.md'),
        'Custom context 2',
      );

      const task = createMinimalTask({ contexts: ['custom1', 'custom2'] });
      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('<custom-contexts>');
      expect(result.fullPrompt).toContain('Custom context 1');
      expect(result.fullPrompt).toContain('Custom context 2');
    });

    it('should include task metadata', async () => {
      const task = createMinimalTask({
        title: 'My Task',
        stage: 'code',
        project: 'my-project',
        phase: 'phase-1',
        agent: 'claude',
        tags: ['mvp', 'important'],
        created: '2025-01-15T10:00:00Z',
      });

      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('Title: My Task');
      expect(result.fullPrompt).toContain('Stage: code');
      expect(result.fullPrompt).toContain('Project: my-project');
      expect(result.fullPrompt).toContain('Phase: phase-1');
      expect(result.fullPrompt).toContain('Agent: claude');
      expect(result.fullPrompt).toContain('Tags: mvp, important');
      expect(result.fullPrompt).toContain('Created: 2025-01-15T10:00:00Z');
    });

    it('should return separate sections', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'How it works',
      );

      const task = createMinimalTask();
      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.contextSection).toContain('<context>');
      expect(result.taskSection).toContain('<task>');
    });

    it('should handle task with no optional fields', async () => {
      const task: Task = {
        id: 'minimal',
        filePath: '/path/to/minimal.md',
        title: 'Minimal Task',
        stage: 'inbox',
        content: '',
      };

      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('<system>');
      expect(result.fullPrompt).toContain('Minimal Task');
      expect(result.fullPrompt).toContain('Stage: inbox');
    });

    it('should build prompt with all 9 layers', async () => {
      // Setup all context files
      await fs.writeFile(path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks), 'Layer 1');
      await fs.writeFile(path.join(tempRoot, GLOBAL_CONTEXT_FILES.architecture), 'Layer 2');
      await fs.writeFile(path.join(tempRoot, GLOBAL_CONTEXT_FILES.projectDetails), 'Layer 3');

      await fs.mkdir(path.join(tempRoot, FOLDERS.agents), { recursive: true });
      await fs.writeFile(path.join(tempRoot, FOLDERS.agents, 'claude.md'), 'Layer 4');

      const projectPath = path.join(tempRoot, FOLDERS.projects, 'project');
      await fs.mkdir(projectPath, { recursive: true });
      await fs.writeFile(path.join(projectPath, '_context.md'), 'Layer 5');

      const phasePath = path.join(projectPath, 'phase');
      await fs.mkdir(phasePath, { recursive: true });
      await fs.writeFile(path.join(phasePath, '_context.md'), 'Layer 6');

      await fs.mkdir(path.join(tempRoot, FOLDERS.stageTemplates), { recursive: true });
      await fs.writeFile(path.join(tempRoot, FOLDERS.stageTemplates, 'code.md'), 'Layer 7');

      await fs.mkdir(path.join(tempRoot, FOLDERS.contexts), { recursive: true });
      await fs.writeFile(path.join(tempRoot, FOLDERS.contexts, 'custom.md'), 'Layer 8');

      const task = createMinimalTask({
        stage: 'code',
        agent: 'claude',
        project: 'project',
        phase: 'phase',
        contexts: ['custom'],
        content: 'Layer 9 - Task body',
      });

      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('Layer 1');
      expect(result.fullPrompt).toContain('Layer 2');
      expect(result.fullPrompt).toContain('Layer 3');
      expect(result.fullPrompt).toContain('Layer 4');
      expect(result.fullPrompt).toContain('Layer 5');
      expect(result.fullPrompt).toContain('Layer 6');
      expect(result.fullPrompt).toContain('Layer 7');
      expect(result.fullPrompt).toContain('Layer 8');
      expect(result.fullPrompt).toContain('Layer 9 - Task body');
    });
  });

  describe('buildContextOnly', () => {
    it('should return only context section wrapped in system tags', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'Context content',
      );

      const task = createMinimalTask();
      const result = await buildContextOnly(task, tempRoot);

      expect(result).toContain('<system>');
      expect(result).toContain('<context>');
      expect(result).toContain('Context content');
      expect(result).not.toContain('<task>');
    });

    it('should return empty string when no context available', async () => {
      const task = createMinimalTask();
      const result = await buildContextOnly(task, tempRoot);

      expect(result).toBe('');
    });
  });

  describe('buildTaskOnly', () => {
    it('should return only task section wrapped in system tags', () => {
      const task = createMinimalTask({
        title: 'Task Only Test',
        stage: 'code',
        content: 'Task content here',
      });

      const result = buildTaskOnly(task);

      expect(result).toContain('<system>');
      expect(result).toContain('<task>');
      expect(result).toContain('<metadata>');
      expect(result).toContain('<body>');
      expect(result).toContain('Task Only Test');
      expect(result).toContain('Task content here');
      expect(result).not.toContain('<context>');
    });

    it('should include all metadata fields', () => {
      const task = createMinimalTask({
        title: 'Full Metadata',
        stage: 'audit',
        project: 'test-project',
        phase: 'phase-2',
        agent: 'claude',
        tags: ['tag1', 'tag2'],
        created: '2025-01-01T00:00:00Z',
      });

      const result = buildTaskOnly(task);

      expect(result).toContain('Title: Full Metadata');
      expect(result).toContain('Stage: audit');
      expect(result).toContain('Project: test-project');
      expect(result).toContain('Phase: phase-2');
      expect(result).toContain('Agent: claude');
      expect(result).toContain('Tags: tag1, tag2');
      expect(result).toContain('Created: 2025-01-01T00:00:00Z');
    });

    it('should escape XML special characters in content', () => {
      const task = createMinimalTask({
        title: 'Task with <special> & chars',
        content: 'Content with <tags> & ampersands > arrows',
      });

      const result = buildTaskOnly(task);

      expect(result).toContain('&lt;special&gt;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;tags&gt;');
      expect(result).toContain('&gt; arrows');
      // Should not contain unescaped characters inside content
      expect(result).not.toMatch(/<special>/);
      expect(result).not.toMatch(/<tags>/);
    });
  });

  describe('XML escaping', () => {
    it('should escape content in context files', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'Content with <html> & special chars',
      );

      const task = createMinimalTask();
      const result = await buildXMLPrompt(task, tempRoot);

      expect(result.fullPrompt).toContain('&lt;html&gt;');
      expect(result.fullPrompt).toContain('&amp;');
    });
  });
});
