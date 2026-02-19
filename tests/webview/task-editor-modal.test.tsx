// @vitest-environment jsdom
import './setup-dom';
import './setup-matchers';
import React, { act } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createEnvelope } from '../../src/webview/messaging';

interface MonacoCompletionProvider {
  triggerCharacters?: string[];
  provideCompletionItems: (
    model: { getValueInRange: (range: unknown) => string },
    position: { lineNumber: number; column: number },
  ) => Promise<{
    suggestions: Array<{
      label: string;
      insertText: string;
      range: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
      };
    }>;
  }>;
}

const monacoMentionTestState = vi.hoisted(() => ({
  completionProvider: null as MonacoCompletionProvider | null,
}));

vi.mock('@monaco-editor/loader', () => ({
  default: { config: vi.fn() },
}));

vi.mock('@monaco-editor/react', () => ({
  default: (props: {
    value: string;
    onChange?: (next: string) => void;
    beforeMount?: (monaco: {
      editor: {
        defineTheme: (name: string, theme: unknown) => void;
      };
      languages: {
        CompletionItemKind: { File: number };
        registerCompletionItemProvider: (
          language: string,
          provider: MonacoCompletionProvider,
        ) => { dispose: () => void };
      };
    }) => void;
  }) => {
    props.beforeMount?.({
      editor: {
        defineTheme: vi.fn(),
      },
      languages: {
        CompletionItemKind: { File: 17 },
        registerCompletionItemProvider: (_language: string, provider: MonacoCompletionProvider) => {
          monacoMentionTestState.completionProvider = provider;
          return { dispose: vi.fn() };
        },
      },
    });
    return (
      <textarea
        data-testid="monaco"
        value={props.value}
        onChange={(e) => props.onChange?.((e.target as HTMLTextAreaElement).value)}
      />
    );
  },
}));

let postMessageSpy = vi.fn();

beforeAll(() => {
  (globalThis as any).acquireVsCodeApi = () => ({ postMessage: postMessageSpy });
});

