import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { loadStageTemplate, loadTaskTemplate } from '../../src/services/templateService';
import { FOLDERS } from '../../src/core/constants';

describe('templateService', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  describe('loadStageTemplate', () => {
    it('should load stage template when present', async () => {
      const stageTemplatesPath = path.join(tempRoot, FOLDERS.stageTemplates);
      await fs.mkdir(stageTemplatesPath, { recursive: true });
      await fs.writeFile(
        path.join(stageTemplatesPath, 'plan.md'),
        'Planning stage guidance: Break down the task into steps.',
      );

      const result = await loadStageTemplate(tempRoot, 'plan');

      expect(result).toBe('Planning stage guidance: Break down the task into steps.');
    });

    it('should return null for missing stage template', async () => {
      const result = await loadStageTemplate(tempRoot, 'code');

      expect(result).toBeNull();
    });

    it('should handle all valid stages', async () => {
      const stages = ['inbox', 'plan', 'code', 'audit', 'completed'] as const;
      const stageTemplatesPath = path.join(tempRoot, FOLDERS.stageTemplates);
      await fs.mkdir(stageTemplatesPath, { recursive: true });

      for (const stage of stages) {
        await fs.writeFile(
          path.join(stageTemplatesPath, `${stage}.md`),
          `Template for ${stage}`,
        );
      }

      for (const stage of stages) {
        const result = await loadStageTemplate(tempRoot, stage);
        expect(result).toBe(`Template for ${stage}`);
      }
    });

    it('should return null for empty template file', async () => {
      const stageTemplatesPath = path.join(tempRoot, FOLDERS.stageTemplates);
      await fs.mkdir(stageTemplatesPath, { recursive: true });
      await fs.writeFile(path.join(stageTemplatesPath, 'inbox.md'), '');

      const result = await loadStageTemplate(tempRoot, 'inbox');

      expect(result).toBeNull();
    });

    it('should trim whitespace from template content', async () => {
      const stageTemplatesPath = path.join(tempRoot, FOLDERS.stageTemplates);
      await fs.mkdir(stageTemplatesPath, { recursive: true });
      await fs.writeFile(
        path.join(stageTemplatesPath, 'code.md'),
        '\n  Template with whitespace  \n',
      );

      const result = await loadStageTemplate(tempRoot, 'code');

      expect(result).toBe('Template with whitespace');
    });
  });

  describe('loadTaskTemplate', () => {
    it('should load task template when present', async () => {
      const taskTemplatesPath = path.join(tempRoot, FOLDERS.taskTemplates);
      await fs.mkdir(taskTemplatesPath, { recursive: true });
      await fs.writeFile(
        path.join(taskTemplatesPath, 'bug-report.md'),
        '# Bug Report\n\n## Description\n\n## Steps to Reproduce',
      );

      const result = await loadTaskTemplate(tempRoot, 'bug-report');

      expect(result).toContain('# Bug Report');
      expect(result).toContain('## Steps to Reproduce');
    });

    it('should return null for missing task template', async () => {
      const result = await loadTaskTemplate(tempRoot, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should handle template names with hyphens', async () => {
      const taskTemplatesPath = path.join(tempRoot, FOLDERS.taskTemplates);
      await fs.mkdir(taskTemplatesPath, { recursive: true });
      await fs.writeFile(
        path.join(taskTemplatesPath, 'feature-request.md'),
        'Feature request template',
      );

      const result = await loadTaskTemplate(tempRoot, 'feature-request');

      expect(result).toBe('Feature request template');
    });
  });
});
