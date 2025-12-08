/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { Task } from '../../../src/types/task';

// Use vi.hoisted to make mocks available in vi.mock factories
const { mockPostMessageToHost, mockCreateTaskCreateMessage } = vi.hoisted(() => ({
  mockPostMessageToHost: vi.fn(),
  mockCreateTaskCreateMessage: vi.fn((title: string, options: Record<string, unknown>) => ({
    type: 'task:create',
    payload: { title, ...options },
  })),
}));

vi.mock('../../../src/webview/stores/taskStore', () => ({
  useTaskStore: vi.fn((selector: (state: unknown) => unknown) => {
    const state = {
      tasks: [],
      filters: { search: '', project: null, tags: [], stages: [] },
      loading: false,
      error: null,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
  selectProjects: vi.fn(() => ['project-a', 'project-b']),
  selectPhases: vi.fn(() => ['phase-1', 'phase-2']),
}));

vi.mock('../../../src/webview/messaging/protocol', () => ({
  postMessageToHost: mockPostMessageToHost,
  createTaskCreateMessage: mockCreateTaskCreateMessage,
}));

// Import after mocks
import { TaskModal } from '../../../src/webview/components/TaskModal';

describe('TaskModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockPostMessageToHost.mockClear();
    mockCreateTaskCreateMessage.mockClear();
    mockOnClose.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('regular task creation', () => {
    it('should render title "New Task" for regular creation', () => {
      const { getByText } = render(<TaskModal onClose={mockOnClose} />);
      expect(getByText('New Task')).toBeInTheDocument();
    });

    it('should show location section for regular tasks', () => {
      const { getByText } = render(<TaskModal onClose={mockOnClose} />);
      expect(getByText('Location')).toBeInTheDocument();
    });

    it('should show stage selection for regular tasks', () => {
      const { getByText } = render(<TaskModal onClose={mockOnClose} />);
      expect(getByText('Stage')).toBeInTheDocument();
      expect(getByText('Plan')).toBeInTheDocument();
      expect(getByText('Code')).toBeInTheDocument();
    });

    it('should create task with entered title', async () => {
      const { getByPlaceholderText, getByText } = render(<TaskModal onClose={mockOnClose} />);

      // Enter title
      const titleInput = getByPlaceholderText('What needs to be done?');
      fireEvent.change(titleInput, { target: { value: 'New Test Task' } });

      // Submit
      fireEvent.click(getByText('Create Task'));

      await waitFor(() => {
        expect(mockCreateTaskCreateMessage).toHaveBeenCalledWith(
          'New Test Task',
          expect.any(Object),
        );
      });
    });
  });

  describe('follow-up task creation', () => {
    const parentTask: Task = {
      id: 'parent-task-1',
      filePath: '/path/to/parent.md',
      title: 'Parent Task',
      stage: 'code',
      project: 'project-a',
      phase: 'phase-1',
      tags: ['feature', 'mvp'],
      agent: 'claude',
      content: 'Parent content',
    };

    it('should render title "Add Follow-up" for follow-up creation', () => {
      const { getByText } = render(<TaskModal onClose={mockOnClose} parentTask={parentTask} />);
      expect(getByText('Add Follow-up')).toBeInTheDocument();
    });

    it('should show parent task info', () => {
      const { getByText } = render(<TaskModal onClose={mockOnClose} parentTask={parentTask} />);
      expect(getByText('Follow-up to:')).toBeInTheDocument();
      expect(getByText('Parent Task')).toBeInTheDocument();
    });

    it('should NOT show location label for follow-ups (enforced inbox)', () => {
      const { queryByText } = render(<TaskModal onClose={mockOnClose} parentTask={parentTask} />);
      const locationLabel = queryByText('Location');
      expect(locationLabel).toBeNull();
    });

    it('should NOT show stage selection label for follow-ups (enforced inbox)', () => {
      const { queryAllByText } = render(<TaskModal onClose={mockOnClose} parentTask={parentTask} />);
      const stageLabels = queryAllByText('Stage');
      expect(stageLabels.length).toBe(0);
    });

    it('should inherit tags from parent', () => {
      const { getByDisplayValue } = render(<TaskModal onClose={mockOnClose} parentTask={parentTask} />);
      expect(getByDisplayValue('feature, mvp')).toBeInTheDocument();
    });

    it('should inherit agent from parent', () => {
      const { getByDisplayValue } = render(<TaskModal onClose={mockOnClose} parentTask={parentTask} />);
      expect(getByDisplayValue('claude')).toBeInTheDocument();
    });

    it('should create follow-up with parent reference and inbox stage', async () => {
      const { getByPlaceholderText, getByText } = render(
        <TaskModal onClose={mockOnClose} parentTask={parentTask} />,
      );

      const titleInput = getByPlaceholderText('What needs to be done?');
      fireEvent.change(titleInput, { target: { value: 'Follow-up Task' } });

      fireEvent.click(getByText('Create Follow-up'));

      await waitFor(() => {
        expect(mockCreateTaskCreateMessage).toHaveBeenCalledWith(
          'Follow-up Task',
          expect.objectContaining({
            stage: 'inbox',
            parent: 'parent-task-1',
          }),
        );
      });
    });

    it('should NOT include project/phase for follow-ups', async () => {
      const { getByPlaceholderText, getByText } = render(
        <TaskModal onClose={mockOnClose} parentTask={parentTask} />,
      );

      const titleInput = getByPlaceholderText('What needs to be done?');
      fireEvent.change(titleInput, { target: { value: 'Follow-up Task' } });

      fireEvent.click(getByText('Create Follow-up'));

      await waitFor(() => {
        expect(mockCreateTaskCreateMessage).toHaveBeenCalledWith(
          'Follow-up Task',
          expect.objectContaining({
            project: undefined,
            phase: undefined,
          }),
        );
      });
    });
  });

  describe('form validation', () => {
    it('should disable submit button when title is empty', () => {
      const { getByText } = render(<TaskModal onClose={mockOnClose} />);
      const submitButton = getByText('Create Task');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when title is entered', () => {
      const { getByText, getByPlaceholderText } = render(<TaskModal onClose={mockOnClose} />);

      const titleInput = getByPlaceholderText('What needs to be done?');
      fireEvent.change(titleInput, { target: { value: 'My Task' } });

      const submitButton = getByText('Create Task');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('modal interactions', () => {
    it('should close on Cancel click', () => {
      const { getByText } = render(<TaskModal onClose={mockOnClose} />);
      fireEvent.click(getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close on Escape key', () => {
      render(<TaskModal onClose={mockOnClose} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
