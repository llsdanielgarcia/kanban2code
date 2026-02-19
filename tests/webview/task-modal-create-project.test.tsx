// @vitest-environment jsdom
import './setup-dom';
import './setup-matchers';
import React, { act } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createEnvelope } from '../../src/webview/messaging';

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as any).acquireVsCodeApi = () => ({ postMessage: postMessageSpy });
});

afterEach(() => {
  postMessageSpy.mockClear();
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function dispatchMessage(data: unknown) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data }));
  });
}

function getLocationTypeButton(name: RegExp) {
  const buttons = screen.getAllByRole('button', { name });
  const match = buttons.find((button) => button.classList.contains('location-type-btn'));
  if (!match) {
    throw new Error(`Expected to find location type button matching ${name}`);
  }
  return match;
}

describe('TaskModal', () => {
  it('renders both agent and provider pickers', async () => {
    const { TaskModal } = await import('../../src/webview/ui/components/TaskModal');

    render(
      <TaskModal
        isOpen
        tasks={[] as any}
        projects={[]}
        phasesByProject={{}}
        contexts={[]}
        agents={[{ id: 'codex', name: 'Codex', description: 'Code model' }]}
        providers={[{ id: 'coder', name: 'Coder', description: 'Code provider', path: '_providers/coder.md' }]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
  });

  it('creates a project from LocationPicker and selects it', async () => {
    const { TaskModal } = await import('../../src/webview/ui/components/TaskModal');

    render(
      <TaskModal
        isOpen
        tasks={[] as any}
        projects={[]}
        phasesByProject={{}}
        contexts={[]}
        agents={[]}
        providers={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /create project/i })).not.toBeInTheDocument();

    fireEvent.click(getLocationTypeButton(/project/i));
    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    const dialog = screen.getByRole('dialog', { name: /create project/i });
    fireEvent.change(within(dialog).getByLabelText(/project name/i), { target: { value: 'My Project' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^create project$/i }));

    await waitFor(() => {
      const createProject = postMessageSpy.mock.calls.find((call) => (call[0] as any).type === 'CreateProject')?.[0] as any;
      expect(createProject).toBeTruthy();
      expect(createProject.payload).toEqual({ name: 'My Project', phases: undefined });
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^project$/i)).toHaveValue('my-project');
    });
  });

  it('posts CreateTask payload with selected provider and agent', async () => {
    const { TaskModal } = await import('../../src/webview/ui/components/TaskModal');

    render(
      <TaskModal
        isOpen
        tasks={[] as any}
        projects={[]}
        phasesByProject={{}}
        contexts={[]}
        agents={[{ id: 'codex', name: 'Codex', description: 'Code model' }]}
        providers={[{ id: 'coder', name: 'Coder', description: 'Code provider', path: '_providers/coder.md' }]}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New provider task' } });
    const agentSelect = screen.getByRole('option', { name: 'Codex' }).closest('select');
    const providerSelect = screen.getByRole('option', { name: 'Coder' }).closest('select');
    if (!agentSelect || !providerSelect) throw new Error('Expected provider and agent selects to be rendered');
    fireEvent.change(agentSelect, { target: { value: 'codex' } });
    fireEvent.change(providerSelect, { target: { value: 'coder' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      const createTask = postMessageSpy.mock.calls.find((call) => (call[0] as any).type === 'CreateTask')?.[0] as any;
      expect(createTask).toBeTruthy();
      expect(createTask.payload.agent).toBe('codex');
      expect(createTask.payload.provider).toBe('coder');
    });
  });

  it('inserts selected mention file and ignores stale FilesSearched responses', async () => {
    vi.useFakeTimers();
    const { TaskModal } = await import('../../src/webview/ui/components/TaskModal');

    render(
      <TaskModal
        isOpen
        tasks={[] as any}
        projects={[]}
        phasesByProject={{}}
        contexts={[]}
        agents={[]}
        providers={[]}
        onClose={vi.fn()}
      />,
    );

    const contentInput = screen.getByPlaceholderText(
      /task description or notes\.\.\. \(type @ to mention files\)/i,
    ) as HTMLTextAreaElement;

    fireEvent.change(contentInput, {
      target: { value: 'See @', selectionStart: 5, selectionEnd: 5 },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(160);
    });

    const searchRequest = postMessageSpy.mock.calls.find((call) => (call[0] as any).type === 'SearchFiles')?.[0] as any;
    expect(searchRequest).toBeTruthy();
    expect(searchRequest.payload.query).toBe('');
    vi.useRealTimers();

    dispatchMessage(
      createEnvelope('FilesSearched', { requestId: 'stale-request', files: ['src/stale.ts'] }),
    );
    expect(screen.queryByText('src/stale.ts')).not.toBeInTheDocument();

    dispatchMessage(
      createEnvelope('FilesSearched', {
        requestId: searchRequest.payload.requestId,
        files: ['src/real.ts'],
      }),
    );

    const suggestion = await screen.findByText('src/real.ts');
    fireEvent.click(suggestion);

    expect(contentInput.value).toBe('See src/real.ts');
  });
});
