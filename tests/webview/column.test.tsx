// @vitest-environment jsdom
import './setup-dom';
import React from 'react';
import { expect, test, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import './setup-matchers';

const tasks = [
  { id: '1', filePath: '/tmp/1.md', title: 'A', stage: 'plan', content: '' },
  { id: '2', filePath: '/tmp/2.md', title: 'B', stage: 'plan', content: '' },
] as any;

const noop = () => {};

test('Column renders tasks and count', async () => {
  const { Column } = await import('../../src/webview/ui/components/Column');

  render(
    <Column
      stage="plan"
      title="Plan"
      tasks={tasks}
      onMoveTask={noop}
      onOpenTask={noop}
    />,
  );

  expect(screen.getByText('Plan')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('A')).toBeInTheDocument();
  expect(screen.getByText('B')).toBeInTheDocument();
  cleanup();
});

test('Runner buttons render for plan/code/audit columns only', async () => {
  const { Column } = await import('../../src/webview/ui/components/Column');

  for (const stage of ['plan', 'code', 'audit'] as const) {
    render(
      <Column
        stage={stage}
        title={stage}
        tasks={[]}
        onMoveTask={noop}
        onOpenTask={noop}
      />,
    );

    expect(screen.getByLabelText('Run top task')).toBeInTheDocument();
    expect(screen.getByLabelText('Run column')).toBeInTheDocument();
    cleanup();
  }
});

test('Runner buttons NOT rendered for inbox/completed', async () => {
  const { Column } = await import('../../src/webview/ui/components/Column');

  for (const stage of ['inbox', 'completed'] as const) {
    render(
      <Column
        stage={stage}
        title={stage}
        tasks={[]}
        onMoveTask={noop}
        onOpenTask={noop}
      />,
    );

    expect(screen.queryByLabelText('Run top task')).toBeNull();
    expect(screen.queryByLabelText('Run column')).toBeNull();
    cleanup();
  }
});

test('Stop visible only when isRunnerActive is true', async () => {
  const { Column } = await import('../../src/webview/ui/components/Column');

  // Not active: stop button should not be present
  render(
    <Column
      stage="plan"
      title="Plan"
      tasks={[]}
      isRunnerActive={false}
      onMoveTask={noop}
      onOpenTask={noop}
    />,
  );
  expect(screen.queryByLabelText('Stop runner')).toBeNull();
  cleanup();

  // Active: stop button should be present
  render(
    <Column
      stage="plan"
      title="Plan"
      tasks={[]}
      isRunnerActive={true}
      onMoveTask={noop}
      onOpenTask={noop}
    />,
  );
  expect(screen.getByLabelText('Stop runner')).toBeInTheDocument();
  cleanup();
});

test('Play disabled when isRunnerActive is true', async () => {
  const { Column } = await import('../../src/webview/ui/components/Column');

  render(
    <Column
      stage="code"
      title="Code"
      tasks={[]}
      isRunnerActive={true}
      onMoveTask={noop}
      onOpenTask={noop}
    />,
  );

  expect(screen.getByLabelText('Run top task')).toBeDisabled();
  expect(screen.getByLabelText('Run column')).toBeDisabled();
  cleanup();
});

test('Clicking play fires onRunTopTask callback with correct stage', async () => {
  const { Column } = await import('../../src/webview/ui/components/Column');
  const onRunTopTask = vi.fn();

  render(
    <Column
      stage="audit"
      title="Audit"
      tasks={[]}
      onRunTopTask={onRunTopTask}
      onMoveTask={noop}
      onOpenTask={noop}
    />,
  );

  fireEvent.click(screen.getByLabelText('Run top task'));
  expect(onRunTopTask).toHaveBeenCalledWith('audit');
  cleanup();
});
