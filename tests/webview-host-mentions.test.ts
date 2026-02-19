import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createEnvelope } from '../src/webview/messaging';
import { WorkspaceState } from '../src/workspace/state';

function buildDescendingPaths(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `src/file-${String(count - index - 1).padStart(2, '0')}.ts`);
}

async function mockWorkspaceFiles(paths: string[]) {
  const vscode = await import('vscode');
  const root = '/workspace';
  const uris = paths.map((relativePath) => ({ fsPath: `${root}/${relativePath}`, path: `${root}/${relativePath}` }));

  (vscode.workspace as { findFiles?: unknown }).findFiles = vi.fn().mockResolvedValue(uris);
  (vscode.workspace as { asRelativePath?: unknown }).asRelativePath = vi.fn((uri: { fsPath: string }) =>
    uri.fsPath.replace(`${root}/`, ''),
  );
}

describe('webview host mentions file search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    WorkspaceState.setKanbanRoot('/workspace');
  });

  test('SidebarProvider SearchFiles handles empty query with deterministic first 20 files', async () => {
    await mockWorkspaceFiles(buildDescendingPaths(30));
    const { SidebarProvider } = await import('../src/webview/SidebarProvider');
    const postMessageSpy = vi.fn();

    await (SidebarProvider.prototype as { _handleWebviewMessage: (data: unknown) => Promise<void> })._handleWebviewMessage.call(
      { _postMessage: postMessageSpy },
      createEnvelope('SearchFiles', { query: '', requestId: 'req-sidebar' }),
    );

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FilesSearched',
        payload: {
          requestId: 'req-sidebar',
          files: Array.from({ length: 20 }, (_, index) => `src/file-${String(index).padStart(2, '0')}.ts`),
        },
      }),
    );
  });

  test('KanbanPanel SearchFiles handles empty query with deterministic first 20 files', async () => {
    await mockWorkspaceFiles(buildDescendingPaths(30));
    const { KanbanPanel } = await import('../src/webview/KanbanPanel');
    const postMessageSpy = vi.fn();

    await (KanbanPanel.prototype as { _handleWebviewMessage: (data: unknown) => Promise<void> })._handleWebviewMessage.call(
      { _postMessage: postMessageSpy },
      createEnvelope('SearchFiles', { query: '', requestId: 'req-board' }),
    );

    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FilesSearched',
        payload: {
          requestId: 'req-board',
          files: Array.from({ length: 20 }, (_, index) => `src/file-${String(index).padStart(2, '0')}.ts`),
        },
      }),
    );
  });
});
