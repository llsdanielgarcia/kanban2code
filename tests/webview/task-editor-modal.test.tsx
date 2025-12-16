// @vitest-environment jsdom
import './setup-dom';
import './setup-matchers';
import React, { act } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createEnvelope } from '../../src/webview/messaging';

vi.mock('@monaco-editor/loader', () => ({
  default: { config: vi.fn() },
}));

vi.mock('@monaco-editor/react', () => ({
  default: (props: { value: string; onChange?: (next: string) => void }) => (
    <textarea
      data-testid="monaco"
      value={props.value}
      onChange={(e) => props.onChange?.((e.target as HTMLTextAreaElement).value)}
    />
  ),
}));

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as any).acquireVsCodeApi = () => ({ postMessage: postMessageSpy });
});

afterEach(() => {
  postMessageSpy.mockClear();
  cleanup();
  vi.restoreAllMocks();
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

describe('TaskEditorModal', () => {
  it('requests full task data on open and populates UI on response', async () => {
    const { TaskEditorModal } = await import('../../src/webview/ui/components/TaskEditorModal');

    const onClose = vi.fn();
    const task = { id: 't1', title: 'Task 1', filePath: '/tmp/t1.md', stage: 'inbox', content: '' } as any;

    render(<TaskEditorModal isOpen task={task} onClose={onClose} />);

    await waitFor(() => {
      expect(postMessageSpy).toHaveBeenCalled();
    });

    const first = postMessageSpy.mock.calls[0]![0] as any;
    expect(first.type).toBe('RequestFullTaskData');
    expect(first.payload).toEqual({ taskId: 't1' });

    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'inbox' },
        agent: null,
        template: null,
        contexts: [],
        tags: [],
      },
      templates: [{ id: 'bug', name: 'Bug', description: 'Bug template' }],
      contexts: [],
      agents: [],
      projects: [],
      phasesByProject: {},
    }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Loaded Title')).toBeInTheDocument();
    });
  });

  it('syncs LocationPicker UI to loaded location value', async () => {
    const { TaskEditorModal } = await import('../../src/webview/ui/components/TaskEditorModal');

    render(
      <TaskEditorModal
        isOpen
        task={{ id: 't1', title: 'Task 1', filePath: '/tmp/t1.md', stage: 'inbox', content: '' } as any}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(postMessageSpy).toHaveBeenCalled());

    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'project', project: 'proj', phase: 'phase-1' },
        agent: null,
        template: null,
        contexts: [],
        tags: [],
      },
      templates: [],
      contexts: [],
      agents: [],
      projects: ['proj'],
      phasesByProject: { proj: ['phase-1'] },
    }));

    await screen.findByDisplayValue('Loaded Title');
    expect(getLocationTypeButton(/project/i)).toHaveClass('active');
  });

  it('creates a project from LocationPicker and selects it', async () => {
    const { TaskEditorModal } = await import('../../src/webview/ui/components/TaskEditorModal');

    render(
      <TaskEditorModal
        isOpen
        task={{ id: 't1', title: 'Task 1', filePath: '/tmp/t1.md', stage: 'inbox', content: '' } as any}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(postMessageSpy).toHaveBeenCalled());

    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'inbox' },
        agent: null,
        template: null,
        contexts: [],
        tags: [],
      },
      templates: [],
      contexts: [],
      agents: [],
      projects: [],
      phasesByProject: {},
    }));

    await screen.findByDisplayValue('Loaded Title');

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

  it('shows dirty indicator when metadata changes and confirms on cancel', async () => {
    const { TaskEditorModal } = await import('../../src/webview/ui/components/TaskEditorModal');

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onClose = vi.fn();
    const task = { id: 't1', title: 'Task 1', filePath: '/tmp/t1.md', stage: 'inbox', content: '' } as any;

    render(<TaskEditorModal isOpen task={task} onClose={onClose} />);

    await waitFor(() => expect(postMessageSpy).toHaveBeenCalled());

    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'inbox' },
        agent: null,
        template: null,
        contexts: [],
        tags: [],
      },
      templates: [],
      contexts: [],
      agents: [],
      projects: [],
      phasesByProject: {},
    }));

    const titleInput = await screen.findByDisplayValue('Loaded Title');
    fireEvent.change(titleInput, { target: { value: 'Changed Title' } });

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(confirmSpy).toHaveBeenCalledWith('Discard unsaved changes?');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('warns before applying template when content is non-empty', async () => {
    const { TaskEditorModal } = await import('../../src/webview/ui/components/TaskEditorModal');

    const task = { id: 't1', title: 'Task 1', filePath: '/tmp/t1.md', stage: 'inbox', content: '' } as any;

    render(<TaskEditorModal isOpen task={task} onClose={vi.fn()} />);

    await waitFor(() => expect(postMessageSpy).toHaveBeenCalled());

    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\nSome content\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'inbox' },
        agent: null,
        template: null,
        contexts: [],
        tags: [],
      },
      templates: [{ id: 'bug', name: 'Bug Report', description: 'Bug template' }],
      contexts: [],
      agents: [],
      projects: [],
      phasesByProject: {},
    }));

    const select = await screen.findByDisplayValue('No template');
    fireEvent.change(select, { target: { value: 'bug' } });

    expect(screen.getByText('Changing template will replace content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      const last = postMessageSpy.mock.calls.at(-1)![0] as any;
      expect(last.type).toBe('RequestTemplateContent');
      expect(last.payload).toEqual({ templateId: 'bug' });
    });
  });

  it('shows error when template content load fails', async () => {
    const { TaskEditorModal } = await import('../../src/webview/ui/components/TaskEditorModal');

    render(
      <TaskEditorModal
        isOpen
        task={{ id: 't1', title: 'Task 1', filePath: '/tmp/t1.md', stage: 'inbox', content: '' } as any}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => expect(postMessageSpy).toHaveBeenCalled());

    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\nSome content\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'inbox' },
        agent: null,
        template: null,
        contexts: [],
        tags: [],
      },
      templates: [{ id: 'bug', name: 'Bug Report', description: 'Bug template' }],
      contexts: [],
      agents: [],
      projects: [],
      phasesByProject: {},
    }));

    const select = await screen.findByDisplayValue('No template');
    fireEvent.change(select, { target: { value: 'bug' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    dispatchMessage(createEnvelope('TemplateContentLoadFailed', { templateId: 'bug', error: 'nope' }));

    await waitFor(() => {
      expect(screen.getByText('nope')).toBeInTheDocument();
    });
  });

  it('posts SaveTaskWithMetadata with current content and metadata', async () => {
    const { TaskEditorModal } = await import('../../src/webview/ui/components/TaskEditorModal');

    const task = { id: 't1', title: 'Task 1', filePath: '/tmp/t1.md', stage: 'inbox', content: '' } as any;

    render(<TaskEditorModal isOpen task={task} onClose={vi.fn()} />);

    await waitFor(() => expect(postMessageSpy).toHaveBeenCalled());

    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\nSome content\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'inbox' },
        agent: null,
        template: null,
        contexts: [],
        tags: [],
      },
      templates: [],
      contexts: [],
      agents: [],
      projects: [],
      phasesByProject: {},
    }));

    await screen.findByDisplayValue('Loaded Title');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const last = postMessageSpy.mock.calls.at(-1)![0] as any;
      expect(last.type).toBe('SaveTaskWithMetadata');
      expect(last.payload.taskId).toBe('t1');
      expect(last.payload.content).toContain('Some content');
      expect(last.payload.metadata.title).toBe('Loaded Title');
      expect(last.payload.metadata.location).toEqual({ type: 'inbox' });
    });
  });

  it('adds and removes tags via input', async () => {
    const { TaskEditorModal } = await import('../../src/webview/ui/components/TaskEditorModal');

    const task = { id: 't1', title: 'Task 1', filePath: '/tmp/t1.md', stage: 'inbox', content: '' } as any;

    render(<TaskEditorModal isOpen task={task} onClose={vi.fn()} />);

    await waitFor(() => expect(postMessageSpy).toHaveBeenCalled());

    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'inbox' },
        agent: null,
        template: null,
        contexts: [],
        tags: [],
      },
      templates: [],
      contexts: [],
      agents: [],
      projects: [],
      phasesByProject: {},
    }));

    const tagInput = await screen.findByPlaceholderText('Add tag...');
    fireEvent.change(tagInput, { target: { value: 'bug' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    expect(await screen.findByText('bug')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove tag bug' }));
    await waitFor(() => expect(screen.queryByText('bug')).not.toBeInTheDocument());
  });
});
