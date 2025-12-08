import * as vscode from 'vscode';
import path from 'path';
import { FOLDERS } from '../core/constants';

/**
 * Event types emitted by the file watcher.
 */
export enum FileWatcherEvent {
  Created = 'created',
  Updated = 'updated',
  Deleted = 'deleted',
  Moved = 'moved',
}

/**
 * Payload for file watcher events.
 */
export interface FileWatcherPayload {
  event: FileWatcherEvent;
  filePath: string;
  uri: vscode.Uri;
  oldPath?: string;
  oldUri?: vscode.Uri;
}

/**
 * Callback type for file watcher events.
 */
export type FileWatcherCallback = (payload: FileWatcherPayload) => void;

/**
 * Directories that should be ignored by the file watcher.
 */
const IGNORED_DIRS = [
  FOLDERS.templates,
  FOLDERS.agents,
  FOLDERS.archive,
];

/**
 * Files that should be ignored by the file watcher.
 */
const IGNORED_FILES = ['_context.md', '_project.md', '_phase.md'];

/**
 * Checks if a file path should be ignored by the watcher.
 */
function shouldIgnore(filePath: string, root: string): boolean {
  const relativePath = path.relative(root, filePath);
  const parts = relativePath.split(path.sep);

  // Check if in an ignored directory
  if (parts.length > 0 && IGNORED_DIRS.includes(parts[0])) {
    return true;
  }

  // Check if it's an ignored file
  const filename = path.basename(filePath);
  if (IGNORED_FILES.includes(filename)) {
    return true;
  }

  // Ignore files starting with underscore
  if (filename.startsWith('_')) {
    return true;
  }

  // Only watch .md files
  if (!filename.endsWith('.md')) {
    return true;
  }

  return false;
}

/**
 * File watcher service that monitors the .kanban2code directory for changes.
 *
 * Features:
 * - Watches for file creation, modification, and deletion
 * - Debounces rapid changes to avoid excessive updates
 * - Ignores non-task files (_templates, _agents, _archive, _context.md)
 * - Emits typed events for task changes (including renames)
 */
export class TaskFileWatcher implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher | null = null;
  private renameDisposable: vscode.Disposable | null = null;
  private callbacks: Set<FileWatcherCallback> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private pendingEvents: Map<string, FileWatcherPayload> = new Map();
  private disposed = false;

  /**
   * Debounce delay in milliseconds.
   */
  private readonly debounceDelay = 300;

  /**
   * Creates a new TaskFileWatcher.
   *
   * @param root - The .kanban2code root directory to watch
   */
  constructor(private readonly root: string) {}

  /**
   * Starts watching the directory for changes.
   */
  start(): void {
    if (this.disposed) {
      throw new Error('Cannot start disposed watcher');
    }

    if (this.watcher) {
      return; // Already watching
    }

    // Create a glob pattern that watches all .md files in the root
    const pattern = new vscode.RelativePattern(this.root, '**/*.md');
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    // Handle file creation
    this.watcher.onDidCreate((uri) => {
      this.handleEvent(FileWatcherEvent.Created, uri);
    });

    // Handle file modification
    this.watcher.onDidChange((uri) => {
      this.handleEvent(FileWatcherEvent.Updated, uri);
    });

    // Handle file deletion
    this.watcher.onDidDelete((uri) => {
      this.handleEvent(FileWatcherEvent.Deleted, uri);
    });

    // Handle file moves/renames
    this.renameDisposable = vscode.workspace.onDidRenameFiles((event) => {
      for (const file of event.files) {
        this.handleRename(file.oldUri, file.newUri);
      }
    });
  }

  /**
   * Stops watching and disposes resources.
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
    }

    if (this.renameDisposable) {
      this.renameDisposable.dispose();
      this.renameDisposable = null;
    }

    // Clear all pending debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.pendingEvents.clear();
  }

  /**
   * Disposes the watcher.
   */
  dispose(): void {
    this.disposed = true;
    this.stop();
    this.callbacks.clear();
  }

  /**
   * Subscribes to file watcher events.
   *
   * @param callback - Function to call when events occur
   * @returns Unsubscribe function
   */
  subscribe(callback: FileWatcherCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Handles a file system event with debouncing.
   */
  private handleEvent(event: FileWatcherEvent, uri: vscode.Uri): void {
    const filePath = uri.fsPath;

    // Skip ignored files
    if (shouldIgnore(filePath, this.root)) {
      return;
    }

    const payload: FileWatcherPayload = {
      event,
      filePath,
      uri,
    };

    this.queueEvent(filePath, payload);
  }

  /**
   * Emits an event to all subscribers.
   */
  private emit(payload: FileWatcherPayload): void {
    for (const callback of this.callbacks) {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error in file watcher callback:', error);
      }
    }
  }

  /**
   * Forces immediate processing of all pending events.
   * Useful for testing or cleanup.
   */
  flush(): void {
    for (const [filePath, timer] of this.debounceTimers) {
      clearTimeout(timer);
      const payload = this.pendingEvents.get(filePath);
      if (payload) {
        this.emit(payload);
      }
    }
    this.debounceTimers.clear();
    this.pendingEvents.clear();
  }

  /**
   * Handles rename/move events separately to capture both old and new paths.
   */
  private handleRename(oldUri: vscode.Uri, newUri: vscode.Uri): void {
    const oldPath = oldUri.fsPath;
    const newPath = newUri.fsPath;

    const oldIgnored = shouldIgnore(oldPath, this.root);
    const newIgnored = shouldIgnore(newPath, this.root);

    // If both paths are ignored, do nothing.
    if (oldIgnored && newIgnored) {
      return;
    }

    // If moving from ignored to tracked, treat as creation.
    if (oldIgnored && !newIgnored) {
      this.handleEvent(FileWatcherEvent.Created, newUri);
      return;
    }

    // If moving from tracked to ignored, treat as deletion.
    if (!oldIgnored && newIgnored) {
      this.handleEvent(FileWatcherEvent.Deleted, oldUri);
      return;
    }

    // Both paths tracked: emit moved event with both paths.
    const payload: FileWatcherPayload = {
      event: FileWatcherEvent.Moved,
      filePath: newPath,
      uri: newUri,
      oldPath,
      oldUri,
    };

    this.queueEvent(newPath, payload);
  }

  /**
   * Enqueues an event with debounce, keyed by path.
   */
  private queueEvent(filePath: string, payload: FileWatcherPayload): void {
    // Store the pending event
    this.pendingEvents.set(filePath, payload);

    // Clear existing timer for this file
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      const pendingPayload = this.pendingEvents.get(filePath);
      this.pendingEvents.delete(filePath);

      if (pendingPayload) {
        this.emit(pendingPayload);
      }
    }, this.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }
}

/**
 * Creates a file watcher for the given kanban root.
 *
 * @param root - The .kanban2code root directory
 * @returns A new TaskFileWatcher instance (not started)
 */
export function createFileWatcher(root: string): TaskFileWatcher {
  return new TaskFileWatcher(root);
}
