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
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'My Test Task',
      stage: 'inbox',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} />);

    expect(screen.getByText('My Test Task')).toBeInTheDocument();
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

  test('calls onOpenFile when Open File button clicked', async () => {
    const { TaskCard } = await import('../../src/webview/ui/components/TaskCard');
    const onOpenFile = vi.fn();
    const task = {
      id: 't1',
      filePath: '/tmp/t1.md',
      title: 'Task',
      stage: 'inbox',
      content: '',
    } as any;

    render(<TaskCard task={task} onOpen={vi.fn()} onOpenFile={onOpenFile} />);

    const openFileBtn = screen.getByRole('button', { name: /open file/i });
    fireEvent.click(openFileBtn);
    expect(onOpenFile).toHaveBeenCalledWith(task);
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
});
