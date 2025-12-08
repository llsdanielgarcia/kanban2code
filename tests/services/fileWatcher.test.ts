import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import { TaskFileWatcher, FileWatcherEvent } from '../../src/services/fileWatcher';

// Mock vscode API with lightweight event emitters
function createEmitter<T>() {
  const listeners = new Set<(value: T) => void>();
  return {
    on(listener: (value: T) => void) {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
    fire(value: T) {
      for (const listener of Array.from(listeners)) {
        listener(value);
      }
    },
    clear() {
      listeners.clear();
    },
  };
}

vi.mock(
  'vscode',
  () => {
  const watchers: any[] = [];
  const renameEmitter = createEmitter<any>();

  class MockFileSystemWatcher {
    private createEmitter = createEmitter<any>();
    private changeEmitter = createEmitter<any>();
    private deleteEmitter = createEmitter<any>();

    onDidCreate(listener: (uri: any) => void) {
      return this.createEmitter.on(listener);
    }
    onDidChange(listener: (uri: any) => void) {
      return this.changeEmitter.on(listener);
    }
    onDidDelete(listener: (uri: any) => void) {
      return this.deleteEmitter.on(listener);
    }

    fireCreate(uri: any) {
      this.createEmitter.fire(uri);
    }
    fireChange(uri: any) {
      this.changeEmitter.fire(uri);
    }
    fireDelete(uri: any) {
      this.deleteEmitter.fire(uri);
    }

    dispose() {}
  }

  const workspace = {
    workspaceFolders: [],
    createFileSystemWatcher: () => {
      const watcher = new MockFileSystemWatcher();
      watchers.push(watcher);
      return watcher;
    },
    onDidRenameFiles: (listener: (event: any) => void) => renameEmitter.on(listener),
  };

  const RelativePattern = class {
    constructor(public base: string, public pattern: string) {}
  };

  const Uri = {
    file: (fsPath: string) => ({ fsPath }),
  };

  return {
    workspace,
    RelativePattern,
    Uri,
    __watchers: watchers,
    __fireRename: renameEmitter.fire,
  };
  },
  { virtual: true },
);

// Helper to access mock internals
const getMocks = async () => {
  const vscode: any = await import('vscode');
  return vscode;
};

describe('TaskFileWatcher', () => {
  const root = '/root/.kanban2code';
  let watcher: TaskFileWatcher;

  beforeEach(() => {
    watcher = new TaskFileWatcher(root);
    watcher.start();
  });

  afterEach(async () => {
    watcher.dispose();
    const vscode: any = await getMocks();
    vscode.__watchers.length = 0;
    vscode.__fireRename({ files: [] });
  });

  it('emits create/update/delete events with debounce flush', async () => {
    const events: any[] = [];
    watcher.subscribe((payload) => events.push(payload));

    const vscode: any = await getMocks();
    const fsWatcher = vscode.__watchers[0];

    fsWatcher.fireCreate({ fsPath: path.join(root, 'inbox/task.md') });
    fsWatcher.fireChange({ fsPath: path.join(root, 'inbox/task.md') });

    watcher.flush();

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe(FileWatcherEvent.Updated);
    expect(events[0].filePath).toContain('inbox/task.md');
  });

  it('ignores excluded directories and underscore files', async () => {
    const events: any[] = [];
    watcher.subscribe((payload) => events.push(payload));

    const vscode: any = await getMocks();
    const fsWatcher = vscode.__watchers[0];

    fsWatcher.fireCreate({ fsPath: path.join(root, '_templates', 'example.md') });
    fsWatcher.fireCreate({ fsPath: path.join(root, 'inbox', '_hidden.md') });

    watcher.flush();
    expect(events).toHaveLength(0);
  });

  it('emits moved event with old and new paths on rename', async () => {
    const events: any[] = [];
    watcher.subscribe((payload) => events.push(payload));

    const vscode: any = await getMocks();
    vscode.__fireRename({
      files: [
        {
          oldUri: { fsPath: path.join(root, 'inbox', 'old.md') },
          newUri: { fsPath: path.join(root, 'inbox', 'new.md') },
        },
      ],
    });

    watcher.flush();

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe(FileWatcherEvent.Moved);
    expect(events[0].oldPath).toContain('old.md');
    expect(events[0].filePath).toContain('new.md');
  });

  it('treats rename into ignored folder as deletion', async () => {
    const events: any[] = [];
    watcher.subscribe((payload) => events.push(payload));

    const vscode: any = await getMocks();
    vscode.__fireRename({
      files: [
        {
          oldUri: { fsPath: path.join(root, 'inbox', 'task.md') },
          newUri: { fsPath: path.join(root, '_archive', 'task.md') },
        },
      ],
    });

    watcher.flush();

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe(FileWatcherEvent.Deleted);
    expect(events[0].filePath).toContain('inbox/task.md');
  });
});
