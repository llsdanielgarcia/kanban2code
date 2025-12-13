// @vitest-environment jsdom
import './setup-dom';
import React from 'react';
import { expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import './setup-matchers';

test('Column renders tasks and count', async () => {
  const { Column } = await import('../../src/webview/ui/components/Column');
  const tasks = [
    { id: '1', filePath: '/tmp/1.md', title: 'A', stage: 'plan', content: '' },
    { id: '2', filePath: '/tmp/2.md', title: 'B', stage: 'plan', content: '' },
  ] as any;

  render(
    <Column
      stage="plan"
      title="Plan"
      tasks={tasks}
      onMoveTask={() => {}}
      onOpenTask={() => {}}
    />,
  );

  expect(screen.getByText('Plan')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('A')).toBeInTheDocument();
  expect(screen.getByText('B')).toBeInTheDocument();
  cleanup();
});
