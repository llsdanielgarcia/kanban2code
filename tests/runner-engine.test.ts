import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';
import matter from 'gray-matter';
import type { Task, Stage } from '../src/types/task';
import { parseTaskFile } from '../src/services/frontmatter';
import { RunnerEngine } from '../src/runner/runner-engine';

interface SpawnStep {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  delayMs?: number;
}

interface SpawnCall {
  command: string;
  args: string[];
  stdin: string;
  killCount: number;
}

function createSpawnQueue(steps: SpawnStep[]) {
  const calls: SpawnCall[] = [];

  const spawn = vi.fn((command: string, args: string[]) => {
    const step = steps.shift();
    if (!step) {
      throw new Error(`No queued spawn step for ${command} ${args.join(' ')}`);
    }

    const proc = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      stdin: { write: (chunk: string) => void; end: () => void };
      killed: boolean;
      kill: (signal?: string) => boolean;
    };

    let stdin = '';
    let killCount = 0;

    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.killed = false;
    proc.stdin = {
      write: (chunk: string) => {
        stdin += chunk;
      },
      end: () => {
        // no-op
      },
    };
    proc.kill = () => {
      killCount += 1;
      proc.killed = true;
      return true;
    };

    calls.push({
      command,
      args,
      stdin,
      killCount,
    });

    const delay = step.delayMs ?? 0;
    setTimeout(() => {
      if (step.stdout) {
        proc.stdout.emit('data', Buffer.from(step.stdout));
      }
      if (step.stderr) {
        proc.stderr.emit('data', Buffer.from(step.stderr));
      }
      proc.emit('close', step.exitCode ?? 0);

      const last = calls[calls.length - 1];
      last.stdin = stdin;
      last.killCount = killCount;
    }, delay);

    return proc;
  });

  return { spawn, calls };
}

function codexJsonlResult(text: string): string {
  return [
    JSON.stringify({ type: 'event.delta', delta: 'working' }),
    JSON.stringify({ type: 'event.final', result: text }),
  ].join('\n');
}

