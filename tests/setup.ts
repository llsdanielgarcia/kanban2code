/**
 * Global test setup for Vitest
 * Phase 5.0: Test Infrastructure
 */

import { vi } from 'vitest';

// Mock VS Code API for all tests
vi.mock('vscode', () => ({
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInputBox: vi.fn(),
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    })),
    withProgress: vi.fn((options, task) => task({ report: vi.fn() })),
  },
  workspace: {
    workspaceFolders: [],
    createFileSystemWatcher: vi.fn(() => ({
      onDidChange: vi.fn(),
      onDidCreate: vi.fn(),
      onDidDelete: vi.fn(),
      dispose: vi.fn(),
    })),
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      delete: vi.fn(),
      createDirectory: vi.fn(),
      stat: vi.fn(),
      readDirectory: vi.fn(),
      rename: vi.fn(),
      copy: vi.fn(),
    },
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn(),
    })),
    openTextDocument: vi.fn(),
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn(),
  },
  RelativePattern: class RelativePattern {
    base: string;
    pattern: string;
    constructor(base: string, pattern: string) {
      this.base = base;
      this.pattern = pattern;
    }
  },
  Uri: {
    file: (path: string) => ({ fsPath: path, path }),
    parse: (uri: string) => ({ fsPath: uri, path: uri }),
  },
  env: {
    clipboard: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
  },
  ExtensionContext: vi.fn(),
  EventEmitter: class EventEmitter<T> {
    event = vi.fn();
    fire = vi.fn((_data?: T) => {});
    dispose = vi.fn();
  },
  ProgressLocation: {
    Notification: 1,
    Window: 10,
    SourceControl: 15,
  },
  ThemeIcon: vi.fn(),
}));

// Global test utilities
globalThis.testUtils = {
  createMockTask: (overrides = {}) => ({
    id: 'test-task-1',
    filePath: '/test/.kanban2code/inbox/test-task.md',
    title: 'Test Task',
    stage: 'inbox' as const,
    content: 'Test content',
    created: new Date().toISOString(),
    ...overrides,
  }),

  createMockFilterState: (overrides = {}) => ({
    stages: ['inbox', 'plan', 'code', 'audit', 'completed'] as const,
    project: null,
    tags: [],
    search: '',
    quickView: null,
    ...overrides,
  }),
};

// Type declaration for global test utils
declare global {
  var testUtils: {
    createMockTask: (overrides?: Record<string, unknown>) => {
      id: string;
      filePath: string;
      title: string;
      stage: 'inbox' | 'plan' | 'code' | 'audit' | 'completed';
      content: string;
      created: string;
    };
    createMockFilterState: (overrides?: Record<string, unknown>) => {
      stages: readonly ('inbox' | 'plan' | 'code' | 'audit' | 'completed')[];
      project: string | null;
      tags: string[];
      search: string;
      quickView: string | null;
    };
  };
}
