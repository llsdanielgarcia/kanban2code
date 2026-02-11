// @vitest-environment jsdom
import './setup-dom';
import React from 'react';
import { expect, test, vi, beforeAll, afterEach, describe } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import './setup-matchers';

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as any).acquireVsCodeApi = () => ({ postMessage: postMessageSpy });
});

afterEach(() => postMessageSpy.mockClear());
afterEach(() => cleanup());

describe('TaskCard', () => {
  test('calls onOpen when clicked', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const onOpen = vi.fn();
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Hello',
      stage: 'inbox',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={onOpen} />);

    screen.getByRole('button', { name: /open task hello/i }).click();
    expect(onOpen).toHaveBeenCalledWith(task);
  });

  test('displays title in card header', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 'task1.2-my-test-task',
      filePath: '/tmp/t1.md',
      title: 'My Test Task',
      stage: 'inbox',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    expect(screen.getByText('1.2 My Test Task')).toBeInTheDocument();
  });

  test('displays breadcrumb when project and phase exist', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'plan',
      project: 'auth-system',
      phase: 'phase-1',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    expect(screen.getByText('auth-system')).toBeInTheDocument();
    expect(screen.getByText('phase-1')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  test('displays tags with proper classes', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'inbox',
      tags: ['bug', 'mvp'],
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    const bugTag = screen.getByText('bug');
    const mvpTag = screen.getByText('mvp');
    expect(bugTag).toHaveClass('card-tag', 'bug');
    expect(mvpTag).toHaveClass('card-tag', 'mvp');
  });

  test('displays agent name in footer', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'code',
      agent: 'Ncode',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    expect(screen.getByText('Ncode')).toBeInTheDocument();
  });

  test('displays canonical agent name when agents lookup provided', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'code',
      agent: '05-⚙️coder',
      content: '',
    } as any;
    const agents = [
      { id: '04-📋planner', name: 'planner', description: '', path: '' },
      { id: '05-⚙️coder', name: 'coder', description: '', path: '' },
      { id: '06-✅auditor', name: 'auditor', description: '', path: '' },
    ];

    render(<TaskCard task={task} agents={agents} onOpen={vi.fn()} />);

    expect(screen.getByText('coder')).toBeInTheDocument();
  });

  test('displays raw agent id when not found in agents lookup', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'code',
      agent: 'custom-agent',
      content: '',
    } as any;
    const agents = [
      { id: '05-⚙️coder', name: 'coder', description: '', path: '' },
    ];

    render(<TaskCard task={task} agents={agents} onOpen={vi.fn()} />);

    expect(screen.getByText('custom-agent')).toBeInTheDocument();
  });

  test('displays "unassigned" when no agent', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'inbox',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    expect(screen.getByText('unassigned')).toBeInTheDocument();
  });

  test('calls onCopyXml when Copy XML button clicked', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const onCopyXml = vi.fn();
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'inbox',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} onCopyXml={onCopyXml} />);

    const copyBtn = screen.getByRole('button', { name: /copy xml/i });
    fireEvent.click(copyBtn);
    expect(onCopyXml).toHaveBeenCalledWith(task);
  });

  test('calls onEdit when Edit Task button clicked', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const onEdit = vi.fn();
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'inbox',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} onEdit={onEdit} />);

    const editBtn = screen.getByRole('button', { name: /edit task/i });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(task);
  });

  test('has completed styling for completed tasks', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Done Task',
      stage: 'completed',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    const card = screen.getByRole('button', { name: /open task done task/i });
    expect(card).toHaveClass('completed');
    expect(screen.getByText('Done Task')).toHaveClass('completed');
  });

  test('calls onDelete when Delete button clicked', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const onDelete = vi.fn();
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Delete Me',
      stage: 'inbox',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} onDelete={onDelete} />);

    const deleteBtn = screen.getByRole('button', { name: /delete task/i });
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(task);
  });

  test('card shows mode name when set', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'code',
      agent: 'opus',
      mode: 'coder',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    expect(screen.getByText('coder | opus')).toBeInTheDocument();
  });

  test('card shows agent only when mode is unset', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'code',
      agent: 'opus',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    expect(screen.getByText('opus')).toBeInTheDocument();
  });

  test('run button visible on plan/code/audit cards', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const onRunTask = vi.fn();

    for (const stage of ['plan', 'code', 'audit']) {
      cleanup();
      const task = {
        id: `t-${stage}`,
        filePath: '/tmp/t1.md',
        title: `${stage} task`,
        stage,
        content: '',
      } as any;

      render(<TaskCard task={task} onOpen={vi.fn()} onRunTask={onRunTask} />);

      const runBtn = screen.getByRole('button', { name: /run task/i });
      expect(runBtn).toBeInTheDocument();
    }
  });

  test('run button not visible on inbox/completed cards', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const onRunTask = vi.fn();

    for (const stage of ['inbox', 'completed']) {
      cleanup();
      const task = {
        id: `t-${stage}`,
        filePath: '/tmp/t1.md',
        title: `${stage} task`,
        stage,
        content: '',
      } as any;

      render(<TaskCard task={task} onOpen={vi.fn()} onRunTask={onRunTask} />);

      expect(screen.queryByRole('button', { name: /run task/i })).toBeNull();
    }
  });

  test('progress indicator shown when runner active on this task', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Running Task',
      stage: 'code',
      content: '',
    } as any;

    render(
      <TaskCard
        task={task}
        onOpen={vi.fn()}
        isRunnerActive={true}
        runningTaskId="t1"
      />,
    );

    // Card should have the running class for pulsing border
    const card = screen.getByRole('button', { name: /open task running task/i });
    expect(card).toHaveClass('running');

    // Spinner should be present
    expect(screen.getByLabelText('Runner active')).toBeInTheDocument();
  });

  test('no progress indicator when runner active on different task', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Not Running',
      stage: 'code',
      content: '',
    } as any;

    render(
      <TaskCard
        task={task}
        onOpen={vi.fn()}
        isRunnerActive={true}
        runningTaskId="t2"
      />,
    );

    const card = screen.getByRole('button', { name: /open task not running/i });
    expect(card).not.toHaveClass('running');
    expect(screen.queryByLabelText('Runner active')).toBeNull();
  });
});

