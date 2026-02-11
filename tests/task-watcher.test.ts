import { describe, expect, test, vi, beforeEach } from 'vitest';
import { TaskWatcher, FileSystemWatcherLike } from '../src/services/task-watcher';

class FakeWatcher implements FileSystemWatcherLike {
  createListeners: Array<(uri: string) => void> = [];
  changeListeners: Array<(uri: string) => void> = [];
  deleteListeners: Array<(uri: string) => void> = [];
  disposed = false;

  onDidCreate(listener: (uri: string) => void) {
    this.createListeners.push(listener);
  }
  onDidChange(listener: (uri: string) => void) {
    this.changeListeners.push(listener);
  }
  onDidDelete(listener: (uri: string) => void) {
    this.deleteListeners.push(listener);
  }
  dispose() {
    this.disposed = true;
  }
}

describe('TaskWatcher', () => {
  const root = '/tmp/.kanban2code';
  let fake: FakeWatcher;

  beforeEach(() => {
    fake = new FakeWatcher();
  });

  function createWatcher() {
    const watcher = new TaskWatcher(root, {
      debounceMs: 10,
      watcherFactory: () => fake,
    });
    watcher.start();
    return watcher;
  }

  test('emits debounced update events', async () => {
    const watcher = createWatcher();
    const handler = vi.fn();
    watcher.on('event', handler);

    fake.changeListeners.forEach((fn) => fn('/tmp/.kanban2code/inbox/t1.md'));
    fake.changeListeners.forEach((fn) => fn('/tmp/.kanban2code/inbox/t1.md'));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: 'updated', path: '/tmp/.kanban2code/inbox/t1.md' });
    watcher.dispose();
  });

  test('emits created when a new task file appears', async () => {
    const watcher = createWatcher();
    const handler = vi.fn();
    watcher.on('event', handler);

    fake.createListeners.forEach((fn) => fn('/tmp/.kanban2code/inbox/ai-created.md'));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(handler).toHaveBeenCalledWith({ type: 'created', path: '/tmp/.kanban2code/inbox/ai-created.md' });
    watcher.dispose();
  });

  test('ignores _context files', async () => {
    const watcher = createWatcher();
    const handler = vi.fn();
    watcher.on('event', handler);

    fake.createListeners.forEach((fn) => fn('/tmp/.kanban2code/projects/x/_context.md'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(handler).not.toHaveBeenCalled();
    watcher.dispose();
  });

  test('emits moved when delete followed by create quickly', async () => {
    const watcher = createWatcher();
    const handler = vi.fn();
    watcher.on('event', handler);

    fake.deleteListeners.forEach((fn) => fn('/tmp/.kanban2code/inbox/old.md'));
    fake.createListeners.forEach((fn) => fn('/tmp/.kanban2code/inbox/new.md'));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(handler).toHaveBeenCalledWith({ type: 'moved', from: '/tmp/.kanban2code/inbox/old.md', to: '/tmp/.kanban2code/inbox/new.md' });
    watcher.dispose();
  });

  test('ignores _modes/ files', async () => {
    const watcher = createWatcher();
    const handler = vi.fn();
    watcher.on('event', handler);

    fake.changeListeners.forEach((fn) => fn('/tmp/.kanban2code/_modes/coder.md'));
    fake.createListeners.forEach((fn) => fn('/tmp/.kanban2code/_modes/auditor.md'));
    fake.deleteListeners.forEach((fn) => fn('/tmp/.kanban2code/_modes/planner.md'));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(handler).not.toHaveBeenCalled();
    watcher.dispose();
  });

  test('ignores _agents/ files', async () => {
    const watcher = createWatcher();
    const handler = vi.fn();
    watcher.on('event', handler);

    fake.changeListeners.forEach((fn) => fn('/tmp/.kanban2code/_agents/opus.md'));
    fake.createListeners.forEach((fn) => fn('/tmp/.kanban2code/_agents/codex.md'));
    fake.deleteListeners.forEach((fn) => fn('/tmp/.kanban2code/_agents/kimi.md'));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(handler).not.toHaveBeenCalled();
    watcher.dispose();
  });
});
