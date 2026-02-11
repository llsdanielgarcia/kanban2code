import { beforeAll, beforeEach, afterEach, expect, test, describe, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { BUNDLED_AGENTS } from '../src/assets/agents';
import { BUNDLED_MODES } from '../src/assets/modes';
import { HOW_IT_WORKS } from '../src/assets/seed-content';

let scaffoldWorkspace: typeof import('../src/services/scaffolder').scaffoldWorkspace;
let syncBundledAgents: typeof import('../src/services/scaffolder').syncBundledAgents;
let syncWorkspace: typeof import('../src/services/scaffolder').syncWorkspace;
let KANBAN_FOLDER: typeof import('../src/services/scaffolder').KANBAN_FOLDER;

beforeAll(async () => {
  const mod = await import('../src/services/scaffolder');
  scaffoldWorkspace = mod.scaffoldWorkspace;
  syncBundledAgents = mod.syncBundledAgents;
  syncWorkspace = mod.syncWorkspace;
  KANBAN_FOLDER = mod.KANBAN_FOLDER;
});

let TEST_DIR: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban2code-test-' + Date.now());
  await fs.mkdir(TEST_DIR, { recursive: true });
});

test('scaffoldWorkspace creates expected structure', async () => {
  await scaffoldWorkspace(TEST_DIR);

  const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);

  // Check directories
  const statsInbox = await fs.stat(path.join(kanbanRoot, 'inbox'));
  expect(statsInbox.isDirectory()).toBe(true);

  const statsArchive = await fs.stat(path.join(kanbanRoot, '_archive'));
  expect(statsArchive.isDirectory()).toBe(true);

  await expect(fs.stat(path.join(kanbanRoot, '_templates'))).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(fs.stat(path.join(kanbanRoot, '_templates', 'tasks'))).rejects.toMatchObject({ code: 'ENOENT' });
  await expect(fs.stat(path.join(kanbanRoot, '_templates', 'stages'))).rejects.toMatchObject({ code: 'ENOENT' });

  // Check files
  const howItWorks = await fs.readFile(path.join(kanbanRoot, 'how-it-works.md'), 'utf-8');
  expect(howItWorks).toContain('# How Kanban2Code Works');

  const architecture = await fs.readFile(path.join(kanbanRoot, 'architecture.md'), 'utf-8');
  expect(architecture).toContain('# Architecture');

  // Verify bundled agents are created (not legacy opus.md)
  const coder = await fs.readFile(path.join(kanbanRoot, '_agents/05-⚙️coder.md'), 'utf-8');
  expect(coder).toContain('name: coder');

  const inboxTask = await fs.readFile(path.join(kanbanRoot, 'inbox/sample-task.md'), 'utf-8');
  expect(inboxTask).toContain('# Explore Kanban2Code');

  const gitignore = await fs.readFile(path.join(kanbanRoot, '.gitignore'), 'utf-8');
  expect(gitignore).toContain('_archive/');

  const aiGuide = await fs.readFile(path.join(kanbanRoot, '_context/ai-guide.md'), 'utf-8');
  expect(aiGuide).toContain('# Kanban2Code AI Guide');

  // Verify _modes directory and bundled modes
  const statsModes = await fs.stat(path.join(kanbanRoot, '_modes'));
  expect(statsModes.isDirectory()).toBe(true);

  const coderMode = await fs.readFile(path.join(kanbanRoot, '_modes/coder.md'), 'utf-8');
  expect(coderMode).toContain('name: coder');
});

test('scaffoldWorkspace fails if already initialized', async () => {
  await scaffoldWorkspace(TEST_DIR);

  await expect(scaffoldWorkspace(TEST_DIR)).rejects.toThrow('Kanban2Code already initialized.');
});

