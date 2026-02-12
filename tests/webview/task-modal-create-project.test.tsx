// @vitest-environment jsdom
import './setup-dom';
import './setup-matchers';
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as any).acquireVsCodeApi = () => ({ postMessage: postMessageSpy });
});

afterEach(() => {
  postMessageSpy.mockClear();
  cleanup();
  vi.restoreAllMocks();
});

function getLocationTypeButton(name: RegExp) {
  const buttons = screen.getAllByRole('button', { name });
  const match = buttons.find((button) => button.classList.contains('location-type-btn'));
  if (!match) {
    throw new Error(`Expected to find location type button matching ${name}`);
  }
  return match;
}

describe('TaskModal', () => {
  it('renders both agent and mode pickers', async () => {
    const { TaskModal } = await import('../../src/webview/ui/components/TaskModal');

    render(
      <TaskModal
        isOpen
        tasks={[] as any}
        projects={[]}
        phasesByProject={{}}
        contexts={[]}
        agents={[{ id: 'codex', name: 'Codex', description: 'Code model' }]}
        modes={[{ id: 'coder', name: 'Coder', description: 'Code mode', path: '_modes/coder.md' }]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Agent (LLM Provider)')).toBeInTheDocument();
    expect(screen.getByText('Mode (optional)')).toBeInTheDocument();
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
        modes={[]}
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

  it('posts CreateTask payload with selected mode and agent', async () => {
    const { TaskModal } = await import('../../src/webview/ui/components/TaskModal');

    render(
      <TaskModal
        isOpen
        tasks={[] as any}
        projects={[]}
        phasesByProject={{}}
        contexts={[]}
        agents={[{ id: 'codex', name: 'Codex', description: 'Code model' }]}
        modes={[{ id: 'coder', name: 'Coder', description: 'Code mode', path: '_modes/coder.md' }]}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New mode task' } });
    const agentSelect = screen.getByRole('option', { name: 'Codex' }).closest('select');
    const modeSelect = screen.getByRole('option', { name: 'Coder' }).closest('select');
    if (!agentSelect || !modeSelect) throw new Error('Expected mode and agent selects to be rendered');
    fireEvent.change(agentSelect, { target: { value: 'codex' } });
    fireEvent.change(modeSelect, { target: { value: 'coder' } });
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      const createTask = postMessageSpy.mock.calls.find((call) => (call[0] as any).type === 'CreateTask')?.[0] as any;
      expect(createTask).toBeTruthy();
      expect(createTask.payload.agent).toBe('codex');
      expect(createTask.payload.mode).toBe('coder');
    });
  });
});
