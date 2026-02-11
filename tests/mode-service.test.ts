import { beforeEach, afterEach, describe, expect, test } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  listAvailableModes,
  resolveModePath,
  loadModeContext,
  createModeFile,
  updateModeFile,
  deleteModeFile,
} from '../src/services/mode-service';
import { KANBAN_FOLDER, MODES_FOLDER } from '../src/core/constants';

let TEST_DIR: string;
let KANBAN_ROOT: string;

beforeEach(async () => {
  TEST_DIR = path.join(os.tmpdir(), 'kanban-mode-' + Date.now());
  KANBAN_ROOT = path.join(TEST_DIR, KANBAN_FOLDER);
  await fs.mkdir(KANBAN_ROOT, { recursive: true });
});

afterEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('listAvailableModes', () => {
  test('returns empty array when _modes/ does not exist', async () => {
    const modes = await listAvailableModes(KANBAN_ROOT);
    expect(modes).toEqual([]);
  });

  test('parses frontmatter correctly (name, description, stage)', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });

    await fs.writeFile(
      path.join(modesDir, 'coder.md'),
      `---
name: Coder
description: General-purpose coding agent
stage: code
---
# Coder Agent

You are a coding agent.
`
    );

    const modes = await listAvailableModes(KANBAN_ROOT);
    expect(modes).toHaveLength(1);
    expect(modes[0].id).toBe('coder');
    expect(modes[0].name).toBe('Coder');
    expect(modes[0].description).toBe('General-purpose coding agent');
    expect(modes[0].stage).toBe('code');
    expect(modes[0].path).toBe('_modes/coder.md');
  });

  test('handles modes without stage field', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });

    await fs.writeFile(
      path.join(modesDir, 'planner.md'),
      `---
name: Planner
description: Planning agent
---
# Planner Agent
`
    );

    const modes = await listAvailableModes(KANBAN_ROOT);
    expect(modes).toHaveLength(1);
    expect(modes[0].stage).toBeUndefined();
  });

  test('sorts modes by name', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });

    await fs.writeFile(
      path.join(modesDir, 'zebra.md'),
      `---\nname: Zebra Mode\ndescription: Z\n---\n`
    );
    await fs.writeFile(
      path.join(modesDir, 'alpha.md'),
      `---\nname: Alpha Mode\ndescription: A\n---\n`
    );

    const modes = await listAvailableModes(KANBAN_ROOT);
    expect(modes).toHaveLength(2);
    expect(modes[0].name).toBe('Alpha Mode');
    expect(modes[1].name).toBe('Zebra Mode');
  });

  test('uses filename as fallback name when frontmatter name missing', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });

    await fs.writeFile(
      path.join(modesDir, 'custom-mode.md'),
      `---
description: No name field
---
Body content
`
    );

    const modes = await listAvailableModes(KANBAN_ROOT);
    expect(modes).toHaveLength(1);
    expect(modes[0].name).toBe('Custom Mode');
  });
});

describe('resolveModePath', () => {
  test('finds mode by filename (id)', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });
    await fs.writeFile(
      path.join(modesDir, 'coder.md'),
      `---\nname: Coder\n---\n`
    );

    const resolved = await resolveModePath(KANBAN_ROOT, 'coder');
    expect(resolved).toBe('_modes/coder.md');
  });

  test('finds mode by frontmatter name', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });
    await fs.writeFile(
      path.join(modesDir, 'coder.md'),
      `---\nname: Coder\n---\n`
    );

    const resolved = await resolveModePath(KANBAN_ROOT, 'Coder');
    expect(resolved).toBe('_modes/coder.md');
  });

  test('returns undefined when mode not found', async () => {
    const resolved = await resolveModePath(KANBAN_ROOT, 'nonexistent');
    expect(resolved).toBeUndefined();
  });
});

