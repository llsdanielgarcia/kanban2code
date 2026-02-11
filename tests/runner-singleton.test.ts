import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Task } from '../src/types/task';

function makeTask(): Task {
  return {
    id: 'task-1',
    filePath: '/tmp/.kanban2code/inbox/task-1.md',
    title: 'Task One',
    stage: 'code',
    content: 'body',
  };
}

describe('runner singleton lifecycle', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('Runner singleton prevents parallel execution (second call rejected)', async () => {
    vi.doMock('../src/runner/runner-engine', async () => {
      const { EventEmitter } = await import('node:events');

      let resolveActive: ((value: { status: 'completed' }) => void) | null = null;

      class MockRunnerEngine extends EventEmitter {
        runTask = vi.fn(() => new Promise<{ status: 'completed' }>((resolve) => {
          resolveActive = resolve;
        }));

        runColumn = vi.fn(() => new Promise<{ status: 'completed' }>((resolve) => {
          resolveActive = resolve;
        }));

        stop = vi.fn(() => {
          // no-op
        });
      }

      return {
        RunnerEngine: MockRunnerEngine,
        __mock: {
          resolveActive: () => resolveActive?.({ status: 'completed' }),
        },
      };
    });

    const { WorkspaceState } = await import('../src/workspace/state');
    WorkspaceState.setKanbanRoot('/tmp/.kanban2code');

    const extension = await import('../src/extension');
    const runnerModule = await import('../src/runner/runner-engine') as unknown as {
      __mock: { resolveActive: () => void };
    };

    const firstRun = extension.runTaskWithRunner(makeTask());

    await expect(extension.runColumnWithRunner('code')).rejects.toThrow('Runner is already active');

    runnerModule.__mock.resolveActive();
    await expect(firstRun).resolves.toMatchObject({ status: 'completed' });
  });

  test('stopRunner cancels in-progress run', async () => {
    vi.doMock('../src/runner/runner-engine', async () => {
      const { EventEmitter } = await import('node:events');

      let resolveActive: ((value: { status: 'stopped' }) => void) | null = null;
      let lastInstance: MockRunnerEngine | null = null;

      class MockRunnerEngine extends EventEmitter {
        stopCalls = 0;

        constructor() {
          super();
          lastInstance = this;
        }

        runTask = vi.fn(() => new Promise<{ status: 'stopped' }>((resolve) => {
          resolveActive = resolve;
        }));

        runColumn = vi.fn(() => Promise.resolve({ status: 'completed' as const }));

        stop = vi.fn(() => {
          this.stopCalls += 1;
          resolveActive?.({ status: 'stopped' });
        });
      }

      return {
        RunnerEngine: MockRunnerEngine,
        __mock: {
          getLastInstance: () => lastInstance,
        },
      };
    });

    const { WorkspaceState } = await import('../src/workspace/state');
    WorkspaceState.setKanbanRoot('/tmp/.kanban2code');

    const extension = await import('../src/extension');
    const runnerModule = await import('../src/runner/runner-engine') as unknown as {
      __mock: { getLastInstance: () => { stopCalls: number } | null };
    };

    const runPromise = extension.runTaskWithRunner(makeTask());
    expect(extension.stopRunnerExecution()).toBe(true);

    await expect(runPromise).resolves.toMatchObject({ status: 'stopped' });

    const instance = runnerModule.__mock.getLastInstance();
    expect(instance?.stopCalls).toBe(1);

    expect(extension.stopRunnerExecution()).toBe(false);
  });
});
