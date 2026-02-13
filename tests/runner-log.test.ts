import { afterEach, describe, expect, test } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { RunnerLog } from '../src/runner/runner-log';

function fixedNowFactory(isoValues: string[]) {
  let index = 0;
  return () => {
    const value = isoValues[Math.min(index, isoValues.length - 1)];
    index += 1;
    return new Date(value);
  };
}

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  tempDirs.length = 0;
});

test('toMarkdown() generates valid markdown with correct headers', () => {
  const now = fixedNowFactory(['2026-02-11T02:30:00.000Z', '2026-02-11T02:40:00.000Z']);
  const log = new RunnerLog({ now });

  log.startRun();
  log.finishRun('completed');

  const markdown = log.toMarkdown();

  expect(markdown).toContain('# Night Shift Report');
  expect(markdown).toContain('## Summary');
  expect(markdown).toContain('| Metric | Value |');
  expect(markdown).toContain('## Tasks');
});

test('Summary counts match (completed, failed, crashed totals)', () => {
  const now = fixedNowFactory(['2026-02-11T02:30:00.000Z', '2026-02-11T03:00:00.000Z']);
  const log = new RunnerLog({ now });

  log.startRun();
  log.recordTask({ taskId: 'task-1', title: 'One', status: 'completed' });
  log.recordTask({ taskId: 'task-2', title: 'Two', status: 'failed' });
  log.recordTask({ taskId: 'task-3', title: 'Three', status: 'crashed' });
  log.finishRun('failed');

  const markdown = log.toMarkdown();

  expect(markdown).toContain('| Tasks processed | 3 |');
  expect(markdown).toContain('| Completed | 1 |');
  expect(markdown).toContain('| Failed | 1 |');
  expect(markdown).toContain('| Crashed | 1 |');
});

test('Per-task section includes all required fields', () => {
  const now = fixedNowFactory(['2026-02-11T02:30:00.000Z', '2026-02-11T02:40:00.000Z']);
  const log = new RunnerLog({ now });

  log.startRun();
  log.recordTask({
    taskId: 'task-a',
    title: 'Implement parser',
    status: 'completed',
    provider: 'coder -> auditor',
    agent: 'codex',
    tokensIn: 12450,
    tokensOut: 3200,
    durationMs: 492000,
    commit: 'abc1234',
    attempts: 1,
    error: undefined,
  });
  log.finishRun('completed');

  const markdown = log.toMarkdown();

  expect(markdown).toContain('### Implement parser');
  expect(markdown).toContain('- Task: task-a');
  expect(markdown).toContain('- Status: completed');
  expect(markdown).toContain('- Provider: coder -> auditor');
  expect(markdown).toContain('- Agent: codex');
  expect(markdown).toContain('- Tokens: 12,450 in / 3,200 out');
  expect(markdown).toContain('- Time: 8m 12s');
  expect(markdown).toContain('- Commit: abc1234');
  expect(markdown).toContain('- Attempts: 1');
  expect(markdown).toContain('- Error: -');
});

test('Handles zero-task run gracefully', async () => {
  const now = fixedNowFactory(['2026-02-11T02:30:00.000Z', '2026-02-11T02:35:00.000Z']);
  const log = new RunnerLog({ now });

  log.startRun();
  log.finishRun('stopped');

  const markdown = log.toMarkdown();
  expect(markdown).toContain('_No tasks were processed in this run._');

  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'kanban-runner-log-'));
  tempDirs.push(workspaceRoot);
  const savedPath = await log.save(workspaceRoot);

  expect(savedPath).toContain(path.join('.kanban2code', '_logs', 'run-'));
  const persisted = await fs.readFile(savedPath, 'utf-8');
  expect(persisted).toContain('# Night Shift Report');
});

test('getRunDirectoryName() returns expected format', () => {
  const now = fixedNowFactory(['2026-02-13T14:30:52.000Z']);
  const log = new RunnerLog({ now });
  log.startRun();
  expect(log.getRunDirectoryName()).toMatch(/^run-\d{8}-\d{6}$/);
});

test('toMarkdown() includes per-stage details when stages are provided', () => {
  const now = fixedNowFactory(['2026-02-11T02:30:00.000Z', '2026-02-11T02:40:00.000Z']);
  const log = new RunnerLog({ now });

  log.startRun();
  log.recordTask({
    taskId: 'task-x',
    title: 'Stage Test',
    status: 'failed',
    stages: [
      { stage: 'plan', stageTransition: 'code' },
      { stage: 'code', stageTransition: 'audit', filesChanged: ['src/a.ts'] },
      { stage: 'audit', auditRating: 4, auditVerdict: 'NEEDS_WORK', outputFile: 'task-x-audit.md' },
    ],
  });
  log.finishRun('failed');

  const md = log.toMarkdown();
  expect(md).toContain('**Stages:**');
  expect(md).toContain('rating=4');
  expect(md).toContain('verdict=NEEDS_WORK');
  expect(md).toContain('transition=code');
  expect(md).toContain('files=src/a.ts');
  expect(md).toContain('task-x-audit.md');
});

test('toMarkdown() omits stages section when no stages provided', () => {
  const now = fixedNowFactory(['2026-02-11T02:30:00.000Z', '2026-02-11T02:40:00.000Z']);
  const log = new RunnerLog({ now });

  log.startRun();
  log.recordTask({ taskId: 'task-y', title: 'No Stages', status: 'completed' });
  log.finishRun('completed');

  const md = log.toMarkdown();
  expect(md).not.toContain('**Stages:**');
});
