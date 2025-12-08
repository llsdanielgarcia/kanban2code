/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { TaskCard, type TaskCardProps } from '../../../src/webview/components/TaskCard';
import { useUIStore } from '../../../src/webview/stores/uiStore';
import { useTaskStore } from '../../../src/webview/stores/taskStore';
import type { Task } from '../../../src/types/task';

const mockTask: Task = {
  id: 'task-1',
  filePath: '/path/to/task.md',
  title: 'Test Task',
  stage: 'code',
  project: 'test-project',
  phase: 'phase-1',
  tags: ['bug', 'mvp', 'urgent'],
  content: 'Task content here',
};

const inboxTask: Task = {
  id: 'task-2',
  filePath: '/path/to/inbox-task.md',
  title: 'Inbox Task',
  stage: 'inbox',
  content: 'Inbox task content',
};

const defaultProps: TaskCardProps = {
  task: mockTask,
  isDragging: false,
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onContextMenu: vi.fn(),
  onFollowUp: vi.fn(),
};

describe('TaskCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores
    useUIStore.setState({ selectedTaskId: null });
    useTaskStore.setState({ tasks: [mockTask, inboxTask] });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render task title', () => {
      const { getByText } = render(<TaskCard {...defaultProps} />);
      expect(getByText('Test Task')).toBeInTheDocument();
    });

    it('should render project and phase crumb', () => {
      const { getByText } = render(<TaskCard {...defaultProps} />);
      expect(getByText('test-project › phase-1')).toBeInTheDocument();
    });

    it('should render "Inbox" for tasks without project', () => {
      const { container } = render(<TaskCard {...defaultProps} task={inboxTask} />);
      const locationElement = container.querySelector('.task-card__location');
      expect(locationElement).toHaveTextContent('Inbox');
    });

    it('should render tags (max 3)', () => {
      const { getByText } = render(<TaskCard {...defaultProps} />);
      expect(getByText('bug')).toBeInTheDocument();
      expect(getByText('mvp')).toBeInTheDocument();
      expect(getByText('urgent')).toBeInTheDocument();
    });

    it('should show +N for extra tags', () => {
      const taskWithManyTags = {
        ...mockTask,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };
      const { getByText } = render(<TaskCard {...defaultProps} task={taskWithManyTags} />);
      expect(getByText('+2')).toBeInTheDocument();
    });

    it('should render stage pill with correct label', () => {
      const { getByText } = render(<TaskCard {...defaultProps} />);
      expect(getByText('Code')).toBeInTheDocument();
    });

    it('should apply dragging class when isDragging is true', () => {
      const { container } = render(<TaskCard {...defaultProps} isDragging={true} />);
      expect(container.querySelector('.task-card--dragging')).toBeInTheDocument();
    });

    it('should apply selected class when task is selected', () => {
      useUIStore.setState({ selectedTaskId: 'task-1' });
      const { container } = render(<TaskCard {...defaultProps} />);
      expect(container.querySelector('.task-card--selected')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call selectTask on click', () => {
      const { container } = render(<TaskCard {...defaultProps} />);
      const card = container.querySelector('.task-card');
      fireEvent.click(card!);
      expect(useUIStore.getState().selectedTaskId).toBe('task-1');
    });

    it('should call onContextMenu on right click', () => {
      const onContextMenu = vi.fn();
      const { container } = render(<TaskCard {...defaultProps} onContextMenu={onContextMenu} />);
      const card = container.querySelector('.task-card');
      fireEvent.contextMenu(card!, { clientX: 100, clientY: 200 });
      expect(onContextMenu).toHaveBeenCalled();
    });

    it('should call onDragStart when dragging starts', () => {
      const onDragStart = vi.fn();
      const { container } = render(<TaskCard {...defaultProps} onDragStart={onDragStart} />);
      const card = container.querySelector('.task-card');
      fireEvent.dragStart(card!);
      expect(onDragStart).toHaveBeenCalled();
    });

    it('should call onDragEnd when dragging ends', () => {
      const onDragEnd = vi.fn();
      const { container } = render(<TaskCard {...defaultProps} onDragEnd={onDragEnd} />);
      const card = container.querySelector('.task-card');
      fireEvent.dragEnd(card!);
      expect(onDragEnd).toHaveBeenCalled();
    });
  });

  describe('hover actions', () => {
    it('should show actions on hover', () => {
      const { getByTitle } = render(<TaskCard {...defaultProps} />);
      // Actions should exist in DOM (displayed via CSS on hover)
      expect(getByTitle('Copy XML (C)')).toBeInTheDocument();
      expect(getByTitle('Open (Enter)')).toBeInTheDocument();
      expect(getByTitle('More actions')).toBeInTheDocument();
    });

    it('should call onFollowUp when follow-up button is clicked', () => {
      const onFollowUp = vi.fn();
      const { getByTitle } = render(<TaskCard {...defaultProps} onFollowUp={onFollowUp} />);
      fireEvent.click(getByTitle('Add Follow-up'));
      expect(onFollowUp).toHaveBeenCalled();
    });
  });

  describe('follow-up indicator', () => {
    it('should show follow-up count when task has children', () => {
      const childTask: Task = {
        id: 'child-1',
        filePath: '/path/to/child.md',
        title: 'Child Task',
        stage: 'inbox',
        parent: 'task-1',
        content: 'Child content',
      };
      useTaskStore.setState({ tasks: [mockTask, childTask] });
      const { getByTitle } = render(<TaskCard {...defaultProps} />);
      expect(getByTitle('1 follow-up(s)')).toBeInTheDocument();
    });

    it('should not show follow-up indicator when no children', () => {
      const { queryByTitle } = render(<TaskCard {...defaultProps} />);
      expect(queryByTitle(/follow-up/)).not.toBeInTheDocument();
    });
  });

  describe('type tags', () => {
    it('should style type-like tags differently', () => {
      const { container } = render(<TaskCard {...defaultProps} />);
      const bugTag = container.querySelector('.task-card__tag--type');
      expect(bugTag).toBeInTheDocument();
      expect(bugTag?.textContent).toBe('bug');
    });
  });

  describe('accessibility', () => {
    it('should have proper tabIndex', () => {
      const { container } = render(<TaskCard {...defaultProps} />);
      const card = container.querySelector('.task-card');
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('should have role button', () => {
      const { container } = render(<TaskCard {...defaultProps} />);
      const card = container.querySelector('.task-card');
      expect(card).toHaveAttribute('role', 'button');
    });

    it('should have data-task-id attribute', () => {
      const { container } = render(<TaskCard {...defaultProps} />);
      const card = container.querySelector('.task-card');
      expect(card).toHaveAttribute('data-task-id', 'task-1');
    });
  });
});
