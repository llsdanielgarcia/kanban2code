import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  ValidationStatus,
  validateWorkspace,
  validatePath,
  isExcludedPath,
  guardWrite,
} from '../../src/workspace/validation';
import { KANBAN_ROOT, FOLDERS } from '../../src/core/constants';

vi.mock('vscode', () => ({ workspace: { workspaceFolders: [] } }), { virtual: true });

describe('workspace/validation', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban2code-validation-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const mockFolder = (fsPath: string) => ({ uri: { fsPath } }) as const;

  it('validates workspace when .kanban2code exists', async () => {
    const root = path.join(tempDir, KANBAN_ROOT);
    await fs.mkdir(root, { recursive: true });

    const result = await validateWorkspace([mockFolder(tempDir)] as any);

    expect(result.status).toBe(ValidationStatus.Valid);
    expect(result.root).toBe(root);
  });

  it('returns missing status when no workspace folder', async () => {
    const result = await validateWorkspace([] as any);
    expect(result.status).toBe(ValidationStatus.Missing);
  });

  it('returns invalid status when .kanban2code is not a directory', async () => {
    const root = path.join(tempDir, KANBAN_ROOT);
    await fs.writeFile(root, 'not a directory');

    const result = await validateWorkspace([mockFolder(tempDir)] as any);
    expect(result.status).toBe(ValidationStatus.Invalid);
  });

  it('validates path safety and exclusions', () => {
    const root = path.join(tempDir, KANBAN_ROOT);

    const validPath = path.join(root, 'inbox', 'task.md');
    expect(validatePath(validPath, root)).toBe(ValidationStatus.Valid);
    expect(isExcludedPath(validPath, root)).toBe(false);

    const excluded = path.join(root, FOLDERS.templates, 'example.md');
    expect(isExcludedPath(excluded, root)).toBe(true);

    const forbidden = path.join(tempDir, 'outside', 'task.md');
    expect(validatePath(forbidden, root)).toBe(ValidationStatus.Forbidden);
  });

  it('guards writes to excluded directories', () => {
    const root = path.join(tempDir, KANBAN_ROOT);
    const excluded = path.join(root, FOLDERS.archive, 'task.md');

    expect(() => guardWrite(excluded, root)).toThrow();

    const allowed = path.join(root, 'inbox', 'task.md');
    expect(() => guardWrite(allowed, root)).not.toThrow();
  });
});