describe('bundled agents scaffolding', () => {
  test('scaffoldWorkspace creates all bundled agent files', async () => {
    await scaffoldWorkspace(TEST_DIR);

    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    const agentsDir = path.join(kanbanRoot, '_agents');

    // Check all bundled agents are created
    for (const filename of Object.keys(BUNDLED_AGENTS)) {
      const agentPath = path.join(agentsDir, filename);
      const stat = await fs.stat(agentPath);
      expect(stat.isFile()).toBe(true);
    }

    // Verify content of a few agents
    const roadmapper = await fs.readFile(path.join(agentsDir, '01-🗺️roadmapper.md'), 'utf-8');
    expect(roadmapper).toContain('name: roadmapper');
    expect(roadmapper).toContain('type: robot');

    const coder = await fs.readFile(path.join(agentsDir, '05-⚙️coder.md'), 'utf-8');
    expect(coder).toContain('name: coder');
    expect(coder).toContain('type: robot');

    const auditor = await fs.readFile(path.join(agentsDir, '06-✅auditor.md'), 'utf-8');
    expect(auditor).toContain('name: auditor');
    expect(auditor).toContain('Rating 8-10');
  });

  test('syncBundledAgents adds missing agents without overwriting existing', async () => {
    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    const agentsDir = path.join(kanbanRoot, '_agents');

    // Create _agents directory and one custom agent
    await fs.mkdir(agentsDir, { recursive: true });
    const customContent = '---\nname: roadmapper\ncustom: true\n---\nCustom roadmapper';
    await fs.writeFile(path.join(agentsDir, '01-🗺️roadmapper.md'), customContent);

    // Sync bundled agents
    const synced = await syncBundledAgents(TEST_DIR);

    // roadmapper.md should NOT be synced (already exists)
    expect(synced).not.toContain('01-🗺️roadmapper.md');

    // Other agents should be synced
    expect(synced).toContain('02-🏛️architect.md');
    expect(synced).toContain('03-✂️splitter.md');
    expect(synced).toContain('04-📋planner.md');
    expect(synced).toContain('05-⚙️coder.md');
    expect(synced).toContain('06-✅auditor.md');
    expect(synced).toContain('07-💬conversational.md');

    // Verify custom roadmapper is preserved
    const roadmapper = await fs.readFile(path.join(agentsDir, '01-🗺️roadmapper.md'), 'utf-8');
    expect(roadmapper).toContain('custom: true');

    // Verify new agents are created correctly
    const architect = await fs.readFile(path.join(agentsDir, '02-🏛️architect.md'), 'utf-8');
    expect(architect).toContain('name: architect');
  });

  test('syncBundledAgents creates _agents directory if missing', async () => {
    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);

    // Create only the kanban root, not _agents
    await fs.mkdir(kanbanRoot, { recursive: true });

    // Sync should create _agents and all bundled agents
    const synced = await syncBundledAgents(TEST_DIR);

    expect(synced.length).toBe(Object.keys(BUNDLED_AGENTS).length);

    const agentsDir = path.join(kanbanRoot, '_agents');
    const stat = await fs.stat(agentsDir);
    expect(stat.isDirectory()).toBe(true);
  });

  test('syncBundledAgents fails if workspace not initialized', async () => {
    await expect(syncBundledAgents(TEST_DIR)).rejects.toThrow('Kanban2Code not initialized');
  });

  test('syncBundledAgents throws if an agent path exists but is not a file', async () => {
    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    const agentsDir = path.join(kanbanRoot, '_agents');
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.mkdir(path.join(agentsDir, '01-🗺️roadmapper.md'), { recursive: true });

    await expect(syncBundledAgents(TEST_DIR)).rejects.toThrow('Agent path exists but is not a file');
  });
});

