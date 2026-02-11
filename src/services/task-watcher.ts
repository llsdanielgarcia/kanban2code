import { EventEmitter } from 'events';
import * as path from 'path';
import { AGENTS_FOLDER, KANBAN_FOLDER, MODES_FOLDER } from '../core/constants';

export type TaskWatcherEvent =
  | { type: 'created' | 'updated' | 'deleted'; path: string }
  | { type: 'moved'; from: string; to: string };

export interface FileSystemWatcherLike {
  onDidCreate: (listener: (uri: string) => void) => void;
  onDidChange: (listener: (uri: string) => void) => void;
  onDidDelete: (listener: (uri: string) => void) => void;
  dispose: () => void;
}

export type WatcherFactory = (root: string) => FileSystemWatcherLike;

export interface TaskWatcherOptions {
  debounceMs?: number;
  watcherFactory?: WatcherFactory;
}

const DEFAULT_DEBOUNCE_MS = 300;

function isTaskFile(filePath: string): boolean {
  const isMarkdown = filePath.endsWith('.md');
  const fileName = path.basename(filePath);
  if (!isMarkdown || fileName === '_context.md') return false;

  // Exclude config directories — _modes/ and _agents/ are not tasks
  const sep = path.sep;
  if (
    filePath.includes(`${sep}${MODES_FOLDER}${sep}`) ||
    filePath.includes(`${sep}${AGENTS_FOLDER}${sep}`)
  ) {
    return false;
  }

  return true;
}

function createVsCodeWatcher(root: string): FileSystemWatcherLike {
  // Lazily require vscode so tests don't need it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vscode = require('vscode') as typeof import('vscode');
  const pattern = new vscode.RelativePattern(root, '**/*.md');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);

  return {
    onDidCreate: (listener) => watcher.onDidCreate((uri) => listener(uri.fsPath)),
    onDidChange: (listener) => watcher.onDidChange((uri) => listener(uri.fsPath)),
    onDidDelete: (listener) => watcher.onDidDelete((uri) => listener(uri.fsPath)),
    dispose: () => watcher.dispose(),
  };
}

export class TaskWatcher extends EventEmitter {
  private watcher?: FileSystemWatcherLike;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private lastDeleted: { path: string; at: number } | null = null;
  private readonly debounceMs: number;
  private readonly watcherFactory: WatcherFactory;

  constructor(private readonly root: string, options: TaskWatcherOptions = {}) {
    super();
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.watcherFactory = options.watcherFactory ?? createVsCodeWatcher;
  }

  start() {
    if (this.watcher) return;
    this.watcher = this.watcherFactory(this.root);

    this.watcher.onDidCreate((uri) => this.handleEvent('created', uri));
    this.watcher.onDidChange((uri) => this.handleEvent('updated', uri));
    this.watcher.onDidDelete((uri) => this.handleEvent('deleted', uri));
  }

  dispose() {
    this.watcher?.dispose();
    this.debounceTimers.forEach((t) => clearTimeout(t));
    this.debounceTimers.clear();
    this.lastDeleted = null;
  }

  private handleEvent(type: 'created' | 'updated' | 'deleted', filePath: string) {
    if (!filePath.includes(KANBAN_FOLDER) || !isTaskFile(filePath)) return;

    const previousDeletion = this.lastDeleted;
    const now = Date.now();

    if (type === 'deleted') {
      this.lastDeleted = { path: filePath, at: now };
    } else if (previousDeletion && now - previousDeletion.at <= this.debounceMs) {
      // Treat rapid delete+create as a move
      this.emitDebounced(`move-${previousDeletion.path}->${filePath}`, () => {
        this.emit('event', { type: 'moved', from: previousDeletion.path, to: filePath } as TaskWatcherEvent);
      });
      this.lastDeleted = null;
      return;
    }

    this.emitDebounced(`${type}:${filePath}`, () => {
      this.emit('event', { type, path: filePath } as TaskWatcherEvent);
    });
  }

  private emitDebounced(key: string, fn: () => void) {
    const existing = this.debounceTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      fn();
    }, this.debounceMs);

    this.debounceTimers.set(key, timer);
  }
}
