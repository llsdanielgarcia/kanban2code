import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import matter from 'gray-matter';
import { migrateToProviders } from '../src/services/migration';
import { ProviderConfigSchema } from '../src/types/provider';

let TEST_DIR: string;
let WORKSPACE_ROOT: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), `kanban-migration-${Date.now()}`);
  WORKSPACE_ROOT = TEST_DIR;
  KANBAN_ROOT = path.join(WORKSPACE_ROOT, '.kanban2code');

  await fs.mkdir(path.join(KANBAN_ROOT, '_agents'), { recursive: true });
  await fs.mkdir(path.join(KANBAN_ROOT, 'inbox'), { recursive: true });
  await fs.mkdir(path.join(KANBAN_ROOT, 'projects', 'demo', 'phase1'), { recursive: true });
  await fs.mkdir(path.join(KANBAN_ROOT, '_archive'), { recursive: true });

  await fs.writeFile(path.join(KANBAN_ROOT, '.gitignore'), '_archive/\n', 'utf-8');

  // Old-style agent files (pre-migration)
  await fs.writeFile(
    path.join(KANBAN_ROOT, '_agents', '05-⚙️coder.md'),
    `---
name: coder
description: coding
type: robot
stage: code
created: '2025-12-17'
---

# Coder Agent
`,
    'utf-8',
  );

  await fs.writeFile(
    path.join(KANBAN_ROOT, '_agents', '06-✅auditor.md'),
    `---
name: auditor
description: auditing
type: robot
stage: audit
created: '2025-12-17'
---

Update .kanban2code/_context/architecture.md on accept.
`,
    'utf-8',
  );

  // Tasks with old 'mode' and 'agent' fields
  await fs.writeFile(
    path.join(KANBAN_ROOT, 'inbox', 'task-coder.md'),
    `---
stage: code
agent: coder
mode: coder
tags: [feature]
---

# Task Coder
`,
    'utf-8',
  );

  await fs.writeFile(
    path.join(KANBAN_ROOT, 'projects', 'demo', 'phase1', 'task-prefixed.md'),
    `---
stage: audit
agent: 06-✅auditor
mode: auditor
tags: [audit]
---

# Task Auditor
`,
    'utf-8',
  );
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('migrateToProviders', () => {
  test('creates _providers files, removes mode from tasks, adds provider, and deletes _modes', async () => {
    // Pre-create a _modes/ directory to test removal
    await fs.mkdir(path.join(KANBAN_ROOT, '_modes'), { recursive: true });
    await fs.writeFile(
      path.join(KANBAN_ROOT, '_modes', 'coder.md'),
      '---\nname: coder\nstage: code\n---\n# Coder Mode\n',
    );

    const report = await migrateToProviders(WORKSPACE_ROOT);

    // 1. Provider configs should be created
    const providersDir = path.join(KANBAN_ROOT, '_providers');
    const providerFiles = await fs.readdir(providersDir);
    expect(providerFiles).toContain('opus.md');
    expect(providerFiles).toContain('codex.md');
    expect(providerFiles).toContain('kimi.md');
    expect(providerFiles).toContain('glm.md');

    // Validate provider configs parse correctly
    const opusRaw = await fs.readFile(path.join(providersDir, 'opus.md'), 'utf-8');
    const opusParsed = matter(opusRaw);
    const schemaResult = ProviderConfigSchema.safeParse(opusParsed.data);
    expect(schemaResult.success).toBe(true);

    // 2. Tasks should have mode removed and provider added
    const inboxTask = matter(
      await fs.readFile(path.join(KANBAN_ROOT, 'inbox', 'task-coder.md'), 'utf-8'),
    );
    expect(inboxTask.data.mode).toBeUndefined();
    expect(inboxTask.data.provider).toBeDefined();

    const projectTask = matter(
      await fs.readFile(
        path.join(KANBAN_ROOT, 'projects', 'demo', 'phase1', 'task-prefixed.md'),
        'utf-8',
      ),
    );
    expect(projectTask.data.mode).toBeUndefined();
    expect(projectTask.data.provider).toBeDefined();

    // 3. _modes/ directory should be deleted
    expect(report.removedModes).toBe(true);
    await expect(fs.stat(path.join(KANBAN_ROOT, '_modes'))).rejects.toThrow();

    // 4. Report should contain created providers and updated tasks
    expect(report.createdProviders).toEqual(
      expect.arrayContaining([
        '_providers/opus.md',
        '_providers/codex.md',
        '_providers/kimi.md',
        '_providers/glm.md',
      ]),
    );
    expect(report.updatedTasks).toEqual(
      expect.arrayContaining(['inbox/task-coder.md', 'projects/demo/phase1/task-prefixed.md']),
    );
  });

  test('is idempotent when run twice', async () => {
    const first = await migrateToProviders(WORKSPACE_ROOT);
    const second = await migrateToProviders(WORKSPACE_ROOT);

    expect(first.createdProviders.length).toBeGreaterThan(0);
    expect(first.removedModes).toBe(false);
    expect(second.createdProviders).toEqual([]);
    expect(second.updatedTasks).toEqual([]);
    expect(second.removedModes).toBe(false);
  });

  test('skips existing provider files', async () => {
    const providersDir = path.join(KANBAN_ROOT, '_providers');
    await fs.mkdir(providersDir, { recursive: true });
    const customContent = '---\ncli: custom-claude\nmodel: custom-model\n---\nCustom opus';
    await fs.writeFile(path.join(providersDir, 'opus.md'), customContent);

    const report = await migrateToProviders(WORKSPACE_ROOT);

    // opus.md should be skipped
    expect(report.skipped).toContain('_providers/opus.md');
    expect(report.createdProviders).not.toContain('_providers/opus.md');

    // Custom content should be preserved
    const opusContent = await fs.readFile(path.join(providersDir, 'opus.md'), 'utf-8');
    expect(opusContent).toContain('custom-claude');
  });

  test('adds _logs/ to .kanban2code/.gitignore', async () => {
    await migrateToProviders(WORKSPACE_ROOT);
    const gitignore = await fs.readFile(path.join(KANBAN_ROOT, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('_archive/');
    expect(gitignore).toContain('_logs/');
  });
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
