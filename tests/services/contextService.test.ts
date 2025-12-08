import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  loadGlobalContext,
  loadAgentContext,
  loadProjectContext,
  loadPhaseContext,
  loadCustomContexts,
  loadCustomContextsCombined,
} from '../../src/services/contextService';
import { FOLDERS, GLOBAL_CONTEXT_FILES } from '../../src/core/constants';

describe('contextService', () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  describe('loadGlobalContext', () => {
    it('should load all global context files when present', async () => {
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

      const result = await loadGlobalContext(tempRoot);

      expect(result.howItWorks).toBe('How it works content');
      expect(result.architecture).toBe('Architecture content');
      expect(result.projectDetails).toBe('Project details content');
    });

    it('should return null for missing files', async () => {
      const result = await loadGlobalContext(tempRoot);

      expect(result.howItWorks).toBeNull();
      expect(result.architecture).toBeNull();
      expect(result.projectDetails).toBeNull();
    });

    it('should handle partial files', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        'Only how-it-works',
      );

      const result = await loadGlobalContext(tempRoot);

      expect(result.howItWorks).toBe('Only how-it-works');
      expect(result.architecture).toBeNull();
      expect(result.projectDetails).toBeNull();
    });

    it('should return null for empty files', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        '',
      );
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.architecture),
        '   ',
      );

      const result = await loadGlobalContext(tempRoot);

      expect(result.howItWorks).toBeNull();
      expect(result.architecture).toBeNull();
    });

    it('should trim whitespace from content', async () => {
      await fs.writeFile(
        path.join(tempRoot, GLOBAL_CONTEXT_FILES.howItWorks),
        '  \n  Content with whitespace  \n  ',
      );

      const result = await loadGlobalContext(tempRoot);

      expect(result.howItWorks).toBe('Content with whitespace');
    });
  });

  describe('loadAgentContext', () => {
    it('should load agent context file', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.agents), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.agents, 'claude.md'),
        'Claude agent configuration',
      );

      const result = await loadAgentContext(tempRoot, 'claude');

      expect(result).toBe('Claude agent configuration');
    });

    it('should return null for missing agent', async () => {
      const result = await loadAgentContext(tempRoot, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should handle agent names with special characters', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.agents), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.agents, 'my-agent-v2.md'),
        'Agent v2 content',
      );

      const result = await loadAgentContext(tempRoot, 'my-agent-v2');

      expect(result).toBe('Agent v2 content');
    });
  });

  describe('loadProjectContext', () => {
    it('should load project context file', async () => {
      const projectPath = path.join(tempRoot, FOLDERS.projects, 'my-project');
      await fs.mkdir(projectPath, { recursive: true });
      await fs.writeFile(
        path.join(projectPath, '_context.md'),
        'Project context content',
      );

      const result = await loadProjectContext(tempRoot, 'my-project');

      expect(result).toBe('Project context content');
    });

    it('should return null for missing project context', async () => {
      const result = await loadProjectContext(tempRoot, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when project exists but no context file', async () => {
      const projectPath = path.join(tempRoot, FOLDERS.projects, 'my-project');
      await fs.mkdir(projectPath, { recursive: true });

      const result = await loadProjectContext(tempRoot, 'my-project');

      expect(result).toBeNull();
    });
  });

  describe('loadPhaseContext', () => {
    it('should load phase context file', async () => {
      const phasePath = path.join(tempRoot, FOLDERS.projects, 'my-project', 'phase-1');
      await fs.mkdir(phasePath, { recursive: true });
      await fs.writeFile(
        path.join(phasePath, '_context.md'),
        'Phase context content',
      );

      const result = await loadPhaseContext(tempRoot, 'my-project', 'phase-1');

      expect(result).toBe('Phase context content');
    });

    it('should return null for missing phase context', async () => {
      const result = await loadPhaseContext(tempRoot, 'nonexistent', 'phase');

      expect(result).toBeNull();
    });
  });

  describe('loadCustomContexts', () => {
    it('should load multiple custom context files', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.contexts), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'context1.md'),
        'Context 1 content',
      );
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'context2.md'),
        'Context 2 content',
      );

      const result = await loadCustomContexts(tempRoot, ['context1', 'context2']);

      expect(result).toEqual(['Context 1 content', 'Context 2 content']);
    });

    it('should handle .md extension in names', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.contexts), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'context1.md'),
        'Content 1',
      );

      const result = await loadCustomContexts(tempRoot, ['context1.md']);

      expect(result).toEqual(['Content 1']);
    });

    it('should return null for missing contexts', async () => {
      const result = await loadCustomContexts(tempRoot, ['missing1', 'missing2']);

      expect(result).toEqual([null, null]);
    });

    it('should handle mixed existing and missing', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.contexts), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'existing.md'),
        'Existing content',
      );

      const result = await loadCustomContexts(tempRoot, ['existing', 'missing']);

      expect(result).toEqual(['Existing content', null]);
    });
  });

  describe('loadCustomContextsCombined', () => {
    it('should combine multiple contexts with double newlines', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.contexts), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'context1.md'),
        'Content 1',
      );
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'context2.md'),
        'Content 2',
      );

      const result = await loadCustomContextsCombined(tempRoot, ['context1', 'context2']);

      expect(result).toBe('Content 1\n\nContent 2');
    });

    it('should filter out null values', async () => {
      await fs.mkdir(path.join(tempRoot, FOLDERS.contexts), { recursive: true });
      await fs.writeFile(
        path.join(tempRoot, FOLDERS.contexts, 'existing.md'),
        'Existing content',
      );

      const result = await loadCustomContextsCombined(tempRoot, ['existing', 'missing']);

      expect(result).toBe('Existing content');
    });

    it('should return null for empty array', async () => {
      const result = await loadCustomContextsCombined(tempRoot, []);

      expect(result).toBeNull();
    });

    it('should return null when all contexts are missing', async () => {
      const result = await loadCustomContextsCombined(tempRoot, ['missing1', 'missing2']);

      expect(result).toBeNull();
    });
  });
});