describe('loadModeContext', () => {
  test('returns full file content as string', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });
    await fs.writeFile(
      path.join(modesDir, 'coder.md'),
      `---
name: Coder
description: Coding agent
---
# Coder Agent

You write code.
`
    );

    const content = await loadModeContext(KANBAN_ROOT, 'coder');
    expect(content).toContain('---');
    expect(content).toContain('name: Coder');
    expect(content).toContain('# Coder Agent');
    expect(content).toContain('You write code.');
  });

  test('returns empty string for null/undefined modeName', async () => {
    expect(await loadModeContext(KANBAN_ROOT, null)).toBe('');
    expect(await loadModeContext(KANBAN_ROOT, undefined)).toBe('');
  });

  test('returns empty string when mode not found', async () => {
    const content = await loadModeContext(KANBAN_ROOT, 'nonexistent');
    expect(content).toBe('');
  });
});

describe('createModeFile', () => {
  test('writes new mode file with frontmatter + body', async () => {
    const relativePath = await createModeFile(KANBAN_ROOT, {
      name: 'Test Mode',
      description: 'A test mode',
      stage: 'plan',
      content: '# Test Mode\n\nThis is the body.',
    });

    expect(relativePath).toBe('_modes/test-mode.md');

    const filePath = path.join(KANBAN_ROOT, relativePath);
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('name: Test Mode');
    expect(content).toContain('description: A test mode');
    expect(content).toContain('stage: plan');
    expect(content).toContain('# Test Mode');
    expect(content).toContain('This is the body.');
  });

  test('creates _modes directory if it does not exist', async () => {
    await createModeFile(KANBAN_ROOT, {
      name: 'New Mode',
      description: 'Description',
      content: 'Body',
    });

    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    const stat = await fs.stat(modesDir);
    expect(stat.isDirectory()).toBe(true);
  });

  test('omits stage from frontmatter when not provided', async () => {
    await createModeFile(KANBAN_ROOT, {
      name: 'No Stage Mode',
      description: 'No stage',
      content: 'Body',
    });

    const filePath = path.join(KANBAN_ROOT, '_modes/no-stage-mode.md');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).not.toContain('stage:');
  });
});

describe('updateModeFile', () => {
  test('overwrites existing mode file', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });
    await fs.writeFile(
      path.join(modesDir, 'existing.md'),
      `---
name: Old Name
description: Old description
---
Old body
`
    );

    await updateModeFile(KANBAN_ROOT, 'existing', {
      name: 'New Name',
      description: 'New description',
      stage: 'audit',
      content: 'New body',
    });

    const content = await fs.readFile(path.join(modesDir, 'existing.md'), 'utf-8');
    expect(content).toContain('name: New Name');
    expect(content).toContain('description: New description');
    expect(content).toContain('stage: audit');
    expect(content).toContain('New body');
    expect(content).not.toContain('Old');
  });

  test('throws when mode not found', async () => {
    await expect(
      updateModeFile(KANBAN_ROOT, 'nonexistent', {
        name: 'Test',
        description: 'Test',
        content: 'Test',
      })
    ).rejects.toThrow('Mode not found');
  });
});

describe('deleteModeFile', () => {
  test('deletes mode file and returns true', async () => {
    const modesDir = path.join(KANBAN_ROOT, MODES_FOLDER);
    await fs.mkdir(modesDir, { recursive: true });
    await fs.writeFile(path.join(modesDir, 'to-delete.md'), '---\nname: Delete Me\n---\n');

    const result = await deleteModeFile(KANBAN_ROOT, 'to-delete');
    expect(result).toBe(true);

    await expect(fs.stat(path.join(modesDir, 'to-delete.md'))).rejects.toThrow();
  });

  test('returns false when mode not found', async () => {
    const result = await deleteModeFile(KANBAN_ROOT, 'nonexistent');
    expect(result).toBe(false);
  });
});

describe('round-trip', () => {
  test('create → list → verify content matches', async () => {
    // Create a mode
    await createModeFile(KANBAN_ROOT, {
      name: 'Round Trip Mode',
      description: 'Testing round trip',
      stage: 'code',
      content: '# Instructions\n\nFollow these steps.',
    });

    // List modes
    const modes = await listAvailableModes(KANBAN_ROOT);
    expect(modes).toHaveLength(1);
    expect(modes[0].name).toBe('Round Trip Mode');
    expect(modes[0].description).toBe('Testing round trip');
    expect(modes[0].stage).toBe('code');

    // Load full content
    const content = await loadModeContext(KANBAN_ROOT, 'round-trip-mode');
    expect(content).toContain('# Instructions');
    expect(content).toContain('Follow these steps.');
  });
});
