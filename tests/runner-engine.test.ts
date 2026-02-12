import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { EventEmitter } from 'events';
import { RunnerEngine } from '../src/runner/runner-engine';
import { Task } from '../src/types/task';
import * as fs from 'node:fs/promises';

// Mocks
vi.mock('node:fs/promises');
vi.mock('../src/services/frontmatter');
vi.mock('../src/services/scanner');
vi.mock('../src/services/prompt-builder');
vi.mock('../src/services/provider-service');
vi.mock('../src/services/stage-manager');
vi.mock('../src/runner/adapter-factory');

// Import mocked modules to setup implementation
import { parseTaskFile, stringifyTaskFile } from '../src/services/frontmatter';
import { loadAllTasks, getOrderedTasksForStage } from '../src/services/scanner';
import { buildRunnerPrompt } from '../src/services/prompt-builder';
import { resolveProviderConfig } from '../src/services/provider-service';
import { getDefaultAgentForStage, getDefaultProviderForAgent } from '../src/services/stage-manager';
import { getAdapterForCli } from '../src/runner/adapter-factory';

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = { write: vi.fn(), end: vi.fn() };
  killed = false;
  kill = vi.fn(() => { this.killed = true; });
}

describe('RunnerEngine', () => {
  let runner: RunnerEngine;
  let mockSpawn: Mock;
  let activeProcess: MockChildProcess;
  const kanbanRoot = '/mock/root';

  const mockTask: Task = {
    id: 'task-1',
    filePath: '/mock/root/task-1.md',
    title: 'Test Task',
    stage: 'plan',
    content: 'Initial content',
    provider: 'opus',
    agent: 'codex',
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockSpawn = vi.fn().mockImplementation(() => {
      activeProcess = new MockChildProcess();
      // Auto-close successfully by default after a tick, unless we want to control it manually
      // strictly speaking, the runner awaits the process.
      // We'll let the test driver control the process emission.
      return activeProcess;
    });

    runner = new RunnerEngine(kanbanRoot, { spawn: mockSpawn });

    // Default mock implementations
    (parseTaskFile as Mock).mockResolvedValue({ ...mockTask });
    (stringifyTaskFile as Mock).mockReturnValue('serialized-content');
    (fs.readFile as Mock).mockResolvedValue('original-file-content');
    (fs.writeFile as Mock).mockResolvedValue(undefined);
    (buildRunnerPrompt as Mock).mockResolvedValue({
      xmlPrompt: '<xml>prompt</xml>',
      agentInstructions: 'Task instructions',
    });
    (resolveProviderConfig as Mock).mockResolvedValue({
      cli: 'mock-cli',
      safety: { max_turns: 5 },
    });
    (getAdapterForCli as Mock).mockReturnValue({
      buildCommand: () => ({ command: 'echo', args: ['hello'], stdin: '' }),
      parseResponse: (stdout: string) => ({ success: true, result: stdout }),
    });
    (getDefaultAgentForStage as Mock).mockResolvedValue('default-agent');
    (getDefaultProviderForAgent as Mock).mockReturnValue('default-provider');
    (getOrderedTasksForStage as Mock).mockReturnValue([mockTask]);
    (loadAllTasks as Mock).mockResolvedValue([mockTask]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to drive the process
  async function completeProcess(stdout: string, exitCode = 0) {
    if (!activeProcess) throw new Error('No active process to complete');
    
    // Defer to allow listeners to attach
    await new Promise(resolve => setTimeout(resolve, 0));
    
    activeProcess.stdout.emit('data', stdout);
    activeProcess.emit('close', exitCode);
  }

  it('Pipeline: Plan -> Code -> Audit (Success)', async () => {
    const task = { ...mockTask, stage: 'plan' } as Task;
    (parseTaskFile as Mock).mockResolvedValue(task);

    // Default agent/provider setup for transitions
    (getDefaultAgentForStage as Mock).mockImplementation((root, stage) => {
      if (stage === 'plan') return 'planner';
      if (stage === 'code') return 'coder';
      if (stage === 'audit') return 'auditor';
    });

    const runPromise = runner.runTask(task);

    // 1. Git Check
    await completeProcess(''); // git status clean

    // 2. Plan Stage
    await completeProcess('Plan done. <!-- STAGE_TRANSITION: code -->');

    // 3. Code Stage
    await completeProcess('Code done. <!-- STAGE_TRANSITION: audit --> <!-- FILES_CHANGED: src/foo.ts -->');

    // 4. Audit Stage
    await completeProcess('Audit passed. <!-- AUDIT_RATING: 9 -->');

    const result = await runPromise;

    expect(result.status).toBe('completed');
    expect(fs.writeFile).toHaveBeenCalledTimes(4); // 3 stages (plan, code, audit) setTaskStageProviderAgent calls + 1 persistTask(completed)
    
    // Verifications
    expect(parseTaskFile).toHaveBeenCalledWith(task.filePath);
    expect(resolveProviderConfig).toHaveBeenCalledTimes(3);
    expect(
      (resolveProviderConfig as Mock).mock.calls.every(
        ([rootArg, providerArg]) => rootArg === kanbanRoot && providerArg === 'default-provider',
      ),
    ).toBe(true);
  });

  it('Audit Fail (Attempt 1) -> Back to Code', async () => {
    const task = { ...mockTask, stage: 'audit', attempts: 0 } as Task;
    (parseTaskFile as Mock).mockResolvedValue(task);
    (getDefaultAgentForStage as Mock).mockResolvedValue('auditor');

    const runPromise = runner.runTask(task);
    
    // Git check
    await completeProcess('');

    // Audit Stage -> Fail
    // Returns hardStop: false, so runTask returns status: 'failed' but hardStop: false
    await completeProcess('Audit failed. <!-- AUDIT_RATING: 4 -->');

    const result = await runPromise;

    expect(result.status).toBe('failed');
    expect(result.hardStop).toBe(false);
    expect(result.error).toContain('Audit failed');

    // Verify task updated to code stage
    // Last write should set stage: code, attempts: 1
    const lastWriteCall = (fs.writeFile as Mock).mock.calls.at(-1);

    expect(stringifyTaskFile).toHaveBeenLastCalledWith(
      expect.objectContaining({ stage: 'code', attempts: 1 }),
      expect.anything()
    );
  });

  it('Audit Fail (Attempt 2) -> Hard Stop', async () => {
    const task = { ...mockTask, stage: 'audit', attempts: 1 } as Task;
    (parseTaskFile as Mock).mockResolvedValue(task);
    
    const runPromise = runner.runTask(task);
    await completeProcess(''); // git
    await completeProcess('Audit failed again. <!-- AUDIT_RATING: 3 -->');

    const result = await runPromise;

    expect(result.status).toBe('failed');
    expect(result.hardStop).toBe(true);
    expect(stringifyTaskFile).toHaveBeenLastCalledWith(
      expect.objectContaining({ stage: 'audit', attempts: 2 }),
      expect.anything()
    );
  });

  it('CLI Crash -> Hard Stop', async () => {
    const runPromise = runner.runTask(mockTask);
    await completeProcess(''); // git
    await completeProcess('Segmentation fault', 1); // Exit 1

    const result = await runPromise;

    expect(result.status).toBe('failed');
    expect(result.hardStop).toBe(true);
    expect(result.error).toContain('CLI crash');
  });

  it('Stop() cancels execution', async () => {
    const runPromise = runner.runTask(mockTask);
    await completeProcess(''); // git

    // Wait for the Plan stage to spawn
    await vi.waitUntil(() => mockSpawn.mock.calls.length === 2);

    // Trigger stop while Plan stage is running
    runner.stop();
    
    // Complete the current process (Plan)
    await completeProcess('Plan done.');

    const result = await runPromise;
    expect(result.status).toBe('stopped');
    
    // Should NOT have run next stage (Code)
    // resolveProviderConfig is called once for Plan
    expect(resolveProviderConfig).toHaveBeenCalledTimes(1);
    // Writes: 1 for plan update
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('Refuses to run if git dirty', async () => {
    const runPromise = runner.runTask(mockTask);
    
    // Git check returns output
    await completeProcess(' M src/file.ts');

    const result = await runPromise;
    expect(result.status).toBe('failed');
    expect(result.error).toContain('git working tree is dirty');
  });

  it('falls back to global default provider when stage mapping is missing', async () => {
    const task = { ...mockTask, stage: 'audit', provider: undefined } as Task;
    (parseTaskFile as Mock).mockResolvedValue(task);
    (getDefaultProviderForAgent as Mock).mockReturnValue(undefined);

    const runPromise = runner.runTask(task);
    await completeProcess(''); // git
    await completeProcess('Audit passed. <!-- AUDIT_RATING: 9 -->');

    const result = await runPromise;
    expect(result.status).toBe('completed');
    expect(resolveProviderConfig).toHaveBeenCalledWith(kanbanRoot, 'codex');
  });
});
