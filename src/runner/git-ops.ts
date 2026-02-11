import { spawn } from 'node:child_process';

interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

function normalizeTaskTitle(taskTitle: string): string {
  const normalized = taskTitle.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : 'untitled-task';
}

function runGitCommand(cwd: string, args: string[]): Promise<CommandResult> {
  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn('git', args, {
      cwd,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });
  });
}

/**
 * Returns true when the working tree has no pending tracked/untracked changes.
 */
export async function isWorkingTreeClean(cwd: string = process.cwd()): Promise<boolean> {
  const result = await runGitCommand(cwd, ['status', '--porcelain']);

  if (result.exitCode !== 0) {
    throw new Error(`Failed to check git status: ${result.stderr || result.stdout || 'unknown error'}`);
  }

  return result.stdout.trim().length === 0;
}

/**
 * Convenience inverse of `isWorkingTreeClean`.
 */
export async function hasUncommittedChanges(cwd: string = process.cwd()): Promise<boolean> {
  return !(await isWorkingTreeClean(cwd));
}

/**
 * Stages all changes, creates an auto runner commit, and returns the new commit hash.
 */
export async function commitRunnerChanges(
  taskTitle: string,
  cwd: string = process.cwd(),
): Promise<string> {
  const message = `feat(runner): ${normalizeTaskTitle(taskTitle)} [auto]`;

  const addResult = await runGitCommand(cwd, ['add', '-A']);
  if (addResult.exitCode !== 0) {
    throw new Error(`Failed to stage changes: ${addResult.stderr || addResult.stdout || 'unknown error'}`);
  }

  const commitResult = await runGitCommand(cwd, ['commit', '-m', message]);
  if (commitResult.exitCode !== 0) {
    throw new Error(`Failed to commit runner changes: ${commitResult.stderr || commitResult.stdout || 'unknown error'}`);
  }

  const hashResult = await runGitCommand(cwd, ['rev-parse', 'HEAD']);
  if (hashResult.exitCode !== 0) {
    throw new Error(`Failed to read commit hash: ${hashResult.stderr || hashResult.stdout || 'unknown error'}`);
  }

  const hash = hashResult.stdout.trim();
  if (!hash) {
    throw new Error('Failed to read commit hash: empty output');
  }

  return hash;
}
