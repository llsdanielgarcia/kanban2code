// @vitest-environment jsdom
import '../setup-dom';
import '../setup-matchers';
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Task, Stage } from '../../../src/types/task';

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as unknown as { acquireVsCodeApi?: () => { postMessage: (message: unknown) => void } }).acquireVsCodeApi =
    () => ({ postMessage: postMessageSpy });
});

afterEach(() => {
  postMessageSpy.mockClear();
  cleanup();
});

function makeTask(stage: Stage): Task {
  return {
    id: `task-${stage}`,
    filePath: '/tmp/task.md',
    title: `Task ${stage}`,
    stage,
    content: 'Task body',
    tags: ['feature'],
  };
}

describe('TaskContextMenu', () => {
  it('shows Run Task action for plan/code/audit tasks', async () => {
    const { TaskContextMenu } = await import('../../../src/webview/ui/components/TaskContextMenu');

    for (const stage of ['plan', 'code', 'audit'] as const) {
      cleanup();
      render(
        <TaskContextMenu
          task={makeTask(stage)}
          position={{ x: 16, y: 16 }}
          onClose={vi.fn()}
        />,
      );

      expect(screen.getByRole('menuitem', { name: /run task/i })).toBeInTheDocument();
    }
  });

  it('disables Run Task action when runner is active', async () => {
    const { TaskContextMenu } = await import('../../../src/webview/ui/components/TaskContextMenu');

    render(
      <TaskContextMenu
        task={makeTask('code')}
        isRunnerActive={true}
        position={{ x: 16, y: 16 }}
        onClose={vi.fn()}
      />,
    );

    const runTaskButton = screen.getByRole('menuitem', { name: /run task/i });
    expect(runTaskButton).toBeDisabled();

    fireEvent.click(runTaskButton);
    expect(postMessageSpy).not.toHaveBeenCalled();
  });

  it('lists all available providers in Change Provider submenu', async () => {
    const { TaskContextMenu } = await import('../../../src/webview/ui/components/TaskContextMenu');

    render(
      <TaskContextMenu
        task={makeTask('code')}
        providers={[
          { id: 'planner', name: 'Planner', description: 'Plan', path: '_providers/planner.md', stage: 'plan' },
          { id: 'coder', name: 'Coder', description: 'Code', path: '_providers/coder.md', stage: 'code' },
          { id: 'auditor', name: 'Auditor', description: 'Audit', path: '_providers/auditor.md', stage: 'audit' },
        ]}
        position={{ x: 16, y: 16 }}
        onClose={vi.fn()}
      />,
    );

    fireEvent.mouseEnter(screen.getByRole('menuitem', { name: /change provider/i }));

    expect(screen.getByRole('menuitem', { name: 'Planner' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Coder' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Auditor' })).toBeInTheDocument();
  });

  it('lists all available providers in Change Agent submenu', async () => {
    const { TaskContextMenu } = await import('../../../src/webview/ui/components/TaskContextMenu');

    render(
      <TaskContextMenu
        task={makeTask('code')}
        agents={[
          { id: 'codex', name: 'Codex', description: 'OpenAI Codex', path: '_agents/codex.md' },
          { id: 'claude', name: 'Claude', description: 'Anthropic Claude', path: '_agents/claude.md' },
          { id: 'kimi', name: 'KIMI', description: 'Moonshot KIMI', path: '_agents/kimi.md' },
        ]}
        position={{ x: 16, y: 16 }}
        onClose={vi.fn()}
      />,
    );

    fireEvent.mouseEnter(screen.getByRole('menuitem', { name: /change agent/i }));

    expect(screen.getByRole('menuitem', { name: 'Codex' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Claude' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'KIMI' })).toBeInTheDocument();
  });

  it('shows no-agents placeholder in Change Agent submenu when empty', async () => {
    const { TaskContextMenu } = await import('../../../src/webview/ui/components/TaskContextMenu');

    render(
      <TaskContextMenu
        task={makeTask('code')}
        agents={[]}
        position={{ x: 16, y: 16 }}
        onClose={vi.fn()}
      />,
    );

    fireEvent.mouseEnter(screen.getByRole('menuitem', { name: /change agent/i }));
    expect(screen.getByRole('menuitem', { name: /no agents available/i })).toBeInTheDocument();
  });
});