afterEach(() => {
  postMessageSpy.mockClear();
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  monacoMentionTestState.completionProvider = null;
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

async function openEditorWithLoadedTask(content = '@'): Promise<void> {
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
    content,
    metadata: {
      title: 'Loaded Title',
      location: { type: 'inbox' },
      agent: null,
      provider: null,
      contexts: [],
      skills: [],
      tags: [],
    },
    contexts: [],
    skills: [],
    agents: [],
    projects: [],
    phasesByProject: {},
  }));
  await screen.findByDisplayValue('Loaded Title');
  await waitFor(() => {
    expect(monacoMentionTestState.completionProvider).not.toBeNull();
  });
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
    dispatchMessage(createEnvelope('FullTaskDataLoaded', {
      taskId: 't1',
      content: '---\nstage: inbox\n---\n\n# Title\n',
      metadata: {
        title: 'Loaded Title',
        location: { type: 'inbox' },
        agent: null,
        provider: null,
        contexts: [],
        skills: [],
        tags: [],
      },
      contexts: [],
      skills: [],
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
        provider: null,
        contexts: [],
        skills: [],
        tags: [],
      },
      contexts: [],
      skills: [],
      agents: [],
      projects: ['proj'],
      phasesByProject: { proj: ['phase-1'] },
    }));

    await screen.findByDisplayValue('Loaded Title');
    expect(getLocationTypeButton(/project/i)).toHaveClass('active');
  });

  it('renders both agent and provider pickers in metadata panel', async () => {
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
        provider: null,
        contexts: [],
        skills: [],
        tags: [],
      },
      contexts: [],
      skills: [],
      agents: [{ id: 'codex', name: 'Codex', description: 'Code model', path: '_agents/codex.md' }],
      providers: [{ id: 'coder', name: 'Coder', description: 'Code provider', path: '_providers/coder.md' }],
      projects: [],
      phasesByProject: {},
    }));

    await screen.findByDisplayValue('Loaded Title');
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
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
        provider: null,
        contexts: [],
        skills: [],
        tags: [],
      },
      contexts: [],
      skills: [],
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
        provider: null,
        contexts: [],
        skills: [],
        tags: [],
      },
      contexts: [],
      skills: [],
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

  it('posts SaveTaskWithMetadata with current content and provider/agent metadata', async () => {
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
        provider: null,
        contexts: [],
        skills: [],
        tags: [],
      },
      contexts: [],
      skills: [],
      agents: [{ id: 'codex', name: 'Codex', description: 'Code model', path: '_agents/codex.md' }],
      providers: [{ id: 'coder', name: 'Coder', description: 'Code provider', path: '_providers/coder.md' }],
      projects: [],
      phasesByProject: {},
    }));

    await screen.findByDisplayValue('Loaded Title');
    const agentSelect = screen.getByRole('option', { name: 'Codex' }).closest('select');
    const providerSelect = screen.getByRole('option', { name: 'Coder' }).closest('select');
    if (!agentSelect || !providerSelect) throw new Error('Expected provider and agent selects to be rendered');
    fireEvent.change(agentSelect, { target: { value: 'codex' } });
    fireEvent.change(providerSelect, { target: { value: 'coder' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const last = postMessageSpy.mock.calls.at(-1)![0] as any;
      expect(last.type).toBe('SaveTaskWithMetadata');
      expect(last.payload.taskId).toBe('t1');
      expect(last.payload.content).toContain('Some content');
      expect(last.payload.metadata.title).toBe('Loaded Title');
      expect(last.payload.metadata.location).toEqual({ type: 'inbox' });
      expect(last.payload.metadata.agent).toBe('codex');
      expect(last.payload.metadata.provider).toBe('coder');
    });
  });

  it('saves missing provider as null', async () => {
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
        contexts: [],
        skills: [],
        tags: [],
      },
      contexts: [],
      skills: [],
      agents: [],
      projects: [],
      phasesByProject: {},
    }));

    await screen.findByDisplayValue('Loaded Title');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const last = postMessageSpy.mock.calls.at(-1)![0] as any;
      expect(last.type).toBe('SaveTaskWithMetadata');
      expect(last.payload.metadata.provider).toBeNull();
    });
  });

  it('Monaco mention completion uses requestId correlation and replaces active @query range only', async () => {
    await openEditorWithLoadedTask('@');
    vi.useFakeTimers();
    postMessageSpy.mockClear();

    const provider = monacoMentionTestState.completionProvider;
    if (!provider) throw new Error('Expected Monaco completion provider to be registered');

    const completionPromise = provider.provideCompletionItems(
      { getValueInRange: () => '@' },
      { lineNumber: 1, column: 2 },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(160);
    });

    const searchCall = postMessageSpy.mock.calls.find((call) => (call[0] as any).type === 'SearchFiles')?.[0] as any;
    expect(searchCall).toBeTruthy();
    expect(searchCall.payload.query).toBe('');

    let resolved = false;
    void completionPromise.then(() => {
      resolved = true;
    });

    dispatchMessage(
      createEnvelope('FilesSearched', { requestId: 'stale-request', files: ['src/stale.ts'] }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(resolved).toBe(false);

    dispatchMessage(
      createEnvelope('FilesSearched', {
        requestId: searchCall.payload.requestId,
        files: ['src/real.ts'],
      }),
    );

    const completions = await completionPromise;
    expect(completions.suggestions).toEqual([
      expect.objectContaining({
        label: 'src/real.ts',
        insertText: 'src/real.ts',
        range: {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
        },
      }),
    ]);
  });

  it('Monaco mention completion ignores word-prefixed @ and queries with spaces', async () => {
    await openEditorWithLoadedTask('text');
    postMessageSpy.mockClear();

    const provider = monacoMentionTestState.completionProvider;
    if (!provider) throw new Error('Expected Monaco completion provider to be registered');

    const prefixedResult = await provider.provideCompletionItems(
      { getValueInRange: () => 'foo@bar' },
      { lineNumber: 1, column: 8 },
    );
    const spacedResult = await provider.provideCompletionItems(
      { getValueInRange: () => '@foo bar' },
      { lineNumber: 1, column: 9 },
    );

    expect(prefixedResult.suggestions).toEqual([]);
    expect(spacedResult.suggestions).toEqual([]);
    expect(postMessageSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SearchFiles' }),
    );
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
        provider: null,
        contexts: [],
        skills: [],
        tags: [],
      },
      contexts: [],
      skills: [],
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
