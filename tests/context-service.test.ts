import { beforeEach, afterEach, expect, test } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  loadAgentContext,
  loadCustomContexts,
  loadGlobalContext,
  loadPhaseContext,
  loadProjectContext,
} from '../src/services/context';
import { AGENTS_FOLDER, KANBAN_FOLDER, PROJECTS_FOLDER } from '../src/core/constants';

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-context-' + Date.now());
  KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

test('loadGlobalContext reads files in order and skips missing', async () => {
  await fs.writeFile(path.join(KANBAN_ROOT, 'how-it-works.md'), 'HOW');
  await fs.writeFile(path.join(KANBAN_ROOT, 'architecture.md'), 'ARCH');
  // project-details missing intentionally

  const content = await loadGlobalContext(KANBAN_ROOT);
  expect(content).toContain('HOW');
  expect(content).toContain('ARCH');
  expect(content.indexOf('HOW')).toBeLessThan(content.indexOf('ARCH'));
});

test('agent, project, and phase context loaders fallback gracefully', async () => {
  const agentsDir = path.join(KANBAN_ROOT, AGENTS_FOLDER);
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.writeFile(path.join(agentsDir, 'opus.md'), 'AGENT');

  const projectsDir = path.join(KANBAN_ROOT, PROJECTS_FOLDER, 'alpha');
  await fs.mkdir(projectsDir, { recursive: true });
  await fs.writeFile(path.join(projectsDir, '_context.md'), 'PROJECT');

  const phaseDir = path.join(projectsDir, 'phase-1');
  await fs.mkdir(phaseDir, { recursive: true });
  await fs.writeFile(path.join(phaseDir, '_context.md'), 'PHASE');

  expect(await loadAgentContext(KANBAN_ROOT, 'opus')).toBe('AGENT');
  expect(await loadAgentContext(KANBAN_ROOT, 'missing')).toBe('');
  expect(await loadProjectContext(KANBAN_ROOT, 'alpha')).toBe('PROJECT');
  expect(await loadPhaseContext(KANBAN_ROOT, 'alpha', 'phase-1')).toBe('PHASE');
});

test('custom contexts resolve multiple files and ensure extensions', async () => {
  await fs.writeFile(path.join(KANBAN_ROOT, 'custom-a.md'), 'A');
  await fs.writeFile(path.join(KANBAN_ROOT, 'custom-b.md'), 'B');

  const combined = await loadCustomContexts(KANBAN_ROOT, ['custom-a', 'custom-b.md']);
  expect(combined).toContain('A');
  expect(combined).toContain('B');
});

test('loadCustomContexts rejects unsafe paths', async () => {
  await expect(loadCustomContexts(KANBAN_ROOT, ['../escape'])).rejects.toThrow('Path validation failed');
});

test('loadCustomContexts expands folder: contexts recursively', async () => {
  const folder = path.join(KANBAN_ROOT, 'sample-context-folder');
  await fs.mkdir(path.join(folder, 'nested'), { recursive: true });
  await fs.writeFile(path.join(folder, 'a.md'), 'A');
  await fs.writeFile(path.join(folder, 'nested', 'b.ts'), 'B');

  const combined = await loadCustomContexts(KANBAN_ROOT, ['folder:sample-context-folder']);
  expect(combined).toContain('A');
  expect(combined).toContain('B');
  expect(combined).toContain('sample-context-folder/a.md');
  expect(combined).toContain('sample-context-folder/nested/b.ts');
});

test('loadCustomContexts rejects unsafe folder: contexts', async () => {
  await expect(loadCustomContexts(KANBAN_ROOT, ['folder:../escape'])).rejects.toThrow('Path validation failed');
});
