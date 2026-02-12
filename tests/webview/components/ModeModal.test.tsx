// @vitest-environment jsdom
import '../setup-dom';
import '../setup-matchers';
import React from 'react';
import { describe, expect, it, vi, beforeAll, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as unknown as { acquireVsCodeApi?: () => { postMessage: (message: unknown) => void } }).acquireVsCodeApi =
    () => ({ postMessage: postMessageSpy });
});

afterEach(() => {
  postMessageSpy.mockClear();
});

describe('ModeModal', () => {
  it('renders all form fields', async () => {
    const { ModeModal } = await import('../../../src/webview/ui/components/ModeModal');

    render(<ModeModal isOpen onClose={vi.fn()} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument();
  });

  it('validates required fields before submit', async () => {
    const { ModeModal } = await import('../../../src/webview/ui/components/ModeModal');

    render(<ModeModal isOpen onClose={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /create mode/i });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'coder' } });
    fireEvent.click(submitButton);
    expect(postMessageSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Implements tasks in code stage' },
    });
    fireEvent.click(submitButton);

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CreateMode',
        payload: expect.objectContaining({
          name: 'coder',
          description: 'Implements tasks in code stage',
        }),
      }),
    );
  });

  it('edit mode pre-populates fields from existing mode', async () => {
    const { ModeModal } = await import('../../../src/webview/ui/components/ModeModal');

    render(
      <ModeModal
        isOpen
        onClose={vi.fn()}
        mode={{
          id: 'coder',
          name: 'coder',
          description: 'Initial description',
          stage: 'code',
          instructions: '# Instructions\n\nBe concise.',
        }}
      />,
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('coder');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Initial description');
    expect(screen.getByLabelText(/stage/i)).toHaveValue('code');
    expect(screen.getByLabelText(/instructions/i)).toHaveValue('# Instructions\n\nBe concise.');

    fireEvent.click(screen.getByRole('button', { name: /save mode/i }));

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UpdateMode',
        payload: expect.objectContaining({
          modeId: 'coder',
          name: 'coder',
          description: 'Initial description',
          stage: 'code',
          content: '# Instructions\n\nBe concise.',
        }),
      }),
    );
  });
});
