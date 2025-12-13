import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { WorkspaceState } from '../src/workspace/state';

vi.mock('../src/services/scanner', () => ({
  findTaskById: vi.fn(),
  loadAllTasks: vi.fn(),
}));

describe('task-content service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    WorkspaceState.setKanbanRoot('/test/.kanban2code');
  });

  test('loadTaskContentById throws when kanban root is not set', async () => {
    WorkspaceState.setKanbanRoot(null);
    const { loadTaskContentById } = await import('../src/services/task-content');
    await expect(loadTaskContentById('task-1')).rejects.toThrow('Kanban workspace not detected.');
  });

  test('loadTaskContentById throws when task is not found', async () => {
    const { findTaskById } = await import('../src/services/scanner');
    vi.mocked(findTaskById).mockResolvedValue(null);

    const { loadTaskContentById } = await import('../src/services/task-content');
    await expect(loadTaskContentById('missing')).rejects.toThrow('Task not found.');
  });

  test('loadTaskContentById reads full file content', async () => {
    const { findTaskById } = await import('../src/services/scanner');
    vi.mocked(findTaskById).mockResolvedValue({
      id: 'task-1',
      title: 'Test Task',
      filePath: '/test/.kanban2code/inbox/task-1.md',
      stage: 'inbox',
      content: '',
    });

    vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(new TextEncoder().encode('---\nstage: inbox\n---\n\n# Test'));

    const { loadTaskContentById } = await import('../src/services/task-content');
    const result = await loadTaskContentById('task-1');

    expect(result.content).toContain('stage: inbox');
    expect(vscode.workspace.fs.readFile).toHaveBeenCalled();
  });

  test('saveTaskContentById rejects invalid stage and does not write file', async () => {
    const { findTaskById } = await import('../src/services/scanner');
    vi.mocked(findTaskById).mockResolvedValue({
      id: 'task-1',
      title: 'Test Task',
      filePath: '/test/.kanban2code/inbox/task-1.md',
      stage: 'inbox',
      content: '',
    });

    const { saveTaskContentById } = await import('../src/services/task-content');
    await expect(saveTaskContentById('task-1', '---\nstage: no\n---\n\n# Test')).rejects.toThrow(
      /Invalid frontmatter: "stage"/,
    );
    expect(vscode.workspace.fs.writeFile).not.toHaveBeenCalled();
  });

  test('saveTaskContentById writes file and returns updated tasks', async () => {
    const { findTaskById, loadAllTasks } = await import('../src/services/scanner');
    vi.mocked(findTaskById).mockResolvedValue({
      id: 'task-1',
      title: 'Test Task',
      filePath: '/test/.kanban2code/inbox/task-1.md',
      stage: 'inbox',
      content: '',
    });

    vi.mocked(vscode.workspace.fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(loadAllTasks).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Test Task',
        filePath: '/test/.kanban2code/inbox/task-1.md',
        stage: 'inbox',
        content: '',
      },
    ]);

    const { saveTaskContentById } = await import('../src/services/task-content');
    const tasks = await saveTaskContentById('task-1', '---\nstage: inbox\n---\n\n# Test');

    expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
    expect(tasks).toHaveLength(1);
  });
});

