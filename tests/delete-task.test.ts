/**
 * Tests for delete-task service
 * Phase 6.0: Fix Delete Button in Board View
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { WorkspaceState } from '../src/workspace/state';

// Mock the scanner module
vi.mock('../src/services/scanner', () => ({
  findTaskById: vi.fn(),
  loadAllTasks: vi.fn(),
}));

describe('deleteTaskById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    WorkspaceState.setKanbanRoot('/test/.kanban2code');
  });

  test('returns null when kanban root is not set', async () => {
    WorkspaceState.setKanbanRoot(null);

    const { deleteTaskById } = await import('../src/services/delete-task');
    const result = await deleteTaskById('task-1');

    expect(result).toBeNull();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'Kanban workspace not detected.'
    );
  });

  test('returns null when taskId is empty', async () => {
    const { deleteTaskById } = await import('../src/services/delete-task');
    const result = await deleteTaskById('');

    expect(result).toBeNull();
  });

  test('returns null when task is not found', async () => {
    const { findTaskById } = await import('../src/services/scanner');
    vi.mocked(findTaskById).mockResolvedValue(null);

    const { deleteTaskById } = await import('../src/services/delete-task');
    const result = await deleteTaskById('nonexistent-task');

    expect(result).toBeNull();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Task not found.');
  });

  test('returns null when user cancels confirmation', async () => {
    const { findTaskById, loadAllTasks } = await import('../src/services/scanner');
    vi.mocked(findTaskById).mockResolvedValue({
      id: 'task-1',
      title: 'Test Task',
      filePath: '/test/.kanban2code/inbox/test-task.md',
      stage: 'inbox',
      content: '',
    });
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined);

    const { deleteTaskById } = await import('../src/services/delete-task');
    const result = await deleteTaskById('task-1');

    expect(result).toBeNull();
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'Delete task "Test Task"?',
      { modal: true },
      'Delete'
    );
    expect(vscode.workspace.fs.delete).not.toHaveBeenCalled();
    expect(loadAllTasks).not.toHaveBeenCalled();
  });

  test('deletes task file and returns updated task list when confirmed', async () => {
    const { findTaskById, loadAllTasks } = await import('../src/services/scanner');
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      filePath: '/test/.kanban2code/inbox/test-task.md',
      stage: 'inbox' as const,
      content: '',
    };
    const updatedTasks = [
      { id: 'task-2', title: 'Other Task', filePath: '/test/.kanban2code/inbox/other.md', stage: 'inbox' as const, content: '' },
    ];

    vi.mocked(findTaskById).mockResolvedValue(mockTask);
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Delete' as any);
    vi.mocked(vscode.workspace.fs.delete).mockResolvedValue(undefined);
    vi.mocked(loadAllTasks).mockResolvedValue(updatedTasks);

    const { deleteTaskById } = await import('../src/services/delete-task');
    const result = await deleteTaskById('task-1');

    expect(vscode.workspace.fs.delete).toHaveBeenCalled();
    expect(loadAllTasks).toHaveBeenCalledWith('/test/.kanban2code');
    expect(result).toEqual(updatedTasks);
  });

  test('shows error message when file deletion fails', async () => {
    const { findTaskById } = await import('../src/services/scanner');
    const mockTask = {
      id: 'task-1',
      title: 'Test Task',
      filePath: '/test/.kanban2code/inbox/test-task.md',
      stage: 'inbox' as const,
      content: '',
    };

    vi.mocked(findTaskById).mockResolvedValue(mockTask);
    vi.mocked(vscode.window.showWarningMessage).mockResolvedValue('Delete' as any);
    vi.mocked(vscode.workspace.fs.delete).mockRejectedValue(new Error('Permission denied'));

    const { deleteTaskById } = await import('../src/services/delete-task');
    const result = await deleteTaskById('task-1');

    expect(result).toBeNull();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'Failed to delete task: Permission denied'
    );
  });
});