async function writeTask(filePath: string, stage: Stage): Promise<void> {
  const content = matter.stringify('# Example Task\n\nBody content.', {
    stage,
    tags: ['feature'],
    agent: 'codex',
  });

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

async function writeMode(kanbanRoot: string, id: string, stage: Stage): Promise<void> {
  const modePath = path.join(kanbanRoot, '_modes', `${id}.md`);
  await fs.mkdir(path.dirname(modePath), { recursive: true });
  await fs.writeFile(
    modePath,
    matter.stringify('mode instructions', {
      name: id,
      description: `${id} mode`,
      stage,
    }),
    'utf-8',
  );
}

async function writeCodexAgent(kanbanRoot: string): Promise<void> {
  const agentPath = path.join(kanbanRoot, '_agents', 'codex.md');
  await fs.mkdir(path.dirname(agentPath), { recursive: true });
  await fs.writeFile(
    agentPath,
    matter.stringify('', {
      cli: 'codex',
      subcommand: 'exec',
      model: 'gpt-5.3-codex',
      unattended_flags: ['--yolo'],
      output_flags: ['--json'],
      prompt_style: 'stdin',
      provider: 'openai',
    }),
    'utf-8',
  );
}

async function writeRunnerConfig(kanbanRoot: string): Promise<void> {
  const configPath = path.join(kanbanRoot, 'config.json');
  await fs.writeFile(
    configPath,
    JSON.stringify(
      {
        modeDefaults: {
          planner: 'codex',
          coder: 'codex',
          auditor: 'codex',
        },
        preferences: {
          defaultAgent: 'codex',
        },
      },
      null,
      2,
    ),
    'utf-8',
  );
}

describe('RunnerEngine', () => {
  let workspaceRoot: string;
  let kanbanRoot: string;

  beforeEach(async () => {
    workspaceRoot = path.join(os.tmpdir(), `kanban-runner-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    kanbanRoot = path.join(workspaceRoot, '.kanban2code');

    await fs.mkdir(path.join(kanbanRoot, 'inbox'), { recursive: true });
    await fs.mkdir(path.join(kanbanRoot, 'projects'), { recursive: true });

    await writeMode(kanbanRoot, 'planner', 'plan');
    await writeMode(kanbanRoot, 'coder', 'code');
    await writeMode(kanbanRoot, 'auditor', 'audit');
    await writeCodexAgent(kanbanRoot);
    await writeRunnerConfig(kanbanRoot);
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  test('Code-stage task runs coder mode then auditor mode', async () => {
    const taskPath = path.join(kanbanRoot, 'inbox', 'task-code.md');
    await writeTask(taskPath, 'code');
    const task = await parseTaskFile(taskPath);

    const queue = createSpawnQueue([
      { stdout: '', exitCode: 0 },
      { stdout: codexJsonlResult('Code stage done') },
      { stdout: codexJsonlResult('<!-- AUDIT_RATING: 8 -->\nLooks good') },
    ]);

    const engine = new RunnerEngine(kanbanRoot, { spawn: queue.spawn as never });
    const stages: string[] = [];
    engine.on('stageStarted', (event: { stage: string }) => stages.push(event.stage));

    const result = await engine.runTask(task);

    expect(result.status).toBe('completed');
    expect(stages).toEqual(['code', 'audit']);

    const persisted = await parseTaskFile(taskPath);
    expect(persisted.stage).toBe('completed');
    expect(persisted.mode).toBe('auditor');
    expect(persisted.agent).toBe('codex');

    expect(queue.calls[1].stdin).toContain('<runner automated="true" />');
  });

  test('Plan-stage task runs planner, coder, auditor in sequence', async () => {
    const taskPath = path.join(kanbanRoot, 'inbox', 'task-plan.md');
    await writeTask(taskPath, 'plan');
    const task = await parseTaskFile(taskPath);

    const queue = createSpawnQueue([
      { stdout: '', exitCode: 0 },
      { stdout: codexJsonlResult('Planning done') },
      { stdout: codexJsonlResult('Coding done') },
      { stdout: codexJsonlResult('<!-- AUDIT_RATING: 8 -->\nAccepted') },
    ]);

    const engine = new RunnerEngine(kanbanRoot, { spawn: queue.spawn as never });
    const stages: string[] = [];
    engine.on('stageStarted', (event: { stage: string }) => stages.push(event.stage));

    const result = await engine.runTask(task);

    expect(result.status).toBe('completed');
    expect(stages).toEqual(['plan', 'code', 'audit']);
  });

  test('Audit pass (8+) marks task completed', async () => {
    const taskPath = path.join(kanbanRoot, 'inbox', 'task-audit-pass.md');
    await writeTask(taskPath, 'audit');
    const task = await parseTaskFile(taskPath);

    const queue = createSpawnQueue([
      { stdout: '', exitCode: 0 },
      { stdout: codexJsonlResult('<!-- AUDIT_RATING: 9 -->\nGreat') },
    ]);

    const engine = new RunnerEngine(kanbanRoot, { spawn: queue.spawn as never });
    const result = await engine.runTask(task);

    expect(result.status).toBe('completed');
    const persisted = await parseTaskFile(taskPath);
    expect(persisted.stage).toBe('completed');
  });

  test('Audit fail (attempt 1) sends task back to code stage', async () => {
    const taskPath = path.join(kanbanRoot, 'inbox', 'task-audit-fail-1.md');
    await writeTask(taskPath, 'audit');
    const task = await parseTaskFile(taskPath);

    const queue = createSpawnQueue([
      { stdout: '', exitCode: 0 },
      { stdout: codexJsonlResult('<!-- AUDIT_RATING: 7 -->\nNeeds fixes') },
    ]);

    const engine = new RunnerEngine(kanbanRoot, { spawn: queue.spawn as never });
    const result = await engine.runTask(task);

    expect(result.status).toBe('failed');
    expect(result.hardStop).toBe(false);

    const persisted = await parseTaskFile(taskPath);
    expect(persisted.stage).toBe('code');
    expect(persisted.attempts).toBe(1);
  });

  test('Audit fail (attempt 2) stops runner entirely, leaves task in audit', async () => {
    const taskPath = path.join(kanbanRoot, 'inbox', 'task-audit-fail-2.md');
    await writeTask(taskPath, 'audit');

    const original = await parseTaskFile(taskPath);
    const withAttempt: Task = { ...original, attempts: 1 };
    const raw = await fs.readFile(taskPath, 'utf-8');
    await fs.writeFile(taskPath, matter.stringify(withAttempt.content, { ...matter(raw).data, attempts: 1 }), 'utf-8');

    const task = await parseTaskFile(taskPath);

    const queue = createSpawnQueue([
      { stdout: '', exitCode: 0 },
      { stdout: codexJsonlResult('<!-- AUDIT_RATING: 7 -->\nStill failing') },
    ]);

    const engine = new RunnerEngine(kanbanRoot, { spawn: queue.spawn as never });
    const result = await engine.runTask(task);

    expect(result.status).toBe('failed');
    expect(result.hardStop).toBe(true);

    const persisted = await parseTaskFile(taskPath);
    expect(persisted.stage).toBe('audit');
    expect(persisted.attempts).toBe(2);
  });

  test('CLI crash (exit code 1) stops runner immediately', async () => {
    const taskPath = path.join(kanbanRoot, 'inbox', 'task-crash.md');
    await writeTask(taskPath, 'code');
    const task = await parseTaskFile(taskPath);

    const queue = createSpawnQueue([
      { stdout: '', exitCode: 0 },
      { stderr: 'boom', exitCode: 1 },
    ]);

    const engine = new RunnerEngine(kanbanRoot, { spawn: queue.spawn as never });
    const result = await engine.runTask(task);

    expect(result.status).toBe('failed');
    expect(result.hardStop).toBe(true);

    // Git preflight + first stage only (no audit stage spawned)
    expect(queue.calls).toHaveLength(2);
  });

  test('stop() cancels execution before next stage', async () => {
    const taskPath = path.join(kanbanRoot, 'inbox', 'task-stop.md');
    await writeTask(taskPath, 'code');
    const task = await parseTaskFile(taskPath);

    const queue = createSpawnQueue([
      { stdout: '', exitCode: 0 },
      { stdout: codexJsonlResult('Code complete') },
    ]);

    const engine = new RunnerEngine(kanbanRoot, { spawn: queue.spawn as never });
    const started: string[] = [];

    engine.on('stageStarted', (event: { stage: string }) => {
      started.push(event.stage);
    });

    engine.on('stageCompleted', (event: { stage: string }) => {
      if (event.stage === 'code') {
        engine.stop();
      }
    });

    const result = await engine.runTask(task);

    expect(result.status).toBe('stopped');
    expect(started).toEqual(['code']);
  });
});
