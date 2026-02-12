import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createEnvelope } from '../src/webview/messaging';
import { WorkspaceState } from '../src/workspace/state';
import { setRunnerState } from '../src/runner/runner-state';

describe('webview host runner messaging', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    WorkspaceState.setKanbanRoot(null);
    setRunnerState({ isRunning: false });
  });

  test('RunTask message triggers runner command execution', async () => {
    const vscode = await import('vscode');
    const { KanbanPanel } = await import('../src/webview/KanbanPanel');

    await (KanbanPanel.prototype as any)._handleWebviewMessage.call(
      {},
      createEnvelope('RunTask', { taskId: 'task-1' }),
    );

    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('kanban2code.runTask', 'task-1');
  });

  test('SidebarProvider forwards runner state via RunnerStateChanged', async () => {
    const { SidebarProvider } = await import('../src/webview/SidebarProvider');
    const provider = new SidebarProvider({} as any);
    const postMessageSpy = vi.fn();

    (provider as any)._postMessage = postMessageSpy;
    setRunnerState({ isRunning: true, activeTaskId: 'task-2', activeStage: 'code' });

    await (provider as any)._sendInitialState();

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'RunnerStateChanged',
        payload: expect.objectContaining({
          isRunning: true,
          activeTaskId: 'task-2',
        }),
      }),
    );
  });
});
