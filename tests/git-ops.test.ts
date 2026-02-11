import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  commitRunnerChanges,
  hasUncommittedChanges,
  isWorkingTreeClean,
} from '../src/runner/git-ops';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf-8' }).trim();
}

async function createRepo(): Promise<string> {
  const repoPath = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban-git-ops-'));

  git(repoPath, 'init');
  git(repoPath, 'config', 'user.email', 'runner@example.com');
  git(repoPath, 'config', 'user.name', 'Runner Bot');

  await fs.writeFile(path.join(repoPath, 'README.md'), '# temp repo\n', 'utf-8');
  git(repoPath, 'add', '-A');
  git(repoPath, 'commit', '-m', 'chore: init');

  return repoPath;
}

describe('git-ops', () => {
  let repoPath: string;

  beforeEach(async () => {
    repoPath = await createRepo();
  });

  afterEach(async () => {
    await fs.rm(repoPath, { recursive: true, force: true });
  });

  test('Commit message follows format feat(runner): {title} [auto]', async () => {
    await fs.writeFile(path.join(repoPath, 'task.txt'), 'new content\n', 'utf-8');

    await commitRunnerChanges('Implement runner log', repoPath);

    const subject = git(repoPath, 'log', '-1', '--pretty=%s');
    expect(subject).toBe('feat(runner): Implement runner log [auto]');
  });

  test('isWorkingTreeClean returns true when no pending changes', async () => {
    await expect(isWorkingTreeClean(repoPath)).resolves.toBe(true);
    await expect(hasUncommittedChanges(repoPath)).resolves.toBe(false);
  });

  test('Returns commit hash string on success', async () => {
    await fs.writeFile(path.join(repoPath, 'file.ts'), 'export const x = 1;\n', 'utf-8');

    const hash = await commitRunnerChanges('Add file', repoPath);

    expect(hash).toMatch(/^[a-f0-9]{40}$/);
    expect(hash).toBe(git(repoPath, 'rev-parse', 'HEAD'));
  });
});