describe('bundled modes scaffolding', () => {
  test('scaffoldWorkspace creates all bundled mode files', async () => {
    await scaffoldWorkspace(TEST_DIR);

    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    const modesDir = path.join(kanbanRoot, '_modes');

    // Check all bundled modes are created
    for (const filename of Object.keys(BUNDLED_MODES)) {
      const modePath = path.join(modesDir, filename);
      const stat = await fs.stat(modePath);
      expect(stat.isFile()).toBe(true);
    }

    // Verify content of modes
    const coder = await fs.readFile(path.join(modesDir, 'coder.md'), 'utf-8');
    expect(coder).toContain('name: coder');

    const auditor = await fs.readFile(path.join(modesDir, 'auditor.md'), 'utf-8');
    expect(auditor).toContain('name: auditor');
  });

  test('sync writes missing mode files without overwriting existing ones', async () => {
    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    await fs.mkdir(kanbanRoot, { recursive: true });

    // Pre-create a custom mode file
    const modesDir = path.join(kanbanRoot, '_modes');
    await fs.mkdir(modesDir, { recursive: true });
    const customContent = '---\nname: coder\ncustom: true\n---\nCustom coder mode';
    await fs.writeFile(path.join(modesDir, 'coder.md'), customContent);

    // Sync workspace
    const report = await syncWorkspace(TEST_DIR);

    // coder.md should be skipped (already exists)
    expect(report.skipped).toContain('_modes/coder.md');

    // Other modes should be created
    expect(report.created).toContain('_modes/auditor.md');
    expect(report.created).toContain('_modes/planner.md');

    // Verify custom mode is preserved
    const coder = await fs.readFile(path.join(modesDir, 'coder.md'), 'utf-8');
    expect(coder).toContain('custom: true');

    // Verify new modes are created correctly
    const auditor = await fs.readFile(path.join(modesDir, 'auditor.md'), 'utf-8');
    expect(auditor).toContain('name: auditor');
  });
});

describe('workspace sync', () => {
  test('syncWorkspace updates unmodified files', async () => {
    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    await fs.mkdir(kanbanRoot, { recursive: true });
    await fs.writeFile(path.join(kanbanRoot, 'how-it-works.md'), HOW_IT_WORKS);

    const report = await syncWorkspace(TEST_DIR);

    expect(report.skipped).toContain('how-it-works.md');
    const synced = await fs.readFile(path.join(kanbanRoot, 'how-it-works.md'), 'utf-8');
    expect(synced).toBe(HOW_IT_WORKS);
  });

  test('syncWorkspace preserves modified files', async () => {
    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    await fs.mkdir(kanbanRoot, { recursive: true });
    const customContent = '# Custom Architecture\n';
    const architecturePath = path.join(kanbanRoot, 'architecture.md');
    await fs.writeFile(architecturePath, customContent);

    const report = await syncWorkspace(TEST_DIR);

    expect(report.skipped).toContain('architecture.md');
    const result = await fs.readFile(architecturePath, 'utf-8');
    expect(result).toBe(customContent);
  });

  test('syncWorkspace handles missing directories', async () => {
    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    await fs.mkdir(kanbanRoot, { recursive: true });

    const report = await syncWorkspace(TEST_DIR);

    const agentsDir = path.join(kanbanRoot, '_agents');
    const stat = await fs.stat(agentsDir);
    expect(stat.isDirectory()).toBe(true);
    expect(report.created).toContain('how-it-works.md');
    expect(report.created).toContain('_agents/01-🗺️roadmapper.md');
    expect(report.created).toContain('_context/ai-guide.md');
  });

  test('syncWorkspace returns detailed sync report', async () => {
    const kanbanRoot = path.join(TEST_DIR, KANBAN_FOLDER);
    await fs.mkdir(kanbanRoot, { recursive: true });
    await fs.writeFile(path.join(kanbanRoot, 'how-it-works.md'), HOW_IT_WORKS);
    await fs.writeFile(path.join(kanbanRoot, 'architecture.md'), '# Custom Architecture\n');

    const report = await syncWorkspace(TEST_DIR);

    expect(report.skipped).toContain('how-it-works.md');
    expect(report.skipped).toContain('architecture.md');
    expect(report.created).toContain('project-details.md');
  });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});
