import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import matter from 'gray-matter';
import { migrateAgentsToModes } from '../src/services/migration';
import { AgentCliConfigSchema } from '../src/types/agent';

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

  await fs.writeFile(
    path.join(KANBAN_ROOT, 'inbox', 'task-coder.md'),
    `---
stage: code
agent: coder
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

describe('migrateAgentsToModes', () => {
  test('creates _modes files, strips emoji prefix, removes type: robot, updates tasks, and creates new agent configs', async () => {
    const report = await migrateAgentsToModes(WORKSPACE_ROOT);

    const modesDir = path.join(KANBAN_ROOT, '_modes');
    const modeFiles = await fs.readdir(modesDir);
    expect(modeFiles).toContain('coder.md');
    expect(modeFiles).toContain('auditor.md');
    expect(modeFiles).not.toContain('05-⚙️coder.md');

    const coderModeRaw = await fs.readFile(path.join(modesDir, 'coder.md'), 'utf-8');
    const coderMode = matter(coderModeRaw);
    expect(coderMode.data.name).toBe('coder');
    expect(coderMode.data.description).toBe('coding');
    expect(coderMode.data.stage).toBe('code');
    expect(coderMode.data.created).toBe('2025-12-17');
    expect(coderMode.data.type).toBeUndefined();

    const auditorModeRaw = await fs.readFile(path.join(modesDir, 'auditor.md'), 'utf-8');
    expect(auditorModeRaw).toContain('.kanban2code/architecture.md');
    expect(auditorModeRaw).not.toContain('_context/architecture.md');

    const inboxTask = matter(await fs.readFile(path.join(KANBAN_ROOT, 'inbox', 'task-coder.md'), 'utf-8'));
    expect(inboxTask.data.mode).toBe('coder');
    expect(inboxTask.data.agent).toBe('opus');

    const projectTask = matter(
      await fs.readFile(path.join(KANBAN_ROOT, 'projects', 'demo', 'phase1', 'task-prefixed.md'), 'utf-8'),
    );
    expect(projectTask.data.mode).toBe('auditor');
    expect(projectTask.data.agent).toBe('opus');

    expect(await fileExists(path.join(KANBAN_ROOT, '_agents', '05-⚙️coder.md'))).toBe(false);
    expect(await fileExists(path.join(KANBAN_ROOT, '_agents', '06-✅auditor.md'))).toBe(false);

    const createdAgents = ['opus.md', 'codex.md', 'kimi.md', 'glm.md'];
    for (const fileName of createdAgents) {
      const raw = await fs.readFile(path.join(KANBAN_ROOT, '_agents', fileName), 'utf-8');
      const parsed = matter(raw);
      const schemaResult = AgentCliConfigSchema.safeParse(parsed.data);
      expect(schemaResult.success).toBe(true);
    }

    expect(report.movedModes).toEqual(expect.arrayContaining(['_modes/coder.md', '_modes/auditor.md']));
    expect(report.createdAgents).toEqual(
      expect.arrayContaining(['_agents/opus.md', '_agents/codex.md', '_agents/kimi.md', '_agents/glm.md']),
    );
    expect(report.updatedTasks).toEqual(
      expect.arrayContaining(['inbox/task-coder.md', 'projects/demo/phase1/task-prefixed.md']),
    );
  });

  test('is idempotent when run twice', async () => {
    const first = await migrateAgentsToModes(WORKSPACE_ROOT);
    const second = await migrateAgentsToModes(WORKSPACE_ROOT);

    expect(first.movedModes.length).toBeGreaterThan(0);
    expect(first.createdAgents.length).toBe(4);
    expect(second.movedModes).toEqual([]);
    expect(second.createdAgents).toEqual([]);
    expect(second.updatedTasks).toEqual([]);
  });

  test('rolls back copied modes and restores _agents if task update fails in step 2', async () => {
    await fs.writeFile(
      path.join(KANBAN_ROOT, 'inbox', 'broken.md'),
      `---
stage: code
agent: coder
tags: [feature
---

# Broken
`,
      'utf-8',
    );

    await expect(migrateAgentsToModes(WORKSPACE_ROOT)).rejects.toThrow();

    expect(await fileExists(path.join(KANBAN_ROOT, '_modes', 'coder.md'))).toBe(false);
    expect(await fileExists(path.join(KANBAN_ROOT, '_modes', 'auditor.md'))).toBe(false);

    expect(await fileExists(path.join(KANBAN_ROOT, '_agents', '05-⚙️coder.md'))).toBe(true);
    expect(await fileExists(path.join(KANBAN_ROOT, '_agents', '06-✅auditor.md'))).toBe(true);
    expect(await fileExists(path.join(KANBAN_ROOT, '_agents', 'opus.md'))).toBe(false);
  });

  test('adds _logs/ to .kanban2code/.gitignore', async () => {
    await migrateAgentsToModes(WORKSPACE_ROOT);
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
