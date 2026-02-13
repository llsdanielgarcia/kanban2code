// @vitest-environment jsdom
import './setup-dom';
import React from 'react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import './setup-matchers';

const mockTasks = [
  {
    id: '1',
    filePath: '/tmp/1.md',
    title: 'Task 1',
    stage: 'inbox',
    content: 'hello',
    tags: ['bug'],
  },
  {
    id: '2',
    filePath: '/tmp/2.md',
    title: 'Task 2',
    stage: 'code',
    content: 'world',
    project: 'proj',
  },
];

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as any).acquireVsCodeApi = () => ({ postMessage: postMessageSpy });
});

afterEach(() => postMessageSpy.mockClear());
afterEach(() => cleanup());

test('Board renders columns layout by default', async () => {
  const { Board } = await import('../../src/webview/ui/components/Board');
  render(<Board hasKanban={true} />);

  // Simulate InitState from host
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          version: 1,
          type: 'InitState',
          payload: {
            context: 'board',
            hasKanban: true,
            tasks: mockTasks,
            workspaceRoot: '/tmp',
            filterState: { stages: ['inbox', 'plan', 'code', 'audit', 'completed'] },
          },
        },
      }),
    );
  });

  expect(await screen.findByText('Task 1')).toBeInTheDocument();
  expect(screen.getByText('Task 2')).toBeInTheDocument();
  expect(screen.getAllByLabelText(/column$/i).length).toBeGreaterThanOrEqual(5);
});

test('Board search filters tasks locally', async () => {
  const { Board } = await import('../../src/webview/ui/components/Board');
  render(<Board hasKanban={true} />);

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          version: 1,
          type: 'InitState',
          payload: {
            context: 'board',
            hasKanban: true,
            tasks: mockTasks,
            workspaceRoot: '/tmp',
            filterState: { stages: ['inbox', 'plan', 'code', 'audit', 'completed'] },
          },
        },
      }),
    );
  });

  const input = await screen.findByLabelText('Search tasks');
  await userEvent.type(input, 'Task 2');

  expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
  expect(screen.getByText('Task 2')).toBeInTheDocument();
});

test('Drop sends MoveTask message for allowed transition', async () => {
  const { Board } = await import('../../src/webview/ui/components/Board');
  render(<Board hasKanban={true} />);

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          version: 1,
          type: 'InitState',
          payload: {
            context: 'board',
            hasKanban: true,
            tasks: mockTasks,
            workspaceRoot: '/tmp',
            filterState: { stages: ['inbox', 'plan', 'code', 'audit', 'completed'] },
          },
        },
      }),
    );
  });

  // Create a fake drop on Plan column (allowed from inbox)
  const planColumn = await screen.findByLabelText('Plan column');
  const dataTransfer = {
    getData: () => JSON.stringify({ id: '1', stage: 'inbox' }),
    dropEffect: '',
    effectAllowed: '',
  } as unknown as DataTransfer;

  fireEvent.drop(planColumn, { dataTransfer });

  expect(postMessageSpy).toHaveBeenCalled();
  const sent = postMessageSpy.mock.calls.find((c) => c[0]?.type === 'MoveTask');
  expect(sent?.[0]?.payload).toMatchObject({ taskId: '1', toStage: 'plan' });
});

test('Delete button sends DeleteTask message', async () => {
  const { Board } = await import('../../src/webview/ui/components/Board');
  render(<Board hasKanban={true} />);

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          version: 1,
          type: 'InitState',
          payload: {
            context: 'board',
            hasKanban: true,
            tasks: mockTasks,
            workspaceRoot: '/tmp',
            filterState: { stages: ['inbox', 'plan', 'code', 'audit', 'completed'] },
          },
        },
      }),
    );
  });

  const taskCard = screen.getByText('Task 1').closest('.task-card');
  expect(taskCard).toBeTruthy();
  within(taskCard as HTMLElement).getByRole('button', { name: /delete task/i }).click();

  const sent = postMessageSpy.mock.calls.find((c) => c[0]?.type === 'DeleteTask');
  expect(sent?.[0]?.payload).toMatchObject({ taskId: '1' });
});

test('Board hides tasks from hidden projects', async () => {
  const { Board } = await import('../../src/webview/ui/components/Board');
  render(<Board hasKanban={true} />);

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          version: 1,
          type: 'InitState',
          payload: {
            context: 'board',
            hasKanban: true,
            tasks: mockTasks,
            workspaceRoot: '/tmp',
            filterState: {
              stages: ['inbox', 'plan', 'code', 'audit', 'completed'],
              hiddenProjects: ['proj'],
            },
          },
        },
      }),
    );
  });

  // Task 1 (no project) should be visible
  expect(await screen.findByText('Task 1')).toBeInTheDocument();
  // Task 2 (project: 'proj') should be hidden
  expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
});

test('Board shows inbox tasks even when all projects are hidden', async () => {
  const { Board } = await import('../../src/webview/ui/components/Board');
  render(<Board hasKanban={true} />);

  const tasksWithProjects = [
    ...mockTasks,
    {
      id: '3',
      filePath: '/tmp/3.md',
      title: 'Task 3',
      stage: 'plan',
      content: 'another',
      project: 'other-proj',
    },
  ];

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          version: 1,
          type: 'InitState',
          payload: {
            context: 'board',
            hasKanban: true,
            tasks: tasksWithProjects,
            workspaceRoot: '/tmp',
            filterState: {
              stages: ['inbox', 'plan', 'code', 'audit', 'completed'],
              hiddenProjects: ['proj', 'other-proj'],
            },
          },
        },
      }),
    );
  });

  // Task 1 (inbox, no project) should still be visible
  expect(await screen.findByText('Task 1')).toBeInTheDocument();
  // Task 2 and Task 3 (with projects) should be hidden
  expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
});

test('Runner controls in board column post RunTask and RunColumn messages', async () => {
  const { Board } = await import('../../src/webview/ui/components/Board');
  render(<Board hasKanban={true} />);

  const tasksWithPlanAndCode = [
    ...mockTasks,
    {
      id: '3',
      filePath: '/tmp/3.md',
      title: 'Task 3',
      stage: 'plan',
      content: 'plan me',
    },
  ];

  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          version: 1,
          type: 'InitState',
          payload: {
            context: 'board',
            hasKanban: true,
            tasks: tasksWithPlanAndCode,
            workspaceRoot: '/tmp',
            filterState: { stages: ['inbox', 'plan', 'code', 'audit', 'completed'] },
            isRunnerActive: false,
          },
        },
      }),
    );
  });

  const codeColumn = await screen.findByLabelText('Code column');
  within(codeColumn).getByRole('button', { name: 'Run top task' }).click();
  within(codeColumn).getByRole('button', { name: 'Run column' }).click();

  const runTaskMessage = postMessageSpy.mock.calls.find((c) => c[0]?.type === 'RunTask');
  expect(runTaskMessage?.[0]?.payload).toMatchObject({ taskId: '2' });

  const runColumnMessage = postMessageSpy.mock.calls.find((c) => c[0]?.type === 'RunColumn');
  expect(runColumnMessage?.[0]?.payload).toMatchObject({ stage: 'code' });
});
