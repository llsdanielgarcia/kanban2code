// @vitest-environment jsdom
import './setup-dom';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeAll, beforeEach } from 'vitest';
import { createEnvelope } from '../../src/webview/messaging';

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as any).acquireVsCodeApi = () => ({ postMessage: postMessageSpy });
});

beforeEach(() => {
  postMessageSpy.mockClear();
});

describe('useTaskData runner state', () => {
  test('exposes providers array and runner state', async () => {
    const { useTaskData } = await import('../../src/webview/ui/hooks/useTaskData');
    const { result } = renderHook(() => useTaskData());

    await waitFor(() => {
      expect(postMessageSpy).toHaveBeenCalledWith(createEnvelope('RequestState', {}));
    });

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: createEnvelope('InitState', {
            tasks: [],
            contexts: [],
            agents: [],
            providers: [{ id: 'coder', name: 'coder', description: 'Code provider', path: '_providers/coder.md' }],
            projects: [],
            phasesByProject: {},
            workspaceRoot: '/tmp/.kanban2code',
            context: 'board',
            isRunnerActive: false,
            activeRunnerTaskId: null,
          }),
        }),
      );
    });

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: createEnvelope('RunnerStateChanged', {
            isRunning: true,
            activeTaskId: 'task-9',
            activeStage: 'code',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.providers).toEqual([
        { id: 'coder', name: 'coder', description: 'Code provider', path: '_providers/coder.md' },
      ]);
      expect(result.current.isRunnerActive).toBe(true);
      expect(result.current.activeRunnerTaskId).toBe('task-9');
    });
  });
});
